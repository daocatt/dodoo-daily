import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { growthRecord } from '@/lib/schema'
import { eq, desc, sql } from 'drizzle-orm'
import { getSessionUser } from '@/lib/auth'

export async function GET(req: NextRequest) {
    const session = await getSessionUser()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { userId, role } = session

    const { searchParams } = new URL(req.url)
    const targetUserId = searchParams.get('userId') || userId

    // Only Admin can fetch growth records
    if (session.permissionRole !== 'SUPERADMIN' && session.permissionRole !== 'ADMIN') {
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
    const session = await getSessionUser()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { userId, role } = session

    try {
        const body = await req.json()
        const { targetUserId, height, weight, date } = body

        const finalTargetId = targetUserId || userId
        // Only Admin can record growth data
        if (session.permissionRole !== 'SUPERADMIN' && session.permissionRole !== 'ADMIN') {
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
