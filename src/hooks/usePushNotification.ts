'use client'

import { useState, useEffect } from 'react'

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

/** Wrap navigator.serviceWorker.ready with a timeout so it never hangs forever */
function swReady(ms = 4000): Promise<ServiceWorkerRegistration | null> {
    return Promise.race([
        navigator.serviceWorker.ready,
        new Promise<null>((resolve) => setTimeout(() => resolve(null), ms))
    ])
}

export function usePushNotification() {
    const [permission, setPermission] = useState<NotificationPermission>('default')
    const [isSubscribed, setIsSubscribed] = useState(false)
    const [subscription, setSubscription] = useState<PushSubscription | null>(null)
    const [loading, setLoading] = useState(true)
    const [swAvailable, setSwAvailable] = useState(false)

    useEffect(() => {
        const init = async () => {
            if (typeof window === 'undefined' || !('Notification' in window) || !('serviceWorker' in navigator)) {
                setLoading(false)
                return
            }
            setPermission(Notification.permission)
            try {
                const registration = await swReady()
                if (!registration) {
                    // No active service worker — push is not available
                    setLoading(false)
                    return
                }
                setSwAvailable(true)
                const sub = await registration.pushManager.getSubscription()
                setIsSubscribed(!!sub)
                setSubscription(sub)
            } catch (_error) {
                console.error('Error checking push subscription:', error)
            } finally {
                setLoading(false)
            }
        }
        init()
    }, [])

    const subscribe = async () => {
        if (!VAPID_PUBLIC_KEY) {
            console.error('VAPID public key not configured')
            return false
        }
        try {
            setLoading(true)
            const result = await Notification.requestPermission()
            setPermission(result)
            if (result !== 'granted') return false

            const registration = await swReady()
            if (!registration) {
                console.error('No active service worker — cannot subscribe to push')
                return false
            }

            const sub = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
            })

            const res = await fetch('/api/push/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    subscription: sub,
                    deviceType: /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop'
                })
            })

            if (res.ok) {
                setIsSubscribed(true)
                setSubscription(sub)
                return true
            }
            return false
        } catch (_error) {
            console.error('Error subscribing to push:', error)
            return false
        } finally {
            setLoading(false)
        }
    }

    const unsubscribe = async () => {
        try {
            setLoading(true)
            if (subscription) {
                await subscription.unsubscribe()
                await fetch('/api/push/subscribe', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ endpoint: subscription.endpoint })
                })
            }
            setIsSubscribed(false)
            setSubscription(null)
            return true
        } catch (_error) {
            console.error('Error unsubscribing from push:', error)
            return false
        } finally {
            setLoading(false)
        }
    }

    return {
        permission,
        isSubscribed,
        loading,
        swAvailable,
        subscribe,
        unsubscribe
    }
}

function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
}
