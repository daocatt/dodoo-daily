import { NextRequest, NextResponse } from 'next/server'
import { uploadMedia } from '@/lib/storage'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
    try {
        const cookieStore = await cookies()
        const currentUserId = cookieStore.get('dodoo_user_id')?.value
        const role = cookieStore.get('dodoo_role')?.value

        if (!currentUserId || role !== 'PARENT') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const formData = await req.formData()
        const file = formData.get('file') as File

        if (!file) {
            return NextResponse.json({ error: 'File is required' }, { status: 400 })
        }

        // Just upload and return path, don't update user profile
        const mediaItem = await uploadMedia(file, 'IMAGE', currentUserId);

        return NextResponse.json({ success: true, url: mediaItem.path })
    } catch (error: any) {
        console.error('Failed to upload system media:', error)
        return NextResponse.json({ error: error.message || 'Failed to upload' }, { status: 500 })
    }
}
