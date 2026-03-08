import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { cookies } from 'next/headers'
import { addBalance } from '@/lib/economy'

async function getParentId() {
    const cookieStore = await cookies()
    const id = cookieStore.get('dodoo_user_id')?.value
    return { id, isParent: cookieStore.get('dodoo_role')?.value === 'PARENT' }
}

export async function POST(req: NextRequest) {
    try {
        const { id, isParent } = await getParentId()
        if (!isParent || !id) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

        const body = await req.json()
        const { amount, type } = body // type: 'CURRENCY' or 'GOLD_STAR'

        if (!amount || amount <= 0) {
            return NextResponse.json({ error: 'Positive amount required' }, { status: 400 })
        }

        const res = await addBalance(id, type || 'CURRENCY', amount, 'Auto-recharge by Parent')

        if (!res.success) {
            return NextResponse.json({ error: res.error }, { status: 400 })
        }

        return NextResponse.json({ success: true, balance: res.balance })
    } catch (e) {
        console.error('Recharge failed:', e)
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}
