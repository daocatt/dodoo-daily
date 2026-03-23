import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { artwork } from '@/lib/schema'
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
        const { exhibitionDescription } = body

        await db.update(artwork)
            .set({ exhibitionDescription })
            .where(eq(artwork.id, id))

        return NextResponse.json({ success: true })
    } catch (_e) {
        console.error('Update artwork description error:', e)
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}
