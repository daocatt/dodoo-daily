import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users, systemSettings } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { cookies } from 'next/headers'

export async function POST(req: Request) {
    try {
        const { id, pin, rememberMe } = await req.json()
        const [user] = await db.select().from(users).where(eq(users.id, id))

        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

        if (user.isArchived || user.isDeleted) {
            return NextResponse.json({ error: 'Account disabled' }, { status: 403 })
        }

        if (user.pin && user.pin !== pin) {
            return NextResponse.json({ error: 'Invalid PIN' }, { status: 401 })
        }

        // Set session cookie
        const cookieStore = await cookies()
        const maxAge = rememberMe ? 60 * 60 * 24 * 365 : 60 * 60 * 24
        cookieStore.set('dodoo_user_id', user.id, { maxAge, path: '/' })
        cookieStore.set('dodoo_role', user.role, { maxAge, path: '/' })

        // Update last login
        await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id));

        // For parent login: check if first-run setup is needed
        let needsSetup = false
        if (user.role === 'PARENT') {
            const [settings] = await db.select().from(systemSettings).where(eq(systemSettings.id, 'app_settings'))
            needsSetup = settings?.needsSetup ?? false
        }

        return NextResponse.json({
            success: true,
            user: { id: user.id, role: user.role },
            needsSetup,
        })
    } catch (e) {
        console.error('Login error', e)
        return NextResponse.json({ error: 'Failed to login' }, { status: 500 })
    }
}
