import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { visitor } from '@/lib/schema'
import { desc } from 'drizzle-orm'
import { getSessionUser } from '@/lib/auth'

export async function GET(_req: NextRequest) {
    try {
        const session = await getSessionUser()
        if (!session || session.role !== 'PARENT') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const visitors = await db.select().from(visitor).orderBy(desc(visitor.createdAt))
        return NextResponse.json(visitors)
    } catch (_e) {
        console.error('Fetch visitors error:', e)
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}
