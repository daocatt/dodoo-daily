import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { order, artwork } from '@/lib/schema'
import { eq, desc } from 'drizzle-orm'
import { getSession } from '@/lib/auth'

export async function GET(req: NextRequest) {
    try {
        const session = await getSession()
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        
        const userId = session.userId

        const data = await db.select({
            id: order.id,
            artworkId: order.artworkId,
            artworkTitle: artwork.title,
            artworkImage: artwork.imageUrl,
            status: order.status,
            amount: order.amountCoins,
            createdAt: order.createdAt
        })
        .from(order)
        .leftJoin(artwork, eq(order.artworkId, artwork.id))
        .where(eq(order.memberId, userId))
        .orderBy(desc(order.createdAt))
        .limit(50)

        return NextResponse.json(data)
    } catch (_e) {
        console.error('Member Orders API error:', _e)
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}
