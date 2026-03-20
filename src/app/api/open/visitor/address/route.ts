import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { guest } from '@/lib/schema'
import { eq } from 'drizzle-orm'

export async function PATCH(req: NextRequest) {
    try {
        const body = await req.json()
        const { guestId, address } = body

        if (!guestId) return NextResponse.json({ error: 'Missing guestId' }, { status: 400 })

        await db.update(guest).set({ 
            address: address || null 
        }).where(eq(guest.id, guestId))

        return NextResponse.json({ success: true, address })
    } catch (error) {
        console.error('Failed to update visitor address:', error)
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}
