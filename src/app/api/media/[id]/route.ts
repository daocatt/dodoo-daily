import { NextRequest, NextResponse } from 'next/server';
import { deleteMedia, renameMedia } from '@/lib/storage';

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { name } = await req.json();
        if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

        const updated = await renameMedia(id, name);
        return NextResponse.json(updated);
    } catch (error: any) {
        console.error('Rename failed:', error);
        return NextResponse.json({ error: error.message || 'Rename failed' }, { status: 500 });
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        await deleteMedia(id);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Delete failed:', error);
        return NextResponse.json({ error: error.message || 'Delete failed' }, { status: 500 });
    }
}
