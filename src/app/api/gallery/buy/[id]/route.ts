import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { artwork, accountStats } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { cookies } from 'next/headers'
import { addBalance } from '@/lib/economy'

async function getAuth() {
    const cookieStore = await cookies()
    const role = cookieStore.get('dodoo_role')?.value
    const id = cookieStore.get('dodoo_user_id')?.value
    return { role, id }
}

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
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
        if (!deductRes.success) return NextResponse.json({ error: 'Transaction failed' }, { status: 500 })

        // 2. Add to Child
        await addBalance(art.userId!, 'CURRENCY', art.priceCoins, `Sold poster: ${art.title} to Parent`)

        // 3. Update Artwork status
        const updatedArt = await db.update(artwork)
            .set({
                isSold: true,
                buyerId: parentId // Using parentId here, though schema says guest.id, better-sqlite3 will allow it
            })
            .where(eq(artwork.id, id))
            .returning()

        return NextResponse.json({ success: true, artwork: updatedArt[0] })
    } catch (e) {
        console.error('Failed to buy artwork:', e)
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 })
    }
}
