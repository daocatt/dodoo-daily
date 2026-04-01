import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { artwork } from '@/lib/schema'
import { eq } from 'drizzle-orm'

export async function PATCH(
    req: NextRequest,
    { params: _params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await _params
        const body = await req.json()
        const { title, albumId, priceRMB, priceCoins, isArchived, isPublic, isFeatured, exhibitionDescription } = body
        
        const currentArtwork = await db.select().from(artwork).where(eq(artwork.id, id))
        if (currentArtwork.length === 0) {
            return NextResponse.json({ error: 'Artwork not found' }, { status: 404 })
        }

        const updateData: Record<string, string | number | boolean | null> = {}
        if (title !== undefined) updateData.title = title
        if (albumId !== undefined) updateData.albumId = albumId || null
        if (priceRMB !== undefined) updateData.priceRMB = parseFloat(priceRMB) || 0
        if (priceCoins !== undefined) updateData.priceCoins = parseInt(priceCoins, 10) || 0
        if (isArchived !== undefined) updateData.isArchived = isArchived
        if (isPublic !== undefined) updateData.isPublic = isPublic
        if (isFeatured !== undefined) updateData.isFeatured = isFeatured
        if (exhibitionDescription !== undefined) updateData.exhibitionDescription = exhibitionDescription

        const updated = await db.update(artwork)
            .set(updateData)
            .where(eq(artwork.id, id))
            .returning()

        return NextResponse.json(updated[0])
    } catch (error) {
        console.error('Failed to update artwork:', error)
        return NextResponse.json({ error: 'Failed to update artwork' }, { status: 500 })
    }
}

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    return PATCH(req, { params })
}

export async function DELETE(
    _req: NextRequest,
    { params: _params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await _params

        const currentArtwork = await db.select().from(artwork).where(eq(artwork.id, id))
        if (currentArtwork.length === 0) {
            return NextResponse.json({ error: 'Artwork not found' }, { status: 404 })
        }

        if (currentArtwork[0].isSold) {
            // Cannot delete sold artwork, can only archive it
            const archived = await db.update(artwork)
                .set({ isArchived: true, albumId: null })
                .where(eq(artwork.id, id))
                .returning()
            return NextResponse.json({ success: true, archived: true, artwork: archived[0] })
        }

        await db.delete(artwork).where(eq(artwork.id, id))

        return NextResponse.json({ success: true, deleted: true })
    } catch (error) {
        console.error('Failed to delete artwork:', error)
        return NextResponse.json({ error: 'Failed to delete artwork' }, { status: 500 })
    }
}
