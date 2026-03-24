import { NextRequest, NextResponse } from 'next/server'
import { uploadMedia } from '@/lib/storage'
import { getSessionUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
    try {
        const session = await getSessionUser()
        if (!session || session.role !== 'PARENT') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        const currentUserId = session.userId

        const formData = await req.formData()
        const file = formData.get('file') as File

        if (!file) {
            return NextResponse.json({ error: 'File is required' }, { status: 400 })
        }

        // Just upload and return path, don't update user profile
        const mediaItem = await uploadMedia(file, 'IMAGE', currentUserId);

        return NextResponse.json({ success: true, url: mediaItem.path })
    } catch (error) {
        console.error('Failed to upload system media:', error)
        return NextResponse.json({ error: 'Failed to upload' }, { status: 500 })
    }
}
