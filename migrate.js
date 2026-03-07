const { drizzle } = require('drizzle-orm/better-sqlite3');
const { migrate } = require('drizzle-orm/better-sqlite3/migrator');
const Database = require('better-sqlite3');
const path = require('path');

async function run() {
    console.log('⏳ Running database migrations...');
    try {
        const sqlite = new Database('./database/dodoo.db');
        const db = drizzle(sqlite);

        // Match the 'out' dir in drizzle.config.ts
        // In standalone mode, migrations should be copied over.
        await migrate(db, {
            migrationsFolder: path.join(__dirname, 'drizzle')
        });

        sqlite.close();
        console.log('✅ Migrations completed successfully.');
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

run();
