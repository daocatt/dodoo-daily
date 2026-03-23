import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { getSessionUser } from '@/lib/auth'
import { addBalance } from '@/lib/economy'

export async function POST(_req: NextRequest) {
    try {
        const { userId, role } = await getSessionUser()
        if (role !== 'PARENT' || !userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

        const body = await req.json()
        const { amount, type } = body // type: 'CURRENCY' or 'GOLD_STAR'

        if (!amount || amount <= 0) {
            return NextResponse.json({ error: 'Positive amount required' }, { status: 400 })
        }

        const res = await addBalance(userId, type || 'CURRENCY', amount, 'Auto-recharge by Parent')

        if (!res || !res.success) {
            return NextResponse.json({ error: res?.error || 'Transaction failed' }, { status: 400 })
        }

        return NextResponse.json({ success: true, balance: res.balance })
    } catch (_e) {
        console.error('Recharge failed:', e)
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}
