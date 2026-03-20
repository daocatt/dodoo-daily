import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { growthRecord } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { cookies } from 'next/headers'
import { getSessionUser } from '@/lib/auth';

async function getAuth() {
    const cookieStore = await cookies()
    const userId = (await getSessionUser())?.userId
    const role = (await getSessionUser())?.role
    return { userId, role }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { userId, role } = await getAuth()
    const { id } = await params
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const record = await db.select().from(growthRecord).where(eq(growthRecord.id, id)).get()
        if (!record) return NextResponse.json({ error: 'Not found' }, { status: 404 })

        if (record.userId !== userId && role !== 'PARENT') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        await db.delete(growthRecord).where(eq(growthRecord.id, id))
        return NextResponse.json({ success: true })
    } catch (e) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}
