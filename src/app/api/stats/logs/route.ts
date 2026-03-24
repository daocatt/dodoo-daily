import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { accountStatsLog, currencyLog, goldStarLog, purpleStarLog, users } from '@/lib/schema'
import { eq, and, desc, sql } from 'drizzle-orm'
import { getSessionUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
    const session = await getSessionUser()
    const currentUserId = session?.userId
    const role = session?.role

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

        // Choose table based on type
        let logs: Record<string, unknown>[] = []
        let totalCountResult: { count: number } | undefined = undefined

        if (type === 'CURRENCY') {
            logs = await db.select({
                id: currencyLog.id,
                userId: currencyLog.userId,
                amount: currencyLog.amount,
                balance: currencyLog.balance,
                reason: currencyLog.reason,
                actorId: currencyLog.actorId,
                actorName: users.name,
                createdAt: currencyLog.createdAt
            }).from(currencyLog)
                .leftJoin(users, eq(currencyLog.actorId, users.id))
                .where(eq(currencyLog.userId, targetUserId))
                .orderBy(desc(currencyLog.createdAt))
                .limit(limit).offset(offset).all()

            totalCountResult = await db.select({ count: sql<number>`count(*)` })
                .from(currencyLog).where(eq(currencyLog.userId, targetUserId)).get()
        } else if (type === 'GOLD_STAR') {
            logs = await db.select({
                id: goldStarLog.id,
                userId: goldStarLog.userId,
                amount: goldStarLog.amount,
                balance: goldStarLog.balance,
                reason: goldStarLog.reason,
                actorId: goldStarLog.actorId,
                actorName: users.name,
                createdAt: goldStarLog.createdAt
            }).from(goldStarLog)
                .leftJoin(users, eq(goldStarLog.actorId, users.id))
                .where(eq(goldStarLog.userId, targetUserId))
                .orderBy(desc(goldStarLog.createdAt))
                .limit(limit).offset(offset).all()

            totalCountResult = await db.select({ count: sql<number>`count(*)` })
                .from(goldStarLog).where(eq(goldStarLog.userId, targetUserId)).get()
        } else if (type === 'PURPLE_STAR') {
            logs = await db.select({
                id: purpleStarLog.id,
                userId: purpleStarLog.userId,
                amount: purpleStarLog.amount,
                balance: purpleStarLog.balance,
                reason: purpleStarLog.reason,
                actorId: purpleStarLog.actorId,
                actorName: users.name,
                createdAt: purpleStarLog.createdAt
            }).from(purpleStarLog)
                .leftJoin(users, eq(purpleStarLog.actorId, users.id))
                .where(eq(purpleStarLog.userId, targetUserId))
                .orderBy(desc(purpleStarLog.createdAt))
                .limit(limit).offset(offset).all()

            totalCountResult = await db.select({ count: sql<number>`count(*)` })
                .from(purpleStarLog).where(eq(purpleStarLog.userId, targetUserId)).get()
        } else {
            // Fallback to unified log if no type or other type
            const whereClause = type
                ? and(eq(accountStatsLog.userId, targetUserId), eq(accountStatsLog.type, type as typeof accountStatsLog.$inferInsert.type))
                : eq(accountStatsLog.userId, targetUserId)

            logs = await db.select({
                id: accountStatsLog.id,
                userId: accountStatsLog.userId,
                type: accountStatsLog.type,
                amount: accountStatsLog.amount,
                balance: accountStatsLog.balance,
                reason: accountStatsLog.reason,
                actorId: accountStatsLog.actorId,
                actorName: users.name,
                createdAt: accountStatsLog.createdAt
            }).from(accountStatsLog)
                .leftJoin(users, eq(accountStatsLog.actorId, users.id))
                .where(whereClause)
                .orderBy(desc(accountStatsLog.createdAt))
                .limit(limit).offset(offset).all()

            totalCountResult = await db.select({ count: sql<number>`count(*)` })
                .from(accountStatsLog).where(whereClause).get()
        }

        return NextResponse.json({
            logs,
            pagination: {
                page,
                limit,
                total: totalCountResult?.count || 0,
                totalPages: Math.ceil((totalCountResult?.count || 0) / limit)
            }
        })
    } catch (error) {
        console.error('Failed to fetch history:', error)
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}
