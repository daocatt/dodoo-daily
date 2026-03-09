import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import { users } from '@/lib/schema'
import { eq, and, not, or } from 'drizzle-orm'

export async function PATCH(req: Request) {
    const cookieStore = await cookies()
    const session = cookieStore.get('dodoo_user_id')?.value
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const { name, nickname, avatarUrl, gender, birthDate } = await req.json()

        // Uniquness check
        if (name || nickname) {
            const conditions = [];
            if (name) conditions.push(eq(users.name, name.trim()));
            if (nickname) conditions.push(eq(users.nickname, nickname.trim()));

            if (conditions.length > 0) {
                const existing = await db.select().from(users).where(
                    and(
                        not(eq(users.id, session)),
                        or(...conditions)
                    )
                ).all();

                if (existing.length > 0) {
                    const hasSameName = name && existing.some(u => u.name === name.trim());
                    const hasSameNickname = nickname && existing.some(u => u.nickname === nickname.trim());
                    if (hasSameName) return NextResponse.json({ error: 'Name already exists' }, { status: 400 });
                    if (hasSameNickname) return NextResponse.json({ error: 'Nickname already exists' }, { status: 400 });
                }
            }
        }

        const updates: Partial<typeof users.$inferInsert> & { updatedAt?: Date } = {}
        if (name !== undefined) updates.name = name.trim()
        if (nickname !== undefined) updates.nickname = nickname ? nickname.trim() : null
        if (avatarUrl !== undefined) updates.avatarUrl = avatarUrl
        if (gender !== undefined) updates.gender = gender
        if (birthDate !== undefined) updates.birthDate = birthDate ? new Date(birthDate) : null

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
