import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { task } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { getSessionUser } from '@/lib/auth'
import { addBalance } from '@/lib/economy'

export async function POST(req: NextRequest) {
    try {
        const { userId: actorId, role } = await getSessionUser()

        if (role !== 'PARENT' || !actorId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { taskId, action } = await req.json() // action: 'APPROVE' | 'REJECT'
        const currentTask = await db.select().from(task).where(eq(task.id, taskId)).get()

        if (!currentTask) {
            return NextResponse.json({ error: 'Task not found' }, { status: 404 })
        }

        if (currentTask.confirmationStatus !== 'PENDING') {
            return NextResponse.json({ error: 'Task already processed' }, { status: 400 })
        }

        if (action === 'APPROVE') {
            if (currentTask.assignedTo) {
                // Award stars
                await addBalance(currentTask.assignedTo, 'GOLD_STAR', currentTask.rewardStars, `Assigned Task Approved: ${currentTask.title}`, actorId)
                // Award coins if any
                if (currentTask.rewardCoins > 0) {
                    await addBalance(currentTask.assignedTo, 'CURRENCY', currentTask.rewardCoins, `Bonus for Task: ${currentTask.title}`, actorId)
                }
            }

            const updated = await db.update(task)
                .set({ confirmationStatus: 'APPROVED', updatedAt: new Date() })
                .where(eq(task.id, taskId))
                .returning()

            return NextResponse.json(updated[0])
        } else if (action === 'REJECT') {
            const updated = await db.update(task)
                .set({
                    confirmationStatus: 'REJECTED',
                    completed: false, // Set back to incomplete so child can re-submit
                    updatedAt: new Date()
                })
                .where(eq(task.id, taskId))
                .returning()

            return NextResponse.json(updated[0])
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    } catch (error) {
        console.error('Task confirmation error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
