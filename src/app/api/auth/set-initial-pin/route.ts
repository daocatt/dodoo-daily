import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users } from '@/lib/schema'
import { eq } from 'drizzle-orm'

export async function POST(req: Request) {
    try {
        const { userId, pin } = await req.json()
        if (!userId || !pin) return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
        if (pin.length < 4) return NextResponse.json({ error: 'PIN must be at least 4 digits' }, { status: 400 })

        // 1. Physical Verification - User must exist and currently have NO pin
        const [user] = await db.select().from(users).where(eq(users.id, userId)).all()
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

        // Check if user already has a PIN. This prevents anyone from resetting random user pins.
        if (user.pin && user.pin.trim() !== '') {
            return NextResponse.json({ error: 'Account already has a PIN. Please use login.' }, { status: 403 })
        }

        // 2. Set the initial PIN
        await db.update(users)
            .set({ pin: pin.trim() })
            .where(eq(users.id, userId))

        return NextResponse.json({ success: true, message: 'PIN set successfully' })
    } catch (error) {
        console.error('Failed to set initial PIN:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
