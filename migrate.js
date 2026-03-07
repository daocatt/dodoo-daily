const { drizzle } = require('drizzle-orm/better-sqlite3');
const { migrate } = require('drizzle-orm/better-sqlite3/migrator');
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// ---------------------------------------------------------------------------
// Seed: ensure a parent account and system settings exist after migration
// ---------------------------------------------------------------------------
async function seedIfNeeded(sqlite) {
    const { randomUUID } = require('crypto');

    // Check if parent exists
    const rows = sqlite.prepare("SELECT id FROM Users WHERE role = 'PARENT' LIMIT 1").all();
    if (rows.length === 0) {
        const id = randomUUID();
        sqlite.prepare(
            "INSERT INTO Users (id, name, role, pin, avatarUrl, isArchived, isDeleted) VALUES (?, ?, 'PARENT', '1234', '/parent_avatar.png', 0, 0)"
        ).run(id, 'Parent');
        console.log('✅ Created default Parent account (PIN: 1234)');
    }

    // Check if system settings exist
    const settingsRows = sqlite.prepare("SELECT id FROM SystemSettings WHERE id = 'app_settings' LIMIT 1").all();
    if (settingsRows.length === 0) {
        sqlite.prepare(
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

        const dockerPath = path.join(__dirname, 'drizzle');
        const localPath = path.join(__dirname, 'src', 'lib', 'drizzle');
        const migrationsFolder = fs.existsSync(localPath) ? localPath : dockerPath;

        await migrate(db, {
            migrationsFolder
        });

        console.log('✅ Migrations completed.');

        // Seed initial data if needed
        console.log('🌱 Checking seed data...');
        await seedIfNeeded(sqlite);
        console.log('✨ Ready!');

        sqlite.close();
    } catch (error) {
        console.error('❌ Migration/seed failed:', error);
        process.exit(1);
    }
}

run();
