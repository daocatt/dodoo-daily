import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { task, users } from '@/lib/schema'
import { desc, eq, and, or, sql, isNull } from 'drizzle-orm'
import { getSessionUser } from '@/lib/auth'

export async function GET(req: NextRequest) {
    try {
        const session = await getSessionUser()
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        const { userId: id } = session

        // Fetch personal tasks only (assignerId is null)
        const personalTasks = await db.select({
            id: task.id,
            title: task.title,
            description: task.description,
            rewardStars: task.rewardStars,
            rewardCoins: task.rewardCoins,
            creatorId: task.creatorId,
            completed: task.completed,
            completedById: task.completedById,
            plannedTime: task.plannedTime,
            isRepeating: task.isRepeating,
            isMonthlyRepeating: task.isMonthlyRepeating,
            updatedAt: task.updatedAt,
            createdAt: task.createdAt,
            completedByNickname: sql<string>`(SELECT COALESCE(nickname, name) FROM Users WHERE id = Task.completedById)`,
        })
            .from(task)
            .where(and(eq(task.creatorId, id), isNull(task.assignerId)))
            .orderBy(desc(task.createdAt))

        return NextResponse.json(personalTasks)
    } catch (error) {
        console.error('Failed to fetch personal tasks:', (error as Error).message, (error as Error).stack)
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getSessionUser()
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        const { userId: id } = session

        const body = await req.json()
        const { title, description, isRepeating, isMonthlyRepeating, plannedTime } = body

        if (!title) return NextResponse.json({ error: 'Title required' }, { status: 400 })

        const newTask = await db.insert(task).values({
            creatorId: id,
            title,
            description: description || null,
            rewardStars: 1, // Fixed for personal
            rewardCoins: 0, // Fixed for personal
            isRepeating: !!isRepeating,
            isMonthlyRepeating: !!isMonthlyRepeating,
            plannedTime: plannedTime ? new Date(plannedTime) : null,
            completed: false,
        }).returning()

        return NextResponse.json(newTask[0])
    } catch (error) {
        console.error('Failed to create personal task:', error)
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}
