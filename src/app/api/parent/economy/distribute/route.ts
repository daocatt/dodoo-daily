import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { cookies } from 'next/headers'
import { addBalance, TransactionType } from '@/lib/economy'

import { getSessionUser } from '@/lib/auth'
import { addBalance, TransactionType } from '@/lib/economy'

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

        if (!res.success) {
            return NextResponse.json({ error: res.error }, { status: 400 })
        }

        return NextResponse.json({ success: true, balance: res.balance })
    } catch (e) {
        console.error('Manual distribution failed:', e)
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}
