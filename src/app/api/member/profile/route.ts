import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { getSession } from '@/lib/auth'

export async function PATCH(req: NextRequest) {
    try {
        const session = await getSession()
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        
        const userId = session.userId
        const body = await req.json()
        const { address } = body

        if (address === undefined) {
            return NextResponse.json({ error: 'Missing address field' }, { status: 400 })
        }

        await db.update(users).set({ address }).where(eq(users.id, userId))

        return NextResponse.json({ success: true })
    } catch (_e) {
        console.error('Member Profile API error:', _e)
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}
