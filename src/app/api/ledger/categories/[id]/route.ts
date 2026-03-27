import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { ledgerCategory, ledgerRecord } from "@/lib/schema";
import { and, eq, ne } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    const session = await getSessionUser();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (session.role !== 'PARENT') {
        return NextResponse.json({ error: "Only admins can delete categories" }, { status: 403 });
    }

    try {
        // 1. Check if category is system
        const category = await db.select().from(ledgerCategory).where(eq(ledgerCategory.id, id)).get()
        if (!category) return NextResponse.json({ error: "Not found" }, { status: 404 });
        
        if (category.isSystem) {
            return NextResponse.json({ error: "System categories cannot be deleted" }, { status: 403 });
        }

        // 2. Check if category is used in any records
        const records = await db.select().from(ledgerRecord).where(eq(ledgerRecord.categoryId, id)).limit(1)
        if (records.length > 0) {
            return NextResponse.json({ error: "Category is in use and cannot be deleted" }, { status: 403 });
        }

        // 3. Delete
        await db.delete(ledgerCategory).where(
            eq(ledgerCategory.id, id)
        )

        return NextResponse.json({ success: true });
    } catch (e) {
        console.error("Ledger category delete error:", e);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const session = await getSessionUser();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (session.role !== 'PARENT') {
        return NextResponse.json({ error: "Only admins can update categories" }, { status: 403 });
    }

    try {
        const { name, emoji } = await req.json();
        
        // Check if exists
        const category = await db.select().from(ledgerCategory).where(eq(ledgerCategory.id, id)).get();
        if (!category) return NextResponse.json({ error: "Not found" }, { status: 404 });
        
        // Check uniqueness if name is changing
        if (name && name !== category.name) {
            const conflict = await db.select().from(ledgerCategory)
                .where(and(
                    eq(ledgerCategory.name, name),
                    eq(ledgerCategory.type, category.type),
                    ne(ledgerCategory.id, id)
                )).get();
            
            if (conflict) {
                return NextResponse.json({ error: "Category name already exists in this type" }, { status: 409 });
            }
        }

        await db.update(ledgerCategory).set({
            name: name || category.name,
            emoji: emoji || category.emoji,
            updatedAt: new Date()
        }).where(eq(ledgerCategory.id, id));

        return NextResponse.json({ success: true });
    } catch (e) {
        console.error("Ledger category update error:", e);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
