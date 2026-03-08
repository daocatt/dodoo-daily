import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { accountStatsLog, users } from '@/lib/schema'
import { eq, and, desc, sql } from 'drizzle-orm'
import { cookies } from 'next/headers'

export async function GET(req: NextRequest) {
    const cookieStore = await cookies()
    const currentUserId = cookieStore.get('dodoo_user_id')?.value
    const role = cookieStore.get('dodoo_role')?.value

    if (!currentUserId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const { searchParams } = new URL(req.url)
        const targetUserId = searchParams.get('userId') || currentUserId
        const type = searchParams.get('type') // CURRENCY, GOLD_STAR, PURPLE_STAR
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '20')
        const offset = (page - 1) * limit

        // Security check: children can only see their own logs
        if (role !== 'PARENT' && targetUserId !== currentUserId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const whereClause = type
            ? and(eq(accountStatsLog.userId, targetUserId), eq(accountStatsLog.type, type as any))
            : eq(accountStatsLog.userId, targetUserId)

        const logs = await db.select({
            id: accountStatsLog.id,
            userId: accountStatsLog.userId,
            type: accountStatsLog.type,
            amount: accountStatsLog.amount,
            balance: accountStatsLog.balance,
            reason: accountStatsLog.reason,
            actorId: accountStatsLog.actorId,
            actorName: users.name,
            createdAt: accountStatsLog.createdAt
        })
            .from(accountStatsLog)
            .leftJoin(users, eq(accountStatsLog.actorId, users.id))
            .where(whereClause)
            .orderBy(desc(accountStatsLog.createdAt))
            .limit(limit)
            .offset(offset)
            .all()

        const totalCount = await db.select({ count: sql<number>`count(*)` })
            .from(accountStatsLog)
            .where(whereClause)
            .get()

        return NextResponse.json({
            logs,
            pagination: {
                page,
                limit,
                total: totalCount?.count || 0,
                totalPages: Math.ceil((totalCount?.count || 0) / limit)
            }
        })
    } catch (error) {
        console.error('Failed to fetch history:', error)
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}
