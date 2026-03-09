import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { familyNote, users } from '@/lib/schema'
import { desc, eq, sql } from 'drizzle-orm'
import { getSessionUser } from '@/lib/auth'

export async function GET() {
    try {
        const { userId } = await getSessionUser()
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const notes = await db.select({
            id: familyNote.id,
            text: familyNote.text,
            color: familyNote.color,
            isPinned: familyNote.isPinned,
            createdAt: familyNote.createdAt,
            authorId: familyNote.authorId,
            authorName: sql<string>`(SELECT COALESCE(nickname, name) FROM Users WHERE id = FamilyNote.authorId)`,
            authorAvatar: sql<string>`(SELECT avatarUrl FROM Users WHERE id = FamilyNote.authorId)`
        })
            .from(familyNote)
            .orderBy(desc(familyNote.isPinned), desc(familyNote.createdAt))
            .limit(50)

        return NextResponse.json(notes)
    } catch (error) {
        console.error('Failed to fetch family notes:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    try {
        const { userId } = await getSessionUser()
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { text, color } = await req.json()
        if (!text) return NextResponse.json({ error: 'Text is required' }, { status: 400 })

        const [newNote] = await db.insert(familyNote).values({
            authorId: userId,
            text,
            color: color || "#FEF3C7",
            isPinned: false
        }).returning()

        return NextResponse.json(newNote)
    } catch (error) {
        console.error('Failed to create family note:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
