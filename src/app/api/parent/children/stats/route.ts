import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users, accountStats, task, assignedTask, purchase, accountStatsLog, growthRecord } from '@/lib/schema'
import { eq, and, desc, gte, lte, or, sql } from 'drizzle-orm'
import { cookies } from 'next/headers'

async function getAuth() {
    const cookieStore = await cookies()
    const role = cookieStore.get('dodoo_role')?.value
    const userId = cookieStore.get('dodoo_user_id')?.value
    return { role, userId }
}

export async function GET(req: NextRequest) {
    const { role, userId } = await getAuth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const { searchParams } = new URL(req.url)
        // If child is querying, ignore userId param and force self
        const targetUserId = role === 'PARENT' ? searchParams.get('userId') : userId

        const now = new Date()
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        const lastWeekStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
        const lastWeekEnd = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

        // Query only for the allowed children
        const children = await db.select({
            id: users.id,
            name: users.name,
            nickname: users.nickname,
            avatarUrl: users.avatarUrl,
            stats: {
                currency: accountStats.currency,
                goldStars: accountStats.goldStars,
                purpleStars: accountStats.purpleStars,
            }
        })
            .from(users)
            .leftJoin(accountStats, eq(users.id, accountStats.userId))
            .where(
                role === 'PARENT'
                    ? (targetUserId ? eq(users.id, targetUserId) : and(eq(users.role, 'CHILD'), eq(users.isDeleted, false)))
                    : eq(users.id, userId as string)
            )
            .all()

        const detailedStats = await Promise.all(children.map(async (child) => {
            // 1. This week's earnings (since 7 days ago)
            const thisWeekLogs = await db.select()
                .from(accountStatsLog)
                .where(and(
                    eq(accountStatsLog.userId, child.id),
                    gte(accountStatsLog.createdAt, oneWeekAgo)
                )).all()

            const thisWeekStats = {
                currency: thisWeekLogs.filter(l => l.type === 'CURRENCY' && l.amount > 0).reduce((sum, l) => sum + l.amount, 0),
                goldStars: thisWeekLogs.filter(l => l.type === 'GOLD_STAR' && l.amount > 0).reduce((sum, l) => sum + l.amount, 0),
                purpleStars: thisWeekLogs.filter(l => l.type === 'PURPLE_STAR' && l.amount > 0).reduce((sum, l) => sum + l.amount, 0),
            }

            // 2. Last week's earnings
            const lastWeekLogs = await db.select()
                .from(accountStatsLog)
                .where(and(
                    eq(accountStatsLog.userId, child.id),
                    gte(accountStatsLog.createdAt, lastWeekStart),
                    lte(accountStatsLog.createdAt, lastWeekEnd)
                )).all()

            const lastWeekStats = {
                currency: lastWeekLogs.filter(l => l.type === 'CURRENCY' && l.amount > 0).reduce((sum, l) => sum + l.amount, 0),
                goldStars: lastWeekLogs.filter(l => l.type === 'GOLD_STAR' && l.amount > 0).reduce((sum, l) => sum + l.amount, 0),
                purpleStars: lastWeekLogs.filter(l => l.type === 'PURPLE_STAR' && l.amount > 0).reduce((sum, l) => sum + l.amount, 0),
            }

            // 3. Task completion (Sum of personal tasks and assigned tasks)
            const personalTasksCount = await db.select({ count: sql<number>`count(*)` })
                .from(task)
                .where(and(
                    eq(task.creatorId, child.id),
                    eq(task.completed, true),
                    gte(task.updatedAt, lastWeekStart),
                    lte(task.updatedAt, lastWeekEnd)
                )).get()

            const assignedTasksCount = await db.select({ count: sql<number>`count(*)` })
                .from(assignedTask)
                .where(and(
                    eq(assignedTask.assigneeId, child.id),
                    eq(assignedTask.completed, true),
                    eq(assignedTask.confirmationStatus, 'APPROVED'),
                    gte(assignedTask.updatedAt, lastWeekStart),
                    lte(assignedTask.updatedAt, lastWeekEnd)
                )).get()

            const totalCompletedCount = (personalTasksCount?.count || 0) + (assignedTasksCount?.count || 0)

            // 4. Growth data (last 14 days for charts)
            const growthData = await db.select()
                .from(growthRecord)
                .where(and(
                    eq(growthRecord.userId, child.id),
                    gte(growthRecord.date, lastWeekStart)
                ))
                .orderBy(desc(growthRecord.date))
                .all()

            return {
                ...child,
                thisWeekStats,
                lastWeekStats,
                lastWeekTaskCount: totalCompletedCount,
                growthData
            }
        }))

        return NextResponse.json(detailedStats)
    } catch (error) {
        console.error('Failed to fetch detailed child stats:', error)
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}
