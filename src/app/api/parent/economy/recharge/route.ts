import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { addBalance } from '@/lib/economy'

export async function POST(req: NextRequest) {
    try {
        const session = await getSessionUser()
        if (!session || session.permissionRole !== 'SUPERADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        const userId = session.userId

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
    } catch (error) {
        console.error('Recharge failed:', error)
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}
