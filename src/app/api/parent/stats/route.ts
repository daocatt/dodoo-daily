import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { accountStats, accountStatsLog, users } from '@/lib/schema'
import { eq, desc } from 'drizzle-orm'
import { cookies } from 'next/headers'

async function isParent() {
    const cookieStore = await cookies()
    const role = cookieStore.get('dodoo_role')?.value
    return role === 'PARENT'
}

export async function GET(req: NextRequest) {
    if (!await isParent()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const { searchParams } = new URL(req.url)
        const userId = searchParams.get('userId')
        if (!userId) return NextResponse.json({ error: 'userId is required' }, { status: 400 })

        const logs = await db.select()
            .from(accountStatsLog)
            .where(eq(accountStatsLog.userId, userId))
            .orderBy(desc(accountStatsLog.createdAt))
            .all()

        return NextResponse.json(logs)
    } catch (error) {
        console.error('Failed to fetch stats logs:', error)
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}

export async function PATCH(req: NextRequest) {
    if (!await isParent()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const { userId, type, amount, reason } = await req.json()
        if (!userId || !type || amount === undefined || !reason) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        const [stats] = await db.select().from(accountStats).where(eq(accountStats.userId, userId))
        if (!stats) return NextResponse.json({ error: 'Stats not found' }, { status: 404 })

        let currentBalance = 0
        const updateData: any = {}

        switch (type) {
            case 'CURRENCY':
                currentBalance = stats.currency + parseInt(amount)
                updateData.currency = currentBalance
                break
            case 'GOLD_STAR':
                currentBalance = stats.goldStars + parseInt(amount)
                updateData.goldStars = currentBalance
                break
            case 'PURPLE_STAR':
                currentBalance = stats.purpleStars + parseInt(amount)
                updateData.purpleStars = currentBalance
                break
            case 'ANGER_PENALTY':
                currentBalance = stats.angerPenalties + parseInt(amount)
                updateData.angerPenalties = currentBalance
                break
            default:
                return NextResponse.json({ error: 'Invalid stat type' }, { status: 400 })
        }

        await db.update(accountStats)
            .set(updateData)
            .where(eq(accountStats.userId, userId))

        const [log] = await db.insert(accountStatsLog).values({
            userId,
            type,
            amount: parseInt(amount),
            balance: currentBalance,
            reason
        }).returning()

        return NextResponse.json({ success: true, balance: currentBalance, log })
    } catch (error) {
        console.error('Failed to update stats:', error)
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}
