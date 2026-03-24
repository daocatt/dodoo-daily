import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { task, accountStats, goldStarLog } from '@/lib/schema'
import { desc, eq, and, sql, isNotNull } from 'drizzle-orm'
import { getSessionUser } from '@/lib/auth'
import { sendPushNotification } from '@/lib/push'

export async function GET(req: NextRequest) {
    try {
        const { userId: id, role } = await getSessionUser()
        if (!id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { searchParams } = new URL(req.url)
        const targetUserId = searchParams.get('userId')

        // Fetch assigned tasks (where assignerId is set)
        const query = db.select({
            id: task.id,
            title: task.title,
            description: task.description,
            rewardStars: task.rewardStars,
            rewardCoins: task.rewardCoins,
            assignerId: task.assignerId,
            assigneeId: task.assigneeId,
            completed: task.completed,
            completedById: task.completedById,
            plannedTime: task.plannedTime,
            confirmationStatus: task.confirmationStatus,
            isRepeating: task.isRepeating,
            isMonthlyRepeating: task.isMonthlyRepeating,
            updatedAt: task.updatedAt,
            createdAt: task.createdAt,
            assigneeNickname: sql<string>`(SELECT COALESCE(nickname, name) FROM Users WHERE id = Task.assigneeId)`,
            assigneeAvatar: sql<string>`(SELECT avatarUrl FROM Users WHERE id = Task.assigneeId)`,
            assignerNickname: sql<string>`(SELECT COALESCE(nickname, name) FROM Users WHERE id = Task.assignerId)`,
            assignerAvatar: sql<string>`(SELECT avatarUrl FROM Users WHERE id = Task.assignerId)`,
            completedByNickname: sql<string>`(SELECT COALESCE(nickname, name) FROM Users WHERE id = Task.completedById)`,
        })
            .from(task)

        const filters = [];
        // Ensure we only get assigned tasks
        filters.push(isNotNull(task.assignerId));

        if (role === 'PARENT') {
            if (targetUserId) {
                filters.push(eq(task.assigneeId, targetUserId));
            } else {
                filters.push(eq(task.assignerId, id));
            }
        } else {
            filters.push(eq(task.assigneeId, id));
        }

        const tasks = await query.where(and(...filters)).orderBy(desc(task.createdAt));

        return NextResponse.json(tasks)
    } catch (error) {
        console.error('Failed to fetch assigned tasks:', error)
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    try {
        const { userId: id } = await getSessionUser()
        if (!id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const body = await req.json()
        const { title, description, rewardStars, assignedTo, plannedTime, isRepeating, isMonthlyRepeating } = body

        if (!title || !assignedTo) return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        const stars = Math.max(0, parseInt(rewardStars?.toString() || '0'))

        // Verify and Deduct Stars from Assigner (P2P logic)
        const [stats] = await db.select().from(accountStats).where(eq(accountStats.userId, id))
        if (!stats || stats.goldStars < stars) {
            return NextResponse.json({ error: 'Insufficient Gold Stars' }, { status: 400 })
        }

        const [newTask] = await db.transaction(async (tx) => {
            // Deduct Stars
            await tx.update(accountStats)
                .set({ goldStars: sql`goldStars - ${stars}` })
                .where(eq(accountStats.userId, id))

            await tx.insert(goldStarLog).values({
                userId: id,
                amount: -stars,
                balance: stats.goldStars - stars,
                reason: `Assigned Task: ${title}`,
                actorId: id
            })

            return tx.insert(task).values({
                assignerId: id,
                assigneeId: assignedTo,
                creatorId: id,
                title,
                description,
                rewardStars: stars,
                rewardCoins: 0, // Enforce 0 as per new rules
                plannedTime: plannedTime ? new Date(plannedTime) : null,
                confirmationStatus: 'PENDING',
                isRepeating: isRepeating || false,
                isMonthlyRepeating: isMonthlyRepeating || false,
                completed: false
            }).returning()
        })

        // Send Push Notification to child asynchronously
        try {
            sendPushNotification(assignedTo, {
                title: 'New Task! 🌟',
                body: `You have a new task: ${title}`,
                data: { url: '/tasks' }
            }).catch(e => console.error('Delayed push failed:', e))
        } catch (_e) {
            console.error('Notification trigger error:', e)
        }

        return NextResponse.json(newTask)
    } catch (error) {
        console.error('Failed to create assigned task:', error)
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}
