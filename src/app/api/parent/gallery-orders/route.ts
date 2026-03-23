import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { order, artwork, users, visitor } from '@/lib/schema'
import { eq, desc } from 'drizzle-orm'
import { getSessionUser } from '@/lib/auth'

async function checkIsParent() {
    const { role } = await getSessionUser()
    return role === 'PARENT'
}

export async function GET() {
    if (!await checkIsParent()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const results = await db.select({
            id: order.id,
            status: order.status,
            amountRMB: order.amountRMB,
            createdAt: order.createdAt,
            artwork: {
                id: artwork.id,
                title: artwork.title,
                imageUrl: artwork.imageUrl,
                priceCoins: artwork.priceCoins
            },
            artist: {
                name: users.name,
                nickname: users.nickname
            },
            visitor: {
                name: visitor.name,
                phone: visitor.phone
            }
        })
        .from(order)
        .leftJoin(artwork, eq(order.artworkId, artwork.id))
        .leftJoin(users, eq(artwork.userId, users.id))
        .leftJoin(visitor, eq(order.visitorId, visitor.id))
        .orderBy(desc(order.createdAt))
        .all()

        return NextResponse.json(results)
    } catch (e) {
        console.error('Failed to fetch gallery orders:', e)
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}

export async function PATCH(req: NextRequest) {
    if (!await checkIsParent()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const { id, status } = await req.json()
        if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })

        // If status is COMPLETED, we mark the artwork as sold
        if (status === 'COMPLETED') {
            const [orderData] = await db.select().from(order).where(eq(order.id, id)).limit(1)
            if (orderData) {
                await db.update(artwork)
                    .set({ isSold: true, buyerId: orderData.visitorId })
                    .where(eq(artwork.id, orderData.artworkId))
            }
        }

        const [updated] = await db.update(order)
            .set({ status, updatedAt: new Date() })
            .where(eq(order.id, id))
            .returning()

        return NextResponse.json(updated)
    } catch (e) {
        console.error('Failed to update gallery order:', e)
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}
