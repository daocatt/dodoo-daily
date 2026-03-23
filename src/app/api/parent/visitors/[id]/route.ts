import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { visitor } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { getSessionUser } from '@/lib/auth'

export async function PATCH(
    req: NextRequest,
    { params: _params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const session = await getSessionUser()
        if (!session || session.role !== 'PARENT') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await req.json()
        const { action } = body

        if (action === 'DELETE') {
            await db.delete(visitor).where(eq(visitor.id, id))
        } else if (action === 'APPROVE') {
            await db.update(visitor).set({ status: 'APPROVED' }).where(eq(visitor.id, id))
        } else if (action === 'BAN') {
            await db.update(visitor).set({ status: 'BANNED' }).where(eq(visitor.id, id))
        } else {
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
        }

        return NextResponse.json({ success: true })
    } catch (_e) {
        console.error('Update visitor error:', e)
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}
