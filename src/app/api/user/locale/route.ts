import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users, guest } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { getSessionUser } from '@/lib/auth'

export async function POST(req: NextRequest) {
    try {
        const user = await getSessionUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { locale } = await req.json()
        if (!locale || !['en', 'zh-CN'].includes(locale)) {
            return NextResponse.json({ error: 'Invalid locale' }, { status: 400 })
        }

        if (user.isGuest) {
            // For guests, we only use localStorage.
            return NextResponse.json({ success: true, skipDb: true })
        } else {
            await db.update(users).set({ locale }).where(eq(users.id, user.id))
        }

        return NextResponse.json({ success: true })
    } catch (e) {
        console.error('[API user locale] Error:', e)
        return NextResponse.json({ error: 'Failed to update locale' }, { status: 500 })
    }
}
