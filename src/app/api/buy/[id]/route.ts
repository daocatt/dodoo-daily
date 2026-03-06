import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { artwork, guest, order, accountStats } from '@/lib/schema'
import { eq } from 'drizzle-orm'

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const body = await req.json()
        const { name, phone } = body
        const { id } = await params

        if (!name) {
            return NextResponse.json({ error: 'Name is required' }, { status: 400 })
        }

        // Check if artwork exists and is not sold
        const artworks = await db.select().from(artwork).where(eq(artwork.id, id))
        if (artworks.length === 0) {
            return NextResponse.json({ error: 'Artwork not found' }, { status: 404 })
        }

        const art = artworks[0]
        if (art.isSold) {
            return NextResponse.json({ error: 'Artwork is already sold' }, { status: 400 })
        }

        // 1. Create Guest
        const newGuest = await db.insert(guest).values({
            name,
            phone: phone || null,
        }).returning()

        const guestId = newGuest[0].id

        // 2. Create Order
        await db.insert(order).values({
            artworkId: art.id,
            guestId,
            amountRMB: art.priceRMB,
            status: 'PAID',
        })

        // 3. Mark Artwork as Sold
        await db.update(artwork)
            .set({
                isSold: true,
                buyerId: guestId
            })
            .where(eq(artwork.id, id))

        // 4. Update Account Stats for the SPECIFIC user who created the art
        if (art.userId) {
            let stats = await db.select().from(accountStats).where(eq(accountStats.userId, art.userId))
            const earnings = art.priceCoins || Math.floor(art.priceRMB * 10)

            if (stats.length === 0) {
                await db.insert(accountStats).values({
                    userId: art.userId,
                    currency: earnings,
                })
            } else {
                await db.update(accountStats)
                    .set({
                        currency: stats[0].currency + earnings,
                    })
                    .where(eq(accountStats.userId, art.userId))
            }
        }

        return NextResponse.json({ success: true, message: 'Purchase successful' })
    } catch (error) {
        console.error('Purchase error:', error)
        return NextResponse.json({ error: 'Purchase processing failed' }, { status: 500 })
    }
}
