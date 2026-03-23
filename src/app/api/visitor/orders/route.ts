import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { order, artwork } from '@/lib/schema'
import { eq, desc } from 'drizzle-orm'

export async function GET(_req: NextRequest) {
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
        .leftJoin(artwork, eq(order.artworkId, artwork.id))
        .where(condition)
        .orderBy(desc(order.createdAt))

        return NextResponse.json(orders)
    } catch (_e) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}
