import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { ledgerRecord, accountStats } from "@/lib/schema";
import { eq, and, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = params;

  try {
    // 1. Get the record to know the amount and type
    const record = await db.select().from(ledgerRecord).where(eq(ledgerRecord.id, id)).get();
    
    if (!record) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    }

    // 2. Permission check: Only owner or parent can delete
    if (record.userId !== user.id && user.role !== 'PARENT') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 3. Perform reversal and deletion in a transaction
    db.transaction((tx) => {
      // Calculate balance delta: 
      // Deleting EXPENSE means adding back.
      // Deleting INCOME means subtracting.
      const delta = record.type === 'EXPENSE' ? record.amount : -record.amount;

      // Update balance
      tx.update(accountStats)
        .set({ 
          fiatBalance: sql`fiatBalance + ${delta}`,
          updatedAt: new Date()
        })
        .where(eq(accountStats.userId, record.userId))
        .run();

      // Delete record
      tx.delete(ledgerRecord)
        .where(eq(ledgerRecord.id, id))
        .run();
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Ledger delete error:", e);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
