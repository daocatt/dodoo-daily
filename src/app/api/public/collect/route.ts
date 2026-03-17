import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { artwork, guest, order } from '@/lib/schema'
import { eq, and } from 'drizzle-orm'

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { artworkId, guestName, guestPhone } = body

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

        // 2. Create/Find Guest
        const [newGuest] = await db.insert(guest).values({
            name: guestName,
            phone: guestPhone
        }).returning()

        // 3. Create Order
        const [newOrder] = await db.insert(order).values({
            artworkId: art.id,
            guestId: newGuest.id,
                amountRMB: art.priceRMB || 0,
            status: 'PENDING'
        }).returning()

        // Note: In a real app, I'd send a notification to the parent here.
        // I can trigger a push notification to all parents.

        return NextResponse.json({ success: true, orderId: newOrder.id })
    } catch (e) {
        console.error('Public collect error:', e)
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}
