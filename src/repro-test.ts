import { db } from './lib/db';
import { users, accountStats, systemSettings, shopItem } from './lib/schema';
import { eq } from 'drizzle-orm';

async function test() {
    try {
        console.log('Testing User select...');
        const user = await db.select().from(users).limit(1).get();
        console.log('User used for test:', user ? user.id : 'NONE FOUND');

        console.log('Testing SystemSettings select...');
        const settings = await db.select({ timezone: systemSettings.timezone })
            .from(systemSettings)
            .where(eq(systemSettings.id, 'app_settings'))
            .get();
        console.log('Settings found:', settings?.timezone);

        console.log('Testing shopItem select...');
        const item = await db.select().from(shopItem).limit(1).get();
        console.log('shopItem found:', item ? 'YES' : 'NO');

        if (user) {
            console.log('Testing AccountStats select for user:', user.id);
            const stats = await db.select().from(accountStats).where(eq(accountStats.userId, user.id)).get();
            console.log('Stats found:', stats ? 'YES' : 'NO');
        }

        process.exit(0);
    } catch (e: any) {
        console.error('FAILED with error:', e.message, e.stack);
        process.exit(1);
    }
}

test();
