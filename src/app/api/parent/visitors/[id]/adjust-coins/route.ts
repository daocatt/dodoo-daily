import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { visitor, visitorCurrencyLog } from '@/lib/schema'
import { eq, sql } from 'drizzle-orm'
import { getSessionUser } from '@/lib/auth'

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const session = await getSessionUser()
        if (!session || session.role !== 'PARENT') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await req.json()
        const { amount, reason } = body

        if (typeof amount !== 'number' || amount === 0) {
            return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
        }

        const currentVisitor = await db.select().from(visitor).where(eq(visitor.id, id)).get()
        if (!currentVisitor) return NextResponse.json({ error: 'Visitor not found' }, { status: 404 })

        const newBalance = currentVisitor.currency + amount

        db.transaction((tx) => {
            tx.update(visitor)
                .set({ currency: newBalance })
                .where(eq(visitor.id, id))
                .run()

            tx.insert(visitorCurrencyLog).values({
                visitorId: id,
                amount,
                balance: newBalance,
                reason: reason || 'MANUAL_ADJUST'
            }).run()
        })

        return NextResponse.json({ success: true, balance: newBalance })
    } catch (e) {
        console.error('Adjust visitor coins error:', e)
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}
