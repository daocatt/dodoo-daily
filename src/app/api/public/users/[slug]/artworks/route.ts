import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users, artwork, album, media } from '@/lib/schema'
import { eq, and, desc } from 'drizzle-orm'

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params

        // 1. Find user by slug (Force numeric 8-digit profile check)
        const results = await db.select({ id: users.id, slug: users.slug })
            .from(users)
            .where(and(eq(users.slug, slug), eq(users.exhibitionEnabled, true)))
            .limit(1)
            
        if (results.length === 0 || !/^[a-zA-Z0-9-]{4,}$/.test(results[0].slug || '')) {
            return NextResponse.json({ error: 'User not found or invalid format' }, { status: 404 })
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
            views: artwork.views,
            thumbnailMedium: media.thumbnailMedium,
            thumbnailLarge: media.thumbnailLarge
        })
        .from(artwork)
        .leftJoin(album, eq(artwork.albumId, album.id))
        .leftJoin(media, eq(artwork.imageUrl, media.path))
        .where(
            and(
                eq(artwork.userId, userId),
                eq(artwork.isPublic, true),
                eq(artwork.isApproved, true),
                eq(artwork.isArchived, false),
                eq(artwork.isSold, true)
            )
        )
        .orderBy(desc(artwork.createdAt))

        const maskedArtworks = publicArtworks.map(art => ({
            ...art,
            imageUrl: art.isSold ? art.imageUrl : null // Hide original URL if not sold
        }))

        return NextResponse.json(maskedArtworks)
    } catch (e) {
        console.error('Public artworks fetch error:', e)
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}
