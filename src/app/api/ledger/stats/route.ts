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
    const startDateParam = searchParams.get('startDate'); // YYYY-MM-DD
    const endDateParam = searchParams.get('endDate');   // YYYY-MM-DD
    const targetUserId = searchParams.get('userId') || user.id;

    if (user.role !== 'PARENT' && targetUserId !== user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const now = new Date();
        
        // --- 1. Determine Date Range ---
        let start = startDateParam ? new Date(startDateParam) : startOfMonth(subMonths(now, 5));
        let end = endDateParam ? endOfMonth(new Date(endDateParam)) : endOfMonth(now);

        // Limit range to 24 months
        const monthDiff = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
        if (monthDiff > 24) {
            return NextResponse.json({ error: "Range exceeds 24 months limit" }, { status: 400 });
        }

        // --- 2. Summary Logic: Current Month & Current Year ---
        const thisMonthStart = startOfMonth(now);
        const thisMonthEnd = endOfMonth(now);
        const thisYearStart = new Date(now.getFullYear(), 0, 1);

        const summaries = await db.select({
            period: sql<string>`case 
                when ${ledgerRecord.date} >= ${thisMonthStart.getTime()} then 'MONTH'
                when ${ledgerRecord.date} >= ${thisYearStart.getTime()} then 'YEAR'
                else 'OTHER'
            end`,
            type: ledgerRecord.type,
            amount: sql<number>`sum(${ledgerRecord.amount})`
        })
        .from(ledgerRecord)
        .where(eq(ledgerRecord.userId, targetUserId))
        .groupBy(sql`case 
                when ${ledgerRecord.date} >= ${thisMonthStart.getTime()} then 'MONTH'
                when ${ledgerRecord.date} >= ${thisYearStart.getTime()} then 'YEAR'
                else 'OTHER'
            end`, ledgerRecord.type);

        const currentMonthStats = { income: 0, expense: 0 };
        const currentYearStats = { income: 0, expense: 0 };

        summaries.forEach(s => {
            if (s.period === 'MONTH') {
                if (s.type === 'INCOME') { currentMonthStats.income += s.amount; currentYearStats.income += s.amount; }
                else { currentMonthStats.expense += s.amount; currentYearStats.expense += s.amount; }
            } else if (s.period === 'YEAR') {
                if (s.type === 'INCOME') currentYearStats.income += s.amount;
                else currentYearStats.expense += s.amount;
            }
        });

        // --- 3. Monthly Trend for the selected range ---
        const monthlyData = await db.select({
            month: sql<string>`strftime('%Y-%m', ${ledgerRecord.date} / 1000, 'unixepoch')`,
            income: sql<number>`sum(case when ${ledgerRecord.type} = 'INCOME' then ${ledgerRecord.amount} else 0 end)`,
            expense: sql<number>`sum(case when ${ledgerRecord.type} = 'EXPENSE' then ${ledgerRecord.amount} else 0 end)`
        })
        .from(ledgerRecord)
        .where(and(
            eq(ledgerRecord.userId, targetUserId),
            gte(ledgerRecord.date, start),
            lte(ledgerRecord.date, end)
        ))
        .groupBy(sql`strftime('%Y-%m', ${ledgerRecord.date} / 1000, 'unixepoch')`)
        .orderBy(sql`strftime('%Y-%m', ${ledgerRecord.date} / 1000, 'unixepoch')`);

        // --- 4. Category Breakdown for the selected range ---
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

        return NextResponse.json({
            currentMonthStats,
            currentYearStats,
            categories,
            monthlyTrend: monthlyData,
            period: {
                start: start.toISOString(),
                end: end.toISOString()
            }
        });
    } catch (e: unknown) {
        return NextResponse.json({ error: (e as Error).message }, { status: 500 });
    }
}
