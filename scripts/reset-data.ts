import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from '../src/lib/schema';
import path from 'path';
import { eq, ne, sql } from 'drizzle-orm';
import readline from 'readline';

const dbPath = path.join(process.cwd(), 'database', 'dodoo.db');
const sqlite = new Database(dbPath);
const db = drizzle(sqlite, { schema });

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function askQuestion(query: string): Promise<string> {
    return new Promise(resolve => rl.question(query, resolve));
}

async function main() {
    console.log('\n--- ⚠️ Database Reset Analysis ---');
    
    const tablesToAnalyze = [
        { name: 'Family Notes', table: schema.familyNote },
        { name: 'Tasks', table: schema.task },
        { name: 'Ledger Records', table: schema.ledgerRecord },
        { name: 'Storage Items', table: schema.storageItems },
        { name: 'Journals', table: schema.journal },
        { name: 'Milestone Media', table: schema.journalMedia },
        { name: 'Account Stats Logs', table: schema.accountStatsLog },
        { name: 'Visitors', table: schema.visitor },
        { name: 'Artwork Gallery', table: schema.artwork },
        { name: 'Visitor Messages', table: schema.visitorMessage },
        { name: 'Auth Logs', table: schema.memberLoginLog }
    ];

    const stats: { name: string, count: number }[] = [];
    
    for (const item of tablesToAnalyze) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const countRes = await db.select({ count: sql<number>`count(*)` }).from(item.table as any).get();
        stats.push({ name: item.name, count: countRes?.count || 0 });
    }

    // Special count for users (non-superadmin)
    const userCountRes = await db.select({ count: sql<number>`count(*)` }).from(schema.users).where(ne(schema.users.permissionRole, 'SUPERADMIN')).get();
    stats.push({ name: 'Users (Non-Superadmin)', count: userCountRes?.count || 0 });

    console.table(stats);
    
    console.warn('\nIMPORTANT: This will PERMANENTLY delete the data above.');
    console.warn('Superadmin user and system settings will be preserved.\n');

    const answer = await askQuestion('Are you sure you want to proceed? (y/N): ');
    
    if (answer.toLowerCase() === 'y') {
        process.stdout.write('Executing Reset Operation...\n');
        
        // Disable foreign keys for reset
        sqlite.exec('PRAGMA foreign_keys = OFF');
        
        const tablesToClear = [
            'familyNote', 'task', 'ledgerRecord', 'storageItems', 'growthRecord',
            'journal', 'journalMedia', 'accountStatsLog', 'currencyLog',
            'goldStarLog', 'purpleStarLog', 'visitor', 'order', 'artwork', 
            'album', 'wish', 'purchase', 'visitorMessage', 'rechargeCode', 
            'memberLoginLog', 'visitorCurrencyLog', 'ipBlacklist', 'storageTransfers'
        ];
        
        for (const tableName of tablesToClear) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await db.delete((schema as any)[tableName]);
        }

        await db.delete(schema.ledgerCategory).where(ne(schema.ledgerCategory.isSystem, true));
        await db.delete(schema.users).where(ne(schema.users.permissionRole, 'SUPERADMIN'));

        // Reset Superadmin stats
        const superadmins = await db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.permissionRole, 'SUPERADMIN'));
        for (const sah of superadmins) {
            await db.update(schema.accountStats).set({
                goldStars: 0,
                purpleStars: 0,
                angerPenalties: 0,
                currency: 0,
                fiatBalance: 0,
                updatedAt: new Date()
            }).where(eq(schema.accountStats.userId, sah.id));
        }

        console.log('--- 🚀 Reset Successful! System is now clean. ---');
    } else {
        console.log('Operation Cancelled.');
    }

    rl.close();
}

main().catch(err => {
    console.error(err);
    rl.close();
    process.exit(1);
});
