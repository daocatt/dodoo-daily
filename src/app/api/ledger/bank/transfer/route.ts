import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { transferToBank, withdrawFromBank } from '@/lib/economy'
import { db } from '@/lib/db'
import { ledgerCategory } from '@/lib/schema'
import { eq, and } from 'drizzle-orm'

export async function POST(req: NextRequest) {
    const session = await getSessionUser()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { userId } = session

    try {
        const { amount, type, description } = await req.json()
        if (!amount || amount <= 0) return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })

        // 1. Ensure system_bank category exists
        let category = await db.select().from(ledgerCategory)
            .where(and(eq(ledgerCategory.isSystem, true), eq(ledgerCategory.name, '银行储蓄')))
            .get()
        
        if (!category) {
            const [newCat] = await db.insert(ledgerCategory).values({
                name: '银行储蓄',
                emoji: '🏦',
                type: 'EXPENSE', // Default to expense but we use it for both
                isSystem: true
            }).returning()
            category = newCat
        }

        let result
        if (type === 'DEPOSIT') {
            result = await transferToBank(userId, amount, description || '存入银行')
        } else if (type === 'WITHDRAWAL') {
            result = await withdrawFromBank(userId, amount, description || '从银行取出')
        } else {
            return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
        }

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 400 })
        }

        return NextResponse.json(result)
    } catch (e: unknown) {
        return NextResponse.json({ error: (e as Error).message }, { status: 500 })
    }
}
