import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { growthRecord } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { getSessionUser } from '@/lib/auth';

async function getAuth() {
    const session = await getSessionUser()
    return { userId: session?.userId, role: session?.role }
}

export async function DELETE(
    _req: NextRequest,
    { params: _params }: { params: Promise<{ id: string }> }
) {
    const { userId, role } = await getAuth()
    const { id } = await _params
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const record = await db.select().from(growthRecord).where(eq(growthRecord.id, id)).get()
        if (!record) return NextResponse.json({ error: 'Not found' }, { status: 404 })

        if (record.userId !== userId && role !== 'PARENT') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        await db.delete(growthRecord).where(eq(growthRecord.id, id))
        return NextResponse.json({ success: true })
    } catch (_e) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}
