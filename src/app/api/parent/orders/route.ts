import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { purchase, users, shopItem, accountStats } from '@/lib/schema'
import { eq, desc } from 'drizzle-orm'
import { cookies } from 'next/headers'
import { addBalance } from '@/lib/economy'

async function isParent() {
    const cookieStore = await cookies()
    const role = cookieStore.get('dodoo_role')?.value
    return role === 'PARENT'
}

export async function GET() {
    if (!await isParent()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const orders = await db.select({
            id: purchase.id,
            costCoins: purchase.costCoins,
            status: purchase.status,
            remarks: purchase.remarks,
            createdAt: purchase.createdAt,
            updatedAt: purchase.updatedAt,
            user: {
                id: users.id,
                name: users.name,
                avatarUrl: users.avatarUrl
            },
            item: {
                id: shopItem.id,
                name: shopItem.name,
                iconUrl: shopItem.iconUrl
            }
        })
            .from(purchase)
            .leftJoin(users, eq(purchase.userId, users.id))
            .leftJoin(shopItem, eq(purchase.itemId, shopItem.id))
            .orderBy(desc(purchase.createdAt))
            .all()

        return NextResponse.json(orders)
    } catch (error) {
        console.error('Failed to fetch orders:', error)
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}

export async function PATCH(req: NextRequest) {
    if (!await isParent()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const { id, status, remarks } = await req.json()
        if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })

        const existingOrder = await db.select().from(purchase).where(eq(purchase.id, id)).get()
        if (!existingOrder) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

        const updateData: any = {}
        if (status !== undefined) updateData.status = status
        if (remarks !== undefined) updateData.remarks = remarks
        updateData.updatedAt = new Date()

        // Handle refund if cancelling a previously non-cancelled order
        if (status === 'CANCELLED' && existingOrder.status !== 'CANCELLED') {
            await addBalance(existingOrder.userId!, existingOrder.costCoins, 'CURRENCY', `Order #${id.slice(0, 8)} cancelled-refund`)
        }

        const [order] = await db.update(purchase)
            .set(updateData)
            .where(eq(purchase.id, id))
            .returning()

        return NextResponse.json(order)
    } catch (error) {
        console.error('Failed to update order:', error)
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}
