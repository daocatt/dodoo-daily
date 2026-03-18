import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { guest, systemSettings, ipBlacklist } from '@/lib/schema'
import { eq, or } from 'drizzle-orm'

export async function POST(req: NextRequest) {
    try {
        const ip = req.headers.get('x-forwarded-for') || req.ip || '0.0.0.0'
        
        // Check IP blacklist
        const isBanned = await db.select().from(ipBlacklist).where(eq(ipBlacklist.ip, ip)).get()
        if (isBanned) return NextResponse.json({ error: 'Your IP is restricted' }, { status: 403 })

        const body = await req.json()
        const { name, email, phone, invitationCode } = body

        if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })

        // Fetch settings
        const settings = await db.select().from(systemSettings).where(eq(systemSettings.id, 'app_settings')).get()
        
        if (settings?.disableVisitorLogin) {
            return NextResponse.json({ error: 'System is temporarily closed' }, { status: 403 })
        }

        if (settings?.disableVisitorRegistration) {
            return NextResponse.json({ error: 'Registration is currently closed' }, { status: 403 })
        }

        // Check invitation code if required
        if (settings?.requireInvitationCode) {
            if (invitationCode !== settings.guestInvitationCode) {
                return NextResponse.json({ error: 'Invalid invitation code' }, { status: 401 })
            }
        }

        // Check if existing
        const existing = await db.select().from(guest).where(
            or(
                phone ? eq(guest.phone, phone) : undefined,
                email ? eq(guest.email, email) : undefined
            )
        ).get()

        if (existing) {
            return NextResponse.json({ error: 'Guest with this email or phone already exists' }, { status: 400 })
        }

        // Approval status
        // If invitation code used, maybe auto-approve? The user said "if using code, default approved"
        const status = (settings?.requireInvitationCode && invitationCode === settings.guestInvitationCode) 
            ? 'APPROVED' 
            : (settings?.requireGuestApproval ? 'PENDING' : 'APPROVED')

        const [newGuest] = await db.insert(guest).values({
            name,
            email,
            phone,
            status,
            lastIp: ip,
        }).returning()

        return NextResponse.json(newGuest)
    } catch (e) {
        console.error('Guest registration error:', e)
        return NextResponse.json({ error: 'Registration failed' }, { status: 500 })
    }
}
