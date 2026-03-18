import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { guest, rechargeCode, guestCurrencyLog } from '@/lib/schema'
import { eq, and } from 'drizzle-orm'

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { guestId, code } = body

        if (!guestId || !code) return NextResponse.json({ error: 'Missing data' }, { status: 400 })

        const result = await db.transaction(async (tx) => {
            const codeRecord = await tx.select().from(rechargeCode).where(
                and(
                    eq(rechargeCode.code, code.toUpperCase()),
                    eq(rechargeCode.isUsed, false)
                )
            ).get()

            if (!codeRecord) throw new Error('Invalid or used code')

            const currentGuest = await tx.select().from(guest).where(eq(guest.id, guestId)).get()
            if (!currentGuest) throw new Error('Guest not found')

            const newBalance = currentGuest.currency + codeRecord.amount

            await tx.update(rechargeCode)
                .set({ isUsed: true, usedByGuestId: guestId, usedAt: new Date() })
                .where(eq(rechargeCode.id, codeRecord.id))

            await tx.update(guest)
                .set({ currency: newBalance })
                .where(eq(guest.id, guestId))

            await tx.insert(guestCurrencyLog).values({
                guestId,
                amount: codeRecord.amount,
                balance: newBalance,
                reason: 'RECHARGE'
            })

            return { amount: codeRecord.amount, balance: newBalance }
        })

        return NextResponse.json({ success: true, ...result })
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Recharge failed'
        return NextResponse.json({ error: message }, { status: 400 })
    }
}
