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
    const adminRows = sqlite.prepare("SELECT id FROM Users WHERE permissionRole = 'SUPERADMIN' LIMIT 1").all();
    if (adminRows.length === 0) {
        // Check if 'Parent' already exists but isn't superadmin
        const parentRows = sqlite.prepare("SELECT id FROM Users WHERE name = 'Parent' LIMIT 1").all();
        if (parentRows.length > 0) {
            sqlite.prepare("UPDATE Users SET permissionRole = 'SUPERADMIN', isLocked = 1 WHERE id = ?").run(parentRows[0].id);
            console.log('✅ Promoted existing Parent account to Superadmin');
        } else {
            const id = randomUUID();
            sqlite.prepare(
                "INSERT INTO Users (id, name, role, pin, avatarUrl, isArchived, isDeleted, isLocked, permissionRole) VALUES (?, ?, 'PARENT', '1234', '/parent_avatar.png', 0, 0, 1, 'SUPERADMIN')"
            ).run(id, 'Parent');
            console.log('✅ Created initial Superadmin account (PIN: 1234)');
        }
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

        // Disable FKs during migration because SQLite table recreation often triggers them
        sqlite.prepare('PRAGMA foreign_keys = OFF').run();

        await migrate(db, {
            migrationsFolder
        });

        sqlite.prepare('PRAGMA foreign_keys = ON').run();

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
