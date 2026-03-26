import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { ledgerRecord, ledgerCategory, accountStats, users } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { addFiatBalance } from "@/lib/economy";

export async function GET(request: Request) {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const userIdQuery = searchParams.get('userId'); 
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = (page - 1) * limit;

    // Determine target user. Parent can see child's ledger.
    const targetUserId = (user.role === 'PARENT' && userIdQuery) ? userIdQuery : user.id;

    try {
        const records = await db.select({
            id: ledgerRecord.id,
            amount: ledgerRecord.amount,
            type: ledgerRecord.type,
            date: ledgerRecord.date,
            description: ledgerRecord.description,
            category: {
                id: ledgerCategory.id,
                name: ledgerCategory.name,
                emoji: ledgerCategory.emoji,
            },
            relatedUser: {
                id: users.id,
                name: users.name,
                avatarUrl: users.avatarUrl,
            }
        })
            .from(ledgerRecord)
            .where(eq(ledgerRecord.userId, targetUserId))
            .innerJoin(ledgerCategory, eq(ledgerRecord.categoryId, ledgerCategory.id))
            .leftJoin(users, eq(ledgerRecord.relatedUserId, users.id))
            .orderBy(desc(ledgerRecord.createdAt))
            .limit(limit)
            .offset(offset);

        // Let's also fetch current balance
        const stats = await db.select().from(accountStats).where(eq(accountStats.userId, targetUserId)).get()
        const balance = stats?.fiatBalance || 0;

        return NextResponse.json({ records, balance });
    } catch (e) {
        console.error("Ledger fetch error:", e);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const body = await request.json();
        const { amount, categoryId, type, description, relatedUserId } = body;

        if (!amount || !categoryId || !type || !description) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Apply ledger changes utilizing the economy helper
        // Assuming date is handled (default to now if absent, or we can update it after)
        const res = await addFiatBalance(
            user.id,
            Number(amount),
            categoryId,
            type as 'INCOME' | 'EXPENSE',
            description,
            relatedUserId
        );

        if (!res.success) {
            return NextResponse.json({ error: res.error }, { status: 400 });
        }

        return NextResponse.json({ success: true, newBalance: res.balance });
    } catch (e) {
        console.error("Ledger create error:", e);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
