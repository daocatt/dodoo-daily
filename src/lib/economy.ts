import { db } from './db'
import { accountStats, accountStatsLog, systemSettings, currencyLog, goldStarLog, purpleStarLog } from './schema'
import { eq, and, gte, lte, sql } from 'drizzle-orm'

export type TransactionType = 'CURRENCY' | 'GOLD_STAR' | 'PURPLE_STAR' | 'ANGER_PENALTY'

export async function addBalance(userId: string, type: TransactionType, amount: number, reason: string, actorId?: string) {
    if (amount === 0) return

    // 1. Get current stats
    let stats = await db.select().from(accountStats).where(eq(accountStats.userId, userId)).get()
    if (!stats) {
        // Create if doesn't exist
        const newStats = await db.insert(accountStats).values({
            userId,
            goldStars: 0,
            purpleStars: 0,
            angerPenalties: 0,
            currency: 0
        }).returning()
        stats = newStats[0]
    }

    // 2. Handle 10-star daily limit for GOLD_STAR (if not from assigned task)
    // We'll pass a special flag in reason or a separate param if we want to enforce this strictly.
    // For now, let's assume the caller handles the logic or we check the reason.
    if (type === 'GOLD_STAR' && amount > 0 && !reason.includes('Assigned Task')) {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(startOfDay);
        endOfDay.setDate(endOfDay.getDate() + 1);

        const logs = await db.select({ total: sql<number>`sum(amount)` })
            .from(accountStatsLog)
            .where(and(
                eq(accountStatsLog.userId, userId),
                eq(accountStatsLog.type, 'GOLD_STAR'),
                gte(accountStatsLog.createdAt, startOfDay),
                lte(accountStatsLog.createdAt, endOfDay),
                sql`reason NOT LIKE '%Assigned Task%'`,
                sql`amount > 0`
            )).get();

        const currentDailyStars = Number(logs?.total || 0);
        if (currentDailyStars >= 10) {
            return { success: false, error: 'Daily star limit (10) reached' };
        }

        // Adjust amount if it would exceed 10
        if (currentDailyStars + amount > 10) {
            amount = 10 - currentDailyStars;
        }
    }

    let newBalance = 0
    const updateObj: Record<string, unknown> = {}

    if (type === 'CURRENCY') {
        newBalance = Math.max(0, (stats.currency || 0) + amount)
        updateObj.currency = newBalance
    } else if (type === 'GOLD_STAR') {
        newBalance = Math.max(0, (stats.goldStars || 0) + amount)
        updateObj.goldStars = newBalance
    } else if (type === 'PURPLE_STAR') {
        newBalance = Math.max(0, (stats.purpleStars || 0) + amount)
        updateObj.purpleStars = newBalance
    } else if (type === 'ANGER_PENALTY') {
        newBalance = Math.max(0, (stats.angerPenalties || 0) + amount)
        updateObj.angerPenalties = newBalance
    }

    // 3. Update Stats
    await db.update(accountStats).set(updateObj).where(eq(accountStats.userId, userId))

    // 4. Log Transaction (Also write to specific tables as requested)
    const logData = {
        userId,
        amount,
        balance: newBalance,
        reason,
        actorId
    }

    await db.insert(accountStatsLog).values({ ...logData, type })

    if (type === 'CURRENCY') {
        await db.insert(currencyLog).values(logData)
    } else if (type === 'GOLD_STAR') {
        await db.insert(goldStarLog).values(logData)
    } else if (type === 'PURPLE_STAR') {
        await db.insert(purpleStarLog).values(logData)
    }

    return { success: true, balance: newBalance }
}

export async function convertStarsToCoins(userId: string, starAmount: number) {
    const settings = await db.select().from(systemSettings).where(eq(systemSettings.id, 'app_settings')).get()
    const ratio = settings?.starsToCoinsRatio || 10

    if (starAmount < ratio) return { success: false, error: `Minimum ${ratio} stars required` }

    const coinsToAdd = Math.floor(starAmount / ratio)
    const starsToDeduct = coinsToAdd * ratio

    // Deduct Stars
    const deductRes = await addBalance(userId, 'GOLD_STAR', -starsToDeduct, 'Exchange for Coins')
    if (!deductRes.success) return deductRes

    // Add Coins
    const addRes = await addBalance(userId, 'CURRENCY', coinsToAdd, `Exchanged ${starsToDeduct} stars`)
    return addRes
}
