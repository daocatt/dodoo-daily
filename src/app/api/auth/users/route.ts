import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users } from '@/lib/schema'
import { seed } from '@/lib/seed'

import { eq, and, not } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        let allUsers = await db.select().from(users).where(
            and(
                eq(users.isArchived, false),
                eq(users.isDeleted, false)
            )
        )

        if (allUsers.length === 0) {
            await seed()
            allUsers = await db.select().from(users).where(
                and(
                    eq(users.isArchived, false),
                    eq(users.isDeleted, false)
                )
            )
        }

        const formatted = allUsers.map(u => ({
            id: u.id,
            name: u.name,
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
