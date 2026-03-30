import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { storageCategory, storageItems } from "@/lib/schema";
import { eq, desc, like } from "drizzle-orm";
import { getSessionUser } from "@/lib/auth";
import { nanoid } from "nanoid";

// GET: All storage categories
export async function GET() {
    try {
        const categories = await db.select()
            .from(storageCategory)
            .orderBy(desc(storageCategory.createdAt));
        
        return NextResponse.json(categories);
    } catch (error) {
        console.error("Failed to fetch storage categories:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// POST: Add new category (Parent Only)
export async function POST(req: Request) {
    const user = await getSessionUser();
    if (!user || user.role?.toLowerCase() !== "parent") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { name, emoji } = await req.json();
        if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

        const newCategory = {
            id: nanoid(),
            name,
            emoji: emoji || "📦",
            creatorId: user.id,
            createdAt: new Date(),
        };

        await db.insert(storageCategory).values(newCategory);
        return NextResponse.json(newCategory);
    } catch (error) {
        console.error("Failed to add storage category:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// DELETE: Remove category (Parent Only)
export async function DELETE(req: Request) {
    const user = await getSessionUser();
    if (!user || user.role?.toLowerCase() !== "parent") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");
        if (!id) return NextResponse.json({ error: "ID is required" }, { status: 400 });

        const category = await db.query.storageCategory.findFirst({
            where: eq(storageCategory.id, id)
        });

        if (!category) return NextResponse.json({ error: "Category not found" }, { status: 404 });

        // Check if any items are using this category name in their tags JSON
        // Since tags is stringified JSON like ["Clothes", "Books"], we search for the name inside it
        const usedByItems = await db.select()
            .from(storageItems)
            .where(like(storageItems.tags, `%${category.name}%`))
            .limit(1);

        if (usedByItems.length > 0) {
            return NextResponse.json({ 
                error: "存在关联物品，不能删除该分类", 
                details: "Please re-categorize items before deletion." 
            }, { status: 400 });
        }

        await db.delete(storageCategory).where(eq(storageCategory.id, id));
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to delete category:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// PUT: Update category (Parent Only)
export async function PUT(req: Request) {
    const user = await getSessionUser();
    if (!user || user.role?.toLowerCase() !== "parent") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { id, name, emoji } = await req.json();
        if (!id || !name) return NextResponse.json({ error: "ID and Name are required" }, { status: 400 });

        await db.update(storageCategory)
            .set({ name, emoji: emoji || "📦" })
            .where(eq(storageCategory.id, id));

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to update storage category:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
