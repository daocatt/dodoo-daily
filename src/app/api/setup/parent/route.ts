import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users, systemSettings } from '@/lib/schema'
import { eq, or, and, not } from 'drizzle-orm'
import { cookies } from 'next/headers'
import { uploadMedia } from '@/lib/storage'

export async function POST(req: NextRequest) {
    try {
        const [settings] = await db.select().from(systemSettings).where(eq(systemSettings.id, 'app_settings')).all()
        if (!settings?.needsSetup) {
            return NextResponse.json({ error: 'Setup already completed' }, { status: 403 })
        }

        const formData = await req.formData()
        const name = formData.get('name') as string
        const file = formData.get('file') as File | null

        if (!name?.trim()) {
            return NextResponse.json({ error: 'Name is required' }, { status: 400 })
        }

        const trimmedName = name.trim();

        // Unique Check
        const existing = await db.select().from(users).where(eq(users.name, trimmedName)).all();
        if (existing.length > 0 && existing[0].role !== 'PARENT') {
            return NextResponse.json({ error: 'Name already exists' }, { status: 400 });
        }

        // Find the default parent user
        const [parentUser] = await db.select().from(users).where(eq(users.role, 'PARENT')).all()
        if (!parentUser) {
            return NextResponse.json({ error: 'Parent account not found' }, { status: 404 })
        }

        let avatarUrl = parentUser.avatarUrl
        if (file) {
            const mediaItem = await uploadMedia(file, 'IMAGE', parentUser.id);
            avatarUrl = mediaItem.path;
        }

        // Auto-generate slug if parent doesn't have one
        const { generateNumericSlug } = await import('@/lib/utils')
        let parentSlug = parentUser.slug
        if (!parentSlug) {
            const baseSlug = trimmedName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || generateNumericSlug(8)
            // ensure uniqueness
            let candidate = baseSlug
            let attempt = 0
            while (true) {
                const slugCheck = await db.select().from(users).where(eq(users.slug, candidate)).all()
                if (slugCheck.length === 0 || slugCheck[0].id === parentUser.id) { parentSlug = candidate; break }
                attempt++; candidate = `${baseSlug}-${attempt}`
                if (attempt > 10) { parentSlug = generateNumericSlug(8); break }
            }
        }

        // Update the parent's name, nickname, avatar, and slug
        await db.update(users)
            .set({ name: trimmedName, nickname: trimmedName, avatarUrl, slug: parentSlug })
            .where(eq(users.id, parentUser.id))

        // Log the parent in automatically by setting session cookies
        const cookieStore = await cookies()
        cookieStore.set('dodoo_user_id', parentUser.id, { maxAge: 60 * 60 * 24 * 365, path: '/' })
        cookieStore.set('dodoo_role', parentUser.role, { maxAge: 60 * 60 * 24 * 365, path: '/' })

        return NextResponse.json({ success: true, needsSetup: true })

    } catch (e) {
        console.error('Parent setup error', e)
        return NextResponse.json({ error: 'Setup failed' }, { status: 500 })
    }
}
