import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { artwork, visitor, order, visitorCurrencyLog, accountStats, accountStatsLog } from '@/lib/schema'
import { eq, and } from 'drizzle-orm'
import { getSessionUser, getVisitorSession } from '@/lib/auth'
export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { artworkId, visitorName, visitorPhone, paymentType, contactName, contactPhone, contactEmail, shippingAddress } = body

        if (!artworkId) {
            return NextResponse.json({ error: 'Missing artwork ID' }, { status: 400 })
        }

        const familySession = await getSessionUser()
        const memberId = familySession?.id

        const visitorSession = await getVisitorSession()
        const visitorId = visitorSession?.visitorId

        if (!memberId && (!visitorName || (!contactEmail && !contactPhone && !visitorPhone))) {
            return NextResponse.json({ error: 'Incomplete information. Email or phone is required for visitors.' }, { status: 400 })
        }

        // 1. Verify Artwork
        const [art] = await db.select().from(artwork).where(
            and(
                eq(artwork.id, artworkId),
                eq(artwork.isPublic, true),
                eq(artwork.isArchived, false)
            )
        ).limit(1)

        if (!art || art.isSold) {
            return NextResponse.json({ error: 'Artwork not available' }, { status: 404 })
        }

        let currentVisitorId = visitorId
        let newBalance = undefined

        const result = await db.transaction(async (tx) => {
            // Case A: Family Member
            if (memberId) {
                if (paymentType === 'COINS') {
                    const stats = tx.select().from(accountStats).where(eq(accountStats.userId, memberId)).get()
                    if (!stats) throw new Error('Member stats not found')
                    if (stats.currency < art.priceCoins) throw new Error('Insufficient coins balance')

                    newBalance = stats.currency - art.priceCoins
                    tx.update(accountStats).set({ currency: newBalance, updatedAt: new Date() }).where(eq(accountStats.userId, memberId)).run()

                    tx.insert(accountStatsLog).values({
                        userId: memberId,
                        type: 'CURRENCY',
                        amount: -art.priceCoins,
                        balance: newBalance,
                        reason: `COLLECT_ARTWORK: ${art.title}`
                    }).run()

                    // Reward Creator (Line 76 in system_roles.md)
                    const { addBalance } = await import('@/lib/economy')
                    // Add Coins if paying by Coins
                    await addBalance(art.userId!, 'CURRENCY', art.priceCoins, `Sold artwork (Member): ${art.title}`, 'SYSTEM')
                    // Add 10 Stars reward
                    await addBalance(art.userId!, 'GOLD_STAR', 10, `Reward for order: ${art.title}`, 'SYSTEM')
                }

                // Create Order
                const newOrder = tx.insert(order).values({
                    artworkId: art.id,
                    memberId: memberId,
                    amountRMB: art.priceRMB || 0,
                    amountCoins: art.priceCoins || 0,
                    paymentType: paymentType || 'COINS',
                    status: 'CONFIRMED', // Family orders are auto-confirmed usually? Or PENDING_CONFIRM
                    contactName: contactName || visitorName || 'Family Member',
                    shippingAddress: shippingAddress || 'INTERNAL_FAMILY'
                }).returning().get()

                // Update Artwork
                tx.update(artwork).set({ isSold: true, buyerMemberId: memberId }).where(eq(artwork.id, art.id)).run()

                return { orderId: newOrder.id, newBalance }
            } 
            
            // Case B: Visitor
            if (!currentVisitorId) {
                const newG = tx.insert(visitor).values({
                    name: visitorName,
                    phone: visitorPhone,
                    status: 'APPROVED'
                }).returning().get()
                currentVisitorId = newG.id
            }

            if (paymentType === 'COINS') {
                const currentVisitor = tx.select().from(visitor).where(eq(visitor.id, currentVisitorId)).get()
                if (!currentVisitor) throw new Error('Visitor not found')
                
                if (currentVisitor.currency < art.priceCoins) {
                    throw new Error('Insufficient coins balance')
                }

                newBalance = currentVisitor.currency - art.priceCoins
                tx.update(visitor).set({ currency: newBalance }).where(eq(visitor.id, currentVisitorId)).run()
                
                tx.insert(visitorCurrencyLog).values({
                    visitorId: currentVisitorId,
                    amount: -art.priceCoins,
                    balance: newBalance,
                    reason: 'PURCHASE'
                }).run()

                // Reward Creator (Line 76 in system_roles.md)
                const { addBalance } = await import('@/lib/economy')
                // Add Coins if paying by Coins
                await addBalance(art.userId!, 'CURRENCY', art.priceCoins, `Sold artwork (Visitor): ${art.title}`, 'SYSTEM')
                // Add 10 Stars reward
                await addBalance(art.userId!, 'GOLD_STAR', 10, `Reward for order: ${art.title}`, 'SYSTEM')
            } else {
                // If paying by RMB or other manual, creator still gets the 10 Stars reward once collected!
                const { addBalance } = await import('@/lib/economy')
                await addBalance(art.userId!, 'GOLD_STAR', 10, `Reward for order: ${art.title}`, 'SYSTEM')
            }

            const newOrder = tx.insert(order).values({
                artworkId: art.id,
                visitorId: currentVisitorId!,
                amountRMB: art.priceRMB || 0,
                amountCoins: art.priceCoins || 0,
                paymentType: paymentType || 'COINS',
                status: 'PENDING_CONFIRM',
                contactName: contactName || visitorName,
                contactPhone: contactPhone || visitorPhone,
                contactEmail: contactEmail || null,
                shippingAddress: shippingAddress || null
            }).returning().get()

            tx.update(artwork).set({ isSold: true, buyerId: currentVisitorId! }).where(eq(artwork.id, art.id)).run()

            return { orderId: newOrder.id, newBalance }
        })

        return NextResponse.json({ success: true, ...result })
    } catch (e: unknown) {
        console.error('Public collect error:', e)
        const message = e instanceof Error ? e.message : 'Collection failed'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
