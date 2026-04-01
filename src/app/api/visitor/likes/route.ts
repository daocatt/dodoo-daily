import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { artwork, artworkLike } from '@/lib/schema'
import { eq, desc } from 'drizzle-orm'

export async function GET(req: NextRequest) {
    try {
        const visitorId = req.nextUrl.searchParams.get('visitorId')
        const memberId = req.nextUrl.searchParams.get('memberId')

        const whereClause = memberId 
            ? eq(artworkLike.memberId, memberId) 
            : (visitorId ? eq(artworkLike.visitorId, visitorId) : undefined)

        if (!whereClause) return NextResponse.json({ error: 'Missing identity' }, { status: 400 })

        const likes = await db.select({
            id: artworkLike.id,
            createdAt: artworkLike.createdAt,
            artworkTitle: artwork.title,
            artworkImage: artwork.imageUrl,
            artworkId: artwork.id,
        })
        .from(artworkLike)
        .innerJoin(artwork, eq(artworkLike.artworkId, artwork.id))
        .where(and(whereClause, eq(artwork.isArchived, false)))
        .orderBy(desc(artworkLike.createdAt))

        // Ensure unique artworks
        const uniqueLikes = Array.from(new Map(likes.map(item => [item.artworkId, item])).values())

        return NextResponse.json(uniqueLikes)
    } catch (e) {
        console.error('Fetch likes error:', e)
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}
