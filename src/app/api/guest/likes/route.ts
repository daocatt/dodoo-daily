import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { artwork, artworkLike } from '@/lib/schema'
import { eq, desc } from 'drizzle-orm'

export async function GET(req: NextRequest) {
    try {
        const guestId = req.nextUrl.searchParams.get('guestId')
        const memberId = req.nextUrl.searchParams.get('memberId')

        const whereClause = memberId 
            ? eq(artworkLike.memberId, memberId) 
            : (guestId ? eq(artworkLike.guestId, guestId) : undefined)

        if (!whereClause) return NextResponse.json({ error: 'Missing identity' }, { status: 400 })

        const likes = await db.select({
            id: artworkLike.id,
            createdAt: artworkLike.createdAt,
            artworkTitle: artwork.title,
            artworkImage: artwork.imageUrl,
            artworkId: artwork.id,
        })
        .from(artworkLike)
        .leftJoin(artwork, eq(artworkLike.artworkId, artwork.id))
        .where(whereClause)
        .orderBy(desc(artworkLike.createdAt))

        return NextResponse.json(likes)
    } catch (e) {
        console.error('Fetch likes error:', e)
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}
