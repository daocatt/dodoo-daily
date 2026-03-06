import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { emotionRecord, accountStats, users } from '@/lib/schema'
import { desc, eq } from 'drizzle-orm'

async function getDefaultChildId() {
    const kids = await db.select().from(users).where(eq(users.role, 'CHILD'))
    return kids.length > 0 ? kids[0].id : null
}

export async function GET() {
    try {
        const childId = await getDefaultChildId()
        if (!childId) return NextResponse.json([])

        const records = await db.select().from(emotionRecord)
            .where(eq(emotionRecord.userId, childId))
            .orderBy(desc(emotionRecord.createdAt))
        return NextResponse.json(records)
    } catch (error) {
        console.error('Failed to fetch emotions:', error)
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { notes } = body

        const childId = await getDefaultChildId()
        if (!childId) return NextResponse.json({ error: 'No child account found' }, { status: 404 })

        const record = await db.insert(emotionRecord).values({
            userId: childId,
            type: 'ANGER',
            notes: notes || 'Tantrum/Anger Outburst',
        }).returning()

        // Give penalty
        let stats = await db.select().from(accountStats).where(eq(accountStats.userId, childId))
        if (stats.length === 0) {
            await db.insert(accountStats).values({
                userId: childId,
                angerPenalties: 1,
            })
        } else {
            await db.update(accountStats)
                .set({ angerPenalties: stats[0].angerPenalties + 1 })
                .where(eq(accountStats.userId, childId))
        }

        return NextResponse.json(record[0])
    } catch (error) {
        console.error('Failed to log emotion:', error)
        return NextResponse.json({ error: 'Failed to log emotion' }, { status: 500 })
    }
}
