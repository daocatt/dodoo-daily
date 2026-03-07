const { drizzle } = require('drizzle-orm/better-sqlite3');
const { migrate } = require('drizzle-orm/better-sqlite3/migrator');
const Database = require('better-sqlite3');
const path = require('path');

// ---------------------------------------------------------------------------
// Seed: ensure a parent account and system settings exist after migration
// ---------------------------------------------------------------------------
async function seedIfNeeded(db) {
    const { randomUUID } = require('crypto');

    // Check if parent exists
    const rows = db.db.prepare("SELECT id FROM Users WHERE role = 'PARENT' LIMIT 1").all();
    if (rows.length === 0) {
        const id = randomUUID();
        db.db.prepare(
            "INSERT INTO Users (id, name, role, pin, isArchived, isDeleted) VALUES (?, ?, 'PARENT', '1234', 0, 0)"
        ).run(id, 'Parent');
        console.log('✅ Created default Parent account (PIN: 1234)');
    }

    // Check if system settings exist
    const settingsRows = db.db.prepare("SELECT id FROM SystemSettings WHERE id = 'app_settings' LIMIT 1").all();
    if (settingsRows.length === 0) {
        db.db.prepare(
            "INSERT INTO SystemSettings (id, isClosed, needsSetup) VALUES ('app_settings', 0, 1)"
        ).run();
        console.log('✅ Created SystemSettings (needsSetup = 1)');
    }
}

async function run() {
    console.log('⏳ Running database migrations...');
    try {
        const sqlite = new Database('./database/dodoo.db');
        const db = drizzle(sqlite);

        await migrate(db, {
            migrationsFolder: path.join(__dirname, 'drizzle')
        });

        console.log('✅ Migrations completed.');

        // Seed initial data if needed
        console.log('🌱 Checking seed data...');
        await seedIfNeeded(db);
        console.log('✨ Ready!');

        sqlite.close();
    } catch (error) {
        console.error('❌ Migration/seed failed:', error);
        process.exit(1);
    }
}

run();
