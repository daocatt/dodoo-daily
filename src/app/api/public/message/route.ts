import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { guestMessage, users, guest } from '@/lib/schema'
import { getSessionUser } from '@/lib/auth'
import { eq, and, desc } from 'drizzle-orm'

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { targetUserId, text, guestId, isPublic } = body

        if (!targetUserId || !text) {
            return NextResponse.json({ error: 'Missing target user or message text' }, { status: 400 })
        }

        const user = await getSessionUser()
        const memberId = user?.id

        if (!memberId && !guestId) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
        }

        const newMessage = await db.insert(guestMessage).values({
            guestId: guestId || null,
            memberId: memberId || null,
            targetUserId: targetUserId,
            text: text,
            isPublic: isPublic ?? false,
        }).returning().get()

        return NextResponse.json({ success: true, message: newMessage })
    } catch (e: unknown) {
        console.error('Guest message failed:', e)
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

        const messages = await db.select({
            id: guestMessage.id,
            text: guestMessage.text,
            createdAt: guestMessage.createdAt,
            guestId: guestMessage.guestId,
            memberId: guestMessage.memberId,
            guestName: guest.name,
            memberName: users.name,
            memberNickname: users.nickname
        })
        .from(guestMessage)
        .leftJoin(guest, eq(guestMessage.guestId, guest.id))
        .leftJoin(users, eq(guestMessage.memberId, users.id))
        .where(
            and(
                eq(guestMessage.targetUserId, userId as string), // Cast to string since userId check is above
                eq(guestMessage.isPublic, true)
            )
        )
        .orderBy(desc(guestMessage.createdAt))
        .limit(20)

        return NextResponse.json(messages)
    } catch (e) {
        return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
    }
}
