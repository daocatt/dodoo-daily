import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { visitor } from '@/lib/schema'
import { eq, or, and, ne } from 'drizzle-orm'
import { getVisitorSession } from '@/lib/auth'
import bcrypt from 'bcryptjs'

export async function PATCH(req: NextRequest) {
    try {
        const session = await getVisitorSession()
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        const visitorId = session.visitorId

        const body = await req.json()
        const { name, email, phone, password, currentPassword } = body

        const storedVisitor = await db.select().from(visitor).where(eq(visitor.id, visitorId)).get()
        if (!storedVisitor) {
            return NextResponse.json({ error: 'Visitor not found' }, { status: 404 })
        }

        // If password is being changed, we MUST verify currentPassword
        if (password && password.trim() !== '') {
            if (!currentPassword) {
                return NextResponse.json({ error: 'Current password verification failed. Please check your credentials.' }, { status: 401 })
            }
            const isMatch = await bcrypt.compare(currentPassword, storedVisitor.password)
            if (!isMatch) {
                return NextResponse.json({ error: 'Current password verification failed. Please check your credentials.' }, { status: 401 })
            }
        }

        // Check uniqueness for email and phone
        if (email || phone) {
            const conditions = []
            if (email) conditions.push(eq(visitor.email, email))
            if (phone) conditions.push(eq(visitor.phone, phone))
            
            const existing = await db.select().from(visitor).where(
                and(
                    or(...conditions),
                    ne(visitor.id, visitorId) // Exclude current user
                )
            ).get()

            if (existing) {
                return NextResponse.json({ error: 'Email or Phone is already taken by another account' }, { status: 400 })
            }
        }

        const data: Partial<typeof visitor.$inferInsert> = {}
        if (name !== undefined) data.name = name
        if (email !== undefined) data.email = email
        if (phone !== undefined) data.phone = phone
        if (password !== undefined && password.trim() !== '') {
            data.password = await bcrypt.hash(password, 10)
        }

        await db.update(visitor).set(data).where(eq(visitor.id, visitorId))

        // Return updated visitor info (excluding password)
        const updated = await db.select().from(visitor).where(eq(visitor.id, visitorId)).get()
        if (updated) {
            return NextResponse.json({
                id: updated.id,
                name: updated.name,
                currency: updated.currency,
                email: updated.email,
                phone: updated.phone
            })
        }
        
        return NextResponse.json({ success: true })
    } catch (_error) {
        console.error('Visitor profile update error:', _error)
        return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
    }
}
export async function GET(_req: NextRequest) {
    try {
        const session = await getVisitorSession()
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        const visitorId = session.visitorId

        const data = await db.select({
            id: visitor.id,
            name: visitor.name,
            currency: visitor.currency,
            email: visitor.email,
            phone: visitor.phone,
            address: visitor.address
        }).from(visitor).where(eq(visitor.id, visitorId)).get()

        if (!data) return NextResponse.json({ error: 'Visitor not found' }, { status: 404 })

        return NextResponse.json(data)
    } catch (e) {
        console.error('Visitor profile fetch error:', e)
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}
