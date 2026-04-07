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
    console.log('--- Adding Extra Mock Data for Wishes & Purchases ---');
    
    // 1. Target Child: Lucky (小乐)
    const luckyId = '43dee2e5-8c36-4bd2-9466-8ee3d6ff1d64';
    console.log(`Targeting child ID: ${luckyId}`);

    // 2. Add 6 Wishes for Lucky
    console.log('Generating 6 Wishes for Lucky...');
    const wishes = [
        { name: '小霸王游戏机机', description: '复刻经典 FC 游戏机，想玩魂斗罗和超级马力欧。', imageUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=400' },
        { name: '哈利波特全集', description: '全套 8 册精装本，我要进入魔法世界！', imageUrl: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=400' },
        { name: '迪士尼乐园两日票', description: '全家人一起去上海迪士尼玩两天，住玩具总动员酒店。', imageUrl: 'https://images.unsplash.com/photo-1506159904226-d999081bb59a?q=80&w=400' },
        { name: 'PS5 Pro 游戏机', description: '最新的游戏机，可以玩黑色神话悟空！', imageUrl: 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?q=80&w=400' },
        { name: '乐高超级马力欧大宅', description: '超大的乐高套装，拼好后可以互联互动。', imageUrl: 'https://images.unsplash.com/photo-1585366119957-e9730b6d0f60?q=80&w=400' },
        { name: '专业山地自行车', description: '周末想和爸爸一起去森林公园骑行。', imageUrl: 'https://images.unsplash.com/photo-1532298229144-0ee0c9e9ad58?q=80&w=400' }
    ];

    for (const w of wishes) {
        await db.insert(schema.wish).values({
            id: uuidv4(),
            userId: luckyId,
            name: w.name,
            description: w.description,
            imageUrl: w.imageUrl,
            status: 'PENDING'
        });
    }

    // 3. Add 3 Purchase Records (Shop Orders) for Lucky
    console.log('Generating 3 Shop Orders for Lucky...');
    
    // Find some shop items to link to
    const items = await db.select().from(schema.shopItem).limit(3).all();
    if (items.length === 0) {
        console.warn('No shop items found. Skipping purchase generation.');
    } else {
        const statuses = ['CONFIRMED', 'PENDING', 'CONFIRMED'];
        for (let i = 0; i < Math.min(items.length, 3); i++) {
            const item = items[i];
            await db.insert(schema.purchase).values({
                id: uuidv4(),
                userId: luckyId,
                itemId: item.id,
                costCoins: item.costCoins,
                itemName: item.name,
                itemIconUrl: item.iconUrl,
                status: statuses[i] || 'CONFIRMED',
                remarks: i === 1 ? '希望快点拿到！' : '已经收到了，太开心了！'
            });
        }
    }

    console.log('--- Extra Mock Data Generation COMPLETED ---');
}

main().catch(console.error);
