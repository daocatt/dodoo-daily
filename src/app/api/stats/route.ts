import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { accountStats, users } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { seed } from '@/lib/seed'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const cookieStore = await cookies()
        const currentUserId = cookieStore.get('dodoo_user_id')?.value
        const currentUserRole = cookieStore.get('dodoo_role')?.value

        if (!currentUserId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const userRecord = await db.select().from(users).where(eq(users.id, currentUserId)).get()
        if (!userRecord) return NextResponse.json({ error: 'User not found' }, { status: 404 })

        if (currentUserRole === 'PARENT') {
            return NextResponse.json({ isParent: true, name: userRecord.name, avatarUrl: userRecord.avatarUrl })
        }

        let stats = await db.select().from(accountStats).where(eq(accountStats.userId, currentUserId))

        let childStats = stats[0]
        if (!childStats) {
            const newStats = await db.insert(accountStats).values({
                userId: currentUserId,
                currency: 0,
                goldStars: 0,
                purpleStars: 0,
                angerPenalties: 0,
            }).returning()
            childStats = newStats[0]
        }

        return NextResponse.json({ ...childStats, name: userRecord.name, avatarUrl: userRecord.avatarUrl })
    } catch (error) {
        console.error('Failed to fetch account stats:', error)
        return NextResponse.json({ error: 'Failed to fetch account stats' }, { status: 500 })
    }
}
