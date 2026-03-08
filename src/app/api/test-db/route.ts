import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users } from '@/lib/schema'

export async function GET() {
    try {
        const count = await db.select().from(users).all()
        return NextResponse.json({ count: count.length })
    } catch (e: any) {
        return NextResponse.json({ error: e.message, stack: e.stack }, { status: 500 })
    }
}
