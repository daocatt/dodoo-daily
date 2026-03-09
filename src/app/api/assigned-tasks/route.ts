import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { assignedTask } from '@/lib/schema'
import { desc, eq, and, sql } from 'drizzle-orm'
import { getSessionUser } from '@/lib/auth'

export async function GET(req: NextRequest) {
    try {
        const { userId: id, role } = await getSessionUser()
        if (!id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { searchParams } = new URL(req.url)
        const targetUserId = searchParams.get('userId')

        // Fetch assigned tasks
        const query = db.select({
            id: assignedTask.id,
            title: assignedTask.title,
            description: assignedTask.description,
            rewardStars: assignedTask.rewardStars,
            rewardCoins: assignedTask.rewardCoins,
            assignerId: assignedTask.assignerId,
            assigneeId: assignedTask.assigneeId,
            completed: assignedTask.completed,
            completedById: assignedTask.completedById,
            plannedTime: assignedTask.plannedTime,
            confirmationStatus: assignedTask.confirmationStatus,
            isRepeating: assignedTask.isRepeating,
            isMonthlyRepeating: assignedTask.isMonthlyRepeating,
            updatedAt: assignedTask.updatedAt,
            createdAt: assignedTask.createdAt,
            assigneeNickname: sql<string>`(SELECT COALESCE(nickname, name) FROM Users WHERE id = AssignedTask.assigneeId)`,
            assigneeAvatar: sql<string>`(SELECT avatarUrl FROM Users WHERE id = AssignedTask.assigneeId)`,
            completedByNickname: sql<string>`(SELECT COALESCE(nickname, name) FROM Users WHERE id = AssignedTask.completedById)`,
        })
            .from(assignedTask)

        const filters = [];
        if (role === 'PARENT') {
            if (targetUserId) {
                filters.push(eq(assignedTask.assigneeId, targetUserId));
            } else {
                filters.push(eq(assignedTask.assignerId, id));
            }
        } else {
            filters.push(eq(assignedTask.assigneeId, id));
        }

        const tasks = await query.where(and(...filters)).orderBy(desc(assignedTask.createdAt));

        return NextResponse.json(tasks)
    } catch (error) {
        console.error('Failed to fetch assigned tasks:', error)
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    try {
        const { userId: id, role } = await getSessionUser()
        if (!id || role !== 'PARENT') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const body = await req.json()
        const { title, description, rewardStars, rewardCoins, isRepeating, isMonthlyRepeating, plannedTime, assignedTo } = body

        if (!title || !assignedTo) return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })

        const newTask = await db.insert(assignedTask).values({
            assignerId: id,
            assigneeId: assignedTo,
            title,
            description: description || null,
            rewardStars: rewardStars ? parseInt(rewardStars) : 1,
            rewardCoins: rewardCoins ? parseInt(rewardCoins) : 0,
            confirmationStatus: 'PENDING',
            isRepeating: !!isRepeating,
            isMonthlyRepeating: !!isMonthlyRepeating,
            plannedTime: plannedTime ? new Date(plannedTime) : null,
            completed: false,
        }).returning()

        return NextResponse.json(newTask[0])
    } catch (error) {
        console.error('Failed to create assigned task:', error)
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}
