import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users } from '@/lib/schema'
import { eq, or, and } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

/**
 * Resolve a nickname to its basic user info (needed when showAllAvatars is false)
 */
export async function POST(req: NextRequest) {
    try {
        const { nickname } = await req.json()
        if (!nickname) return NextResponse.json({ error: 'Nickname required' }, { status: 400 })

        const user = await db.select().from(users).where(
            and(
                or(
                    eq(users.name, nickname),
                    eq(users.nickname, nickname)
                ),
                eq(users.isDeleted, false)
            )
        ).get()

        if (!user) {
            return NextResponse.json({ exists: false })
        }

        return NextResponse.json({
            exists: true,
            id: user.id,
            name: user.nickname || user.name,
            role: user.role,
            avatarUrl: user.avatarUrl,
            hasPin: !!user.pin
        })
    } catch (error) {
        console.error('Resolve failed', error)
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}
