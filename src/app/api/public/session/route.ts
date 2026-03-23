import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getSessionUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { users } from '@/lib/schema'
import { eq } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const user = await getSessionUser()
        const userRecord = user ? await db.select().from(users).where(eq(users.id, user.id)).get() : null
        
        // 2. Check Visitor Session
        const cookieStore = await cookies()
        const visitorToken = cookieStore.get('dodoo_visitor_session')?.value
        let visitorData = null
        
        if (visitorToken) {
            const { verifyJWT } = await import('@/lib/auth')
            const payload = await verifyJWT(visitorToken)
            if (payload && payload.visitorId && payload.type === 'VISITOR') {
                const { visitor: visitorTable } = await import('@/lib/schema')
                visitorData = await db.select().from(visitorTable).where(eq(visitorTable.id, payload.visitorId as string)).get()
            }
        }

        const responseData = {
            user: userRecord ? {
                id: userRecord.id,
                name: userRecord.name,
                nickname: userRecord.nickname,
                avatarUrl: userRecord.avatarUrl,
                role: userRecord.role,
                slug: userRecord.slug
            } : null,
            visitor: visitorData ? {
                id: visitorData.id,
                name: visitorData.name,
                currency: visitorData.currency,
                email: visitorData.email,
                phone: visitorData.phone
            } : null
        }

        return NextResponse.json(responseData)
    } catch (error) {
        console.error('[API public/session] Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
