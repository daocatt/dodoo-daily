import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { shopItem } from '@/lib/schema'
import { desc, eq } from 'drizzle-orm'
import { getSessionUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

async function isParent() {
    const { role } = await getSessionUser()
    return role === 'PARENT'
}

export async function GET() {
    try {
        const items = await db.select().from(shopItem)
            .where(eq(shopItem.isDeleted, false))
            .orderBy(desc(shopItem.createdAt))
            .all()

        if (items.length === 0) {
            const defaults = [
                { name: '冰淇淋', costCoins: 10, iconUrl: '/upload/images/defaults/ice_cream.png', stock: -1, deliveryDays: 1, isActive: true, description: '美味的草莓香草双拼冰淇淋' },
                { name: '乐高积木', costCoins: 500, iconUrl: '/upload/images/defaults/lego.png', stock: 10, deliveryDays: 3, isActive: true, description: '一套充满创意的乐高拼搭套装' },
                { name: '游戏时间1小时', costCoins: 50, iconUrl: '/upload/images/defaults/game_time.png', stock: -1, deliveryDays: 1, isActive: true, description: '尽情享受1小时的电子游戏时间' },
                { name: '任意玩具1个', costCoins: 100, iconUrl: '/upload/images/defaults/toy.png', stock: 5, deliveryDays: 7, isActive: true, description: '挑选一个自己喜欢的玩具（价值50元以内）' },
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
    if (!await isParent()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const body = await req.json()
        const { name, description, costCoins, iconUrl, stock, deliveryDays, isActive } = body

        if (!name || costCoins === undefined) {
            return NextResponse.json({ error: 'Name and cost are required' }, { status: 400 })
        }

        const [newItem] = await db.insert(shopItem).values({
            name,
            description: description || null,
            costCoins: parseInt(costCoins),
            iconUrl: iconUrl || null,
            stock: stock !== undefined ? parseInt(stock) : 1,
            deliveryDays: deliveryDays !== undefined ? parseInt(deliveryDays) : 1,
            isActive: isActive !== undefined ? !!isActive : true
        }).returning()

        return NextResponse.json(newItem)
    } catch (error) {
        console.error('Failed to create shop item:', error)
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}

export async function PATCH(req: NextRequest) {
    if (!await isParent()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const body = await req.json()
        const { id, name, description, costCoins, iconUrl, stock, deliveryDays, isActive } = body

        if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })

        const updateData: Partial<typeof shopItem.$inferInsert> & { updatedAt?: Date } = {}
        if (name !== undefined) updateData.name = name
        if (description !== undefined) updateData.description = description
        if (costCoins !== undefined) updateData.costCoins = parseInt(costCoins)
        if (iconUrl !== undefined) updateData.iconUrl = iconUrl
        if (stock !== undefined) updateData.stock = parseInt(stock)
        if (deliveryDays !== undefined) updateData.deliveryDays = parseInt(deliveryDays)
        if (isActive !== undefined) updateData.isActive = !!isActive
        updateData.updatedAt = new Date()

        const [item] = await db.update(shopItem)
            .set(updateData)
            .where(eq(shopItem.id, id))
            .returning()

        return NextResponse.json(item)
    } catch (error) {
        console.error('Failed to update shop item:', error)
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}

export async function DELETE(req: NextRequest) {
    if (!await isParent()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const { id } = await req.json()
        if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })

        // Soft delete — keeps the row for order history, just marks as deleted
        await db.update(shopItem)
            .set({ isDeleted: true, isActive: false, updatedAt: new Date() })
            .where(eq(shopItem.id, id))

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Failed to delete shop item:', error)
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}
