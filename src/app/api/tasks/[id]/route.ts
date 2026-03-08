import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { task, accountStats, accountStatsLog } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { cookies } from 'next/headers'
import { addBalance } from '@/lib/economy'

async function checkParent() {
    const cookieStore = await cookies()
    return cookieStore.get('dodoo_role')?.value === 'PARENT'
}

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = await req.json()
        const { completed, title, rewardStars, isRepeating, isMonthlyRepeating, plannedTime } = body

        const t = await db.select().from(task).where(eq(task.id, id))
        if (t.length === 0) return NextResponse.json({ error: 'Task not found' }, { status: 404 })

        const currentTask = t[0]
        const assignedTo = currentTask.assignedTo

        if (!assignedTo) {
            return NextResponse.json({ error: 'No user assigned to this task' }, { status: 400 })
        }

        let updateData: any = {}

        if (completed !== undefined) {
            updateData.completed = completed
            // Case 1: Child completing a task
            if (completed && !currentTask.completed) {
                if (currentTask.needsParentConfirmation) {
                    // Just set completed = true, but don't reward yet
                    updateData.confirmationStatus = 'PENDING';
                } else {
                    // Normal task, reward immediately
                    await addBalance(assignedTo, 'GOLD_STAR', currentTask.rewardStars, `Completed task: ${currentTask.title}`);
                }
            }
            // Case 2: Unmarking a task
            else if (!completed && currentTask.completed) {
                // Deduct if it was already rewarded (only if Approved or Not assigned)
                if (!currentTask.needsParentConfirmation || currentTask.confirmationStatus === 'APPROVED') {
                    await addBalance(assignedTo, 'GOLD_STAR', -currentTask.rewardStars, `Unmarked task: ${currentTask.title}`);
                    if (currentTask.rewardCoins > 0) {
                        await addBalance(assignedTo, 'CURRENCY', -currentTask.rewardCoins, `Deducted bonus coins for unmarking: ${currentTask.title}`);
                    }
                }
                updateData.confirmationStatus = 'PENDING';
            }
        }

        if (title !== undefined) updateData.title = title;
        if (rewardStars !== undefined) updateData.rewardStars = parseInt(rewardStars);
        if (body.rewardCoins !== undefined) updateData.rewardCoins = parseInt(body.rewardCoins);
        if (isRepeating !== undefined) updateData.isRepeating = isRepeating;
        if (isMonthlyRepeating !== undefined) updateData.isMonthlyRepeating = isMonthlyRepeating;
        if (plannedTime !== undefined) updateData.plannedTime = new Date(plannedTime);

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json(currentTask);
        }

        const updatedTask = await db.update(task)
            .set(updateData)
            .where(eq(task.id, id))
            .returning()

        return NextResponse.json(updatedTask[0])
    } catch (error) {
        console.error('Failed to update task:', error)
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        if (!await checkParent()) return NextResponse.json({ error: 'Auth failed' }, { status: 403 })
        const { id } = await params
        await db.delete(task).where(eq(task.id, id))
        return NextResponse.json({ success: true })
    } catch (e) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}
