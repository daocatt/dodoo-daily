import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { journal, users } from '@/lib/schema'
import { desc, eq } from 'drizzle-orm'

export async function GET() {
    try {
        const entries = await db.select().from(journal).orderBy(desc(journal.createdAt))
        return NextResponse.json(entries)
    } catch (error) {
        console.error('Failed to fetch journal:', error)
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { text, authorRole, imageUrl, voiceUrl } = body

        if (!text && !imageUrl && !voiceUrl) {
            return NextResponse.json({ error: 'Journal must have content' }, { status: 400 })
        }

        // Find a user matching the role for now
        const matchingUsers = await db.select().from(users).where(eq(users.role, authorRole || 'CHILD'))
        const authorId = matchingUsers.length > 0 ? matchingUsers[0].id : null

        const newEntry = await db.insert(journal).values({
            authorId: authorId,
            authorRole: authorRole || 'CHILD',
            text,
            imageUrl: imageUrl || null,
            voiceUrl: voiceUrl || null,
        }).returning()

        return NextResponse.json(newEntry[0])
    } catch (error) {
        console.error('Failed to create journal:', error)
        return NextResponse.json({ error: 'Failed to create journal' }, { status: 500 })
    }
}
