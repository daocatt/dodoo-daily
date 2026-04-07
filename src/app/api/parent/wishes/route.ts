import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { wish, users, shopItem } from '@/lib/schema'
import { eq, desc } from 'drizzle-orm'
import { getSessionUser } from '@/lib/auth'

async function isAdmin() {
    const session = await getSessionUser()
    return session?.permissionRole === 'SUPERADMIN' || session?.permissionRole === 'ADMIN'
}

export async function GET() {
    if (!await isAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const wishes = await db.select({
            id: wish.id,
            name: wish.name,
            description: wish.description,
            imageUrl: wish.imageUrl,
            status: wish.status,
            addedToShopAt: wish.addedToShopAt,
            createdAt: wish.createdAt,
            user: {
                id: users.id,
                name: users.name,
                nickname: users.nickname,
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
    if (!await isAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const { wishId, action, costCoins } = await req.json()
        if (!wishId) return NextResponse.json({ error: 'wishId is required' }, { status: 400 })

        const [existingWish] = await db.select().from(wish).where(eq(wish.id, wishId))
        if (!existingWish) return NextResponse.json({ error: 'Wish not found' }, { status: 404 })

        // ── CONFIRM: parent acknowledges, does NOT add to shop ──────────────
        if (action === 'CONFIRM') {
            await db.update(wish)
                .set({ status: 'CONFIRMED', updatedAt: new Date() })
                .where(eq(wish.id, wishId))

            return NextResponse.json({ success: true, message: 'Wish confirmed' })
        }

        // ── ADD_TO_SHOP: confirm + create shop item ───────────────────────────
        if (action === 'ADD_TO_SHOP') {
            if (costCoins === undefined) {
                return NextResponse.json({ error: 'costCoins is required' }, { status: 400 })
            }
            // Prevent duplicates
            if (existingWish.addedToShopAt) {
                return NextResponse.json({ error: 'Already added to shop' }, { status: 409 })
            }

            await db.insert(shopItem).values({
                name: existingWish.name,
                description: existingWish.description,
                costCoins: parseInt(costCoins),
                iconUrl: existingWish.imageUrl || null,
                isActive: true,
                isDeleted: false,
            })

            await db.update(wish)
                .set({ status: 'CONFIRMED', addedToShopAt: new Date(), updatedAt: new Date() })
                .where(eq(wish.id, wishId))

            return NextResponse.json({ success: true, message: 'Wish added to shop' })
        }

        // ── REJECT: parent declines ───────────────────────────────────────────
        if (action === 'REJECT' || action === 'CANCEL') {
            await db.update(wish)
                .set({ status: 'REJECTED', updatedAt: new Date() })
                .where(eq(wish.id, wishId))

            return NextResponse.json({ success: true, message: 'Wish rejected' })
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    } catch (error) {
        console.error('Failed to process wish:', error)
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}
