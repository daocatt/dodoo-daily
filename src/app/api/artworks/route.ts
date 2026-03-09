import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { artwork } from '@/lib/schema'
import { getSessionUser } from '@/lib/auth'
import { and, eq, desc } from 'drizzle-orm'

export async function GET(req: NextRequest) {
    try {
        const { userId: currentUserId, role: currentUserRole } = await getSessionUser()
        if (!currentUserId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { searchParams } = new URL(req.url)
        const limit = parseInt(searchParams.get('limit') || '20')
        // Base condition: strictly own artworks and not archived
        const conditions = [
            eq(artwork.userId, currentUserId),
            eq(artwork.isArchived, false)
        ]

        const items = db.select()
            .from(artwork)
            .where(and(...conditions))
            .orderBy(desc(artwork.createdAt))
            .limit(limit)
            .all()

        return NextResponse.json(items || [])
    } catch (error) {
        console.error('Failed to fetch artworks:', error)
        return NextResponse.json({ error: 'Failed to fetch artworks' }, { status: 500 })
    }
}
