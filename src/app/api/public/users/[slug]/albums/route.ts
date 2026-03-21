import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users, album, artwork } from '@/lib/schema'
import { eq, and, desc, sql } from 'drizzle-orm'

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

        if (results.length === 0 || !/^[a-zA-Z0-9-]{6,}$/.test(results[0].slug || '')) {
            return NextResponse.json({ error: 'User not found or invalid format' }, { status: 404 })
        }

        const userId = results[0].id

        // 2. Fetch albums that have at least one public artwork
        const publicAlbums = await db.select({
            id: album.id,
            title: album.title,
            coverUrls: album.coverUrls,
            isPublic: album.isPublic,
            createdAt: album.createdAt,
            updatedAt: album.updatedAt
        })
        .from(album)
        .where(
            and(
                eq(album.userId, userId),
                // Either the album is explicitly public, OR it has public artworks
                sql`EXISTS (
                    SELECT 1 FROM Artwork 
                    WHERE Artwork.albumId = Album.id 
                    AND Artwork.isPublic = 1 
                    AND Artwork.isApproved = 1
                    AND Artwork.isArchived = 0
                )`
            )
        )
        .orderBy(desc(album.updatedAt))

        // Populate with artworks count or previews if needed
        const albumsWithArt = await Promise.all(publicAlbums.map(async (a) => {
            const artworks = await db.select({
                id: artwork.id,
                imageUrl: artwork.imageUrl,
                isPublic: artwork.isPublic
            })
            .from(artwork)
            .where(
                and(
                    eq(artwork.albumId, a.id),
                    eq(artwork.isPublic, true),
                    eq(artwork.isApproved, true),
                    eq(artwork.isArchived, false)
                )
            )
            .limit(4)
            return { ...a, artworks }
        }))

        return NextResponse.json(albumsWithArt)
    } catch (e) {
        console.error('Public albums fetch error:', e)
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}
