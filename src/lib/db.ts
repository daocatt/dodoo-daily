import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';
import path from 'path';

let sqlite: ReturnType<typeof Database>;

if (process.env.NODE_ENV === 'production') {
    sqlite = new Database(path.join(process.cwd(), 'database', 'dodoo.db'));
} else {
    const globalWithSqlite = global as typeof globalThis & {
        sqlite: ReturnType<typeof Database>;
    };
    if (!globalWithSqlite.sqlite) {
        globalWithSqlite.sqlite = new Database(path.join(process.cwd(), 'database', 'dodoo.db'));
    }
    sqlite = globalWithSqlite.sqlite;
}

export const db = drizzle(sqlite, { schema });
