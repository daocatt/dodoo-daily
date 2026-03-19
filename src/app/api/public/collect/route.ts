import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { artwork, guest, order, guestCurrencyLog } from '@/lib/schema'
import { eq, and } from 'drizzle-orm'

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { artworkId, guestId, guestName, guestPhone, paymentType } = body

        if (!artworkId || !guestName || !guestPhone) {
            return NextResponse.json({ error: 'Incomplete information' }, { status: 400 })
        }

        // 1. Verify Artwork
        const [art] = await db.select().from(artwork).where(
            and(
                eq(artwork.id, artworkId),
                eq(artwork.isPublic, true),
                eq(artwork.isArchived, false)
            )
        ).limit(1)

        if (!art || art.isSold) {
            return NextResponse.json({ error: 'Artwork not available' }, { status: 404 })
        }

        let currentGuestId = guestId
        let newBalance = undefined

        const result = db.transaction((tx) => {
            // Find or Create Guest
            if (!currentGuestId) {
                const newG = tx.insert(guest).values({
                    name: guestName,
                    phone: guestPhone,
                    status: 'APPROVED'
                }).returning().get()
                currentGuestId = newG.id
            }

            // If using COINS, verify and deduct
            if (paymentType === 'COINS') {
                const currentGuest = tx.select().from(guest).where(eq(guest.id, currentGuestId)).get()
                if (!currentGuest) throw new Error('Guest not found')
                
                if (currentGuest.currency < art.priceCoins) {
                    throw new Error('Insufficient coins balance')
                }

                newBalance = currentGuest.currency - art.priceCoins
                tx.update(guest).set({ currency: newBalance }).where(eq(guest.id, currentGuestId)).run()
                
                // Log Currency Change
                tx.insert(guestCurrencyLog).values({
                    guestId: currentGuestId,
                    amount: -art.priceCoins,
                    balance: newBalance,
                    reason: 'PURCHASE'
                }).run()
            }

            // Create Order
            const newOrder = tx.insert(order).values({
                artworkId: art.id,
                guestId: currentGuestId!,
                amountRMB: art.priceRMB || 0,
                amountCoins: art.priceCoins || 0,
                paymentType: paymentType || 'RMB',
                status: paymentType === 'COINS' ? 'SUCCESS' : 'PENDING'
            }).returning().get()

            // Update Artwork Status
            tx.update(artwork).set({ isSold: true, buyerId: currentGuestId! }).where(eq(artwork.id, art.id)).run()

            return { orderId: newOrder.id, newBalance }
        })

        return NextResponse.json({ success: true, ...result })
    } catch (e: unknown) {
        console.error('Public collect error:', e)
        const message = e instanceof Error ? e.message : 'Collection failed'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
