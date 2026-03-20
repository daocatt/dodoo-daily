import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { memberLoginLog, users } from '@/lib/schema'
import { eq, desc, and } from 'drizzle-orm'
import { getSessionUser } from '@/lib/auth'

export async function GET(req: Request) {
    try {
        const user = await getSessionUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { searchParams } = new URL(req.url)
        const targetUserId = searchParams.get('userId')

        const results = await db.select({
            id: memberLoginLog.id,
            userId: memberLoginLog.userId,
            ip: memberLoginLog.ip,
            userAgent: memberLoginLog.userAgent,
            status: memberLoginLog.status,
            createdAt: memberLoginLog.createdAt,
            userName: users.name,
            userNickname: users.nickname,
            userAvatar: users.avatarUrl
        })
        .from(memberLoginLog)
        .innerJoin(users, eq(memberLoginLog.userId, users.id))
        .where(
            user.role === 'PARENT' 
                ? (targetUserId ? eq(memberLoginLog.userId, targetUserId) : undefined)
                : eq(memberLoginLog.userId, user.userId)
        )
        .orderBy(desc(memberLoginLog.createdAt))
        .limit(100)
        .all()

        return NextResponse.json(results)
    } catch (error) {
        console.error('Failed to fetch login logs:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
