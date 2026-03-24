import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { artworkLike, artwork } from '@/lib/schema'
import { eq, desc } from 'drizzle-orm'
import { getSession } from '@/lib/auth'

export async function GET(req: NextRequest) {
    try {
        const session = await getSession()
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        
        const userId = session.userId

        const data = await db.select({
            id: artworkLike.id,
            artworkId: artworkLike.artworkId,
            artworkTitle: artwork.title,
            artworkImage: artwork.imageUrl,
            createdAt: artworkLike.createdAt
        })
        .from(artworkLike)
        .leftJoin(artwork, eq(artworkLike.artworkId, artwork.id))
        .where(eq(artworkLike.memberId, userId))
        .orderBy(desc(artworkLike.createdAt))
        .limit(50)

        return NextResponse.json(data)
    } catch (_e) {
        console.error('Member Likes API error:', _e)
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}
