import { NextRequest, NextResponse } from 'next/server';
import { uploadMedia, FileType } from '@/lib/storage';

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;
        const type = (formData.get('type') as FileType) || 'IMAGE';
        const userId = formData.get('userId') as string;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        const media = await uploadMedia(file, type, userId);
        return NextResponse.json(media);
    } catch (error: any) {
        console.error('Upload failed:', error);
        return NextResponse.json({ error: error.message || 'Upload failed' }, { status: 500 });
    }
}
