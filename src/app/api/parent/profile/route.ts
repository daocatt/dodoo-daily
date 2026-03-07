import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import { users } from '@/lib/schema'
import { eq } from 'drizzle-orm'

export async function PATCH(req: Request) {
    const cookieStore = await cookies()
    const session = cookieStore.get('dodoo_user_id')?.value
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const { name, avatarUrl } = await req.json()
        if (!name && !avatarUrl) return NextResponse.json({ error: 'Name or AvatarUrl is required' }, { status: 400 })

        // Find current user from session
        const currentUser = await db.query.users.findFirst({
            where: eq(users.id, session)
        })

        if (!currentUser || currentUser.role !== 'PARENT') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const updates: any = {}
        if (name) updates.name = name
        if (avatarUrl) updates.avatarUrl = avatarUrl

        await db.update(users)
            .set(updates)
            .where(eq(users.id, session))

        return NextResponse.json({ success: true })
    } catch (e) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
