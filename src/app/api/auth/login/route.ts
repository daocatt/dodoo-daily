import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users } from '@/lib/schema'
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

        // set cookie
        const cookieStore = await cookies()
        const maxAge = rememberMe ? 60 * 60 * 24 * 365 : 60 * 60 * 24 // 1 year or 1 day
        cookieStore.set('dodoo_user_id', user.id, { maxAge, path: '/' })
        cookieStore.set('dodoo_role', user.role, { maxAge, path: '/' })

        return NextResponse.json({ success: true, user: { id: user.id, role: user.role } })
    } catch (e) {
        console.error('Login error', e)
        return NextResponse.json({ error: 'Failed to login' }, { status: 500 })
    }
}
