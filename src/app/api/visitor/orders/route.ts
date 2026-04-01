import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { order, artwork } from '@/lib/schema'
import { eq, desc, and } from 'drizzle-orm'

export async function GET(req: NextRequest) {
    try {
        const visitorId = req.nextUrl.searchParams.get('visitorId')
        const memberId = req.nextUrl.searchParams.get('memberId')

        if (!visitorId && !memberId) {
            return NextResponse.json({ error: 'Missing ID' }, { status: 400 })
        }

        const condition = visitorId ? eq(order.visitorId, visitorId) : eq(order.memberId, memberId!)

        const orders = await db.select({
            id: order.id,
            status: order.status,
            createdAt: order.createdAt,
            artworkTitle: artwork.title,
            artworkImage: artwork.imageUrl,
            artworkId: artwork.id,
        })
        .from(order)
        .innerJoin(artwork, eq(order.artworkId, artwork.id))
        .where(and(condition, eq(artwork.isArchived, false)))
        .orderBy(desc(order.createdAt))

        // Ensure unique artworks
        const uniqueOrders = Array.from(new Map(orders.map(item => [item.artworkId, item])).values())

        return NextResponse.json(uniqueOrders)
    } catch (_e) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}
