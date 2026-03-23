import { NextRequest, NextResponse } from 'next/server'
import { join } from 'path'
import { readFile } from 'fs/promises'
import fs from 'fs'

export async function GET(
    req: NextRequest,
    { params: _params }: { params: Promise<{ path: string[] }> }
) {
    try {
        const { path } = await params
        const filePath = path.join('/')
        // In Docker standalone, process.cwd() is /app. Uploads are in /app/uploads.
        const fullPath = join(process.cwd(), 'uploads', 'images', filePath)

        if (!fs.existsSync(fullPath)) {
            return NextResponse.json({ error: 'Image not found' }, { status: 404 })
        }

        const imageBuffer = await readFile(fullPath)

        // Determine content type based on extension
        const ext = fullPath.split('.').pop()?.toLowerCase() || 'jpg'
        let contentType = 'image/jpeg'
        if (ext === 'png') contentType = 'image/png'
        else if (ext === 'gif') contentType = 'image/gif'
        else if (ext === 'webp') contentType = 'image/webp'
        else if (ext === 'svg') contentType = 'image/svg+xml'

        return new NextResponse(imageBuffer, {
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=31536000',
            },
        })
    } catch (error) {
        console.error('Error serving image:', error)
        return NextResponse.json({ error: 'Error serving image' }, { status: 500 })
    }
}
