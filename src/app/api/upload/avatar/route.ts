import { NextRequest, NextResponse } from 'next/server'

import { db } from '@/lib/db'
import { users } from '@/lib/schema'

import { eq } from 'drizzle-orm'


import { uploadMedia } from '@/lib/storage'
import { getSessionUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
    try {
        const session = await getSessionUser()
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const currentUserId = session.userId
        const formData = await req.formData()
        const file = formData.get('file') as File
        const targetUserId = (formData.get('userId') as string) || currentUserId

        // 1. Authorization Check: If trying to update someone else's avatar, must be a parent
        if (targetUserId !== currentUserId && session.role !== 'PARENT') {
            return NextResponse.json({ error: 'Forbidden: You can only update your own avatar' }, { status: 403 })
        }

        if (!file) {
            return NextResponse.json({ error: 'File is required' }, { status: 400 })
        }

        // 2. File Validation: Limit to 2MB and common image formats
        const MAX_SIZE = 2 * 1024 * 1024 // 2MB
        if (file.size > MAX_SIZE) {
            return NextResponse.json({ error: 'File size too large (max 2MB)' }, { status: 400 })
        }

        const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
        if (!ALLOWED_TYPES.includes(file.type)) {
            return NextResponse.json({ error: 'Invalid file type. Only JPG, PNG, WEBP, and GIF are allowed' }, { status: 400 })
        }

        // 3. Process Upload
        const mediaItem = await uploadMedia(file, 'IMAGE', targetUserId)
        const avatarUrl = mediaItem.path

        await db.update(users)
            .set({ avatarUrl })
            .where(eq(users.id, targetUserId))

        return NextResponse.json({ success: true, avatarUrl })
    } catch (error) {
        console.error('Failed to upload avatar:', error)
        return NextResponse.json({ error: 'An unexpected error occurred during upload' }, { status: 500 })
    }
}
