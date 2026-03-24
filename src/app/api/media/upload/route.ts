import { NextRequest, NextResponse } from 'next/server';
import { uploadMedia, FileType } from '@/lib/storage';
import { getSessionUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
    try {
        const session = await getSessionUser();
        const authenticatedUserId = session?.userId;
        if (!authenticatedUserId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const formData = await req.formData();
        const file = formData.get('file') as File;
        const type = (formData.get('type') as FileType) || 'IMAGE';

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        const media = await uploadMedia(file, type, authenticatedUserId);
        return NextResponse.json(media);
    } catch (error) {
        console.error('Upload failed:', error);
        return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }
}
