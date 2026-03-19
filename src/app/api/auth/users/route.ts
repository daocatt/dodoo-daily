import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users, systemSettings } from '@/lib/schema'
import { seed } from '@/lib/seed'
import { eq, and } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const settings = await db.select().from(systemSettings).where(eq(systemSettings.id, 'app_settings')).get()
        const showAllAvatars = settings?.showAllAvatars ?? true
        const needsSetup = settings?.needsSetup ?? false

        // 1. Hide users list if privacy mode is ON (showAllAvatars = false)
        // EXCEPT during first-time setup where we need to find the parent.
        if (!showAllAvatars && !needsSetup) {
            return NextResponse.json([])
        }

        let allUsers = await db.select().from(users).where(
            and(
                eq(users.isArchived, false),
                eq(users.isDeleted, false)
            )
        ).all()

        if (allUsers.length === 0) {
            await seed()
            allUsers = await db.select().from(users).where(
                and(
                    eq(users.isArchived, false),
                    eq(users.isDeleted, false)
                )
            ).all()
        }

        const formatted = allUsers.map(u => ({
            id: u.id,
            name: u.nickname || u.name,
            role: u.role,
            avatarUrl: u.avatarUrl,
            hasPin: !!u.pin
        }))

        return NextResponse.json(formatted)
    } catch (e) {
        console.error('Failed to fetch users', e)
        return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }
}
