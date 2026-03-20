import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { storageItems } from "@/lib/schema";
import { eq, like, and, desc, sql } from "drizzle-orm";
import { getSessionUser } from "@/lib/auth";
import { nanoid } from "nanoid";

// GET: List, Search, and Tag filter
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const tag = searchParams.get("tag");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;

    try {
        const conditions = [eq(storageItems.isDeleted, false)];

        if (search) {
            conditions.push(like(storageItems.name, `%${search}%`));
        }

        // Tags are stored as JSON strings. For SQLite, we can use JSON functions to filter.
        // Or simply use like if we're careful. Let's use clean JSON member check.
        if (tag) {
            conditions.push(sql`EXISTS (SELECT 1 FROM json_each(${storageItems.tags}) WHERE value = ${tag})`);
        }

        const items = await db.select()
            .from(storageItems)
            .where(and(...conditions))
            .limit(limit)
            .offset(offset)
            .orderBy(desc(storageItems.updatedAt));

        return NextResponse.json(items);
    } catch (error) {
        console.error("Failed to fetch storage items:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// POST: Create new item (Parent Only)
export async function POST(req: Request) {
    const user = await getSessionUser();
    if (!user || user.role !== "parent") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { name, imageUrl, notes, tags, purchasePrice, resalePrice, purchaseDate, isForSale, isSynced } = body;

        if (!name || !imageUrl) {
            return NextResponse.json({ error: "Name and Image are required" }, { status: 400 });
        }

        const newItem = {
            id: nanoid(),
            creatorId: user.id,
            name,
            imageUrl,
            notes: notes || "",
            tags: JSON.stringify(tags || []),
            purchasePrice: parseFloat(purchasePrice) || 0,
            resalePrice: parseFloat(resalePrice) || 0,
            purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
            isForSale: !!isForSale,
            isSynced: !!isSynced,
            isDeleted: false,
            version: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        await db.insert(storageItems).values(newItem);
        return NextResponse.json(newItem);
    } catch (error) {
        console.error("Failed to create storage item:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
