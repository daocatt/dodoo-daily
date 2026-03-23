import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { visitor, rechargeCode, visitorCurrencyLog, accountStats, currencyLog } from '@/lib/schema'
import { eq, and } from 'drizzle-orm'

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { visitorId, memberId, code } = body

        if (!visitorId && !memberId) return NextResponse.json({ error: 'Missing ID' }, { status: 400 })
        if (!code) return NextResponse.json({ error: 'Missing code' }, { status: 400 })

        const result = db.transaction((tx) => {
            const codeRecord = tx.select().from(rechargeCode).where(
                and(
                    eq(rechargeCode.code, code.toUpperCase()),
                    eq(rechargeCode.isUsed, false)
                )
            ).get()

            if (!codeRecord) throw new Error('Invalid or used code')

            let newBalance = 0;
            if (memberId) {
                const stats = tx.select().from(accountStats).where(eq(accountStats.userId, memberId)).get()
                if (!stats) throw new Error('Member stats not found')
                newBalance = stats.currency + codeRecord.amount

                tx.update(rechargeCode)
                    .set({ isUsed: true, usedByMemberId: memberId, usedAt: new Date() })
                    .where(eq(rechargeCode.id, codeRecord.id))
                    .run()

                tx.update(accountStats)
                    .set({ currency: newBalance })
                    .where(eq(accountStats.userId, memberId))
                    .run()

                tx.insert(currencyLog).values({
                    userId: memberId,
                    amount: codeRecord.amount,
                    balance: newBalance,
                    reason: 'RECHARGE'
                }).run()
            } else {
                const currentVisitor = tx.select().from(visitor).where(eq(visitor.id, visitorId)).get()
                if (!currentVisitor) throw new Error('Visitor not found')
                newBalance = currentVisitor.currency + codeRecord.amount

                tx.update(rechargeCode)
                    .set({ isUsed: true, usedByVisitorId: visitorId, usedAt: new Date() })
                    .where(eq(rechargeCode.id, codeRecord.id))
                    .run()

                tx.update(visitor)
                    .set({ currency: newBalance })
                    .where(eq(visitor.id, visitorId))
                    .run()

                tx.insert(visitorCurrencyLog).values({
                    visitorId: visitorId!,
                    amount: codeRecord.amount,
                    balance: newBalance,
                    reason: 'RECHARGE'
                }).run()
            }

            return { amount: codeRecord.amount, balance: newBalance }
        })

        return NextResponse.json({ success: true, ...result })
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Recharge failed'
        return NextResponse.json({ error: message }, { status: 400 })
    }
}
