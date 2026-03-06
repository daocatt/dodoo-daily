import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { task, users } from '@/lib/schema'
import { desc, eq } from 'drizzle-orm'

async function getDefaultChildId() {
    const kids = await db.select().from(users).where(eq(users.role, 'CHILD'))
    return kids.length > 0 ? kids[0].id : null
}

export async function GET() {
    try {
        const childId = await getDefaultChildId()
        if (!childId) return NextResponse.json([])

        const allTasks = await db.select().from(task)
            .where(eq(task.assignedTo, childId))
            .orderBy(desc(task.createdAt))
        return NextResponse.json(allTasks)
    } catch (error) {
        console.error('Failed to fetch tasks:', error)
        return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { title, description, rewardStars, isRepeating } = body

        if (!title) {
            return NextResponse.json({ error: 'Title is required' }, { status: 400 })
        }

        const childId = await getDefaultChildId()
        if (!childId) return NextResponse.json({ error: 'No child account found' }, { status: 404 })

        const newTask = await db.insert(task).values({
            assignedTo: childId,
            title,
            description: description || null,
            rewardStars: rewardStars ? parseInt(rewardStars) : 1,
            isRepeating: !!isRepeating,
            completed: false,
        }).returning()

        return NextResponse.json(newTask[0])
    } catch (error) {
        console.error('Failed to create task:', error)
        return NextResponse.json({ error: 'Failed to create task' }, { status: 500 })
    }
}
