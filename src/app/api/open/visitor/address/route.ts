import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { visitor } from '@/lib/schema'
import { eq } from 'drizzle-orm'

export async function PATCH(_req: NextRequest) {
    try {
        const body = await req.json()
        const { visitorId, address } = body

        if (!visitorId) return NextResponse.json({ error: 'Missing visitorId' }, { status: 400 })

        await db.update(visitor).set({ 
            address: address || null 
        }).where(eq(visitor.id, visitorId))

        return NextResponse.json({ success: true, address })
    } catch (error) {
        console.error('Failed to update visitor address:', error)
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}
