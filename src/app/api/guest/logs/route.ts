import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { guestCurrencyLog } from '@/lib/schema'
import { eq, desc } from 'drizzle-orm'

export async function GET(req: NextRequest) {
    try {
        const guestId = req.nextUrl.searchParams.get('guestId')
        if (!guestId) return NextResponse.json({ error: 'Missing guestId' }, { status: 400 })

        const logs = await db.select().from(guestCurrencyLog)
            .where(eq(guestCurrencyLog.guestId, guestId))
            .orderBy(desc(guestCurrencyLog.createdAt))
            .limit(50)

        return NextResponse.json(logs)
    } catch (e) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}
