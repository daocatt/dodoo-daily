import { db } from './db';
import { ledgerCategory, ledgerRecord, users } from './schema';
import { eq, and } from 'drizzle-orm';
import { subDays, subMonths, startOfMonth, endOfMonth, eachMonthOfInterval, format, setDate } from 'date-fns';

async function runMock() {
    console.log('🚀 Starting intensive Ledger Mocking (6 Months Period)...');

    // 1. Get Admin / Parent User
    const admin = await db.select().from(users).where(eq(users.role, 'PARENT')).get();
    if (!admin) {
        console.error('❌ No PARENT user found to assign records.');
        return;
    }
    const userId = admin.id;

    // 2. Setup Categories
    const categories = [
        { name: '餐饮美食', emoji: '🍔', type: 'EXPENSE' },
        { name: '日常购物', emoji: '🛒', type: 'EXPENSE' },
        { name: '交通出行', emoji: '🚗', type: 'EXPENSE' },
        { name: '休闲娱乐', emoji: '🎮', type: 'EXPENSE' },
        { name: '工资收入', emoji: '💰', type: 'INCOME' },
        { name: '奖金收入', emoji: '🧧', type: 'INCOME' },
        { name: '转账收入', emoji: '🏦', type: 'INCOME' },
    ] as const;

    const catMap: Record<string, string> = {};

    console.log('📂 Initializing categories...');
    for (const cat of categories) {
        const existing = await db.select().from(ledgerCategory)
            .where(and(eq(ledgerCategory.name, cat.name), eq(ledgerCategory.type, cat.type)))
            .get();
        
        if (!existing) {
            const [newCat] = await db.insert(ledgerCategory).values({
                name: cat.name,
                emoji: cat.emoji,
                type: cat.type,
                isSystem: false,
                creatorId: userId
            }).returning();
            catMap[cat.name] = newCat.id;
        } else {
            catMap[cat.name] = existing.id;
        }
    }

    // 3. Clear existing records for this user (Fresh Start for UI optimization)
    console.log('🧹 Purging old ledger records...');
    await db.delete(ledgerRecord).where(eq(ledgerRecord.userId, userId));

    // 4. Generate 6 Months of data
    const now = new Date();
    const startDate = subMonths(now, 5); // From 5 months ago to this month = 6 months
    const months = eachMonthOfInterval({ start: startDate, end: now });

    const recordsToInsert = [];

    for (const month of months) {
        const monthStr = format(month, 'yyyy-MM');
        console.log(`📅 Generating data for ${monthStr}...`);

        // INCOMES
        // Fixed monthly salary on day 1
        recordsToInsert.push({
            userId,
            categoryId: catMap['工资收入'],
            type: 'INCOME',
            amount: 8000.00,
            date: startOfMonth(month),
            description: 'Monthly Salary'
        });

        // Random bonus mid-month
        recordsToInsert.push({
            userId,
            categoryId: catMap['奖金收入'],
            type: 'INCOME',
            amount: Number((Math.random() * 800 + 200).toFixed(2)),
            date: setDate(month, 15),
            description: 'Incentive Bonus'
        });

        // EXPENSES
        // Daily food (approx 25 days/month)
        for (let d = 1; d <= 28; d++) {
            if (Math.random() > 0.1) { // 90% chance of eating out/ordering
                recordsToInsert.push({
                    userId,
                    categoryId: catMap['餐饮美食'],
                    type: 'EXPENSE',
                    amount: Number((Math.random() * 100 + 15).toFixed(2)),
                    date: setDate(month, d),
                    description: `Dine out / Meal ${d}`
                });
            }
        }

        // Weekly Shopping
        const shopDays = [3, 10, 18, 25];
        for (const sd of shopDays) {
            recordsToInsert.push({
                userId,
                categoryId: catMap['日常购物'],
                type: 'EXPENSE',
                amount: Number((Math.random() * 500 + 100).toFixed(2)),
                date: setDate(month, sd),
                description: `Weekly Groceries / Supplies`
            });
        }

        // Transport (Commuting)
        for (let d = 1; d <= 22; d++) {
            if (Math.random() > 0.3) {
                recordsToInsert.push({
                    userId,
                    categoryId: catMap['交通出行'],
                    type: 'EXPENSE',
                    amount: Number((Math.random() * 40 + 5).toFixed(2)),
                    date: setDate(month, d),
                    description: `Transport fee ${d}`
                });
            }
        }

        // Entertainment (1-2 times a month)
        recordsToInsert.push({
            userId,
            categoryId: catMap['休闲娱乐'],
            type: 'EXPENSE',
            amount: Number((Math.random() * 300 + 150).toFixed(2)),
            date: setDate(month, 20 + Math.floor(Math.random() * 5)),
            description: `Movie / Game / Outing`
        });
    }

    console.log(`📦 Inserting ${recordsToInsert.length} logical records...`);
    
    // Chunk insert if many records
    for (let i = 0; i < recordsToInsert.length; i += 50) {
        const chunk = recordsToInsert.slice(i, i + 50);
        await db.insert(ledgerRecord).values(chunk as any);
    }

    console.log('✅ Mock data injection SUCCESSFUL!');
}

runMock().catch(console.error);
