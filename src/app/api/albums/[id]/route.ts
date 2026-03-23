import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { album, artwork, users, media } from '@/lib/schema'
import { desc, eq, and } from 'drizzle-orm'

export async function GET(
    req: NextRequest,
    { params: _params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const { searchParams } = new URL(req.url)
        const targetUserId = searchParams.get('userId')

        const albums = await db.select().from(album).where(eq(album.id, id))

        if (albums.length === 0) {
            return NextResponse.json({ error: 'Album not found' }, { status: 404 })
        }

        const albumData = albums[0]

        const artworkRows = await db
            .select({
                id: artwork.id,
                title: artwork.title,
                imageUrl: artwork.imageUrl,
                thumbnailMedium: media.thumbnailMedium,
                thumbnailLarge: media.thumbnailLarge,
                priceRMB: artwork.priceRMB,
                priceCoins: artwork.priceCoins,
                albumId: artwork.albumId,
                isSold: artwork.isSold,
                isArchived: artwork.isArchived,
                isPublic: artwork.isPublic,
                isApproved: artwork.isApproved,
                createdAt: artwork.createdAt,
                creatorNickname: users.nickname,
                creatorName: users.name,
            })
            .from(artwork)
            .leftJoin(users, eq(artwork.userId, users.id))
            .leftJoin(media, eq(artwork.imageUrl, media.path))
            .where(and(eq(artwork.albumId, id), eq(artwork.isArchived, false)))
            .orderBy(desc(artwork.createdAt))

        return NextResponse.json({ ...albumData, artworks: artworkRows })
    } catch (error) {
        console.error('Failed to fetch album details:', error)
        return NextResponse.json({ error: 'Failed to fetch album details' }, { status: 500 })
    }
}

export async function PUT(
    req: NextRequest,
    { params: _params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = await req.json()
        const { title } = body

        if (!title) {
            return NextResponse.json({ error: 'Title is required' }, { status: 400 })
        }

        const updated = await db.update(album)
            .set({ title })
            .where(eq(album.id, id))
            .returning()

        return NextResponse.json(updated[0])
    } catch (error) {
        console.error('Failed to update album:', error)
        return NextResponse.json({ error: 'Failed to update album' }, { status: 500 })
    }
}
export async function DELETE(
    req: NextRequest,
    { params: _params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        // Un-assign artworks from this album before deleting
        await db.update(artwork)
            .set({ albumId: null })
            .where(eq(artwork.albumId, id))

        await db.delete(album).where(eq(album.id, id))

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Failed to delete album:', error)
        return NextResponse.json({ error: 'Failed to delete album' }, { status: 500 })
    }
}
