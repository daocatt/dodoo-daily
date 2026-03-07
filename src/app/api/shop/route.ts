import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { shopItem } from '@/lib/schema'
import { desc, eq } from 'drizzle-orm'
import { cookies } from 'next/headers'

async function isParent() {
    const cookieStore = await cookies()
    const role = cookieStore.get('dodoo_role')?.value
    return role === 'PARENT'
}

export async function GET() {
    try {
        const items = await db.select().from(shopItem).orderBy(desc(shopItem.createdAt))
        // Filter out inactive items for non-parents? Maybe not, usually parents want to see all.
        // Let's keep it simple for now and return all, let the UI decide.

        // If no items, let's seed some defaults for better demo experience
        if (items.length === 0) {
            const defaults = [
                { name: 'Delicious Ice Cream', costCoins: 10, iconUrl: '🍦', stock: -1, isActive: true },
                { name: 'New LEGO Set', costCoins: 500, iconUrl: '🧱', stock: -1, isActive: true },
                { name: 'Gaming Zone (1 Hour)', costCoins: 50, iconUrl: '🎮', stock: -1, isActive: true },
                { name: 'Bedtime Story+', costCoins: 5, iconUrl: '📖', stock: -1, isActive: true },
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
        const { name, description, costCoins, iconUrl, stock, isActive } = body

        if (!name || costCoins === undefined) {
            return NextResponse.json({ error: 'Name and cost are required' }, { status: 400 })
        }

        const [newItem] = await db.insert(shopItem).values({
            name,
            description: description || null,
            costCoins: parseInt(costCoins),
            iconUrl: iconUrl || '🎁',
            stock: stock !== undefined ? parseInt(stock) : -1,
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
        const { id, name, description, costCoins, iconUrl, stock, isActive } = body

        if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })

        const updateData: any = {}
        if (name !== undefined) updateData.name = name
        if (description !== undefined) updateData.description = description
        if (costCoins !== undefined) updateData.costCoins = parseInt(costCoins)
        if (iconUrl !== undefined) updateData.iconUrl = iconUrl
        if (stock !== undefined) updateData.stock = parseInt(stock)
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

        // Hard delete or Soft delete? Let's do hard delete but only if no purchases exist?
        // Actually soft delete is safer.
        await db.update(shopItem)
            .set({ isActive: false })
            .where(eq(shopItem.id, id))

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Failed to delete shop item:', error)
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}
