import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { artwork } from '@/lib/schema'
import { desc, eq } from 'drizzle-orm'

export async function GET() {
    try {
        const artworks = await db.select()
            .from(artwork)
            .where(eq(artwork.isArchived, true))
            .orderBy(desc(artwork.createdAt))

        return NextResponse.json({
            id: 'archive',
            title: 'Archives',
            artworks
        })
    } catch (error) {
        console.error('Failed to fetch archived artworks:', error)
        return NextResponse.json({ error: 'Failed to fetch archived artworks' }, { status: 500 })
    }
}
