import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { ledgerCategory } from "@/lib/schema";
import { or, eq, isNull } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        // Fetch categories that are either system default or created by the user
        let categories = await db.select()
            .from(ledgerCategory)
            .where(or(
                eq(ledgerCategory.isSystem, true),
                eq(ledgerCategory.creatorId, user.id)
            ));

        // Auto-seed default categories if empty
        if (categories.length === 0) {
            const defaults = [
                { name: '餐饮美食', emoji: '🍔', type: 'EXPENSE', isSystem: true },
                { name: '交通出行', emoji: '🚌', type: 'EXPENSE', isSystem: true },
                { name: '休闲娱乐', emoji: '🎮', type: 'EXPENSE', isSystem: true },
                { name: '学习教育', emoji: '📚', type: 'EXPENSE', isSystem: true },
                { name: '日常购物', emoji: '🛒', type: 'EXPENSE', isSystem: true },
                { name: '零花钱', emoji: '💰', type: 'INCOME', isSystem: true },
                { name: '长辈给的', emoji: '🧧', type: 'INCOME', isSystem: true },
                { name: '金币兑换', emoji: '🔄', type: 'INCOME', isSystem: true },
            ];

            await db.insert(ledgerCategory).values(defaults);
            
            categories = await db.select()
                .from(ledgerCategory)
                .where(or(
                    eq(ledgerCategory.isSystem, true),
                    eq(ledgerCategory.creatorId, user.id)
                ));
        }

        return NextResponse.json(categories);
    } catch (e: unknown) {
        return NextResponse.json({ error: (e as Error).message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const body = await request.json();
        const { name, emoji, type } = body;

        if (!name || !emoji || !type) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const newCat = await db.insert(ledgerCategory).values({
            name,
            emoji,
            type,
            creatorId: user.id,
            isSystem: false
        }).returning();

        return NextResponse.json(newCat[0]);
    } catch (e: unknown) {
        return NextResponse.json({ error: (e as Error).message }, { status: 500 });
    }
}
