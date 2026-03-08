import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { album, artwork } from '@/lib/schema'
import { desc, eq, and } from 'drizzle-orm'

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        const albums = await db.select().from(album).where(eq(album.id, id))

        if (albums.length === 0) {
            return NextResponse.json({ error: 'Album not found' }, { status: 404 })
        }

        const albumData = albums[0]

        const artworks = await db.select()
            .from(artwork)
            .where(and(eq(artwork.albumId, id), eq(artwork.isArchived, false)))
            .orderBy(desc(artwork.createdAt))

        return NextResponse.json({ ...albumData, artworks })
    } catch (error) {
        console.error('Failed to fetch album details:', error)
        return NextResponse.json({ error: 'Failed to fetch album details' }, { status: 500 })
    }
}

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
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
