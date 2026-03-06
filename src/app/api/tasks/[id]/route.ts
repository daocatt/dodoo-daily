import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { task, accountStats } from '@/lib/schema'
import { eq } from 'drizzle-orm'

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = await req.json()
        const { completed } = body

        // Fetch task to get reward
        const t = await db.select().from(task).where(eq(task.id, id))
        if (t.length === 0) return NextResponse.json({ error: 'Task not found' }, { status: 404 })

        const currentTask = t[0]
        const assignedTo = currentTask.assignedTo

        if (!assignedTo) {
            return NextResponse.json({ error: 'No user assigned to this task' }, { status: 400 })
        }

        // Only give reward if completing it
        if (completed && !currentTask.completed) {
            // Give reward
            let stats = await db.select().from(accountStats).where(eq(accountStats.userId, assignedTo))
            if (stats.length === 0) {
                await db.insert(accountStats).values({
                    userId: assignedTo,
                    goldStars: currentTask.rewardStars,
                })
            } else {
                await db.update(accountStats)
                    .set({ goldStars: stats[0].goldStars + currentTask.rewardStars })
                    .where(eq(accountStats.userId, assignedTo))
            }
        } else if (!completed && currentTask.completed) {
            // Deduct reward
            let stats = await db.select().from(accountStats).where(eq(accountStats.userId, assignedTo))
            if (stats.length > 0) {
                await db.update(accountStats)
                    .set({ goldStars: Math.max(0, stats[0].goldStars - currentTask.rewardStars) })
                    .where(eq(accountStats.userId, assignedTo))
            }
        }

        const updatedTask = await db.update(task)
            .set({ completed })
            .where(eq(task.id, id))
            .returning()

        return NextResponse.json(updatedTask[0])
    } catch (error) {
        console.error('Failed to update task:', error)
        return NextResponse.json({ error: 'Failed to update task' }, { status: 500 })
    }
}
