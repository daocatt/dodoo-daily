import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { systemSettings } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { getSessionUser } from '@/lib/auth'

async function checkIsParent() {
    const { role } = await getSessionUser()
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
                coinsToRmbRatio: 1.0,
                timezone: 'Asia/Shanghai',
                systemName: 'DoDoo Family',
                showAllAvatars: true,
                homepageImages: JSON.stringify(['/carousel/bg1.jpg', '/carousel/bg2.jpg', '/carousel/bg3.jpg'])
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
    if (!await checkIsParent()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const body = await req.json()
        const updates: Record<string, unknown> = { updatedAt: new Date() }
        if (typeof body.isClosed === 'boolean') updates.isClosed = body.isClosed
        if (typeof body.needsSetup === 'boolean') updates.needsSetup = body.needsSetup
        if (body.starsToCoinsRatio !== undefined) updates.starsToCoinsRatio = parseInt(body.starsToCoinsRatio)
        if (body.coinsToRmbRatio !== undefined) updates.coinsToRmbRatio = parseFloat(body.coinsToRmbRatio)
        if (body.timezone !== undefined) updates.timezone = body.timezone
        if (body.systemName !== undefined) updates.systemName = body.systemName
        if (typeof body.showAllAvatars === 'boolean') updates.showAllAvatars = body.showAllAvatars
        if (body.homepageImages !== undefined) updates.homepageImages = body.homepageImages

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
