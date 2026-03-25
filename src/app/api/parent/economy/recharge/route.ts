import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { addBalance } from '@/lib/economy'

export async function POST(req: NextRequest) {
    try {
        const session = await getSessionUser()
        if (!session || (session.permissionRole !== 'SUPERADMIN' && session.permissionRole !== 'ADMIN')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }
        const userId = session.userId

        const body = await req.json()
        const { amount, type, targetUserId } = body // type: 'CURRENCY' or 'GOLD_STAR'

        if (!amount || amount <= 0) {
            return NextResponse.json({ error: 'Positive amount required' }, { status: 400 })
        }

        // Use targetUserId if provided (for parent to child), otherwise default to current user
        const finalUserId = targetUserId || userId

        const res = await addBalance(finalUserId, type || 'CURRENCY', amount, `Manual Recharge by ${session.nickname || session.name || session.id}`)

        if (!res || !res.success) {
            return NextResponse.json({ error: res?.error || 'Transaction failed' }, { status: 400 })
        }

        return NextResponse.json({ success: true, balance: res.balance })
    } catch (error) {
        console.error('Recharge failed:', error)
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}
