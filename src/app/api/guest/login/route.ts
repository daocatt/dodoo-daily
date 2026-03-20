import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { guest, ipBlacklist, systemSettings } from '@/lib/schema'
import { eq, and, or } from 'drizzle-orm'

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

        const currentGuest = await db.select().from(guest).where(
            and(
                or(
                    eq(guest.phone, identifier),
                    eq(guest.email, identifier)
                ),
                eq(guest.password, password)
            )
        ).get()

        if (!currentGuest) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
        }

        if (currentGuest.status === 'BANNED') {
            return NextResponse.json({ error: 'Your account is banned' }, { status: 403 })
        }

        if (currentGuest.status === 'PENDING') {
            return NextResponse.json({ error: 'Account pending approval', status: 'PENDING' }, { status: 403 })
        }

        // Update last IP
        await db.update(guest).set({ lastIp: ip }).where(eq(guest.id, currentGuest.id))

        return NextResponse.json(currentGuest)
    } catch (e) {
        console.error('Guest login error:', e)
        return NextResponse.json({ error: 'Login failed' }, { status: 500 })
    }
}
