import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { systemSettings } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { getSessionUser } from '@/lib/auth'

async function checkIsAdmin() {
    const user = await getSessionUser()
    return user?.permissionRole === 'SUPERADMIN' || user?.permissionRole === 'ADMIN'
}

export async function GET() {
    try {
        const isAdmin = await checkIsAdmin()
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
                homepageImages: JSON.stringify(['/carousel/bg1.jpg', '/carousel/bg2.jpg', '/carousel/bg3.jpg']),
                currencySymbol: '¥'
            }).returning()
            settings = newSettings
        }

        // If not an admin, return only a safe public subset
        if (!isAdmin && settings) {
             const publicSettings = {
                id: settings.id,
                systemName: settings.systemName,
                systemSubtitle: settings.systemSubtitle,
                timezone: settings.timezone,
                isClosed: settings.isClosed,
                needsSetup: settings.needsSetup,
                showAllAvatars: settings.showAllAvatars,
                homepageImages: settings.homepageImages,
                disableVisitorLogin: settings.disableVisitorLogin,
                disableVisitorRegistration: settings.disableVisitorRegistration,
                defaultLocale: settings.defaultLocale,
                currencySymbol: settings.currencySymbol,
                // Do NOT include visitorInvitationCode or financial ratios for non-parents
            }
            return NextResponse.json(publicSettings)
        }

        return NextResponse.json(settings)
    } catch (error: unknown) {
        const err = error as Error;
        console.error('Failed to fetch system settings:', err)
        return NextResponse.json({
            isClosed: false,
            needsSetup: false,
            error: err?.message || 'Unknown error',
            stack: err?.stack 
        }, { status: 500 })
    }
}

export async function PATCH(req: NextRequest) {
    if (!await checkIsAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const body = await req.json()
        const updates: Record<string, unknown> = { updatedAt: new Date() }
        if (typeof body.isClosed === 'boolean') updates.isClosed = body.isClosed
        if (typeof body.needsSetup === 'boolean') updates.needsSetup = body.needsSetup
        if (body.starsToCoinsRatio !== undefined) updates.starsToCoinsRatio = parseInt(body.starsToCoinsRatio)
        if (body.coinsToRmbRatio !== undefined) updates.coinsToRmbRatio = parseFloat(body.coinsToRmbRatio)
        if (body.timezone !== undefined) updates.timezone = body.timezone
        if (body.systemName !== undefined) updates.systemName = body.systemName
        if (body.systemSubtitle !== undefined) updates.systemSubtitle = body.systemSubtitle
        if (typeof body.showAllAvatars === 'boolean') updates.showAllAvatars = body.showAllAvatars
        if (typeof body.requireVisitorApproval === 'boolean') updates.requireVisitorApproval = body.requireVisitorApproval
        if (typeof body.requireInvitationCode === 'boolean') updates.requireInvitationCode = body.requireInvitationCode
        if (body.visitorInvitationCode !== undefined) updates.visitorInvitationCode = body.visitorInvitationCode
        if (typeof body.disableVisitorLogin === 'boolean') updates.disableVisitorLogin = body.disableVisitorLogin
        if (typeof body.disableVisitorRegistration === 'boolean') updates.disableVisitorRegistration = body.disableVisitorRegistration
        if (body.homepageImages !== undefined) updates.homepageImages = body.homepageImages
        if (body.defaultLocale !== undefined) updates.defaultLocale = body.defaultLocale
        if (body.currencySymbol !== undefined) updates.currencySymbol = body.currencySymbol

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
