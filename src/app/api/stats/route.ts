import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { accountStats, users } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { seed } from '@/lib/seed'

export async function GET() {
    try {
        // Find first child for default HUD
        let kids = await db.select().from(users).where(eq(users.role, 'CHILD'))

        if (kids.length === 0) {
            // Run seed if database is empty or missing kids
            await seed()
            kids = await db.select().from(users).where(eq(users.role, 'CHILD'))
        }

        const childId = kids[0].id
        let stats = await db.select().from(accountStats).where(eq(accountStats.userId, childId))

        if (stats.length === 0) {
            const newStats = await db.insert(accountStats).values({
                userId: childId,
                currency: 0,
                goldStars: 0,
                purpleStars: 0,
                angerPenalties: 0,
            }).returning()
            return NextResponse.json(newStats[0])
        }

        return NextResponse.json(stats[0])
    } catch (error) {
        console.error('Failed to fetch account stats:', error)
        return NextResponse.json({ error: 'Failed to fetch account stats' }, { status: 500 })
    }
}
