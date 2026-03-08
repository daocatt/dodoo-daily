import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { journal, users } from '@/lib/schema'
import { eq, and, or } from 'drizzle-orm'
import { getSessionUser } from '@/lib/auth'

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const { userId } = await getSessionUser()
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 })

        const rawEntry = await db.select({
            id: journal.id,
            authorId: journal.authorId,
            authorRole: journal.authorRole,
            authorAvatar: users.avatarUrl,
            authorName: users.name,
            authorNickname: users.nickname,
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

        if (!rawEntry) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 })
        }

        const entry = {
            ...rawEntry,
            authorName: rawEntry.authorNickname || rawEntry.authorName
        }

        return NextResponse.json(entry)
    } catch (error) {
        console.error('Failed to fetch journal entry:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const { userId, role } = await getSessionUser()

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await req.json()
        const { text, imageUrls, isMilestone, milestoneDate } = body

        // Check if journal exists and access control
        const existingJournal = await db.select().from(journal).where(eq(journal.id, id)).get()
        if (!existingJournal) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 })
        }

        // Only author or parent can edit
        if (existingJournal.authorId !== userId && role !== 'PARENT') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        await db.update(journal)
            .set({
                text: text || existingJournal.text,
                imageUrl: imageUrls && imageUrls.length > 0 ? imageUrls[0] : existingJournal.imageUrl,
                imageUrls: imageUrls ? JSON.stringify(imageUrls) : existingJournal.imageUrls,
                isMilestone: isMilestone !== undefined ? !!isMilestone : existingJournal.isMilestone,
                milestoneDate: milestoneDate ? new Date(Number(milestoneDate)) : existingJournal.milestoneDate,
                updatedAt: new Date()
            })
            .where(eq(journal.id, id))

        // After update, re-fetch with join to return the full author info
        const rawEntryAfterUpdate = await db.select({
            id: journal.id,
            authorId: journal.authorId,
            authorRole: journal.authorRole,
            authorAvatar: users.avatarUrl,
            authorName: users.name,
            authorNickname: users.nickname,
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

        const finalEntry = {
            ...rawEntryAfterUpdate,
            authorName: rawEntryAfterUpdate?.authorNickname || rawEntryAfterUpdate?.authorName
        }

        return NextResponse.json(finalEntry)
    } catch (error) {
        console.error('Failed to update journal entry:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
