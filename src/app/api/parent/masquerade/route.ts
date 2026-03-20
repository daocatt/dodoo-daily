import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { getSessionUser, signSessionJWT } from '@/lib/auth'

export async function POST(req: NextRequest) {
    try {
        // Use JWT-aware auth, not raw cookie check
        const { role } = await getSessionUser()
        if (role !== 'PARENT') {
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

        // Parent can't masquerade as another parent
        if (targetUser.role === 'PARENT') {
            return NextResponse.json({ error: 'Cannot masquerade as another parent' }, { status: 400 })
        }

        // Issue a new JWT for the target user (same as login flow)
        const token = await signSessionJWT(targetUser.id, targetUser.role)

        const res = NextResponse.json({ success: true, redirect: '/' })

        const cookieOpts = {
            path: '/',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax' as const,
            maxAge: 60 * 60 * 24 * 7
        }

        // Update JWT session cookie (this is what getSessionUser reads first)
        res.cookies.set('dodoo_session', token, cookieOpts)



        return res
    } catch (e) {
        console.error('Masquerade failed:', e)
        return NextResponse.json({ error: 'Masquerade failed' }, { status: 500 })
    }
}
