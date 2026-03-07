import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('dodoo_user_id')?.value
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { pin } = await req.json()
        if (pin && pin.length < 4) {
            return NextResponse.json({ error: 'PIN must be at least 4 characters' }, { status: 400 })
        }

        await db.update(users)
            .set({ pin: pin || null })
            .where(eq(users.id, userId))

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Failed to update PIN:', error)
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}
