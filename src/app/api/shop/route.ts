import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { shopItem } from '@/lib/schema'
import { desc } from 'drizzle-orm'

export async function GET() {
    try {
        const items = await db.select().from(shopItem).orderBy(desc(shopItem.createdAt))

        // If no items, let's seed some defaults for better demo experience
        if (items.length === 0) {
            const defaults = [
                { name: 'Delicious Ice Cream', costCoins: 10, iconUrl: '🍦', stock: -1 },
                { name: 'New LEGO Set', costCoins: 500, iconUrl: '🧱', stock: -1 },
                { name: 'Gaming Zone (1 Hour)', costCoins: 50, iconUrl: '🎮', stock: -1 },
                { name: 'Bedtime Story+', costCoins: 5, iconUrl: '📖', stock: -1 },
            ]

            for (const item of defaults) {
                await db.insert(shopItem).values(item)
            }

            const seededItems = await db.select().from(shopItem).orderBy(desc(shopItem.createdAt))
            return NextResponse.json(seededItems)
        }

        return NextResponse.json(items)
    } catch (error) {
        console.error('Failed to fetch shop items:', error)
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { name, costCoins, iconUrl, stock } = body

        if (!name || costCoins === undefined) {
            return NextResponse.json({ error: 'Name and cost are required' }, { status: 400 })
        }

        const newItem = await db.insert(shopItem).values({
            name,
            costCoins: parseInt(costCoins),
            iconUrl: iconUrl || '🎁',
            stock: stock !== undefined ? parseInt(stock) : -1,
        }).returning()

        return NextResponse.json(newItem[0])
    } catch (error) {
        console.error('Failed to create shop item:', error)
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}
