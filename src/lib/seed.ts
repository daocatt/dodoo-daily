import { db } from './db';
import { users, accountStats } from './schema';
import { eq } from 'drizzle-orm';

export async function seed() {
    console.log('🌱 Seeding database...');

    // 1. Create Default Parent
    const existingParent = await db.select().from(users).where(eq(users.role, 'PARENT'));
    let parentId: string;

    if (existingParent.length === 0) {
        const newParent = await db.insert(users).values({
            name: 'Dad & Mom',
            role: 'PARENT',
            pin: '1234', // Default PIN for demo
        }).returning();
        parentId = newParent[0].id;
        console.log('✅ Created Parent account');
    } else {
        parentId = existingParent[0].id;
    }

    // 2. Create Default Child
    const existingChildren = await db.select().from(users).where(eq(users.role, 'CHILD'));
    if (existingChildren.length === 0) {
        const child1 = await db.insert(users).values({
            name: 'Little Artist',
            role: 'CHILD',
        }).returning();

        // Create initial stats for the child
        await db.insert(accountStats).values({
            userId: child1[0].id,
            currency: 0,
            goldStars: 0,
            purpleStars: 0,
            angerPenalties: 0,
        });

        console.log('✅ Created Default Child account & stats');
    }

    console.log('✨ Seeding complete!');
}
