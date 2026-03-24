import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from '../src/lib/schema';
import path from 'path';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

const dbPath = path.join(process.cwd(), 'database', 'dodoo.db');
const sqlite = new Database(dbPath);
const db = drizzle(sqlite, { schema });

async function main() {
    console.log('--- Starting Mock Data Generation ---');
    
    // 1. Find the Superadmin
    const superadmin = await db.select().from(schema.users).where(eq(schema.users.permissionRole, 'SUPERADMIN')).get();
    
    if (!superadmin) {
        console.error('CRITICAL: No SUPERADMIN found in database. Please run setup first.');
        process.exit(1);
    }
    const userId = superadmin.id;
    console.log(`Found Superadmin: ${superadmin.name} (${userId})`);

    // 2. Mock 2 Children: Lucky (Boy) and Summer (Girl)
    console.log('Generating 2 Children...');
    const childrenData = [
        { name: 'Lucky', gender: 'MALE', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lucky', nickname: '小乐 (Lucky)' },
        { name: 'Summer', gender: 'FEMALE', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Summer', nickname: '小夏 (Summer)' }
    ];

    for (const childRecord of childrenData) {
        let child = await db.select().from(schema.users).where(eq(schema.users.name, childRecord.name)).get();
        if (!child) {
            child = await db.insert(schema.users).values({
                id: uuidv4(),
                name: childRecord.name,
                nickname: childRecord.nickname,
                role: 'CHILD',
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                gender: childRecord.gender as any,
                avatarUrl: childRecord.avatar,
                permissionRole: 'USER',
                pin: '1234'
            }).returning().get();
            
            // Create initial stats for children
            await db.insert(schema.accountStats).values({
                userId: child.id,
                goldStars: 12,
                purpleStars: 5,
                currency: 150,
                fiatBalance: 0
            });
        }
    }

    // 3. Mock 10 Notes
    const noteContents = [
        "Buy milk and eggs",
        "Call Grandma this weekend",
        "Remember to water the plants tomorrow",
        "Kids' swimming class at 4 PM on Wednesday",
        "Check the car's tire pressure",
        "New recipe: Honey Glazed Salmon",
        "Plan for the upcoming summer trip",
        "Update the household inventory list",
        "Fix the loose handle on the cabinet",
        "Prepare for the parent-teacher meeting"
    ];
    for (let i = 0; i < 10; i++) {
        await db.insert(schema.familyNote).values({
            authorId: userId,
            text: noteContents[i],
            color: ["#FEF3C7", "#E0F2FE", "#DCFCE7", "#F3E8FF", "#FFEDD5"][i % 5],
            isPinned: i < 2
        });
    }

    // 3. Mock 10 Tasks
    console.log('Generating 10 Tasks...');
    const taskTitles = [
        "Finish Project Report", "Clean the Garage", "Read one chapter of a book", 
        "Exercise for 30 minutes", "Organize digital photos", "Pay electricity bill",
        "Renew insurance policy", "Cook dinner tonight", "Meditate for 10 minutes",
        "Schedule dentist appointment"
    ];
    for (let i = 0; i < 10; i++) {
        const now = new Date();
        let plannedTime;
        if (i === 0) plannedTime = new Date(now); // Today
        else if (i === 1) plannedTime = new Date(now.setDate(now.getDate() + 1)); // Tomorrow
        else if (i === 2) plannedTime = new Date(now.setDate(now.getDate() + 3)); // This week
        else if (i === 3) plannedTime = new Date(now.setMonth(now.getMonth() + 1)); // Next month (M)
        else plannedTime = new Date(now.setFullYear(now.getFullYear() + 1)); // Next year (Y)

        await db.insert(schema.task).values({
            creatorId: userId,
            assignerId: userId,
            assigneeId: userId,
            title: taskTitles[i],
            description: "Automatically generated mock task description.",
            rewardStars: Math.floor(Math.random() * 5) + 1,
            rewardCoins: Math.floor(Math.random() * 10),
            completed: i % 2 === 0, // 50% completed
            plannedTime: plannedTime
        });
    }

    // 4. Mock Ledger Categories & 20 Records
    console.log('Generating 20 Ledger Records...');
    // Ensure default categories exist or create some
    let incomeCat = await db.select().from(schema.ledgerCategory).where(eq(schema.ledgerCategory.name, 'Salary')).get();
    if (!incomeCat) {
        incomeCat = await db.insert(schema.ledgerCategory).values({
            name: 'Salary', emoji: '💰', type: 'INCOME', isSystem: true
        }).returning().get();
    }
    let expenseCat = await db.select().from(schema.ledgerCategory).where(eq(schema.ledgerCategory.name, 'Housing')).get();
    if (!expenseCat) {
        expenseCat = await db.insert(schema.ledgerCategory).values({
            name: 'Housing', emoji: '🏠', type: 'EXPENSE', isSystem: true
        }).returning().get();
    }

    let totalBalance = 0;
    for (let i = 0; i < 20; i++) {
        const isIncome = i % 4 === 0;
        const amount = isIncome ? (Math.random() * 20000 + 5000) : (Math.random() * 1000 + 100);
        await db.insert(schema.ledgerRecord).values({
            userId: userId,
            categoryId: isIncome ? incomeCat.id : expenseCat.id,
            type: isIncome ? 'INCOME' : 'EXPENSE',
            amount: amount,
            date: new Date(Date.now() - i * 86400000),
            description: isIncome ? `Monthly Payout ${i}` : `Expenditure Reference ${i}`
        });
        totalBalance += isIncome ? amount : -amount;
    }

    // Update the actual stats table so the dashboard shows the correct total
    await db.update(schema.accountStats)
        .set({ fiatBalance: totalBalance })
        .where(eq(schema.accountStats.userId, userId));

    console.log(`Updated balance for Superadmin: ${totalBalance.toFixed(2)}`);

    // 5. Mock 10 Household items
    console.log('Generating 10 Storage Items...');
    const itemNames = [
        "Vintage Camera", "Gaming Laptop", "Ergonomic Chair", "Espresso Machine", 
        "Mechanical Keyboard", "Smart Watch", "Noise-Cancelling Headphones", 
        "Dyson Vacuum", "Air Purifier", "Kindle e-Reader"
    ];
    for (let i = 0; i < 10; i++) {
        await db.insert(schema.storageItems).values({
            id: uuidv4(),
            creatorId: userId,
            name: itemNames[i],
            imageUrl: `/placeholder-storage-${i % 5}.jpg`,
            notes: "High quality item from the family collection.",
            purchasePrice: Math.floor(Math.random() * 5000 + 500),
            purchaseDate: new Date(Date.now() - Math.random() * 365 * 86400000)
        });
    }

    // 6. Mock 10 Journals
    console.log('Generating 10 Journal Entries...');
    const journalEntries = [
        "Today we had an amazing picnic in the park.",
        "Started a new project at work. Feeling productive!",
        "The kids did a great job at the school play tonight.",
        "Watched a deep documentary about space exploration.",
        "Sunday brunch with the neighbors was fun.",
        "Finally finished reading that mystery novel.",
        "Rainy afternoon. Spent it playing board games with family.",
        "Delicious homemade pizza for dinner tonight.",
        "Morning run was refreshing. 5km completed.",
        "Spent the evening organizing the backyard garden."
    ];
    for (let i = 0; i < 10; i++) {
        await db.insert(schema.journal).values({
            authorId: userId,
            authorRole: superadmin.role,
            text: journalEntries[i],
            createdAt: new Date(Date.now() - i * 86400000)
        });
    }

    // 7. Mock Milestone Timeline (Birth to University) - 18 years span
    console.log('Generating Milestone Timeline (18 Years)...');
    const milestones = [
        { title: "Hello World! (Birth)", date: "2008-01-01", desc: "A star is born! Welcome to the family." },
        { title: "First Steps", date: "2009-03-15", desc: "Taking the first tiny steps into the big world." },
        { title: "Kindergarten Entry", date: "2011-09-01", desc: "Starting the social journey with new friends." },
        { title: "Primary School Entry", date: "2015-09-01", desc: "Entering the gates of formal education!" },
        { title: "Art Excellence Award", date: "2017-05-01", desc: "Won the Painting Excellence Award! A creative spark." },
        { title: "Primary School Graduation", date: "2020-06-20", desc: "Finished the first long mile of school with honors." },
        { title: "Middle School Entry", date: "2020-09-01", desc: "Moving up to the next big challenge." },
        { title: "Middle School Graduation", date: "2023-06-25", desc: "Youth is blooming. Ready for High School." },
        { title: "High School Entry", date: "2023-09-01", desc: "Entering the final stage of youth education." },
        { title: "University Entry", date: "2026-09-01", desc: "Opening a new chapter! Moving to campus life." }
    ];

    for (const m of milestones) {
        const date = new Date(m.date);
        await db.insert(schema.journal).values({
            authorId: userId,
            authorRole: superadmin.role,
            text: `[MILESTONE] ${m.title}: ${m.desc}`,
            isMilestone: true,
            milestoneDate: date,
            createdAt: date
        });
    }

    console.log('--- Mock Data Generation COMPLETED ---');
}

main().catch(console.error);
