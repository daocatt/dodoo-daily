import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { storageItems, storageTransfers } from "@/lib/schema";
import { eq, sql } from "drizzle-orm";
import { getSessionUser } from "@/lib/auth";
import { nanoid } from "nanoid";

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const user = await getSessionUser();
  if (!user || user.role?.toLowerCase() !== "parent") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = params;
    const body = await req.json();
    const { 
        name, imageUrl, notes, tags, 
        purchasePrice, resalePrice, purchaseDate, 
        isForSale, isSynced 
    } = body;

    const data: Record<string, string | number | boolean | Date | null | ReturnType<typeof sql>> = { updatedAt: new Date() };
    if (name !== undefined) data.name = name;
    if (imageUrl !== undefined) data.imageUrl = imageUrl;
    if (notes !== undefined) data.notes = notes;
    if (tags !== undefined) data.tags = JSON.stringify(tags);
    if (purchasePrice !== undefined) data.purchasePrice = parseFloat(purchasePrice) || 0;
    if (resalePrice !== undefined) data.resalePrice = parseFloat(resalePrice) || 0;
    if (purchaseDate !== undefined) data.purchaseDate = purchaseDate ? new Date(purchaseDate) : null;
    if (isForSale !== undefined) data.isForSale = !!isForSale;
    if (isSynced !== undefined) data.isSynced = !!isSynced;
    
    data.version = sql`version + 1`;

    await db.update(storageItems)
      .set(data)
      .where(eq(storageItems.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update storage item:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST to /api/storage/[id]/transfer to record a sale
export async function POST(
    req: Request,
    { params }: { params: { id: string } }
) {
    const user = await getSessionUser();
    if (!user || user.role?.toLowerCase() !== "parent") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { id } = params;
        const body = await req.json();
        const { transferDate, salePrice, deliveryMethod, buyerId, notes } = body;

        const transferId = nanoid();
        await db.insert(storageTransfers).values({
            id: transferId,
            itemId: id,
            transferDate: new Date(transferDate),
            salePrice: parseFloat(salePrice),
            deliveryMethod: deliveryMethod || "express",
            buyerId: buyerId || "",
            notes: notes || "",
            createdAt: new Date(),
        });

        // Mark item as no longer for sale
        await db.update(storageItems)
            .set({ 
                isForSale: false, 
                // We keep it visible so it can show as "Transferred" in list
                updatedAt: new Date(),
                version: sql`version + 1`
            })
            .where(eq(storageItems.id, id));

        return NextResponse.json({ success: true, transferId });
    } catch (error) {
        console.error("Failed to record transfer:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const user = await getSessionUser();
  if (!user || user.role?.toLowerCase() !== "parent") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = params;

    await db.update(storageItems)
      .set({ 
        isDeleted: true, 
        updatedAt: new Date(),
        version: sql`version + 1`
      })
      .where(eq(storageItems.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete storage item:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
