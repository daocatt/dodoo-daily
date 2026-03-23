import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { media as mediaTable } from '@/lib/schema';
import { desc, eq, and, like } from 'drizzle-orm';

export async function GET(_req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const type = searchParams.get('type');
        const search = searchParams.get('search');

        const conditions = [];
        if (type && type !== 'ALL') {
            conditions.push(eq(mediaTable.fileType, type));
        }
        if (search) {
            conditions.push(like(mediaTable.name, `%${search}%`));
        }

        const query = db.select()
            .from(mediaTable)
            .where(conditions.length > 0 ? and(...conditions) : undefined)
            .orderBy(desc(mediaTable.createdAt));

        const results = await query.all();
        return NextResponse.json(results);
    } catch (error) {
        console.error('List media failed:', error);
        return NextResponse.json({ error: 'Failed to list media' }, { status: 500 });
    }
}
