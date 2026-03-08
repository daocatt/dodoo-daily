import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { wish, users, shopItem } from '@/lib/schema'
import { eq, desc } from 'drizzle-orm'
import { cookies } from 'next/headers'

async function isParent() {
    const cookieStore = await cookies()
    const role = cookieStore.get('dodoo_role')?.value
    return role === 'PARENT'
}

export async function GET() {
    if (!await isParent()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const wishes = await db.select({
            id: wish.id,
            name: wish.name,
            description: wish.description,
            imageUrl: wish.imageUrl,
            status: wish.status,
            createdAt: wish.createdAt,
            user: {
                id: users.id,
                name: users.name,
                avatarUrl: users.avatarUrl
            }
        })
            .from(wish)
            .leftJoin(users, eq(wish.userId, users.id))
            .orderBy(desc(wish.createdAt))
            .all()

        return NextResponse.json(wishes)
    } catch (error) {
        console.error('Failed to fetch wishes:', error)
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    if (!await isParent()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const { wishId, action, costCoins } = await req.json()
        if (!wishId) return NextResponse.json({ error: 'wishId is required' }, { status: 400 })

        const [existingWish] = await db.select().from(wish).where(eq(wish.id, wishId))
        if (!existingWish) return NextResponse.json({ error: 'Wish not found' }, { status: 404 })

        if (action === 'APPROVE') {
            if (costCoins === undefined) return NextResponse.json({ error: 'costCoins is required' }, { status: 400 })

            // 1. Create shop item
            await db.insert(shopItem).values({
                name: existingWish.name,
                description: existingWish.description,
                costCoins: parseInt(costCoins),
                iconUrl: existingWish.imageUrl || '🎁',
                isActive: true
            })

            // 2. Update wish status
            await db.update(wish)
                .set({ status: 'CONFIRMED', updatedAt: new Date() })
                .where(eq(wish.id, wishId))

            return NextResponse.json({ success: true, message: 'Wish approved and added to shop' })
        } else if (action === 'CANCEL' || action === 'REJECT') {
            await db.update(wish)
                .set({ status: 'REJECTED', updatedAt: new Date() })
                .where(eq(wish.id, wishId))

            return NextResponse.json({ success: true, message: 'Wish canceled' })
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    } catch (error) {
        console.error('Failed to process wish:', error)
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}
