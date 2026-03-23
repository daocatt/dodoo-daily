import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users, accountStats, systemSettings } from '@/lib/schema'
import { eq } from 'drizzle-orm'
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

            // Auto-generate numeric slug for child (8 digits)
            const { generateNumericSlug } = await import('@/lib/utils')
            let candidateSlug = generateNumericSlug(8)
            for (let i = 1; i <= 10; i++) {
                const check = await db.select().from(users).where(eq(users.slug, candidateSlug)).all()
                if (check.length === 0) break
                candidateSlug = generateNumericSlug(8)
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

        // Only mark setup as complete if they actually created a child.
        // If they skipped, needsSetup remains true, so next time they log in, they will be prompted again.
        if (!skip) {
            await db.update(systemSettings)
                .set({ needsSetup: false, updatedAt: new Date() })
                .where(eq(systemSettings.id, 'app_settings'))
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Setup error:', error)
        return NextResponse.json({ error: 'Setup failed' }, { status: 500 })
    }
}
