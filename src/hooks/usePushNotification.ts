'use client'

import { useState, useEffect } from 'react'

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

export function usePushNotification() {
    const [permission, setPermission] = useState<NotificationPermission>('default')
    const [isSubscribed, setIsSubscribed] = useState(false)
    const [subscription, setSubscription] = useState<PushSubscription | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator) {
            setPermission(Notification.permission)
            checkSubscription()
        } else {
            setLoading(false)
        }
    }, [])

    const checkSubscription = async () => {
        try {
            const registration = await navigator.serviceWorker.ready
            const sub = await registration.pushManager.getSubscription()
            setIsSubscribed(!!sub)
            setSubscription(sub)
        } catch (error) {
            console.error('Error checking subscription:', error)
        } finally {
            setLoading(false)
        }
    }

    const subscribe = async () => {
        if (!VAPID_PUBLIC_KEY) {
            console.error('VAPID public key not found')
            return false
        }

        try {
            setLoading(true)
            const result = await Notification.requestPermission()
            setPermission(result)

            if (result !== 'granted') {
                return false
            }

            const registration = await navigator.serviceWorker.ready
            const sub = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
            })

            // Send subscription to server
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
        } catch (error) {
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
                
                // Notify server
                await fetch('/api/push/subscribe', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ endpoint: subscription.endpoint })
                })
            }
            setIsSubscribed(false)
            setSubscription(null)
            return true
        } catch (error) {
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
