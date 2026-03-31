import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { journal, users, journalMedia } from '@/lib/schema'
import { desc, eq, and, count, inArray } from 'drizzle-orm'
import { getSessionUser } from '@/lib/auth'
import { notifyParents } from '@/lib/push'

export async function GET(req: NextRequest) {
    try {
        const session = await getSessionUser()
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { searchParams } = new URL(req.url)
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '10')
        const offset = (page - 1) * limit

        const isMilestoneFilter = searchParams.get('isMilestone') === 'true'
        const isDeletedFilter = searchParams.get('isDeleted') === 'true'
        const excludeMilestones = searchParams.get('excludeMilestones') === 'true'

        const conditions = []
        if (isDeletedFilter) {
            conditions.push(eq(journal.isDeleted, true))
        } else {
            conditions.push(eq(journal.isDeleted, false))
            if (isMilestoneFilter) {
                conditions.push(eq(journal.isMilestone, true))
            } else if (excludeMilestones) {
                conditions.push(eq(journal.isMilestone, false))
            }
        }

        const baseQuery = db.select({
            id: journal.id,
            authorId: journal.authorId,
            authorRole: journal.authorRole,
            authorAvatar: users.avatarUrl,
            authorName: users.name,
            authorNickname: users.nickname,
            title: journal.title,
            text: journal.text,
            imageUrl: journal.imageUrl,
            imageUrls: journal.imageUrls,
            voiceUrl: journal.voiceUrl,
            isMilestone: journal.isMilestone,
            isPublic: journal.isPublic,
            isDeleted: journal.isDeleted,
            milestoneDate: journal.milestoneDate,
            createdAt: journal.createdAt,
            updatedAt: journal.updatedAt
        })
            .from(journal)
            .leftJoin(users, eq(journal.authorId, users.id))
            .where(and(...conditions))

        const rawEntries = await baseQuery
            .orderBy(desc(journal.milestoneDate), desc(journal.createdAt))
            .limit(limit)
            .offset(offset)

        // Aggregated Media Retrieval
        const entryIds = rawEntries.map(e => e.id)
        let allMedia: (typeof journalMedia.$inferSelect)[] = []
        if (entryIds.length > 0) {
            allMedia = await db.select()
                .from(journalMedia)
                .where(inArray(journalMedia.journalId, entryIds))
        }

        const entries = rawEntries.map(e => {
            // Find all images in journalMedia table
            const mediaLinks = allMedia
                .filter(m => m.journalId === e.id && m.type === 'IMAGE')
                .map(m => m.url)
            
            // Merge with existing imageUrls JSON if any
            let finalImageUrls = [...mediaLinks]
            if (e.imageUrls) {
                try {
                    const parsed = typeof e.imageUrls === 'string' ? JSON.parse(e.imageUrls) : e.imageUrls
                    if (Array.isArray(parsed)) {
                        finalImageUrls = [...new Set([...finalImageUrls, ...parsed])]
                    }
                } catch {}
            }
            if (e.imageUrl && !finalImageUrls.includes(e.imageUrl)) {
                finalImageUrls.push(e.imageUrl)
            }

            return {
                ...e,
                imageUrls: JSON.stringify(finalImageUrls),
                isMilestone: !!e.isMilestone,
                isPublic: !!e.isPublic,
                isDeleted: !!e.isDeleted,
                authorName: e.authorNickname || e.authorName
            }
        })

        const [totalCount] = await db.select({ value: count() })
            .from(journal)
            .where(isDeletedFilter ? eq(journal.isDeleted, true) : eq(journal.isDeleted, false))

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
        const session = await getSessionUser()
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        const { userId: currentUserId, role: currentUserRoleRaw } = session
        const currentUserRole = (currentUserRoleRaw as 'CHILD' | 'PARENT') || 'CHILD'

        const body = await req.json()
        const { title, text, imageUrl, imageUrls, voiceUrl, isMilestone, milestoneDate, isPublic } = body

        if (!title && !text && !imageUrl && !imageUrls && !voiceUrl) {
            return NextResponse.json({ error: 'Journal must have content' }, { status: 400 })
        }

        // Use a transaction to ensure both journal and media are saved
        const result = db.transaction((tx) => {
            const [newEntry] = tx.insert(journal).values({
                authorId: currentUserId,
                authorRole: currentUserRole,
                title,
                text,
                imageUrl: imageUrl || (imageUrls && imageUrls.length > 0 ? imageUrls[0] : null),
                imageUrls: imageUrls ? JSON.stringify(imageUrls) : null,
                voiceUrl: voiceUrl || null,
                isMilestone: !!isMilestone,
                isPublic: !!isPublic,
                isDeleted: false,
                milestoneDate: milestoneDate ? new Date(Number(milestoneDate)) : new Date()
            }).returning().all()

            // Insert into journalMedia
            const mediaItems: (typeof journalMedia.$inferInsert)[] = []

            // Add images
            if (imageUrls && Array.isArray(imageUrls)) {
                imageUrls.forEach((url, index) => {
                    mediaItems.push({
                        journalId: newEntry.id,
                        type: 'IMAGE',
                        url,
                        sortOrder: index
                    })
                })
            } else if (imageUrl) {
                mediaItems.push({
                    journalId: newEntry.id,
                    type: 'IMAGE',
                    url: imageUrl,
                    sortOrder: 0
                })
            }

            // Add voice
            if (voiceUrl) {
                mediaItems.push({
                    journalId: newEntry.id,
                    type: 'VOICE',
                    url: voiceUrl,
                    sortOrder: 0
                })
            }

            if (mediaItems.length > 0) {
                tx.insert(journalMedia).values(mediaItems).run()
            }

            return newEntry
        })

        // Notify parents if it's a milestone and posted by child
        if (isMilestone && currentUserRole === 'CHILD') {
            notifyParents({
                title: 'New Milestone! ✨',
                body: `Children posted a new milestone: ${text?.substring(0, 50) || 'View entry'}`,
                data: { url: `/journal/${result.id}` }
            }).catch(e => console.error('Milestone notification failed:', e))
        }

        return NextResponse.json(result)
    } catch (error) {
        console.error('Failed to create journal:', error)
        return NextResponse.json({ error: 'Failed to create journal' }, { status: 500 })
    }
}

