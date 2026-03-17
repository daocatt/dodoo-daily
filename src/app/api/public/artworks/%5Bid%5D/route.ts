import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { artwork, users } from '@/lib/schema'
import { eq, and } from 'drizzle-orm'

export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params

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
            isPublic: artwork.isPublic,
            user: {
                name: users.name,
                nickname: users.nickname,
                slug: users.slug,
                avatarUrl: users.avatarUrl
            }
        })
        .from(artwork)
        .leftJoin(users, eq(artwork.userId, users.id))
        .where(
            and(
                eq(artwork.id, id),
                eq(artwork.isPublic, true),
                eq(artwork.isArchived, false)
            )
        )
        .limit(1)

        if (results.length === 0) {
            return NextResponse.json({ error: 'Artwork not found' }, { status: 404 })
        }

        return NextResponse.json(results[0])
    } catch (e) {
        console.error('Public artwork detail fetch error:', e)
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}
