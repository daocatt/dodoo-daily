import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { addBalance, TransactionType } from '@/lib/economy'
import { sendPushNotification } from '@/lib/push'

export async function POST(_req: NextRequest) {
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
        const typeLabels: Record<string, string> = {
            'CURRENCY': 'Coins 💰',
            'GOLD_STAR': 'Gold Stars ⭐',
            'PURPLE_STAR': 'Purple Stars 🌟',
            'ANGER_PENALTY': 'Anger Penalty 💢'
        }
        
        const typeLabel = typeLabels[type] || type
        const actionLabel = amount >= 0 ? 'Received' : 'Adjusted'
        const actionLabelZh = amount >= 0 ? '获得了' : '调整了'
        
        sendPushNotification(targetUserId, {
            title: `Balance Updated / 余额变动: ${typeLabel}`,
            body: `${amount >= 0 ? '+' : '-'}${Math.abs(amount)} ${typeLabel}. ${reason || 'Family update'}\n${actionLabelZh} ${Math.abs(amount)} ${typeLabel}: ${reason || '家庭动态'}`,
            data: { url: '/' }
        }).catch(e => console.error('Distribute push failed:', e))

        return NextResponse.json({ success: true, balance: res.balance })
    } catch (_e) {
        console.error('Manual distribution failed:', e)
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}
