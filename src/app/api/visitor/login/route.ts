import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users, visitor, ipBlacklist, systemSettings } from '@/lib/schema'
import { eq, and, or } from 'drizzle-orm'
import { cookies } from 'next/headers'
import { signVisitorJWT } from '@/lib/auth'

export async function POST(req: NextRequest) {
    try {
        const ip = req.headers.get('x-forwarded-for') || req.ip || '0.0.0.0'
        
        const settings = await db.select().from(systemSettings).where(eq(systemSettings.id, 'app_settings')).get()
        if (settings?.disableVisitorLogin) {
            return NextResponse.json({ error: 'Visitor system is temporarily closed' }, { status: 403 })
        }

        const isBanned = await db.select().from(ipBlacklist).where(eq(ipBlacklist.ip, ip)).get()
        if (isBanned) return NextResponse.json({ error: 'Your IP is restricted' }, { status: 403 })

        const body = await req.json()
        const { identifier, password } = body

        if (!identifier || !password) {
            return NextResponse.json({ error: 'Email/Phone and Password are required' }, { status: 400 })
        }

        const currentVisitor = await db.select().from(visitor).where(
            and(
                or(
                    eq(visitor.phone, identifier),
                    eq(visitor.email, identifier)
                ),
                eq(visitor.password, password)
            )
        ).get()

        if (!currentVisitor) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
        }

        if (currentVisitor.status === 'BANNED') {
            return NextResponse.json({ error: 'Your account is banned' }, { status: 403 })
        }

        if (currentVisitor.status === 'PENDING') {
            return NextResponse.json({ error: 'Account pending approval', status: 'PENDING' }, { status: 403 })
        }

        // Update last IP
        await db.update(visitor).set({ lastIp: ip }).where(eq(visitor.id, currentVisitor.id))

        // Set session cookie
        const cookieStore = await cookies()
        const token = await signVisitorJWT(currentVisitor.id)
        
        cookieStore.set('dodoo_visitor_session', token, {
            maxAge: 60 * 60 * 24 * 30, // 30 days
            path: '/',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax'
        })

        return NextResponse.json(currentVisitor)
    } catch (e) {
        console.error('Visitor login error:', e)
        return NextResponse.json({ error: 'Login failed' }, { status: 500 })
    }
}
