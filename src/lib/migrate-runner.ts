import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { db } from './db';
import path from 'path';

// This is designed to be run as a script or imported
export async function runMigrations() {
    console.log('⏳ Running migrations...');
    try {
        // Correct path to the migrations folder which is created by drizzle-kit
        await migrate(db, {
            migrationsFolder: path.join(process.cwd(), 'src', 'lib', 'drizzle')
        });
        console.log('✅ Migrations completed successfully.');
    } catch (_error) {
        console.error('❌ Migration failed:', _error);
        process.exit(1);
    }
}

// If this file is run directly
if (require.main === module) {
    runMigrations();
}
