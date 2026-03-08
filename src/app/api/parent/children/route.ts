import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users, accountStats } from '@/lib/schema'
import { eq, and, not, or } from 'drizzle-orm'
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
            chineseZodiac: users.chineseZodiac,
            avatarUrl: users.avatarUrl,
            role: users.role,
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
            .where(not(eq(users.role, 'PARENT')))
            .all()

        const formattedChildren = children.map(child => {
            if (child.zodiac && child.zodiac.includes(' - ')) {
                child.zodiac = child.zodiac.split(' - ').pop() || child.zodiac;
            }
            return {
                ...child,
                // The primary 'name' used by the whole system will now be the nickname if available
                displayName: child.nickname || child.name,
                realName: child.name,
                name: child.nickname || child.name
            };
        });

        return NextResponse.json(formattedChildren)
    } catch (error) {
        console.error('Failed to fetch children:', error)
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    if (!await isParent()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const body = await req.json()
        const { name, nickname, gender, birthDate, pin, avatarUrl, role } = body
        let { zodiac, chineseZodiac } = body
        if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })

        if (birthDate) {
            const { getZodiac, getChineseZodiac } = await import('@/lib/utils');
            if (!zodiac) zodiac = getZodiac(new Date(birthDate));
            if (!chineseZodiac) chineseZodiac = getChineseZodiac(new Date(birthDate));
        }

        // Check uniqueness
        const conditions = [eq(users.name, name)];
        if (nickname) conditions.push(eq(users.nickname, nickname));

        const existing = await db.select().from(users).where(or(...conditions)).all();
        if (existing.length > 0) {
            const hasSameName = existing.some(u => u.name === name);
            const hasSameNickname = nickname && existing.some(u => u.nickname === nickname);
            if (hasSameName) return NextResponse.json({ error: 'Real Name already exists' }, { status: 400 });
            if (hasSameNickname) return NextResponse.json({ error: 'Nickname already exists' }, { status: 400 });
        }

        const [newUser] = await db.insert(users).values({
            name,
            nickname: nickname || null,
            gender: gender || 'OTHER',
            birthDate: birthDate ? new Date(birthDate) : null,
            zodiac: zodiac || null,
            chineseZodiac: chineseZodiac || null,
            pin: pin || null,
            avatarUrl: avatarUrl || null,
            role: role || 'CHILD'
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
        const body = await req.json()
        const { id, name, nickname, gender, birthDate, pin, avatarUrl, role, isArchived, isDeleted } = body
        let { zodiac, chineseZodiac } = body
        if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })

        if (birthDate !== undefined) {
            const { getZodiac, getChineseZodiac } = await import('@/lib/utils');
            if (!zodiac) zodiac = birthDate ? getZodiac(new Date(birthDate)) : null;
            if (!chineseZodiac) chineseZodiac = birthDate ? getChineseZodiac(new Date(birthDate)) : null;
        }

        // Check uniqueness
        if (name || nickname) {
            const conditions = [];
            if (name) conditions.push(eq(users.name, name));
            if (nickname) conditions.push(eq(users.nickname, nickname));

            if (conditions.length > 0) {
                const existing = await db.select().from(users).where(
                    and(
                        not(eq(users.id, id)),
                        or(...conditions)
                    )
                ).all();

                if (existing.length > 0) {
                    const hasSameName = name && existing.some(u => u.name === name);
                    const hasSameNickname = nickname && existing.some(u => u.nickname === nickname);
                    if (hasSameName) return NextResponse.json({ error: 'Real Name already exists' }, { status: 400 });
                    if (hasSameNickname) return NextResponse.json({ error: 'Nickname already exists' }, { status: 400 });
                }
            }
        }

        const updateData: any = {}
        if (name !== undefined) updateData.name = name
        if (nickname !== undefined) updateData.nickname = nickname
        if (gender !== undefined) updateData.gender = gender
        if (birthDate !== undefined) updateData.birthDate = birthDate ? new Date(birthDate) : null
        if (zodiac !== undefined) updateData.zodiac = zodiac
        if (chineseZodiac !== undefined) updateData.chineseZodiac = chineseZodiac
        if (pin !== undefined) updateData.pin = pin
        if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl
        if (role !== undefined) updateData.role = role
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
