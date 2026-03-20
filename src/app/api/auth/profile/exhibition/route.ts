import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { getSessionUser } from '@/lib/auth'

export async function PATCH(req: NextRequest) {
    try {
        const user = await getSessionUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const body = await req.json()
        const { exhibitionTitle, exhibitionSubtitle, exhibitionDescription, exhibitionEnabled } = body

        const updates: Record<string, unknown> = {}
        if (exhibitionTitle !== undefined) updates.exhibitionTitle = exhibitionTitle
        if (exhibitionSubtitle !== undefined) updates.exhibitionSubtitle = exhibitionSubtitle
        if (exhibitionDescription !== undefined) updates.exhibitionDescription = exhibitionDescription
        if (exhibitionEnabled !== undefined) updates.exhibitionEnabled = exhibitionEnabled

        await db.update(users).set(updates).where(eq(users.id, user.id))

        return NextResponse.json({ success: true, ...updates })
    } catch (error) {
        console.error('Failed to update exhibition settings:', error)
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}

export async function GET(req: NextRequest) {
    try {
        const userSession = await getSessionUser()
        if (!userSession) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const user = await db.query.users.findFirst({
            where: eq(users.id, userSession.id)
        })

        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

        return NextResponse.json({
            exhibitionTitle: user.exhibitionTitle,
            exhibitionSubtitle: user.exhibitionSubtitle,
            exhibitionDescription: user.exhibitionDescription,
            exhibitionEnabled: user.exhibitionEnabled,
            slug: user.slug
        })
    } catch (error) {
        console.error('Failed to get exhibition settings:', error)
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}
