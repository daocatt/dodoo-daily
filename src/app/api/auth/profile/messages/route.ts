import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { guestMessage, guest, users } from '@/lib/schema'
import { getSessionUser } from '@/lib/auth'
import { eq, and, desc } from 'drizzle-orm'

export async function GET() {
    try {
        const user = await getSessionUser()
        if (!user) return NextResponse.json({ error: 'Auth required' }, { status: 401 })

        // 1. Fetch all messages targeted to this user
        const messages = await db.select({
            id: guestMessage.id,
            text: guestMessage.text,
            isPublic: guestMessage.isPublic,
            createdAt: guestMessage.createdAt,
            guestName: guest.name,
            memberName: users.name,
            memberNickname: users.nickname
        })
        .from(guestMessage)
        .leftJoin(guest, eq(guestMessage.guestId, guest.id))
        .leftJoin(users, eq(guestMessage.memberId, users.id))
        .where(eq(guestMessage.targetUserId, user.id))
        .orderBy(desc(guestMessage.createdAt))

        return NextResponse.json(messages)
    } catch (e) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const user = await getSessionUser()
        if (!user) return NextResponse.json({ error: 'Auth required' }, { status: 401 })

        const { id, isPublic } = await req.json()
        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

        const result = await db.update(guestMessage)
            .set({ isPublic })
            .where(and(eq(guestMessage.id, id), eq(guestMessage.targetUserId, user.id)))
            .returning()

        return NextResponse.json(result[0])
    } catch (e) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const user = await getSessionUser()
        if (!user) return NextResponse.json({ error: 'Auth required' }, { status: 401 })

        const { searchParams } = new URL(req.url)
        const id = searchParams.get('id')
        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

        await db.delete(guestMessage)
            .where(and(eq(guestMessage.id, id), eq(guestMessage.targetUserId, user.id)))

        return NextResponse.json({ success: true })
    } catch (e) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}
