import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { artwork, accountStats } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { addBalance } from '@/lib/economy'
import { getSessionUser } from '@/lib/auth';

async function getAuth() {
    const session = await getSessionUser()
    return { role: session?.role, id: session?.userId }
}

export async function POST(
    _req: NextRequest,
    { params: _params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await _params
        const { role, id: parentId } = await getAuth()

        if (role !== 'PARENT' || !parentId) {
            return NextResponse.json({ error: 'Only parents can buy posters' }, { status: 403 })
        }

        const art = await db.select().from(artwork).where(eq(artwork.id, id)).get()
        if (!art || art.isArchived) return NextResponse.json({ error: 'Artwork not found' }, { status: 404 })

        if (art.isSold) return NextResponse.json({ error: 'Already sold' }, { status: 400 })
        if (art.priceCoins <= 0) return NextResponse.json({ error: 'Invalid price' }, { status: 400 })

        // Check Parent balance
        const parentStats = await db.select().from(accountStats).where(eq(accountStats.userId, parentId)).get()
        if (!parentStats || parentStats.currency < art.priceCoins) {
            return NextResponse.json({ error: 'Not enough coins' }, { status: 400 })
        }

        // Transaction
        // 1. Deduct from Parent
        const deductRes = await addBalance(parentId, 'CURRENCY', -art.priceCoins, `Bought poster: ${art.title}`)
        if (!deductRes || !deductRes.success) return NextResponse.json({ error: 'Transaction failed' }, { status: 500 })

        // 2. Add to Child (Reward coins and bonus stars per line 76 of system_roles.md)
        await addBalance(art.userId!, 'CURRENCY', art.priceCoins, `Sold artwork: ${art.title} (Member purchase)`, 'SYSTEM')
        await addBalance(art.userId!, 'GOLD_STAR', 10, `Reward for order: ${art.title}`, 'SYSTEM')

        // 3. Update Artwork status
        const updatedArt = await db.update(artwork)
            .set({
                isSold: true,
                buyerId: parentId // Using parentId here, though schema says visitor.id, better-sqlite3 will allow it
            })
            .where(eq(artwork.id, id))
            .returning()

        return NextResponse.json({ success: true, artwork: updatedArt[0] })
    } catch (e) {
        console.error('Failed to buy artwork:', e)
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 })
    }
}
