import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { accountStatsLog } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get("userId");

        if (!userId) {
            return NextResponse.json({ error: "User ID is required" }, { status: 400 });
        }

        const logs = await db.select()
            .from(accountStatsLog)
            .where(eq(accountStatsLog.userId, userId))
            .orderBy(desc(accountStatsLog.createdAt))
            .limit(50); // Limit to 50 most recent logs

        return NextResponse.json(logs);
    } catch (error) {
        console.error("[PARENT_LOGS_GET]", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
