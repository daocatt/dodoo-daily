import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import { users } from '@/lib/schema'
import { eq, or, and, not } from 'drizzle-orm'

export async function PATCH(req: Request) {
    const cookieStore = await cookies()
    const session = cookieStore.get('dodoo_user_id')?.value
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const { name, nickname, avatarUrl } = await req.json()
        if (!name && !avatarUrl && !nickname) return NextResponse.json({ error: 'Name, Nickname or AvatarUrl is required' }, { status: 400 })

        // Find current user from session
        const currentUser = await db.query.users.findFirst({
            where: eq(users.id, session)
        })

        if (!currentUser || currentUser.role !== 'PARENT') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        if (name) {
            const existing = await db.select().from(users).where(
                and(
                    not(eq(users.id, session)),
                    eq(users.name, name.trim())
                )
            ).all();

            if (existing.length > 0) {
                return NextResponse.json({ error: 'Name already exists' }, { status: 400 });
            }
        }

        if (nickname) {
            const existing = await db.select().from(users).where(
                and(
                    not(eq(users.id, session)),
                    eq(users.nickname, nickname.trim())
                )
            ).all();

            if (existing.length > 0) {
                return NextResponse.json({ error: 'Nickname already exists' }, { status: 400 });
            }
        }

        const updates: Partial<typeof users.$inferInsert> = {}
        if (name) updates.name = name
        if (nickname) updates.nickname = nickname
        if (avatarUrl) updates.avatarUrl = avatarUrl

        await db.update(users)
            .set(updates)
            .where(eq(users.id, session))

        return NextResponse.json({ success: true })
    } catch (e) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
