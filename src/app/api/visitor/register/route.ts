import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { visitor, systemSettings, ipBlacklist } from '@/lib/schema'
import { eq, or } from 'drizzle-orm'
import { cookies } from 'next/headers'
import { signVisitorJWT } from '@/lib/auth'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
    try {
        const ip = req.headers.get('x-forwarded-for') || req.ip || '0.0.0.0'
        
        // Check IP blacklist
        const isBanned = await db.select().from(ipBlacklist).where(eq(ipBlacklist.ip, ip)).get()
        if (isBanned) return NextResponse.json({ error: 'Your IP is restricted' }, { status: 403 })

        const body = await req.json()
        const { name, email, phone, invitationCode, password } = body

        if (!name || !password) return NextResponse.json({ error: 'Name and Password are required' }, { status: 400 })

        // Fetch settings
        const settings = await db.select().from(systemSettings).where(eq(systemSettings.id, 'app_settings')).get()
        
        // Check invitation code - MUST have it
        if (!invitationCode || invitationCode !== settings?.visitorInvitationCode) {
            return NextResponse.json({ error: 'Valid invitation code is required' }, { status: 401 })
        }

        if (settings?.disableVisitorLogin) {
            return NextResponse.json({ error: 'System is temporarily closed' }, { status: 403 })
        }

        if (settings?.disableVisitorRegistration) {
            return NextResponse.json({ error: 'Registration is currently closed' }, { status: 403 })
        }

        // Check if existing
        const ident = (email || phone) 
        if (!ident) return NextResponse.json({ error: 'Email or Phone is required' }, { status: 400 })

        const existing = await db.select().from(visitor).where(
            or(
                phone ? eq(visitor.phone, phone) : undefined,
                email ? eq(visitor.email, email) : undefined
            )
        ).get()

        if (existing) {
            return NextResponse.json({ error: 'Visitor with this email or phone already exists' }, { status: 400 })
        }

        // 注册通过邀请码，直接 APPROVED
        const status = 'APPROVED'

        // Hash password before store
        const hashedPassword = await bcrypt.hash(password, 10)
        
        const [newVisitor] = await db.insert(visitor).values({
            name,
            email,
            phone,
            password: hashedPassword,
            status,
            lastIp: ip,
        }).returning()

        // Set session cookie
        const cookieStore = await cookies()
        const token = await signVisitorJWT(newVisitor.id)
        
        cookieStore.set('dodoo_visitor_session', token, {
            maxAge: 60 * 60 * 24 * 30, // 30 days
            path: '/',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax'
        })

        const { password: _, ...safeVisitor } = newVisitor
        return NextResponse.json(safeVisitor)
    } catch (e) {
        console.error('Visitor registration error:', e)
        return NextResponse.json({ error: 'Registration failed' }, { status: 500 })
    }
}
