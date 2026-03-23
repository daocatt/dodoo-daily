import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { visitorCurrencyLog, currencyLog } from '@/lib/schema'
import { eq, desc } from 'drizzle-orm'

export async function GET(_req: NextRequest) {
    try {
        const visitorId = req.nextUrl.searchParams.get('visitorId')
        const memberId = req.nextUrl.searchParams.get('memberId')

        if (!visitorId && !memberId) {
            return NextResponse.json({ error: 'Missing identity' }, { status: 400 })
        }

        const logs = memberId 
            ? await db.select().from(currencyLog)
                .where(eq(currencyLog.userId, memberId))
                .orderBy(desc(currencyLog.createdAt))
                .limit(50)
            : await db.select().from(visitorCurrencyLog)
                .where(eq(visitorCurrencyLog.visitorId, visitorId!))
                .orderBy(desc(visitorCurrencyLog.createdAt))
                .limit(50)

        return NextResponse.json(logs)
    } catch (_e) {
        console.error('Logs API error:', e)
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}
