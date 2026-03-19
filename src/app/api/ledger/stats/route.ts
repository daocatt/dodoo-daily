import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { ledgerRecord, ledgerCategory } from "@/lib/schema";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { startOfMonth, endOfMonth, eachDayOfInterval, format } from "date-fns";

export async function GET(request: Request) {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const monthStr = searchParams.get('month'); // e.g. "2024-03"
    const targetUserId = searchParams.get('userId') || user.id;

    // Parent can view child's stats, but children can only view their own
    if (user.role !== 'PARENT' && targetUserId !== user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const now = new Date();
        const start = monthStr ? new Date(`${monthStr}-01T00:00:00`) : startOfMonth(now);
        const end = endOfMonth(start);

        // 1. Get Category Breakdown
        const categories = await db.select({
            id: ledgerCategory.id,
            name: ledgerCategory.name,
            emoji: ledgerCategory.emoji,
            type: ledgerCategory.type,
            total: sql<number>`sum(${ledgerRecord.amount})`
        })
            .from(ledgerRecord)
            .innerJoin(ledgerCategory, eq(ledgerRecord.categoryId, ledgerCategory.id))
            .where(and(
                eq(ledgerRecord.userId, targetUserId),
                gte(ledgerRecord.date, start),
                lte(ledgerRecord.date, end)
            ))
            .groupBy(ledgerCategory.id);

        // 2. Get Daily Summary for Charts
        const dailyData = await db.select({
            day: sql<string>`date(${ledgerRecord.date} / 1000, 'unixepoch')`,
            income: sql<number>`sum(case when ${ledgerRecord.type} = 'INCOME' then ${ledgerRecord.amount} else 0 end)`,
            expense: sql<number>`sum(case when ${ledgerRecord.type} = 'EXPENSE' then ${ledgerRecord.amount} else 0 end)`
        })
            .from(ledgerRecord)
            .where(and(
                eq(ledgerRecord.userId, targetUserId),
                gte(ledgerRecord.date, start),
                lte(ledgerRecord.date, end)
            ))
            .groupBy(sql`date(${ledgerRecord.date} / 1000, 'unixepoch')`)
            .orderBy(sql`date(${ledgerRecord.date} / 1000, 'unixepoch')`);

        // Fill in missing days for the chart
        const allDaysInRange = eachDayOfInterval({ start, end });
        const chartData = allDaysInRange.map(d => {
            const dayStr = format(d, 'yyyy-MM-dd');
            const match = dailyData.find(dd => dd.day === dayStr);
            return {
                day: format(d, 'dd'),
                fullDate: dayStr,
                income: match?.income || 0,
                expense: match?.expense || 0
            };
        });

        // 3. Overall Totals
        const totals = categories.reduce((acc, cat) => {
            if (cat.type === 'INCOME') acc.income += Number(cat.total);
            else acc.expense += Number(cat.total);
            return acc;
        }, { income: 0, expense: 0 });

        return NextResponse.json({
            totals,
            categories,
            chartData,
            period: {
                start: start.toISOString(),
                end: end.toISOString(),
                label: format(start, 'yyyy-MM')
            }
        });
    } catch (e: unknown) {
        return NextResponse.json({ error: (e as Error).message }, { status: 500 });
    }
}
