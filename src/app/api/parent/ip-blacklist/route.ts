import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { ipBlacklist } from '@/lib/schema'
import { desc, eq } from 'drizzle-orm'
import { getSessionUser } from '@/lib/auth'

export async function GET(req: NextRequest) {
    try {
        const session = await getSessionUser()
        if (!session || session.role !== 'PARENT') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const list = await db.select().from(ipBlacklist).orderBy(desc(ipBlacklist.createdAt))
        return NextResponse.json(list)
    } catch (_e) {
        console.error('Fetch IP blacklist error:', e)
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getSessionUser()
        if (!session || session.role !== 'PARENT') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await req.json()
        const { ip, reason } = body

        if (!ip) return NextResponse.json({ error: 'IP is required' }, { status: 400 })

        const [newItem] = await db.insert(ipBlacklist).values({
            ip,
            reason,
        }).returning()

        return NextResponse.json(newItem)
    } catch (_e) {
        console.error('Add IP to blacklist error:', e)
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}
