import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { artwork, artworkLike } from '@/lib/schema'
import { eq, sql, and, or } from 'drizzle-orm'

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = await req.json().catch(() => ({}))
        const { guestId, memberId } = body
        const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1'

        // Check if already liked by this identity
        const existing = await db.select().from(artworkLike).where(
            and(
                eq(artworkLike.artworkId, id),
                or(
                    memberId ? eq(artworkLike.memberId, memberId) : undefined,
                    guestId ? eq(artworkLike.guestId, guestId) : undefined,
                    (!memberId && !guestId) ? eq(artworkLike.ip, ip) : undefined
                )
            )
        ).get()

        if (existing) {
            const currentArtwork = await db.select({ likes: artwork.likes }).from(artwork).where(eq(artwork.id, id)).get()
            return NextResponse.json({ success: true, likes: currentArtwork?.likes || 0, alreadyLiked: true })
        }

        // Record the like
        await db.insert(artworkLike).values({
            artworkId: id,
            guestId: guestId || null,
            memberId: memberId || null,
            ip: (!guestId && !memberId) ? ip : null
        })

        // Increment total count
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
