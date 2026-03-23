import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { getSessionUser } from '@/lib/auth'

export async function GET() {
    const user = await getSessionUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const members = await db.select({
            id: users.id,
            name: users.name,
            nickname: users.nickname,
            avatarUrl: users.avatarUrl,
            role: users.role
        })
        .from(users)
        .where(eq(users.isDeleted, false))
        .all()

        return NextResponse.json(members)
    } catch (_e) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}
