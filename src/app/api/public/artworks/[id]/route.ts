import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { artwork, users, album } from '@/lib/schema'
import { eq, and } from 'drizzle-orm'

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        const results = await db.select({
            id: artwork.id,
            title: artwork.title,
            imageUrl: artwork.imageUrl,
            priceRMB: artwork.priceRMB,
            priceCoins: artwork.priceCoins,
            isSold: artwork.isSold,
            createdAt: artwork.createdAt,
            userId: artwork.userId,
            albumId: artwork.albumId,
            albumTitle: album.title,
            isPublic: artwork.isPublic,
            likes: artwork.likes,
            views: artwork.views,
            exhibitionDescription: artwork.exhibitionDescription,
            user: {
                name: users.name,
                nickname: users.nickname,
                slug: users.slug,
                avatarUrl: users.avatarUrl
            }
        })
        .from(artwork)
        .leftJoin(users, eq(artwork.userId, users.id))
        .leftJoin(album, eq(artwork.albumId, album.id))
        .where(
            and(
                eq(artwork.id, id),
                eq(artwork.isPublic, true),
                eq(artwork.isApproved, true),
                eq(artwork.isArchived, false),
                eq(users.exhibitionEnabled, true)
            )
        )
        .limit(1)

        if (results.length === 0) {
            return NextResponse.json({ error: 'Artwork not found' }, { status: 404 })
        }

        const data = results[0]

        // Increment views in background (or just await it)
        const { sql } = await import('drizzle-orm')
        await db.update(artwork)
            .set({ views: sql`${artwork.views} + 1` })
            .where(eq(artwork.id, id))

        return NextResponse.json({ ...data, views: data.views + 1 })
    } catch (e) {
        console.error('Public artwork detail fetch error:', e)
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}
