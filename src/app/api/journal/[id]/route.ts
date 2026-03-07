import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { journal, users } from '@/lib/schema'
import { eq } from 'drizzle-orm'

export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = await params
        if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 })

        const entry = await db.select({
            id: journal.id,
            authorId: journal.authorId,
            authorRole: journal.authorRole,
            authorAvatar: users.avatarUrl,
            authorName: users.name,
            text: journal.text,
            imageUrl: journal.imageUrl,
            imageUrls: journal.imageUrls,
            voiceUrl: journal.voiceUrl,
            isMilestone: journal.isMilestone,
            milestoneDate: journal.milestoneDate,
            createdAt: journal.createdAt,
            updatedAt: journal.updatedAt
        })
            .from(journal)
            .leftJoin(users, eq(journal.authorId, users.id))
            .where(eq(journal.id, id))
            .get()

        if (!entry) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 })
        }

        return NextResponse.json(entry)
    } catch (error) {
        console.error('Failed to fetch journal entry:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
