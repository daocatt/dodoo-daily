import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { shopItem, purchase, accountStats, users } from '@/lib/schema'
import { eq } from 'drizzle-orm'

async function getDefaultChildId() {
    const kids = await db.select().from(users).where(eq(users.role, 'CHILD'))
    return kids.length > 0 ? kids[0].id : null
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { itemId } = body

        if (!itemId) {
            return NextResponse.json({ error: 'Item ID is required' }, { status: 400 })
        }

        const childId = await getDefaultChildId()
        if (!childId) return NextResponse.json({ error: 'No child account found' }, { status: 404 })

        // 1. Fetch Item details
        const items = await db.select().from(shopItem).where(eq(shopItem.id, itemId))
        if (items.length === 0) {
            return NextResponse.json({ error: 'Item not found' }, { status: 404 })
        }
        const item = items[0]

        // 2. Fetch User Stats
        const stats = await db.select().from(accountStats).where(eq(accountStats.userId, childId))
        if (stats.length === 0) {
            return NextResponse.json({ error: 'Account stats not found' }, { status: 404 })
        }
        const userStats = stats[0]

        // 3. Check Balance
        if (userStats.currency < item.costCoins) {
            return NextResponse.json({ error: 'Not enough coins' }, { status: 400 })
        }

        // 4. Record Purchase
        const newPurchase = await db.insert(purchase).values({
            userId: childId,
            itemId: item.id,
            costCoins: item.costCoins,
            status: 'COMPLETED',
        }).returning()

        // 5. Deduct Coins
        await db.update(accountStats)
            .set({
                currency: userStats.currency - item.costCoins
            })
            .where(eq(accountStats.userId, childId))

        // 6. Handle Stock if applicable
        if (item.stock > 0) {
            await db.update(shopItem)
                .set({ stock: item.stock - 1 })
                .where(eq(shopItem.id, item.id))
        }

        return NextResponse.json({ success: true, purchase: newPurchase[0] })
    } catch (error) {
        console.error('Purchase failed:', error)
        return NextResponse.json({ error: 'Purchase processing failed' }, { status: 500 })
    }
}
