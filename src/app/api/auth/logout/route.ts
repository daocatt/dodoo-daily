import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST() {
    const cookieStore = await cookies()
    cookieStore.delete('dodoo_session')
    cookieStore.delete('dodoo_user_id')
    cookieStore.delete('dodoo_role')
    return NextResponse.json({ success: true })
}
