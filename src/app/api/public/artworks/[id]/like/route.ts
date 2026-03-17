import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { artwork } from '@/lib/schema'
import { eq, sql } from 'drizzle-orm'

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        // Increment likes
        const results = await db.update(artwork)
            .set({ likes: sql`${artwork.likes} + 1` })
            .where(eq(artwork.id, id))
            .returning({ newLikes: artwork.likes })

        if (results.length === 0) {
            return NextResponse.json({ error: 'Artwork not found' }, { status: 404 })
        }

        return NextResponse.json({ success: true, likes: results[0].newLikes })
    } catch (e) {
        console.error('Like artwork error:', e)
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}
