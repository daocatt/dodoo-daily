import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users, album, artwork } from '@/lib/schema'
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

        // 2. Fetch public albums
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
                eq(album.isPublic, true)
            )
        )
        .orderBy(desc(album.updatedAt))

        // Optional: for each album, get a preview of artworks
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
