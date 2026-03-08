import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { journal, users } from '@/lib/schema'
import { desc, eq } from 'drizzle-orm'
import { cookies } from 'next/headers'

import { count } from 'drizzle-orm'

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '10')
        const offset = (page - 1) * limit

        const rawEntries = await db.select({
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
            .orderBy(desc(journal.milestoneDate), desc(journal.createdAt))
            .limit(limit)
            .offset(offset)

        const entries = rawEntries.map(e => ({
            ...e,
            authorName: e.authorNickname || e.authorName
        }))

        const [totalCount] = await db.select({ value: count() }).from(journal)

        return NextResponse.json({
            entries,
            totalCount: totalCount.value,
            page,
            limit
        })
    } catch (error) {
        console.error('Failed to fetch journal:', error)
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    try {
        const cookieStore = await cookies()
        const currentUserId = cookieStore.get('dodoo_user_id')?.value
        const currentUserRole = (cookieStore.get('dodoo_role')?.value as 'CHILD' | 'PARENT') || 'CHILD'

        if (!currentUserId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await req.json()
        const { text, imageUrl, imageUrls, voiceUrl, isMilestone, milestoneDate } = body

        if (!text && !imageUrl && !imageUrls && !voiceUrl) {
            return NextResponse.json({ error: 'Journal must have content' }, { status: 400 })
        }

        const newEntry = await db.insert(journal).values({
            authorId: currentUserId,
            authorRole: currentUserRole,
            text,
            imageUrl: imageUrl || (imageUrls && imageUrls.length > 0 ? imageUrls[0] : null),
            imageUrls: imageUrls ? JSON.stringify(imageUrls) : null,
            voiceUrl: voiceUrl || null,
            isMilestone: !!isMilestone,
            milestoneDate: milestoneDate ? new Date(Number(milestoneDate)) : new Date()
        }).returning()

        return NextResponse.json(newEntry[0])
    } catch (error) {
        console.error('Failed to create journal:', error)
        return NextResponse.json({ error: 'Failed to create journal' }, { status: 500 })
    }
}
