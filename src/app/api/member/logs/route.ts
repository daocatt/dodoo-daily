import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { currencyLog } from '@/lib/schema'
import { eq, desc } from 'drizzle-orm'
import { getSessionUser } from '@/lib/auth'

export async function GET(req: NextRequest) {
    try {
        const session = await getSessionUser()
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        
        const userId = session.userId

        const logs = await db.select().from(currencyLog)
            .where(eq(currencyLog.userId, userId))
            .orderBy(desc(currencyLog.createdAt))
            .limit(50)

        return NextResponse.json(logs)
    } catch (_e) {
        console.error('Member Logs API error:', _e)
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}
