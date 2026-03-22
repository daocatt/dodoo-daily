import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { guest } from '@/lib/schema'
import { eq, or, and, ne } from 'drizzle-orm'

export async function PATCH(req: NextRequest) {
    try {
        const body = await req.json()
        const { guestId, name, email, phone, password } = body

        if (!guestId) {
            return NextResponse.json({ error: 'Guest ID is required' }, { status: 400 })
        }

        // Check uniqueness for email and phone
        if (email || phone) {
            const conditions = []
            if (email) conditions.push(eq(guest.email, email))
            if (phone) conditions.push(eq(guest.phone, phone))
            
            const existing = await db.select().from(guest).where(
                and(
                    or(...conditions),
                    ne(guest.id, guestId) // Exclude current user
                )
            ).get()

            if (existing) {
                return NextResponse.json({ error: 'Email or Phone is already taken by another account' }, { status: 400 })
            }
        }

        const data: Partial<typeof guest.$inferInsert> = {}
        if (name !== undefined) data.name = name
        if (email !== undefined) data.email = email
        if (phone !== undefined) data.phone = phone
        if (password !== undefined && password.trim() !== '') data.password = password

        await db.update(guest).set(data).where(eq(guest.id, guestId))

        // Return updated guest info (excluding password)
        const updated = await db.select().from(guest).where(eq(guest.id, guestId)).get()
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
    } catch (e) {
        console.error('Guest profile update error:', e)
        return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
    }
}
