import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { addBalance, TransactionType } from '@/lib/economy'
import { sendPushNotification } from '@/lib/push'

export async function POST(req: NextRequest) {
    try {
        const { userId: parentId, role } = await getSessionUser()
        if (role !== 'PARENT' || !parentId) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

        const body = await req.json()
        const { targetUserId, type, amount, reason } = body

        if (!targetUserId || !type || amount === undefined) {
            return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
        }

        const res = await addBalance(targetUserId, type as TransactionType, amount, reason || 'Manual adjustment by Parent', parentId)
        
        if (!res || !res.success) {
            return NextResponse.json({ error: res?.error || 'Transaction failed' }, { status: 400 })
        }

        // Async Notify Target User
        const typeLabel = type === 'CURRENCY' ? 'Coins 💰' : (type === 'GOLD_STAR' ? 'Gold Stars ⭐' : 'Purple Stars 🌟')
        const actionLabel = amount >= 0 ? 'Received' : 'Adjusted'
        
        sendPushNotification(targetUserId, {
            title: `Balance Updated! ${typeLabel}`,
            body: `${actionLabel} ${Math.abs(amount)} ${typeLabel}: ${reason || 'Family shared reward'}`,
            data: { url: '/' }
        }).catch(e => console.error('Distribute push failed:', e))

        return NextResponse.json({ success: true, balance: res.balance })
    } catch (e) {
        console.error('Manual distribution failed:', e)
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}
