import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { homeWidget, users } from '@/lib/schema'
import { eq, and } from 'drizzle-orm'
import { getSessionUser } from '@/lib/auth'

export async function GET() {
    const user = await getSessionUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { userId } = user
    const userRecord = await db.select().from(users).where(eq(users.id, userId)).get()
    if (!userRecord) {
        console.warn('[API home-widgets] User record not found for id:', userId)
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const widgets = await db.select().from(homeWidget).where(eq(homeWidget.userId, userId)).all()

        // If no widgets, provide default layout
        if (widgets.length === 0) {
            const defaults = [
                // Row 1: 2x2 widgets
                { type: 'NOTES', size: 'SQUARE', x: 0, y: 0 },
                { type: 'TASKS', size: 'SQUARE', x: 2, y: 0 },
                { type: 'LEDGER', size: 'SQUARE', x: 4, y: 0 },
                { type: 'STORAGE', size: 'SQUARE', x: 6, y: 0 },
                // Row 2: 1x1 widgets
                { type: 'JOURNAL', size: 'ICON', x: 0, y: 2 },
                { type: 'MILESTONE', size: 'ICON', x: 1, y: 2 },
                { type: 'PHOTOS', size: 'ICON', x: 2, y: 2 },
                { type: 'SHOP', size: 'ICON', x: 3, y: 2 }
            ]

            const inserted = []
            for (const item of defaults) {
                const res = await db.insert(homeWidget).values({
                    userId,
                    ...item
                }).returning()
                inserted.push(res[0])
            }
            return NextResponse.json(inserted)
        }

        return NextResponse.json(widgets)
    } catch (e: unknown) {
        const err = e as Error;
        console.error('[API home-widgets GET] Error:', err)
        return NextResponse.json({ error: 'Failed', detail: err.message }, { status: 500 })
    }
}

export async function PATCH(_req: NextRequest) {
    const user = await getSessionUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { userId } = user

    try {
        const body = await req.json()
        const { widgets } = body // Array of {id, x, y, size}

        for (const w of widgets) {
            await db.update(homeWidget)
                .set({ x: w.x, y: w.y, size: w.size, updatedAt: new Date() })
                .where(and(eq(homeWidget.id, w.id), eq(homeWidget.userId, userId)))
        }

        return NextResponse.json({ success: true })
    } catch (e: unknown) {
        const err = e as Error;
        console.error('[API home-widgets PATCH] Error:', err)
        return NextResponse.json({ error: 'Failed to update', detail: err.message }, { status: 500 })
    }
}

export async function POST(_req: NextRequest) {
    const user = await getSessionUser()
    if (!user) {
        console.warn('[API widgets POST] Unauthorized - no session user')
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { id: userId } = user

    try {
        const body = await req.json()
        const { type, size, x, y } = body
        console.log('[API widgets POST] Creating widget:', { userId, type, size, x, y })
        const [res] = await db.insert(homeWidget).values({ userId, type, size, x, y }).returning()
        console.log('[API widgets POST] Success:', res)
        return NextResponse.json(res)
    } catch (e: unknown) {
        const err = e as Error;
        console.error('[API widgets POST] Error:', err)
        return NextResponse.json({ error: 'Failed', detail: err.message }, { status: 500 })
    }
}

export async function DELETE(_req: NextRequest) {
    const user = await getSessionUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { userId } = user

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 })

    try {
        await db.delete(homeWidget).where(and(eq(homeWidget.id, id), eq(homeWidget.userId, userId)))
        return NextResponse.json({ success: true })
    } catch (e: unknown) {
        const err = e as Error;
        console.error('[API home-widgets DELETE] Error:', err)
        return NextResponse.json({ error: 'Failed to delete', detail: err.message }, { status: 500 })
    }
}
