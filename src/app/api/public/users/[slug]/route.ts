import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users, accountStats } from '@/lib/schema'
import { eq, and } from 'drizzle-orm'

export async function GET(
    req: NextRequest,
    { params: _params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await _params

        const results = await db.select({
            id: users.id,
            name: users.name,
            nickname: users.nickname,
            slug: users.slug,
            avatarUrl: users.avatarUrl,
            gender: users.gender,
            role: users.role,
            exhibitionTitle: users.exhibitionTitle,
            exhibitionSubtitle: users.exhibitionSubtitle,
            exhibitionDescription: users.exhibitionDescription,
        })
        .from(users)
        .where(
            and(
                eq(users.slug, slug),
                eq(users.isArchived, false),
                eq(users.isDeleted, false),
                eq(users.exhibitionEnabled, true)
            )
        )

        // Validate UUID format: Alphanumeric or numeric, at least 6 characters.
        if (results.length === 0 || !/^[a-zA-Z0-9-]{4,}$/.test(results[0].slug || '')) {
            return NextResponse.json({ error: 'User not found or invalid format' }, { status: 404 })
        }

        const user = results[0]
        
        // Fetch public stats - e.g. how many purple stars (art stars)
        const stats = await db.select().from(accountStats).where(eq(accountStats.userId, user.id))
        
        // Fetch artwork aggregate stats
        const { artwork } = await import('@/lib/schema')
        const { sum } = await import('drizzle-orm')
        const artStatsResults = await db.select({
            totalLikes: sum(artwork.likes),
            totalViews: sum(artwork.views)
        })
        .from(artwork)
        .where(and(eq(artwork.userId, user.id), eq(artwork.isPublic, true)))

        const artStats = artStatsResults[0] || { totalLikes: 0, totalViews: 0 }
        
        return NextResponse.json({
            ...user,
            stats: stats[0] || null,
            totalLikes: Number(artStats.totalLikes || 0),
            totalViews: Number(artStats.totalViews || 0)
        })
    } catch (_e) {
        console.error('Public profile fetch error:', _e)
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}
