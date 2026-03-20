import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { storageItems, storageTransfers } from "@/lib/schema";
import { eq, like, and, or, desc, sql, getTableColumns, isNotNull } from "drizzle-orm";
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
        // Items are visible if they are NOT deleted, OR if they were deleted due to a transfer (to see them in history)
        const visibilityCondition = or(
            eq(storageItems.isDeleted, false),
            isNotNull(storageTransfers.id)
        );
        const conditions = [visibilityCondition];

        if (search) {
            conditions.push(like(storageItems.name, `%${search}%`));
        }

        if (tag) {
            conditions.push(sql`EXISTS (SELECT 1 FROM json_each(${storageItems.tags}) WHERE value = ${tag})`);
        }

        const items = await db.select({
            ...getTableColumns(storageItems),
            isTransferred: sql<boolean>`CASE WHEN ${storageTransfers.id} IS NOT NULL THEN 1 ELSE 0 END`.as('isTransferred'),
            actualSalePrice: storageTransfers.salePrice
        })
            .from(storageItems)
            .leftJoin(storageTransfers, eq(storageItems.id, storageTransfers.itemId))
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
    if (!user || user.role?.toLowerCase() !== "parent") {
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
