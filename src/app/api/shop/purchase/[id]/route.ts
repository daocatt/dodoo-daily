import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { purchase, shopItem, accountStats } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { cookies } from 'next/headers'
import { addBalance } from '@/lib/economy'
import { sendPushNotification } from '@/lib/push'
import { getSessionUser } from '@/lib/auth';

async function checkAuth() {
    const cookieStore = await cookies()
    const role = (await getSessionUser())?.role
    const userId = (await getSessionUser())?.userId
    return { role, userId }
}

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = await req.json()
        const { status } = body // 'PENDING', 'SHIPPED', 'CANCELLED'

        const { role, userId } = await checkAuth()
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const p = await db.select().from(purchase).where(eq(purchase.id, id)).get()
        if (!p) return NextResponse.json({ error: 'Purchase not found' }, { status: 404 })

        // Check permissions
        if (role !== 'PARENT' && p.userId !== userId) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 })
        }

        // Logic check: SHIP can only be done by parent
        if (status === 'SHIPPED' && role !== 'PARENT') {
            return NextResponse.json({ error: 'Only parents can ship items' }, { status: 403 })
        }

        // Logic check: Once SHIPPED, cannot be CANCELLED
        if (p.status === 'SHIPPED' && status === 'CANCELLED') {
            return NextResponse.json({ error: 'Cannot cancel a shipped item' }, { status: 400 })
        }

        // Handle Refund if CANCELLED
        if (status === 'CANCELLED' && p.status !== 'CANCELLED') {
            await addBalance(p.userId!, 'CURRENCY', p.costCoins, `Order cancelled: Refund for item #${p.itemId}`)
        }

        // Update Status
        const updated = await db.update(purchase)
            .set({ status, updatedAt: new Date() })
            .where(eq(purchase.id, id))
            .returning()

        const result = updated[0]

        // Async Notify Child if SHIPPED
        if (status === 'SHIPPED' && result.userId) {
            sendPushNotification(result.userId, {
                title: 'Item Shipped! 🎁',
                body: `Your reward "${result.itemName}" is ready!`,
                data: { url: '/order' }
            }).catch(e => console.error('Ship push failed:', e))
        }

        return NextResponse.json(result)
    } catch (e) {
        console.error('Update purchase failed:', e)
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}
