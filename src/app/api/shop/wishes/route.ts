import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { wish } from '@/lib/schema'
import { eq, desc } from 'drizzle-orm'
import { cookies } from 'next/headers'

export async function GET(req: NextRequest) {
    try {
        const cookieStore = await cookies()
        const currentUserId = cookieStore.get('dodoo_user_id')?.value
        if (!currentUserId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const results = await db.select()
            .from(wish)
            .where(eq(wish.userId, currentUserId))
            .orderBy(desc(wish.createdAt))
            .all()

        return NextResponse.json(results)
    } catch (error) {
        console.error('Failed to fetch wishes:', error)
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    try {
        const cookieStore = await cookies()
        const currentUserId = cookieStore.get('dodoo_user_id')?.value
        if (!currentUserId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { name, description, imageUrl } = await req.json()
        if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })

        const newWish = await db.insert(wish).values({
            userId: currentUserId,
            name,
            description,
            imageUrl,
            status: 'PENDING'
        }).returning()

        return NextResponse.json(newWish[0])
    } catch (error) {
        console.error('Failed to create wish:', error)
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}
