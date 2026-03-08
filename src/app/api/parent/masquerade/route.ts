import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
    try {
        const cookieStore = await cookies()
        const currentRole = cookieStore.get('dodoo_role')?.value
        if (currentRole !== 'PARENT') {
            return NextResponse.json({ error: 'Unauthorized. Only parents can masquerade.' }, { status: 401 })
        }

        const { targetUserId } = await req.json()
        if (!targetUserId) {
            return NextResponse.json({ error: 'Target User ID is required' }, { status: 400 })
        }

        const targetUser = await db.select().from(users).where(eq(users.id, targetUserId)).get()
        if (!targetUser) {
            return NextResponse.json({ error: 'Target user not found' }, { status: 404 })
        }

        // Parent can't masquerade as another parent (yet)
        if (targetUser.role === 'PARENT') {
            return NextResponse.json({ error: 'Cannot masquerade as another parent' }, { status: 400 })
        }

        // Session logic (mirroring login)
        const res = NextResponse.json({ success: true, redirect: '/' })

        // Update cookies to switch user
        res.cookies.set('dodoo_user_id', targetUser.id, { path: '/', httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 60 * 60 * 24 * 7 })
        res.cookies.set('dodoo_role', targetUser.role, { path: '/', httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 60 * 60 * 24 * 7 })

        return res
    } catch (e) {
        console.error('Masquerade failed:', e)
        return NextResponse.json({ error: 'Masquerade failed' }, { status: 500 })
    }
}
