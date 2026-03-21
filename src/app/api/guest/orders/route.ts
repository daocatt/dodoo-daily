import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { order, artwork } from '@/lib/schema'
import { eq, desc } from 'drizzle-orm'

export async function GET(req: NextRequest) {
    try {
        const guestId = req.nextUrl.searchParams.get('guestId')
        if (!guestId) return NextResponse.json({ error: 'Missing guestId' }, { status: 400 })

        const orders = await db.select({
            id: order.id,
            status: order.status,
            createdAt: order.createdAt,
            artworkTitle: artwork.title,
            artworkImage: artwork.imageUrl,
            artworkId: artwork.id,
        })
        .from(order)
        .leftJoin(artwork, eq(order.artworkId, artwork.id))
        .where(eq(order.guestId, guestId))
        .orderBy(desc(order.createdAt))

        return NextResponse.json(orders)
    } catch (e) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}
