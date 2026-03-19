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
        const { name, nickname, avatarUrl, slug, exhibitionEnabled } = await req.json()
        if (name === undefined && avatarUrl === undefined && nickname === undefined && slug === undefined && exhibitionEnabled === undefined) return NextResponse.json({ error: 'Missing updates' }, { status: 400 })

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

        if (slug) {
            const formattedSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
            if (!formattedSlug) return NextResponse.json({ error: 'Invalid Link ID' }, { status: 400 })

            const existing = await db.select().from(users).where(
                and(
                    not(eq(users.id, session)),
                    eq(users.slug, formattedSlug)
                )
            ).all();

            if (existing.length > 0) {
                return NextResponse.json({ error: 'Link ID already taken' }, { status: 400 });
            }
        }

        const updates: Partial<typeof users.$inferInsert> = {}
        if (name) updates.name = name.trim()
        if (nickname) updates.nickname = nickname.trim()
        if (avatarUrl) updates.avatarUrl = avatarUrl
        if (slug) updates.slug = slug.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
        if (exhibitionEnabled !== undefined) updates.exhibitionEnabled = exhibitionEnabled

        await db.update(users)
            .set(updates)
            .where(eq(users.id, session))

        return NextResponse.json({ success: true })
    } catch (e) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
