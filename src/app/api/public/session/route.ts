import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { users } from '@/lib/schema'
import { eq } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const user = await getSessionUser()
        if (!user) {
            // Unauthenticated family user (could be a visitor, which is fine)
            return NextResponse.json({ user: null }, { status: 200 })
        }

        const userRecord = await db.select().from(users).where(eq(users.id, user.id)).get()
        if (!userRecord) {
            return NextResponse.json({ error: 'User not found' }, { status: 401 })
        }

        // Only return basic public information, omitting sensitive stats and economy data
        const responseData = {
            id: userRecord.id,
            name: userRecord.name,
            nickname: userRecord.nickname,
            avatarUrl: userRecord.avatarUrl,
            role: userRecord.role,
            slug: userRecord.slug
        }

        return NextResponse.json(responseData)
    } catch (error) {
        console.error('[API public/session] Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
