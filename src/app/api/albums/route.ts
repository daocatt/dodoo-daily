import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { album, artwork, users, media } from '@/lib/schema'
import { desc, eq, and } from 'drizzle-orm'
import { cookies } from 'next/headers'
import { getSessionUser } from '@/lib/auth';

async function getAuth() {
    const cookieStore = await cookies()
    const userId = (await getSessionUser())?.userId
    const role = (await getSessionUser())?.role
    return { userId, role }
}

export async function GET(_req: NextRequest) {
    try {
        const { userId: currentUserId, role } = await getAuth()
        if (!currentUserId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { searchParams } = new URL(req.url)
        // If parent, allow filtering by specific childId. Otherwise force self.
        const targetUserId = (role === 'PARENT' && searchParams.get('userId')) ? searchParams.get('userId')! : currentUserId

        const albums = await db.select().from(album)
            .where(eq(album.userId, targetUserId))
            .orderBy(desc(album.updatedAt))

        const allArtworksRaw = await db.select({
            id: artwork.id,
            title: artwork.title,
            imageUrl: artwork.imageUrl,
            thumbnailMedium: media.thumbnailMedium,
            albumId: artwork.albumId,
            priceCoins: artwork.priceCoins,
            priceRMB: artwork.priceRMB,
            isSold: artwork.isSold,
            isPublic: artwork.isPublic,
            isArchived: artwork.isArchived,
            createdAt: artwork.createdAt,
        })
            .from(artwork)
            .leftJoin(media, eq(artwork.imageUrl, media.path))
            .where(and(eq(artwork.userId, targetUserId), eq(artwork.isArchived, false)))
            .orderBy(desc(artwork.createdAt))

        const albumsWithArtworks = albums.map(a => {
            const artworksInAlbum = allArtworksRaw.filter(art => art.albumId === a.id)
            return {
                ...a,
                artworks: artworksInAlbum.slice(0, 3),
                totalArtworks: artworksInAlbum.length
            }
        })

        return NextResponse.json(albumsWithArtworks)
    } catch (error) {
        console.error('Failed to fetch albums:', error)
        return NextResponse.json({ error: 'Failed to fetch albums' }, { status: 500 })
    }
}

export async function POST(_req: NextRequest) {
    try {
        const { userId, role } = await getAuth()
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const body = await req.json()
        const { title, targetUserId } = body

        if (!title) {
            return NextResponse.json({ error: 'Title is required' }, { status: 400 })
        }

        // Parent can create for child
        const ownerId = (role === 'PARENT' && targetUserId) ? targetUserId : userId

        const newAlbum = await db.insert(album).values({
            userId: ownerId,
            title,
        }).returning()

        return NextResponse.json(newAlbum[0])
    } catch (error) {
        console.error('Failed to create album:', error)
        return NextResponse.json({ error: 'Failed to create album' }, { status: 500 })
    }
}
