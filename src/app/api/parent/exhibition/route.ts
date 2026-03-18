import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { artwork, album, users } from '@/lib/schema'
import { eq, and, desc } from 'drizzle-orm'
import { getSession } from '@/lib/auth'

export async function GET(req: NextRequest) {
    try {
        const session = await getSession()
        if (!session || session.role !== 'PARENT') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const exhibitionArtworks = await db.select({
            id: artwork.id,
            title: artwork.title,
            imageUrl: artwork.imageUrl,
            albumTitle: album.title,
            userId: artwork.userId,
            userName: users.name,
            userNickname: users.nickname,
            likes: artwork.likes,
            views: artwork.views,
            isPublic: artwork.isPublic,
            isApproved: artwork.isApproved,
            createdAt: artwork.createdAt
        })
        .from(artwork)
        .leftJoin(album, eq(artwork.albumId, album.id))
        .leftJoin(users, eq(artwork.userId, users.id))
        .where(
            and(
                eq(artwork.isPublic, true),
                eq(artwork.isArchived, false)
            )
        )
        .orderBy(desc(artwork.createdAt))

        return NextResponse.json(exhibitionArtworks)
    } catch (e) {
        console.error('Exhibition management fetch error:', e)
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}
