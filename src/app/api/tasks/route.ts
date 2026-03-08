import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { task, users } from '@/lib/schema'
import { desc, eq, and, or } from 'drizzle-orm'
import { cookies } from 'next/headers'

async function getCurrentUser() {
    const cookieStore = await cookies()
    const id = cookieStore.get('dodoo_user_id')?.value
    const role = cookieStore.get('dodoo_role')?.value
    return { id, role }
}

export async function GET(req: NextRequest) {
    try {
        const { id, role } = await getCurrentUser()
        if (!id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { searchParams } = new URL(req.url)
        const targetUserId = searchParams.get('userId')

        let query = db.select().from(task)

        if (role === 'PARENT') {
            if (targetUserId) {
                // @ts-ignore
                const allTasks = await query.where(eq(task.assignedTo, targetUserId)).orderBy(desc(task.createdAt))
                return NextResponse.json(allTasks)
            } else {
                // Return ONLY tasks assigned to the parent AND tasks created by the parent (like assignments)
                const allTasks = await query.where(
                    or(eq(task.assignedTo, id as string), eq(task.creatorId, id as string))
                ).orderBy(desc(task.createdAt));
                return NextResponse.json(allTasks)
            }
        } else {
            // Child only sees their own tasks
            // @ts-ignore
            const allTasks = await query.where(eq(task.assignedTo, id)).orderBy(desc(task.createdAt))
            return NextResponse.json(allTasks)
        }
    } catch (error) {
        console.error('Failed to fetch tasks:', error)
        return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    try {
        const { id, role } = await getCurrentUser()
        if (!id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await req.json()
        const { title, description, rewardStars, rewardCoins, isRepeating, isMonthlyRepeating, plannedTime, assignedTo } = body

        if (!title) {
            return NextResponse.json({ error: 'Title is required' }, { status: 400 })
        }

        const finalAssignedTo = assignedTo || id;
        const isAssignedTask = finalAssignedTo !== id;

        const newTask = await db.insert(task).values({
            assignedTo: finalAssignedTo,
            creatorId: id,
            title,
            description: description || null,
            rewardStars: rewardStars ? parseInt(rewardStars) : 1,
            rewardCoins: rewardCoins ? parseInt(rewardCoins) : 0,
            needsParentConfirmation: isAssignedTask,
            confirmationStatus: isAssignedTask ? 'PENDING' : 'APPROVED',
            isRepeating: !!isRepeating,
            isMonthlyRepeating: !!isMonthlyRepeating,
            plannedTime: plannedTime ? new Date(plannedTime) : null,
            completed: false,
        }).returning()

        return NextResponse.json(newTask[0])
    } catch (error) {
        console.error('Failed to create task:', error)
        return NextResponse.json({ error: 'Failed to create task' }, { status: 500 })
    }
}

