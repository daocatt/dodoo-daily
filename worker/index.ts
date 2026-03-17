declare let self: ServiceWorkerGlobalScope

self.addEventListener('push', (event) => {
    const data = event.data?.json() || {}
    const title = data.title || 'DoDoo Daily'
    const options = {
        body: data.body || 'New notification',
        icon: data.icon || '/dog.svg',
        badge: data.badge || '/dog.svg',
        data: data.data || {}
    }

    event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
    event.notification.close()
    const url = event.notification.data?.url || '/'
    
    event.waitUntil(
        self.clients.matchAll({ type: 'window' }).then((clientList) => {
            for (const client of clientList) {
                if ('url' in client && client.url === url && 'focus' in client) {
                    return (client as WindowClient).focus()
                }
            }
            if (self.clients.openWindow) {
                return self.clients.openWindow(url)
            }
        })
    )
})

// Custom offline fallback or other worker logic can go here
export {}
