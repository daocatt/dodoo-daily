import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';
import path from 'path';
import fs from 'fs';

let sqlite: ReturnType<typeof Database>;

const dbPath = path.join(process.cwd(), 'database', 'dodoo.db');
console.log('[DB] Attempting to open database at:', dbPath);

if (!fs.existsSync(dbPath)) {
    console.error('[DB] CRITICAL ERROR: Database file not found at:', dbPath);
    // Try to find it in the level above if in .next?
    const altPath = path.join(process.cwd(), '..', 'database', 'dodoo.db');
    if (fs.existsSync(altPath)) {
        console.warn('[DB] Found database at alternative path:', altPath);
    }
}

if (process.env.NODE_ENV === 'production') {
    sqlite = new Database(dbPath);
} else {
    const globalWithSqlite = global as typeof globalThis & {
        sqlite: ReturnType<typeof Database>;
    };
    if (!globalWithSqlite.sqlite) {
        globalWithSqlite.sqlite = new Database(dbPath);
    }
    sqlite = globalWithSqlite.sqlite;
}

console.log('[DB] SQLite connection initialized:', sqlite.name);
export const db = drizzle(sqlite, { schema });
