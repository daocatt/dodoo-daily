import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { album, artwork } from '@/lib/schema'
import { desc, eq } from 'drizzle-orm'

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
            .where(eq(artwork.albumId, id))
            .orderBy(desc(artwork.createdAt))

        return NextResponse.json({ ...albumData, artworks })
    } catch (error) {
        console.error('Failed to fetch album details:', error)
        return NextResponse.json({ error: 'Failed to fetch album details' }, { status: 500 })
    }
}
