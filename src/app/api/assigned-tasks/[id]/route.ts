import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { assignedTask } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { cookies } from 'next/headers'
import { addBalance } from '@/lib/economy'

async function getCurrentUser() {
    const cookieStore = await cookies()
    const id = cookieStore.get('dodoo_user_id')?.value
    const role = cookieStore.get('dodoo_role')?.value
    return { id, role }
}

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = await req.json()
        const { completed, action } = body

        const [currentTask] = await db.select().from(assignedTask).where(eq(assignedTask.id, id))
        if (!currentTask) return NextResponse.json({ error: 'Not found' }, { status: 404 })
        if (!currentTask.assigneeId) return NextResponse.json({ error: 'Assignee not found' }, { status: 400 })

        const { id: currentUserId, role } = await getCurrentUser()
        if (!currentUserId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

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

        if (Object.keys(updateData).length === 0) return NextResponse.json(currentTask)

        const updated = await db.update(assignedTask).set(updateData).where(eq(assignedTask.id, id)).returning()
        return NextResponse.json(updated[0])
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
        const { id: currentUserId, role } = await getCurrentUser()
        const [t] = await db.select().from(assignedTask).where(eq(assignedTask.id, id))

        if (!t || (role !== 'PARENT' && t.assignerId !== currentUserId)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        await db.delete(assignedTask).where(eq(assignedTask.id, id))
        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Failed to delete assigned task:', error)
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}
