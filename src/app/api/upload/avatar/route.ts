import { NextRequest, NextResponse } from 'next/server'
import { join } from 'path'
import { writeFile, mkdir } from 'fs/promises'
import { db } from '@/lib/db'
import { users } from '@/lib/schema'
import { v4 as uuidv4 } from 'uuid'
import { eq } from 'drizzle-orm'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
    try {
        const cookieStore = await cookies()
        const currentUserId = cookieStore.get('dodoo_user_id')?.value
        if (!currentUserId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const formData = await req.formData()
        const file = formData.get('file') as File
        const targetUserId = formData.get('userId') as string || currentUserId

        // If trying to update someone else's avatar, must be parent
        if (targetUserId !== currentUserId) {
            const role = cookieStore.get('dodoo_role')?.value
            if (role !== 'PARENT') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        if (!file) {
            return NextResponse.json({ error: 'File is required' }, { status: 400 })
        }

        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)

        const uploadDir = join(process.cwd(), 'uploads', 'images', 'avatars')
        await mkdir(uploadDir, { recursive: true })

        const ext = file.name.split('.').pop() || 'jpg'
        const fileName = `${uuidv4()}.${ext}`
        const path = join(uploadDir, fileName)

        await writeFile(path, buffer)

        const avatarUrl = `/api/images/avatars/${fileName}`

        await db.update(users)
            .set({ avatarUrl })
            .where(eq(users.id, targetUserId))

        return NextResponse.json({ success: true, avatarUrl })
    } catch (error) {
        console.error('Failed to upload avatar:', error)
        return NextResponse.json({ error: 'Failed to upload' }, { status: 500 })
    }
}
