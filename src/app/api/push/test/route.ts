import { NextRequest, NextResponse } from 'next/server'
import { sendPushNotification } from '@/lib/push'
import { getSessionUser } from '@/lib/auth'

export async function POST(_req: NextRequest) {
    try {
        const { userId } = await getSessionUser()
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await req.json()
        const { title, message } = body

        const result = await sendPushNotification(userId, {
            title: title || 'Test Notification',
            body: message || 'This is a test notification from DoDoo Daily!',
            icon: '/dog.svg',
            badge: '/dog.svg',
            data: {
                url: '/'
            }
        })

        return NextResponse.json(result)
    } catch (error) {
        console.error('Push test failed:', error)
        return NextResponse.json({ error: 'Failed to send test push' }, { status: 500 })
    }
}
