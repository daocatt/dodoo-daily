import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users } from '@/lib/schema'
import { eq, and, not, or } from 'drizzle-orm'
import { getSessionUser } from '@/lib/auth'

export async function PATCH(req: Request) {
    const { userId: session } = await getSessionUser()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const { name, nickname, avatarUrl, gender, birthDate, slug, exhibitionEnabled } = await req.json()
        if ([name, avatarUrl, nickname, slug, exhibitionEnabled].every(v => v === undefined)) {
            return NextResponse.json({ error: 'Missing updates' }, { status: 400 })
        }

        let validatedSlug = slug;
        if (validatedSlug) {
            validatedSlug = validatedSlug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
            if (validatedSlug.length < 6) return NextResponse.json({ error: 'Link ID must be at least 6 characters' }, { status: 400 });
        }

        // Uniqueness check
        if (name || nickname || validatedSlug) {
            const conditions = [];
            if (name) conditions.push(eq(users.name, name.trim()));
            if (nickname) conditions.push(eq(users.nickname, nickname.trim()));
            if (validatedSlug) conditions.push(eq(users.slug, validatedSlug));

            if (conditions.length > 0) {
                const existing = await db.select().from(users).where(
                    and(
                        not(eq(users.id, session)),
                        or(...conditions)
                    )
                ).all();

                if (existing.length > 0) {
                    if (name && existing.some(u => u.name === name.trim())) return NextResponse.json({ error: 'Name already exists' }, { status: 400 });
                    if (nickname && existing.some(u => u.nickname === nickname.trim())) return NextResponse.json({ error: 'Nickname already exists' }, { status: 400 });
                    if (validatedSlug && existing.some(u => u.slug === validatedSlug)) return NextResponse.json({ error: 'This Link ID is already taken' }, { status: 400 });
                }
            }
        }

        const updates: Partial<typeof users.$inferInsert> & { updatedAt?: Date } = {}
        if (name !== undefined) updates.name = name.trim()
        if (nickname !== undefined) updates.nickname = nickname ? nickname.trim() : null
        if (avatarUrl !== undefined) updates.avatarUrl = avatarUrl
        if (gender !== undefined) updates.gender = gender
        if (birthDate !== undefined) updates.birthDate = birthDate ? new Date(birthDate) : null
        if (validatedSlug !== undefined) updates.slug = validatedSlug
        if (exhibitionEnabled !== undefined) updates.exhibitionEnabled = exhibitionEnabled

        updates.updatedAt = new Date()

        await db.update(users)
            .set(updates)
            .where(eq(users.id, session))

        return NextResponse.json({ success: true, ...updates })
    } catch (e) {
        console.error('Profile update error:', e)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
