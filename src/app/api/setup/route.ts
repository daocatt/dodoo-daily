import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users, accountStats, systemSettings } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { cookies } from 'next/headers'
import { getSessionUser } from '@/lib/auth'

// GET: Check if setup is needed
export async function GET() {
    try {
        const [settings] = await db.select().from(systemSettings).where(eq(systemSettings.id, 'app_settings'))
        return NextResponse.json({ needsSetup: settings?.needsSetup ?? true })
    } catch {
        return NextResponse.json({ needsSetup: true })
    }
}

// POST: Complete setup — create the child account and mark setup done
export async function POST(req: NextRequest) {
    const session = await getSessionUser()
    if (session?.role !== 'PARENT') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const body = await req.json()
        const { skip, name, nickname, gender, birthDate, avatarUrl } = body
        if (!skip) {
            // Validate required fields
            if (!name?.trim()) {
                return NextResponse.json({ error: 'Name is required' }, { status: 400 })
            }

            // Auto-generate slug for child
            const { generateNumericSlug } = await import('@/lib/utils')
            const baseSlug = name.trim().toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || generateNumericSlug(8)
            let candidateSlug = baseSlug
            for (let i = 1; i <= 10; i++) {
                const check = await db.select().from(users).where(eq(users.slug, candidateSlug)).all()
                if (check.length === 0) break
                candidateSlug = `${baseSlug}-${i}`
            }

            // Create the child account
            const [child] = await db.insert(users).values({
                name: name.trim(),
                nickname: nickname?.trim() || null,
                role: 'CHILD',
                gender: gender || 'OTHER',
                birthDate: birthDate ? new Date(birthDate) : null,
                avatarUrl: avatarUrl || null,
                slug: candidateSlug,
            }).returning()

            // Initialize stats
            await db.insert(accountStats).values({
                userId: child.id,
                currency: 0,
                goldStars: 0,
                purpleStars: 0,
                angerPenalties: 0,
            })
        }

        // Mark setup as complete regardless of skip
        await db.update(systemSettings)
            .set({ needsSetup: false, updatedAt: new Date() })
            .where(eq(systemSettings.id, 'app_settings'))

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Setup error:', error)
        return NextResponse.json({ error: 'Setup failed' }, { status: 500 })
    }
}
