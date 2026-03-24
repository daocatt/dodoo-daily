import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { artwork } from '@/lib/schema'
import { uploadMedia } from '@/lib/storage'
import { getSessionUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
    try {
        const session = await getSessionUser()
        const userId = session?.userId
        const role = session?.role
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const formData = await req.formData()
        const files = formData.getAll('file') as File[]
        const title = formData.get('title') as string || 'Untitled'
        const priceRMB = parseFloat(formData.get('priceRMB') as string) || 0
        const priceCoins = parseInt(formData.get('priceCoins') as string) || 0
        const albumId = formData.get('albumId') as string
        const targetUserId = formData.get('targetUserId') as string
        const isPublic = formData.get('isPublic') === 'true'
        const isFeatured = formData.get('isFeatured') === 'true'
        const exhibitionDescription = formData.get('exhibitionDescription') as string || null

        if (!files || files.length === 0) {
            return NextResponse.json({ error: 'Files are required' }, { status: 400 })
        }

        const results = []

        const ownerId = (role === 'PARENT' && targetUserId) ? targetUserId : userId

        for (const [index, file] of files.entries()) {
            const mediaItem = await uploadMedia(file, 'GALLERY', ownerId);
            const artworkTitle = files.length > 1 ? `${title} ${index + 1}` : title;

            const isApproved = role === 'PARENT' || !isPublic; // Parents are auto-approved, or if not public

            const insertResult = await db.insert(artwork).values({
                userId: ownerId,
                title: artworkTitle,
                imageUrl: mediaItem.path,
                priceRMB,
                priceCoins,
                albumId: albumId || null,
                isPublic,
                isFeatured,
                isApproved,
                exhibitionDescription,
            }).returning()

            results.push(insertResult[0])
        }

        return NextResponse.json({ success: true, artworks: results })
    } catch (error) {
        console.error('Failed to upload image:', error)
        return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 })
    }
}
