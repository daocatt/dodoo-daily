import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users, artwork, album } from '@/lib/schema'
import { eq, and, desc } from 'drizzle-orm'

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params

        // 1. Find user by slug
        const results = await db.select({ id: users.id })
            .from(users)
            .where(eq(users.slug, slug))
            .limit(1)

        if (results.length === 0) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        const userId = results[0].id

        // 2. Fetch public artworks with album info
        const publicArtworks = await db.select({
            id: artwork.id,
            title: artwork.title,
            imageUrl: artwork.imageUrl,
            priceRMB: artwork.priceRMB,
            priceCoins: artwork.priceCoins,
            isSold: artwork.isSold,
            createdAt: artwork.createdAt,
            albumId: artwork.albumId,
            albumTitle: album.title,
            userId: artwork.userId,
            isPublic: artwork.isPublic,
            likes: artwork.likes,
            views: artwork.views
        })
        .from(artwork)
        .leftJoin(album, eq(artwork.albumId, album.id))
        .where(
            and(
                eq(artwork.userId, userId),
                eq(artwork.isPublic, true),
                eq(artwork.isApproved, true),
                eq(artwork.isArchived, false)
            )
        )
        .orderBy(desc(artwork.createdAt))

        return NextResponse.json(publicArtworks)
    } catch (e) {
        console.error('Public artworks fetch error:', e)
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}
