import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { task } from '@/lib/schema'
import { eq, and, isNull } from 'drizzle-orm'
import { getSessionUser } from '@/lib/auth'
import { addBalance } from '@/lib/economy'

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = await req.json()
        const { completed, title, isRepeating, isMonthlyRepeating, plannedTime } = body

        const t = await db.select().from(task).where(and(eq(task.id, id), isNull(task.assignerId)))
        if (t.length === 0) return NextResponse.json({ error: 'Task not found' }, { status: 404 })

        const currentTask = t[0]
        const { userId: currentUserId } = await getSessionUser()
        if (!currentUserId || currentTask.creatorId !== currentUserId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const updateData: Record<string, unknown> = {}

        if (completed !== undefined) {
            updateData.completed = completed
            if (completed && !currentTask.completed) {
                updateData.completedById = currentUserId
                await addBalance(currentUserId, 'GOLD_STAR', 1, `Personal task: ${currentTask.title}`, currentUserId);
            } else if (!completed && currentTask.completed) {
                updateData.completedById = null
                await addBalance(currentUserId, 'GOLD_STAR', -1, `Unmarked personal task: ${currentTask.title}`, currentUserId);
            }
        }

        if (title !== undefined) updateData.title = title;
        if (isRepeating !== undefined) updateData.isRepeating = isRepeating;
        if (isMonthlyRepeating !== undefined) updateData.isMonthlyRepeating = isMonthlyRepeating;
        if (plannedTime !== undefined) updateData.plannedTime = new Date(plannedTime);

        if (Object.keys(updateData).length === 0) return NextResponse.json(currentTask);

        const updated = await db.update(task).set(updateData).where(eq(task.id, id)).returning()
        return NextResponse.json(updated[0])
    } catch (error) {
        console.error('Failed to update personal task:', error)
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}

export async function DELETE(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSessionUser()
        const currentUserId = session?.userId
        if (!currentUserId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { id } = await params
        const [t] = await db.select().from(task).where(and(eq(task.id, id), isNull(task.assignerId)))
        if (!t || t.creatorId !== currentUserId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

        await db.delete(task).where(eq(task.id, id))
        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Failed to delete personal task:', error)
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}
