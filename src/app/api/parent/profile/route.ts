import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import { users } from '@/lib/schema'
import { eq } from 'drizzle-orm'

export async function PATCH(req: Request) {
    const cookieStore = await cookies()
    const session = cookieStore.get('session')?.value
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const { name } = await req.json()
        if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })

        // Find current user from session (assuming session is the user ID for now as per other routes)
        const currentUser = await db.query.users.findFirst({
            where: eq(users.id, session)
        })

        if (!currentUser || currentUser.role !== 'PARENT') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        await db.update(users)
            .set({ name })
            .where(eq(users.id, session))

        return NextResponse.json({ success: true })
    } catch (e) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
