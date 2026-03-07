import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users, accountStats } from '@/lib/schema'
import { eq, and, not } from 'drizzle-orm'
import { cookies } from 'next/headers'

async function isParent() {
    const cookieStore = await cookies()
    const role = cookieStore.get('dodoo_role')?.value
    return role === 'PARENT'
}

export async function GET() {
    if (!await isParent()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const children = await db.select({
            id: users.id,
            name: users.name,
            nickname: users.nickname,
            gender: users.gender,
            birthDate: users.birthDate,
            zodiac: users.zodiac,
            avatarUrl: users.avatarUrl,
            isArchived: users.isArchived,
            isDeleted: users.isDeleted,
            createdAt: users.createdAt,
            stats: {
                currency: accountStats.currency,
                goldStars: accountStats.goldStars,
                purpleStars: accountStats.purpleStars,
                angerPenalties: accountStats.angerPenalties
            }
        })
            .from(users)
            .leftJoin(accountStats, eq(users.id, accountStats.userId))
            .where(eq(users.role, 'CHILD'))
            .all()

        return NextResponse.json(children)
    } catch (error) {
        console.error('Failed to fetch children:', error)
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    if (!await isParent()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const { name, nickname, gender, birthDate, zodiac, pin, avatarUrl } = await req.json()
        if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })

        const [newUser] = await db.insert(users).values({
            name,
            nickname: nickname || null,
            gender: gender || 'OTHER',
            birthDate: birthDate ? new Date(birthDate) : null,
            zodiac: zodiac || null,
            pin: pin || null,
            avatarUrl: avatarUrl || null,
            role: 'CHILD'
        }).returning()

        await db.insert(accountStats).values({
            userId: newUser.id,
            currency: 0,
            goldStars: 0,
            purpleStars: 0,
            angerPenalties: 0
        })

        return NextResponse.json(newUser)
    } catch (error) {
        console.error('Failed to create child:', error)
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}

export async function PATCH(req: NextRequest) {
    if (!await isParent()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const { id, name, nickname, gender, birthDate, zodiac, pin, avatarUrl, isArchived, isDeleted } = await req.json()
        if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })

        const updateData: any = {}
        if (name !== undefined) updateData.name = name
        if (nickname !== undefined) updateData.nickname = nickname
        if (gender !== undefined) updateData.gender = gender
        if (birthDate !== undefined) updateData.birthDate = birthDate ? new Date(birthDate) : null
        if (zodiac !== undefined) updateData.zodiac = zodiac
        if (pin !== undefined) updateData.pin = pin
        if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl
        if (isArchived !== undefined) updateData.isArchived = isArchived
        if (isDeleted !== undefined) updateData.isDeleted = isDeleted

        const [updatedUser] = await db.update(users)
            .set(updateData)
            .where(eq(users.id, id))
            .returning()

        return NextResponse.json(updatedUser)
    } catch (error) {
        console.error('Failed to update child:', error)
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}

export async function DELETE(req: NextRequest) {
    if (!await isParent()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const { id } = await req.json()
        if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })

        await db.update(users)
            .set({ isDeleted: true })
            .where(eq(users.id, id))

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Failed to delete child:', error)
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}
