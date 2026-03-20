import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST() {
    const cookieStore = await cookies()
    cookieStore.delete('dodoo_session')
    return NextResponse.json({ success: true })
}
