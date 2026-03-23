import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { familyNote } from '@/lib/schema'
import { eq, and, or } from 'drizzle-orm'
import { getSessionUser } from '@/lib/auth'

export async function DELETE(
    req: NextRequest,
    { params: _params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const { userId, role } = await getSessionUser()
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        // Check if the note exists and if the user is authorized (author or parent)
        const [note] = await db.select().from(familyNote).where(eq(familyNote.id, id))
        if (!note) return NextResponse.json({ error: 'Not Found' }, { status: 404 })

        if (note.authorId !== userId && role !== 'PARENT') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        await db.delete(familyNote).where(eq(familyNote.id, id))

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Failed to delete family note:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

export async function PATCH(
    req: NextRequest,
    { params: _params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const { userId, role } = await getSessionUser()
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const body = await req.json()
        const { isPinned } = body

        const [note] = await db.select().from(familyNote).where(eq(familyNote.id, id))
        if (!note) return NextResponse.json({ error: 'Not Found' }, { status: 404 })

        // Only author or parent can toggle pin
        if (note.authorId !== userId && role !== 'PARENT') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const [updated] = await db.update(familyNote)
            .set({ isPinned: !!isPinned })
            .where(eq(familyNote.id, id))
            .returning()

        return NextResponse.json(updated)
    } catch (error) {
        console.error('Failed to update family note:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
