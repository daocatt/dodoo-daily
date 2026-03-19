import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { transferFiat } from '@/lib/economy'

export async function POST(req: NextRequest) {
    const session = await getSessionUser()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id: userId } = session

    try {
        const body = await req.json()
        const { targetUserId, amount, description } = body
        
        if (!targetUserId) return NextResponse.json({ error: '请选择转账对象' }, { status: 400 })
        if (!amount || amount <= 0) return NextResponse.json({ error: '请输入有效金额' }, { status: 400 })

        const result = await transferFiat(userId, targetUserId, parseFloat(amount), description || '转账')

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 400 })
        }

        return NextResponse.json(result)
    } catch (e: unknown) {
        return NextResponse.json({ error: (e as Error).message }, { status: 500 })
    }
}
