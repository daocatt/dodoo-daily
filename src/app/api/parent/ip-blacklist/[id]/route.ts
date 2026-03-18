import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { ipBlacklist } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { getSession } from '@/lib/auth'

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const session = await getSession()
        if (!session || session.role !== 'PARENT') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        await db.delete(ipBlacklist).where(eq(ipBlacklist.id, id))
        return NextResponse.json({ success: true })
    } catch (e) {
        console.error('Delete IP from blacklist error:', e)
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}
