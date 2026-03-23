import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { visitorMessage, visitor, users } from '@/lib/schema'
import { getSessionUser } from '@/lib/auth'
import { eq, and, desc } from 'drizzle-orm'

// GET ALL VISITOR MESSAGES (Parent Access)
export async function GET() {
    try {
        const user = await getSessionUser()
        if (!user || user.role !== 'PARENT') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        const messages = await db.select({
            id: visitorMessage.id,
            text: visitorMessage.text,
            isPublic: visitorMessage.isPublic,
            targetUserId: visitorMessage.targetUserId,
            createdAt: visitorMessage.createdAt,
            visitorName: visitor.name,
            memberName: users.name,
            memberNickname: users.nickname,
            targetUserName: db.select({ name: users.name }).from(users).where(eq(users.id, visitorMessage.targetUserId)).as('target_name')
        })
        .from(visitorMessage)
        .leftJoin(visitor, eq(visitorMessage.visitorId, visitor.id))
        .leftJoin(users, eq(visitorMessage.memberId, users.id))
        .orderBy(desc(visitorMessage.createdAt))

        // Note: Drizzle subqueries in select can be tricky with types in this setup, 
        // let's just do a join for target user too.
        
        const messagesWithTarget = await db.select({
            id: visitorMessage.id,
            text: visitorMessage.text,
            isPublic: visitorMessage.isPublic,
            targetUserId: visitorMessage.targetUserId,
            createdAt: visitorMessage.createdAt,
            visitorName: visitor.name,
            memberNickname: users.nickname,
            memberName: users.name,
        })
        .from(visitorMessage)
        .leftJoin(visitor, eq(visitorMessage.visitorId, visitor.id))
        .leftJoin(users, eq(visitorMessage.memberId, users.id))
        .orderBy(desc(visitorMessage.createdAt))

        // We'll also need to know WHO the message was for. 
        // Let's get all users to map IDs to names in the frontend or join again.
        
        const allUsers = await db.select({ id: users.id, name: users.name, nickname: users.nickname }).from(users)
        const userMap = Object.fromEntries(allUsers.map(u => [u.id, u.nickname || u.name]))

        const results = messagesWithTarget.map(m => ({
            ...m,
            targetUserName: userMap[m.targetUserId] || 'Unknown'
        }))

        return NextResponse.json(results)
    } catch (_e) {
        console.error('Failed to fetch parent messages:', e)
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}

// TOGGLE PUBLIC STATUS
export async function PATCH(req: NextRequest) {
    try {
        const user = await getSessionUser()
        if (!user || user.role !== 'PARENT') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        const { id, isPublic } = await req.json()
        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

        const result = await db.update(visitorMessage)
            .set({ isPublic })
            .where(eq(visitorMessage.id, id))
            .returning()

        return NextResponse.json(result[0])
    } catch (_e) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}

// DELETE MESSAGE
export async function DELETE(req: NextRequest) {
    try {
        const user = await getSessionUser()
        if (!user || user.role !== 'PARENT') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        const { searchParams } = new URL(req.url)
        const id = searchParams.get('id')
        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

        await db.delete(visitorMessage).where(eq(visitorMessage.id, id))

        return NextResponse.json({ success: true })
    } catch (_e) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}
