import { NextRequest, NextResponse } from 'next/server'
import { uploadMedia } from '@/lib/storage'
import { getSessionUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
    try {
        const user = await getSessionUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const formData = await req.formData()
        const files = formData.getAll('file') as File[]

        if (!files || files.length === 0) {
            return NextResponse.json({ error: 'Files are required' }, { status: 400 })
        }

        // Just take the first one for now as we use it as single pick
        const file = files[0]
        
        // Use 'STORAGE' as category if your uploadMedia supports it, 
        // or just use 'GALLERY' as it will go to storage anyway.
        const mediaItem = await uploadMedia(file, 'GALLERY' as 'GALLERY' | 'JOURNAL', user.id);

        return NextResponse.json({ 
            success: true, 
            url: mediaItem.path,
            id: mediaItem.id
        })
    } catch (error) {
        console.error('Failed to upload file:', error)
        return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 })
    }
}
