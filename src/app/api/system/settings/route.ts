import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { systemSettings } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { cookies } from 'next/headers'

async function isParent() {
    const cookieStore = await cookies()
    const role = cookieStore.get('dodoo_role')?.value
    return role === 'PARENT'
}

export async function GET() {
    try {
        let settings = await db.select().from(systemSettings).where(eq(systemSettings.id, 'app_settings')).get()

        if (!settings) {
            // Initialize if not exists
            const [newSettings] = await db.insert(systemSettings).values({
                id: 'app_settings',
                isClosed: false,
                needsSetup: true,
                starsToCoinsRatio: 10,
                coinsToRmbRatio: 1.0
            }).returning()
            settings = newSettings
        }

        return NextResponse.json(settings)
    } catch (error) {
        console.error('Failed to fetch system settings:', error)
        return NextResponse.json({
            isClosed: false,
            needsSetup: false,
            starsToCoinsRatio: 10,
            coinsToRmbRatio: 1.0
        })
    }
}

export async function PATCH(req: NextRequest) {
    if (!await isParent()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const body = await req.json()
        const updates: Record<string, unknown> = { updatedAt: new Date() }
        if (typeof body.isClosed === 'boolean') updates.isClosed = body.isClosed
        if (typeof body.needsSetup === 'boolean') updates.needsSetup = body.needsSetup
        if (body.starsToCoinsRatio !== undefined) updates.starsToCoinsRatio = parseInt(body.starsToCoinsRatio)
        if (body.coinsToRmbRatio !== undefined) updates.coinsToRmbRatio = parseFloat(body.coinsToRmbRatio)

        const existing = await db.select().from(systemSettings).where(eq(systemSettings.id, 'app_settings')).all()

        if (existing.length > 0) {
            await db.update(systemSettings)
                .set(updates)
                .where(eq(systemSettings.id, 'app_settings'))
        } else {
            await db.insert(systemSettings).values({
                id: 'app_settings',
                isClosed: body.isClosed ?? false,
                needsSetup: body.needsSetup ?? false,
            })
        }

        return NextResponse.json({ success: true, ...updates })
    } catch (error) {
        console.error('Failed to update system settings:', error)
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}
