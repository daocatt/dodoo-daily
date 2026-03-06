import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { album, artwork, users } from '@/lib/schema'
import { desc, eq } from 'drizzle-orm'

async function getDefaultChildId() {
    const kids = await db.select().from(users).where(eq(users.role, 'CHILD'))
    return kids.length > 0 ? kids[0].id : null
}

export async function GET() {
    try {
        const childId = await getDefaultChildId()
        if (!childId) return NextResponse.json([])

        const albums = await db.select().from(album)
            .where(eq(album.userId, childId))
            .orderBy(desc(album.updatedAt))

        const allArtworks = await db.select()
            .from(artwork)
            .where(eq(artwork.userId, childId))
            .orderBy(desc(artwork.createdAt))

        const albumsWithArtworks = albums.map(a => {
            const artworksForAlbum = allArtworks.filter(art => art.albumId === a.id).slice(0, 3)
            return {
                ...a,
                artworks: artworksForAlbum
            }
        })

        return NextResponse.json(albumsWithArtworks)
    } catch (error) {
        console.error('Failed to fetch albums:', error)
        return NextResponse.json({ error: 'Failed to fetch albums' }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { title } = body

        if (!title) {
            return NextResponse.json({ error: 'Title is required' }, { status: 400 })
        }

        const childId = await getDefaultChildId()
        if (!childId) return NextResponse.json({ error: 'No child account found' }, { status: 404 })

        const newAlbum = await db.insert(album).values({
            userId: childId,
            title,
        }).returning()

        return NextResponse.json(newAlbum[0])
    } catch (error) {
        console.error('Failed to create album:', error)
        return NextResponse.json({ error: 'Failed to create album' }, { status: 500 })
    }
}
