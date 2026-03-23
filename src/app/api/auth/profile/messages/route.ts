import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { visitorMessage, visitor, users } from '@/lib/schema'
import { getSessionUser } from '@/lib/auth'
import { eq, and, desc } from 'drizzle-orm'

export async function GET() {
    try {
        const user = await getSessionUser()
        if (!user) return NextResponse.json({ error: 'Auth required' }, { status: 401 })

        // 1. Fetch all messages targeted to this user
        const messages = await db.select({
            id: visitorMessage.id,
            text: visitorMessage.text,
            isPublic: visitorMessage.isPublic,
            createdAt: visitorMessage.createdAt,
            visitorName: visitor.name,
            memberName: users.name,
            memberNickname: users.nickname
        })
        .from(visitorMessage)
        .leftJoin(visitor, eq(visitorMessage.visitorId, visitor.id))
        .leftJoin(users, eq(visitorMessage.memberId, users.id))
        .where(eq(visitorMessage.targetUserId, user.id))
        .orderBy(desc(visitorMessage.createdAt))

        return NextResponse.json(messages)
    } catch (_e) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const user = await getSessionUser()
        if (!user) return NextResponse.json({ error: 'Auth required' }, { status: 401 })

        const { id, isPublic } = await req.json()
        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

        const result = await db.update(visitorMessage)
            .set({ isPublic })
            .where(and(eq(visitorMessage.id, id), eq(visitorMessage.targetUserId, user.id)))
            .returning()

        return NextResponse.json(result[0])
    } catch (_e) {
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

        await db.delete(visitorMessage)
            .where(and(eq(visitorMessage.id, id), eq(visitorMessage.targetUserId, user.id)))

        return NextResponse.json({ success: true })
    } catch (_e) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}
