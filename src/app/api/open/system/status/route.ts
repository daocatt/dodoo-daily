import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { systemSettings } from '@/lib/schema'
import { eq } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const settings = await db.select().from(systemSettings).where(eq(systemSettings.id, 'app_settings')).get()
        return NextResponse.json({ 
            needsSetup: settings?.needsSetup ?? true,
            isClosed: settings?.isClosed ?? false,
            systemName: settings?.systemName || 'DoDoo Daily'
        })
    } catch (error) {
        console.error('System status check failed:', error)
        return NextResponse.json({ needsSetup: true }, { status: 500 })
    }
}
