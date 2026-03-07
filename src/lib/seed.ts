import { db } from './db';
import { users, systemSettings } from './schema';
import { eq } from 'drizzle-orm';

export async function seed() {
    console.log('🌱 Seeding database...');

    // 1. Ensure only one Parent account exists (no child pre-created)
    const existingParent = await db.select().from(users).where(eq(users.role, 'PARENT'));

    if (existingParent.length === 0) {
        await db.insert(users).values({
            name: 'Parent',
            role: 'PARENT',
            pin: '1234', // Default PIN — user should change this
        });
        console.log('✅ Created default Parent account (PIN: 1234)');
    } else {
        console.log('ℹ️  Parent account already exists, skipping.');
    }

    // 2. Ensure SystemSettings row exists
    const existingSettings = await db.select().from(systemSettings).where(eq(systemSettings.id, 'app_settings'));
    if (existingSettings.length === 0) {
        await db.insert(systemSettings).values({
            id: 'app_settings',
            isClosed: false,
            needsSetup: true, // Triggers first-run wizard
        });
        console.log('✅ Created SystemSettings (needsSetup = true)');
    }

    console.log('✨ Seeding complete!');
}
