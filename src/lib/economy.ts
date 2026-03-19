import { db } from './db'
import { accountStats, accountStatsLog, systemSettings, currencyLog, goldStarLog, purpleStarLog, ledgerRecord, ledgerCategory, bankTransaction } from './schema'
import { eq, and, gte, lte, sql } from 'drizzle-orm'

export type TransactionType = 'CURRENCY' | 'GOLD_STAR' | 'PURPLE_STAR' | 'ANGER_PENALTY'

export async function addBalance(userId: string, type: TransactionType, amount: number, reason: string, actorId?: string) {
    if (amount === 0) return { success: true }

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
    if (!deductRes || !deductRes.success) return deductRes || { success: false, error: 'Unknown error' }

    // Add Coins
    const addRes = await addBalance(userId, 'CURRENCY', coinsToAdd, `Exchanged ${starsToDeduct} stars`)
    return addRes
}

// ==========================================
// FIAT (Real Money) & BANK SYSTEM
// ==========================================

export async function addFiatBalance(
    userId: string,
    amount: number, // CAN be positive or negative
    categoryId: string,
    type: 'INCOME' | 'EXPENSE',
    description: string,
    relatedUserId?: string
) {
    if (amount === 0) return { success: true, balance: 0 }

    let stats = await db.select().from(accountStats).where(eq(accountStats.userId, userId)).get()
    if (!stats) {
        const newStats = await db.insert(accountStats).values({ userId }).returning()
        stats = newStats[0]
    }

    const currentBalance = stats.fiatBalance || 0
    let delta = amount
    
    // Safety check for expense
    if (type === 'EXPENSE') {
        delta = -Math.abs(amount)
        if (currentBalance + delta < 0) {
            return { success: false, error: '余额不足' } // Insufficient balance
        }
    } else {
        delta = Math.abs(amount)
    }

    const newBalance = Number((currentBalance + delta).toFixed(2)) // 2 decimal places

    // Using transaction block
    try {
        db.transaction((tx) => {
            // 1. Update stats
            tx.update(accountStats)
                .set({ fiatBalance: newBalance, updatedAt: new Date() })
                .where(eq(accountStats.userId, userId))
                .run()

            // 2. Insert ledger record
            tx.insert(ledgerRecord).values({
                userId,
                categoryId,
                type,
                amount: Math.abs(amount), // Always store absolute amount
                date: new Date(),
                description,
                relatedUserId
            }).run()
        })
        return { success: true, balance: newBalance }
    } catch (e: unknown) {
        return { success: false, error: (e as Error).message }
    }
}

export async function convertCoinsToFiat(userId: string, coinsToExchange: number) {
    if (coinsToExchange <= 0) return { success: false, error: '无效金额' }

    const settings = await db.select().from(systemSettings).where(eq(systemSettings.id, 'app_settings')).get()
    // Coins to RMB Ratio. Example: 0.1 means 10 coins = 1 RMB
    const ratio = settings?.coinsToRmbRatio || 0.1

    // Ensure user has enough coins
    const stats = await db.select().from(accountStats).where(eq(accountStats.userId, userId)).get()
    const currentCoins = stats?.currency || 0
    if (currentCoins < coinsToExchange) {
        return { success: false, error: '金币不足' }
    }

    const fiatEarned = Number((coinsToExchange * ratio).toFixed(2))

    // 1. Deduct Coins (Virtual Currency)
    const deductRes = await addBalance(userId, 'CURRENCY', -coinsToExchange, '兑换为零花钱')
    if (!deductRes || !deductRes.success) return deductRes || { success: false, error: '金币扣除失败' }

    // 2. Get or create an "Exchange" category in Ledger
    let category = await db.select().from(ledgerCategory)
        .where(and(eq(ledgerCategory.isSystem, true), eq(ledgerCategory.name, '金币兑换')))
        .get()

    if (!category) {
        const newCat = await db.insert(ledgerCategory).values({
            name: '金币兑换',
            emoji: '🔄',
            type: 'INCOME',
            isSystem: true
        }).returning()
        category = newCat[0]
    }

    // 3. Add Fiat (Real Money)
    const addRes = await addFiatBalance(
        userId,
        fiatEarned,
        category.id,
        'INCOME',
        `由 ${coinsToExchange} 个金币兑换得到`
    )
    return addRes
}

// ==========================================
// VIRTUAL BANK (SAVINGS) SYSTEM
// ==========================================

export async function transferToBank(userId: string, amount: number, description: string = '存入银行') {
    if (amount <= 0) return { success: false, error: '无效金额' }

    try {
        const stats = await db.select().from(accountStats).where(eq(accountStats.userId, userId)).get()
        if (!stats) return { success: false, error: '用户统计数据不存在' }

        const currentFiat = stats.fiatBalance || 0
        if (currentFiat < amount) return { success: false, error: '余额不足' }

        const newFiat = Number((currentFiat - amount).toFixed(2))
        const newBank = Number(((stats.bankBalance || 0) + amount).toFixed(2))

        db.transaction((tx) => {
            tx.update(accountStats)
                .set({ fiatBalance: newFiat, bankBalance: newBank, updatedAt: new Date() })
                .where(eq(accountStats.userId, userId))
                .run()

            tx.insert(ledgerRecord).values({
                userId,
                categoryId: 'system_bank', 
                type: 'EXPENSE',
                amount: amount,
                date: new Date(),
                description: `[银行] ${description}`
            }).run()

            tx.insert(bankTransaction).values({
                userId,
                type: 'DEPOSIT',
                amount: amount,
                description,
                status: 'COMPLETED'
            }).run()
        })

        return { success: true, fiatBalance: newFiat, bankBalance: newBank }
    } catch (e: unknown) {
        return { success: false, error: (e as Error).message }
    }
}

export async function withdrawFromBank(userId: string, amount: number, description: string = '从银行取出') {
    if (amount <= 0) return { success: false, error: '无效金额' }

    try {
        const stats = await db.select().from(accountStats).where(eq(accountStats.userId, userId)).get()
        if (!stats) return { success: false, error: '用户统计数据不存在' }

        const currentBank = stats.bankBalance || 0
        if (currentBank < amount) return { success: false, error: '银行余额不足' }

        const newBank = Number((currentBank - amount).toFixed(2))
        const newFiat = Number(((stats.fiatBalance || 0) + amount).toFixed(2))

        db.transaction((tx) => {
            tx.update(accountStats)
                .set({ fiatBalance: newFiat, bankBalance: newBank, updatedAt: new Date() })
                .where(eq(accountStats.userId, userId))
                .run()

            tx.insert(ledgerRecord).values({
                userId,
                categoryId: 'system_bank',
                type: 'INCOME',
                amount: amount,
                date: new Date(),
                description: `[银行] ${description}`
            }).run()

            tx.insert(bankTransaction).values({
                userId,
                type: 'WITHDRAWAL',
                amount: amount,
                description,
                status: 'COMPLETED'
            }).run()
        })

        return { success: true, fiatBalance: newFiat, bankBalance: newBank }
    } catch (e: unknown) {
        return { success: false, error: (e as Error).message }
    }
}
