import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users, accountStats } from '@/lib/schema'
import { eq, and } from 'drizzle-orm'

export async function GET(
    req: NextRequest,
    { params }: { params: { slug: string } }
) {
    try {
        const { slug } = params

        const results = await db.select({
            id: users.id,
            name: users.name,
            nickname: users.nickname,
            slug: users.slug,
            avatarUrl: users.avatarUrl,
            gender: users.gender,
            role: users.role,
        })
        .from(users)
        .where(
            and(
                eq(users.slug, slug),
                eq(users.isArchived, false),
                eq(users.isDeleted, false)
            )
        )

        if (results.length === 0) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        const user = results[0]
        
        // Fetch public stats - e.g. how many purple stars (art stars)
        const stats = await db.select().from(accountStats).where(eq(accountStats.userId, user.id))
        
        return NextResponse.json({
            ...user,
            stats: stats[0] || null
        })
    } catch (e) {
        console.error('Public profile fetch error:', e)
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}
