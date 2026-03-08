import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { accountStats, users, systemSettings } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const cookieStore = await cookies()
        const currentUserId = cookieStore.get('dodoo_user_id')?.value
        const currentUserRole = cookieStore.get('dodoo_role')?.value

        if (!currentUserId) {
            console.warn('[API stats] No currentUserId in cookies')
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        console.log('[API stats] Fetching stats for user:', currentUserId)

        const userRecord = await db.select().from(users).where(eq(users.id, currentUserId)).get()
        if (!userRecord) {
            console.error('[API stats] User record not found for id:', currentUserId)
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // Fetch or create stats
        let statsRecord = await db.select().from(accountStats).where(eq(accountStats.userId, currentUserId)).get()

        if (!statsRecord) {
            console.log('[API stats] Creating new statsRecord for:', currentUserId)
            try {
                const results = await db.insert(accountStats).values({
                    userId: currentUserId,
                    goldStars: 0,
                    purpleStars: 0,
                    angerPenalties: 0,
                    currency: 0,
                }).returning()
                statsRecord = results[0]
            } catch (insertError: any) {
                console.error('[API stats] Insert failed:', insertError.message)
                // Fallback: maybe it was created by another request in parallel
                statsRecord = await db.select().from(accountStats).where(eq(accountStats.userId, currentUserId)).get()
                if (!statsRecord) throw insertError
            }
        }

        const settings = await db.select({ timezone: systemSettings.timezone })
            .from(systemSettings)
            .where(eq(systemSettings.id, 'app_settings'))
            .get()

        const responseData = {
            ...statsRecord,
            isParent: currentUserRole === 'PARENT',
            avatarUrl: userRecord.avatarUrl,
            timezone: settings?.timezone || 'Asia/Shanghai'
        }

        return NextResponse.json(responseData)
    } catch (error: any) {
        console.error('[API stats] Critical error:', error.message, error.stack)
        return NextResponse.json({
            error: 'Failed to fetch account stats',
            details: error.message
        }, { status: 500 })
    }
}
