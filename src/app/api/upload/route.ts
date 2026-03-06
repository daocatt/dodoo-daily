import { NextRequest, NextResponse } from 'next/server'
import { join } from 'path'
import { writeFile, mkdir } from 'fs/promises'
import { db } from '@/lib/db'
import { artwork, users } from '@/lib/schema'
import { v4 as uuidv4 } from 'uuid'
import { eq } from 'drizzle-orm'

async function getDefaultChildId() {
    const kids = await db.select().from(users).where(eq(users.role, 'CHILD'))
    return kids.length > 0 ? kids[0].id : null
}

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData()
        const file = formData.get('file') as File
        const title = formData.get('title') as string
        const priceRMB = parseFloat(formData.get('priceRMB') as string) || 0
        const priceCoins = parseInt(formData.get('priceCoins') as string) || 0
        const albumId = formData.get('albumId') as string

        if (!file || !title) {
            return NextResponse.json({ error: 'File and title are required' }, { status: 400 })
        }

        const childId = await getDefaultChildId()
        if (!childId) return NextResponse.json({ error: 'No child account found' }, { status: 404 })

        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)

        const now = new Date()
        const dateDir = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

        // In standalone/docker, we might want to ensure 'uploads' is parallel to 'app' or consistent.
        // Dockerfile maps /app/uploads
        const uploadDir = join(process.cwd(), 'uploads', 'images', dateDir)

        await mkdir(uploadDir, { recursive: true })

        const ext = file.name.split('.').pop() || 'jpg'
        const fileName = `${uuidv4()}.${ext}`
        const path = join(uploadDir, fileName)

        await writeFile(path, buffer)

        const imageUrl = `/api/images/${dateDir}/${fileName}`

        const insertResult = await db.insert(artwork).values({
            userId: childId,
            title,
            imageUrl,
            priceRMB,
            priceCoins,
            albumId: albumId || null,
        }).returning()

        return NextResponse.json({ success: true, artwork: insertResult[0] })
    } catch (error) {
        console.error('Failed to upload image:', error)
        return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 })
    }
}
