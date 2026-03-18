import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { rechargeCode } from '@/lib/schema'
import { desc } from 'drizzle-orm'
import { getSession } from '@/lib/auth'

export async function GET(req: NextRequest) {
    try {
        const session = await getSession()
        if (!session || session.role !== 'PARENT') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const codes = await db.select().from(rechargeCode).orderBy(desc(rechargeCode.createdAt))
        return NextResponse.json(codes)
    } catch (e) {
        console.error('Fetch recharge codes error:', e)
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getSession()
        if (!session || session.role !== 'PARENT') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await req.json()
        const { amount } = body

        if (!amount || amount <= 0) {
            return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
        }

        // Generate a simple random code
        const code = Math.random().toString(36).substring(2, 10).toUpperCase()

        const [newCode] = await db.insert(rechargeCode).values({
            code,
            amount,
        }).returning()

        return NextResponse.json(newCode)
    } catch (e) {
        console.error('Generate recharge code error:', e)
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}
