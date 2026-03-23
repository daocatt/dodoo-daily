import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users, systemSettings } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'

export async function POST(req: Request) {
    try {
        const { id, nickname, pin, rememberMe } = await req.json()
        const { or, and } = await import('drizzle-orm')
        
        const [user] = await db.select().from(users).where(
            and(
                id ? eq(users.id, id) : or(eq(users.name, nickname), eq(users.nickname, nickname)),
                eq(users.isDeleted, false)
            )
        ).all()

        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
        
        // Enforce mandatory password/PIN
        if (!user.pin || user.pin.trim() === '') {
            return NextResponse.json({ 
                success: false, 
                error: 'Account requires a security PIN to be set before login',
                needsPin: true,
                userId: user.id 
            }, { status: 403 })
        }

        if (user.isArchived || user.isDeleted) {
            return NextResponse.json({ error: 'Account disabled' }, { status: 403 })
        }

        if (user.pin) {
            const isMatch = await bcrypt.compare(pin, user.pin)
            if (!isMatch) {
                return NextResponse.json({ error: 'Invalid PIN' }, { status: 401 })
            }
        }

        // Set session cookie
        const cookieStore = await cookies()
        const maxAge = rememberMe ? 60 * 60 * 24 * 365 : 60 * 60 * 24

        // 1. Issue JWT (New)
        const { signSessionJWT } = await import('@/lib/auth')
        const token = await signSessionJWT(user.id, user.role)
        cookieStore.set('dodoo_session', token, {
            maxAge,
            path: '/',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax'
        })

        // --- NEW: AUDIT LOG ---
        const { memberLoginLog } = await import('@/lib/schema')
        const ip = req.headers.get('x-forwarded-for') || '127.0.0.1'
        const userAgent = req.headers.get('user-agent') || 'Unknown'
        await db.insert(memberLoginLog).values({
            userId: user.id,
            ip,
            userAgent,
            status: 'SUCCESS'
        })

        // --- NEW: PARENT NOTIFICATION ---
        if (user.role === 'CHILD') {
            try {
                const { notifyParents } = await import('@/lib/push')
                await notifyParents({
                    title: 'Child Login Alert 🔔',
                    body: `${user.nickname || user.name} has just logged into the system.`,
                    icon: user.avatarUrl || '/dog.svg'
                })
            } catch (notifyErr) {
                console.warn('Failed to notify parents:', notifyErr)
            }
        }

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
    } catch (_error) {
        console.error('Login error', _error)
        return NextResponse.json({ error: 'Failed to login' }, { status: 500 })
    }
}
