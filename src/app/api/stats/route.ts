import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { accountStats, users } from '@/lib/schema'
import { eq } from 'drizzle-orm'
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

        // Check if stats exist, if not create them
        let statsRecord = await db.select().from(accountStats).where(eq(accountStats.userId, currentUserId)).get()

        if (!statsRecord) {
            const [newStats] = await db.insert(accountStats).values({
                userId: currentUserId,
                goldStars: 0,
                purpleStars: 0,
                angerPenalties: 0,
                currency: 0,
            }).returning()
            statsRecord = newStats
        }

        return NextResponse.json({
            ...statsRecord,
            isParent: currentUserRole === 'PARENT',
            userId: currentUserId,
            name: userRecord.nickname || userRecord.name,
            avatarUrl: userRecord.avatarUrl
        })
    } catch (error) {
        console.error('Failed to fetch account stats:', error)
        return NextResponse.json({ error: 'Failed to fetch account stats' }, { status: 500 })
    }
}
