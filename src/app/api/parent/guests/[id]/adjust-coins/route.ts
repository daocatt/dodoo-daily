import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { guest, guestCurrencyLog } from '@/lib/schema'
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

        const currentGuest = await db.select().from(guest).where(eq(guest.id, id)).get()
        if (!currentGuest) return NextResponse.json({ error: 'Guest not found' }, { status: 404 })

        const newBalance = currentGuest.currency + amount

        await db.transaction(async (tx) => {
            await tx.update(guest)
                .set({ currency: newBalance })
                .where(eq(guest.id, id))

            await tx.insert(guestCurrencyLog).values({
                guestId: id,
                amount,
                balance: newBalance,
                reason: reason || 'MANUAL_ADJUST'
            })
        })

        return NextResponse.json({ success: true, balance: newBalance })
    } catch (e) {
        console.error('Adjust guest coins error:', e)
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}
