import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { familyMember } from '@/lib/schema'
import { eq, isNull } from 'drizzle-orm'
import { cookies } from 'next/headers'

async function checkAuth() {
    const cookieStore = await cookies()
    return !!cookieStore.get('dodoo_user_id')?.value
}

export async function GET() {
    if (!await checkAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const members = await db.select().from(familyMember).all()
        return NextResponse.json(members)
    } catch (error) {
        console.error('Failed to fetch family members:', error)
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    if (!await checkAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const body = await req.json()
        const { name, relationship, parentId, gender, notes } = body

        if (!name || !relationship) {
            return NextResponse.json({ error: 'Name and Relationship are required' }, { status: 400 })
        }

        const [newMember] = await db.insert(familyMember).values({
            name,
            relationship,
            parentId: parentId || null,
            gender: gender || 'OTHER',
            notes: notes || ''
        }).returning()

        return NextResponse.json(newMember)
    } catch (error) {
        console.error('Failed to create family member:', error)
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}

export async function PATCH(req: NextRequest) {
    if (!await checkAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const body = await req.json()
        const { id, ...data } = body
        if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })

        const [updated] = await db.update(familyMember)
            .set({ ...data })
            .where(eq(familyMember.id, id))
            .returning()

        return NextResponse.json(updated)
    } catch (error) {
        console.error('Failed to update family member:', error)
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}

export async function DELETE(req: NextRequest) {
    if (!await checkAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const { id } = await req.json()
        if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })

        await db.delete(familyMember).where(eq(familyMember.id, id))
        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Failed to delete family member:', error)
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}
