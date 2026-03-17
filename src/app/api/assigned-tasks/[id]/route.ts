import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { task } from '@/lib/schema'
import { eq, and, isNotNull } from 'drizzle-orm'
import { getSessionUser } from '@/lib/auth'
import { addBalance } from '@/lib/economy'
import { notifyParents, sendPushNotification } from '@/lib/push'

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const { userId: currentUserId, role } = await getSessionUser()
        if (!currentUserId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const body = await req.json()
        const { completed, action, title, description, rewardStars, rewardCoins, isRepeating, isMonthlyRepeating, plannedTime } = body

        const [currentTask] = await db.select().from(task).where(and(eq(task.id, id), isNotNull(task.assignerId)))
        if (!currentTask) return NextResponse.json({ error: 'Not found' }, { status: 404 })
        if (!currentTask.assigneeId) return NextResponse.json({ error: 'Assignee not found' }, { status: 400 })

        const updateData: Record<string, unknown> = {}

        // Completion logic
        if (completed !== undefined) {
            updateData.completed = completed
            if (completed && !currentTask.completed) {
                updateData.completedById = currentUserId
                // If Parent (assigner) marks it, approve immediately
                if (role === 'PARENT' && currentTask.assignerId === currentUserId) {
                    updateData.confirmationStatus = 'APPROVED'
                    await addBalance(currentTask.assigneeId, 'GOLD_STAR', currentTask.rewardStars, `Reward: ${currentTask.title}`, currentUserId)
                    if (currentTask.rewardCoins > 0) {
                        await addBalance(currentTask.assigneeId, 'CURRENCY', currentTask.rewardCoins, `Reward: ${currentTask.title}`, currentUserId)
                    }
                } else {
                    updateData.confirmationStatus = 'PENDING'
                }
            } else if (!completed && currentTask.completed) {
                updateData.completedById = null
                // Deduct if approved
                if (currentTask.confirmationStatus === 'APPROVED') {
                    await addBalance(currentTask.assigneeId, 'GOLD_STAR', -currentTask.rewardStars, `Unmarked: ${currentTask.title}`, currentUserId)
                    if (currentTask.rewardCoins > 0) {
                        await addBalance(currentTask.assigneeId, 'CURRENCY', -currentTask.rewardCoins, `Unmarked: ${currentTask.title}`, currentUserId)
                    }
                }
                updateData.confirmationStatus = 'PENDING'
            }
        }

        // Parent approval
        if (action === 'CONFIRM_REWARD' && role === 'PARENT' && currentTask.assignerId === currentUserId) {
            if (currentTask.completed && currentTask.confirmationStatus === 'PENDING') {
                updateData.confirmationStatus = 'APPROVED'
                await addBalance(currentTask.assigneeId, 'GOLD_STAR', currentTask.rewardStars, `Approved: ${currentTask.title}`, currentUserId)
                if (currentTask.rewardCoins > 0) {
                    await addBalance(currentTask.assigneeId, 'CURRENCY', currentTask.rewardCoins, `Approved: ${currentTask.title}`, currentUserId)
                }
            }
        }

        // Metadata updates (Parents only)
        if (role === 'PARENT' && currentTask.assignerId === currentUserId) {
            if (title !== undefined) updateData.title = title
            if (description !== undefined) updateData.description = description
            if (rewardStars !== undefined) updateData.rewardStars = rewardStars
            if (rewardCoins !== undefined) updateData.rewardCoins = rewardCoins
            if (isRepeating !== undefined) updateData.isRepeating = isRepeating
            if (isMonthlyRepeating !== undefined) updateData.isMonthlyRepeating = isMonthlyRepeating
            if (plannedTime !== undefined) updateData.plannedTime = new Date(plannedTime)
        }

        if (Object.keys(updateData).length === 0) return NextResponse.json(currentTask)

        const updated = await db.update(task).set(updateData).where(eq(task.id, id)).returning()
        const result = updated[0]

        // Async Push Notifications
        try {
            // Case 1: Child marks task as complete -> Notify Parent
            if (completed === true && role === 'CHILD' && currentTask.assignerId) {
                notifyParents({
                    title: 'Task Completed! ✅',
                    body: `Completed: ${currentTask.title}`,
                    data: { url: '/parent/tasks' }
                }).catch(e => console.error('Push failed:', e))
            }
            // Case 2: Parent approves task -> Notify Child
            if ((action === 'CONFIRM_REWARD' || (role === 'PARENT' && completed === true)) && currentTask.assigneeId) {
                sendPushNotification(currentTask.assigneeId, {
                    title: 'Reward Confirmed! ✨',
                    body: `Gained stars for: ${currentTask.title}`,
                    data: { url: '/tasks' }
                }).catch(e => console.error('Push failed:', e))
            }
        } catch (e) {
            console.error('Trigger notification error:', e)
        }

        return NextResponse.json(result)
    } catch (error) {
        console.error('Failed to update assigned task:', error)
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const { userId: currentUserId, role } = await getSessionUser()
        const [t] = await db.select().from(task).where(and(eq(task.id, id), isNotNull(task.assignerId)))

        if (!t || (role !== 'PARENT' && t.assignerId !== currentUserId)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        await db.delete(task).where(eq(task.id, id))
        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Failed to delete assigned task:', error)
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}
