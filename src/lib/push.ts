import webpush from 'web-push'
import { db } from '@/lib/db'
import { pushSubscription } from '@/lib/schema'
import { eq } from 'drizzle-orm'

// Initialize web-push with VAPID keys
if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
        process.env.VAPID_EMAIL || 'mailto:admin@dodoo.local',
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
    )
}

export type NotificationPayload = {
    title: string
    body: string
    icon?: string
    badge?: string
    data?: Record<string, unknown>
}

/**
 * Send a push notification to a specific user
 */
export async function sendPushNotification(userId: string, payload: NotificationPayload) {
    try {
        // Find all subscriptions for this user
        const subscriptions = await db.select()
            .from(pushSubscription)
            .where(eq(pushSubscription.userId, userId))

        if (subscriptions.length === 0) {
            return { success: false, reason: 'No subscriptions found' }
        }

        const results = await Promise.allSettled(
            subscriptions.map(async (sub) => {
                const pushSub = {
                    endpoint: sub.endpoint,
                    keys: {
                        p256dh: sub.p256dh,
                        auth: sub.auth
                    }
                }

                try {
                    await webpush.sendNotification(pushSub, JSON.stringify(payload))
                    return { success: true, endpoint: sub.endpoint }
                } catch (_error) {
                    const webPushError = error as { statusCode?: number }
                    // If subscription is expired or invalid, remove it
                    if (webPushError.statusCode === 404 || webPushError.statusCode === 410) {
                        console.log(`Removing expired subscription for user ${userId}: ${sub.endpoint}`)
                        await db.delete(pushSubscription).where(eq(pushSubscription.id, sub.id))
                    }
                    throw error
                }
            })
        )


        return { success: true, results }
    } catch (_error) {
        console.error('Failed to send push notification:', _error)
        return { success: false, error }
    }
}

/**
 * Send push notification to all parents
 */
export async function notifyParents(payload: NotificationPayload) {
    try {
        // This would require a way to find all parent IDs
        // For simplicity, let's assume we fetch users with PARENT role first
        // But in a real app, you might want a more optimized query
        const parents = await db.query.users.findMany({
            where: (users, { eq }) => eq(users.role, 'PARENT')
        })

        const results = await Promise.all(
            parents.map(p => sendPushNotification(p.id, payload))
        )

        return { success: true, results }
    } catch (_error) {
        console.error('Failed to notify parents:', _error)
        return { success: false, error }
    }
}
