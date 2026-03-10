import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { task } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { cookies } from 'next/headers'
import { addBalance } from '@/lib/economy'

async function checkParent() {
    const cookieStore = await cookies()
    return cookieStore.get('dodoo_role')?.value === 'PARENT'
}

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = await req.json()
        const { action } = body // 'APPROVE' or 'REJECT'

        if (!await checkParent()) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

        const t = await db.select().from(task).where(eq(task.id, id)).get()
        if (!t) return NextResponse.json({ error: 'Task not found' }, { status: 404 })

        if (action === 'APPROVE') {
            if (t.confirmationStatus === 'APPROVED') {
                return NextResponse.json({ error: 'Already approved' }, { status: 400 })
            }

            // Award Rewards
            await addBalance(t.assigneeId!, 'GOLD_STAR', t.rewardStars, `Assigned Task Approved: ${t.title}`)
            if (t.rewardCoins > 0) {
                await addBalance(t.assigneeId!, 'CURRENCY', t.rewardCoins, `Assigned Task Bonus Coins: ${t.title}`)
            }

            await db.update(task).set({
                confirmationStatus: 'APPROVED',
                completed: true
            }).where(eq(task.id, id))

            return NextResponse.json({ success: true, status: 'APPROVED' })
        } else if (action === 'REJECT') {
            await db.update(task).set({
                confirmationStatus: 'REJECTED',
                completed: false
            }).where(eq(task.id, id))

            return NextResponse.json({ success: true, status: 'REJECTED' })
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    } catch (e) {
        console.error('Confirmation failed:', e)
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}
