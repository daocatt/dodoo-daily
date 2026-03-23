import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { visitorMessage, users, visitor } from '@/lib/schema'
import { getSessionUser, getVisitorSession } from '@/lib/auth'
import { eq, and, desc } from 'drizzle-orm'

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { targetUserId, text, isPublic } = body // Removed visitorId from body

        if (!targetUserId || !text) {
            return NextResponse.json({ error: 'Missing target user or message text' }, { status: 400 })
        }

        const user = await getSessionUser()
        const memberId = user?.id

        const visitorSession = await getVisitorSession()
        const visitorId = visitorSession?.visitorId

        if (!memberId && !visitorId) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
        }

        const newMessage = await db.insert(visitorMessage).values({
            visitorId: visitorId || null,
            memberId: memberId || null,
            targetUserId: targetUserId,
            text: text,
            isPublic: isPublic ?? false,
        }).returning().get()

        return NextResponse.json({ success: true, message: newMessage })
    } catch (e: unknown) {
        console.error('Visitor message failed:', e)
        return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
    }
}

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const targetUserId = searchParams.get('userId')
        const slug = searchParams.get('slug')

        if (!targetUserId && !slug) {
            return NextResponse.json({ error: 'User filter required' }, { status: 400 })
        }

        let userId = targetUserId
        if (slug) {
            const u = await db.select().from(users).where(eq(users.slug, slug)).get()
            if (u) userId = u.id
        }

        if (!userId) return NextResponse.json([])

        const sessionUser = await getSessionUser()
        const isSelf = sessionUser?.id === userId
        const customLimit = parseInt(searchParams.get('limit') || '20')
        const customOffset = parseInt(searchParams.get('offset') || '0')

        const messages = await db.select({
            id: visitorMessage.id,
            text: visitorMessage.text,
            isPublic: visitorMessage.isPublic,
            createdAt: visitorMessage.createdAt,
            visitorId: visitorMessage.visitorId,
            memberId: visitorMessage.memberId,
            visitorName: visitor.name,
            memberName: users.name,
            memberNickname: users.nickname
        })
        .from(visitorMessage)
        .leftJoin(visitor, eq(visitorMessage.visitorId, visitor.id))
        .leftJoin(users, eq(visitorMessage.memberId, users.id))
        .where(
            and(
                eq(visitorMessage.targetUserId, userId as string),
                isSelf ? undefined : eq(visitorMessage.isPublic, true)
            )
        )
        .orderBy(desc(visitorMessage.createdAt))
        .limit(customLimit)
        .offset(customOffset)

        return NextResponse.json(messages)
    } catch (_e) {
        return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
    }
}
