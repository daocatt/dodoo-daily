import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { pushSubscription } from '@/lib/schema'
import { getSessionUser } from '@/lib/auth'
import { eq, and } from 'drizzle-orm'

export async function POST(_req: NextRequest) {
    try {
        const session = await getSessionUser()
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        const { userId } = session
        
        const body = await req.json()
        const { subscription, deviceType } = body

        if (!subscription || !subscription.endpoint) {
            return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 })
        }

        const { endpoint, keys } = subscription
        const p256dh = keys?.p256dh
        const auth = keys?.auth

        if (!p256dh || !auth) {
            return NextResponse.json({ error: 'Invalid keys' }, { status: 400 })
        }

        // Check if subscription already exists for this user and endpoint
        const existing = await db.select()
            .from(pushSubscription)
            .where(
                and(
                    eq(pushSubscription.userId, userId),
                    eq(pushSubscription.endpoint, endpoint)
                )
            )

        if (existing.length > 0) {
            // Update existing
            await db.update(pushSubscription)
                .set({
                    p256dh,
                    auth,
                    deviceType: deviceType || 'unknown',
                })
                .where(eq(pushSubscription.id, existing[0].id))
            
            return NextResponse.json({ success: true, message: 'Subscription updated' })
        }

        // Create new
        await db.insert(pushSubscription).values({
            userId,
            endpoint,
            p256dh,
            auth,
            deviceType: deviceType || 'unknown',
        })

        return NextResponse.json({ success: true, message: 'Subscribed' })
    } catch (error) {
        console.error('Push subscription failed:', error)
        return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500 })
    }
}

export async function DELETE(_req: NextRequest) {
     try {
        const session = await getSessionUser()
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        const { userId } = session
        
        const body = await req.json()
        const { endpoint } = body

        if (!endpoint) {
            return NextResponse.json({ error: 'Endpoint required' }, { status: 400 })
        }

        await db.delete(pushSubscription)
            .where(
                and(
                    eq(pushSubscription.userId, userId),
                    eq(pushSubscription.endpoint, endpoint)
                )
            )

        return NextResponse.json({ success: true, message: 'Unsubscribed' })
    } catch (error) {
        console.error('Push unsubscription failed:', error)
        return NextResponse.json({ error: 'Failed to unsubscribe' }, { status: 500 })
    }
}
