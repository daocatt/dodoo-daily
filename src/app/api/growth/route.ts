import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { growthRecord, users } from '@/lib/schema'
import { eq, and, desc, gte, lte, sql } from 'drizzle-orm'
import { getSessionUser } from '@/lib/auth'

export async function GET(req: NextRequest) {
    const { userId, role } = await getSessionUser()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const targetUserId = searchParams.get('userId') || userId

    // If not self, must be parent
    if (targetUserId !== userId && role !== 'PARENT') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    try {
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '10')
        const offset = (page - 1) * limit

        const records = await db.select()
            .from(growthRecord)
            .where(eq(growthRecord.userId, targetUserId))
            .orderBy(desc(growthRecord.date))
            .limit(limit)
            .offset(offset)
            .all()

        const [{ count }] = await db.select({ count: sql<number>`count(*)` })
            .from(growthRecord)
            .where(eq(growthRecord.userId, targetUserId))
            .all()

        return NextResponse.json({
            records,
            pagination: {
                total: count,
                page,
                limit,
                totalPages: Math.ceil(count / limit)
            }
        })
    } catch (_e) {
        return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    const { userId, role } = await getSessionUser()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const body = await req.json()
        const { targetUserId, height, weight, date } = body

        const finalTargetId = targetUserId || userId
        if (finalTargetId !== userId && role !== 'PARENT') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const [newRecord] = await db.insert(growthRecord).values({
            userId: finalTargetId,
            height: height ? parseFloat(height) : null,
            weight: weight ? parseFloat(weight) : null,
            date: date ? new Date(date) : new Date()
        }).returning()

        return NextResponse.json(newRecord)
    } catch (_e) {
        return NextResponse.json({ error: 'Failed to create' }, { status: 500 })
    }
}
