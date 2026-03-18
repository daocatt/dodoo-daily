import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { guest } from '@/lib/schema'
import { desc } from 'drizzle-orm'
import { getSessionUser } from '@/lib/auth'

export async function GET(req: NextRequest) {
    try {
        const session = await getSessionUser()
        if (!session || session.role !== 'PARENT') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const guests = await db.select().from(guest).orderBy(desc(guest.createdAt))
        return NextResponse.json(guests)
    } catch (e) {
        console.error('Fetch guests error:', e)
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}
