import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { guest } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { getSessionUser } from '@/lib/auth'

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
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
            await db.delete(guest).where(eq(guest.id, id))
        } else if (action === 'APPROVE') {
            await db.update(guest).set({ status: 'APPROVED' }).where(eq(guest.id, id))
        } else if (action === 'BAN') {
            await db.update(guest).set({ status: 'BANNED' }).where(eq(guest.id, id))
        } else {
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
        }

        return NextResponse.json({ success: true })
    } catch (e) {
        console.error('Update guest error:', e)
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}
