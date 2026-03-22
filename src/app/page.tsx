import { db } from '@/lib/db'
import { systemSettings } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import WelcomeClient from '@/components/public/WelcomeClient'

export default async function WelcomePage() {
    let settings = null
    try {
        settings = await db.select().from(systemSettings).where(eq(systemSettings.id, 'app_settings')).get()
    } catch (error) {
        console.error('Failed to fetch system settings on server:', error)
    }

    return <WelcomeClient initialSettings={settings} />
}
