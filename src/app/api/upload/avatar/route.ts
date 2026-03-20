import { NextRequest, NextResponse } from 'next/server'
import { join } from 'path'
import { writeFile, mkdir } from 'fs/promises'
import { db } from '@/lib/db'
import { users } from '@/lib/schema'
import { v4 as uuidv4 } from 'uuid'
import { eq } from 'drizzle-orm'
import { cookies } from 'next/headers'

import { uploadMedia } from '@/lib/storage'
import { getSessionUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
    try {
        const cookieStore = await cookies()
        const currentUserId = (await getSessionUser())?.userId
        if (!currentUserId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const formData = await req.formData()
        const file = formData.get('file') as File
        const targetUserId = formData.get('userId') as string || currentUserId

        // If trying to update someone else's avatar, must be parent
        if (targetUserId !== currentUserId) {
            const role = (await getSessionUser())?.role
            if (role !== 'PARENT') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        if (!file) {
            return NextResponse.json({ error: 'File is required' }, { status: 400 })
        }

        const mediaItem = await uploadMedia(file, 'IMAGE', targetUserId);
        const avatarUrl = mediaItem.path;

        await db.update(users)
            .set({ avatarUrl })
            .where(eq(users.id, targetUserId))

        return NextResponse.json({ success: true, avatarUrl })
    } catch (error) {
        console.error('Failed to upload avatar:', error)
        return NextResponse.json({ error: error.message || 'Failed to upload' }, { status: 500 })
    }
}
