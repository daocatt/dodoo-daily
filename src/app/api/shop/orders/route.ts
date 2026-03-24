import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { purchase, shopItem } from '@/lib/schema'
import { eq, desc } from 'drizzle-orm'
import { getSessionUser } from '@/lib/auth';

export async function GET(_req: NextRequest) {
    try {
        const currentUserId = (await getSessionUser())?.userId
        if (!currentUserId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const orders = await db.select({
            id: purchase.id,
            costCoins: purchase.costCoins,
            status: purchase.status,
            createdAt: purchase.createdAt,
            itemName: shopItem.name,
            itemIcon: shopItem.iconUrl
        })
            .from(purchase)
            .leftJoin(shopItem, eq(purchase.itemId, shopItem.id))
            .where(eq(purchase.userId, currentUserId))
            .orderBy(desc(purchase.createdAt))
            .all()

        return NextResponse.json(orders)
    } catch (error) {
        console.error('Failed to fetch orders:', error)
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}
