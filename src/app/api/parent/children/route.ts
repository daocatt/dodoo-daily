import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users, accountStats, systemSettings } from '@/lib/schema'
import { eq, and, not, or } from 'drizzle-orm'
import { getSessionUser } from '@/lib/auth'

async function checkIsAdmin() {
    const user = await getSessionUser()
    if (!user) return false
    return user.permissionRole === 'SUPERADMIN' || user.permissionRole === 'ADMIN' || user.role === 'PARENT'
}

async function getPermissionContext() {
    const user = await getSessionUser()
    return {
        id: user?.id,
        isSuperAdmin: user?.permissionRole === 'SUPERADMIN',
        isAdmin: user?.permissionRole === 'SUPERADMIN' || user?.permissionRole === 'ADMIN' || user?.role === 'PARENT'
    }
}

export async function GET() {
    if (!await checkIsAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

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
            slug: users.slug,
            exhibitionEnabled: users.exhibitionEnabled,
            role: users.role,
            isArchived: users.isArchived,
            isDeleted: users.isDeleted,
            isLocked: users.isLocked,
            permissionRole: users.permissionRole,
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
            .where(not(eq(users.permissionRole, 'SUPERADMIN')))
            .all()

        const formattedChildren = children.map(child => {
            if (child.zodiac && child.zodiac.includes(' - ')) {
                child.zodiac = child.zodiac.split(' - ').pop() || child.zodiac;
            }
            return {
                ...child,
                avatar: child.avatarUrl,
                avatarUrl: child.avatarUrl,
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
    if (!await checkIsAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const body = await req.json()
        const { name, nickname, gender, birthDate, pin, avatarUrl, role, slug, exhibitionEnabled } = body
        let { zodiac, chineseZodiac } = body
        if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })

        if (birthDate) {
            const { getZodiac, getChineseZodiac } = await import('@/lib/utils');
            if (!zodiac) zodiac = getZodiac(new Date(birthDate));
            if (!chineseZodiac) chineseZodiac = getChineseZodiac(new Date(birthDate));
        }
        
        const { generateNumericSlug } = await import('@/lib/utils');
        let finalSlug = slug;

        // If slug is provided, validate it. If not, generate an 8-digit number.
        if (finalSlug) {
            finalSlug = finalSlug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
            if (finalSlug.length < 6) {
                return NextResponse.json({ error: 'Slug must be at least 6 characters' }, { status: 400 });
            }
        } else {
            finalSlug = generateNumericSlug(8);
        }

        // Check uniqueness and handle collisions
        for (let attempt = 0; attempt < 10; attempt++) {
            const existingSlug = await db.select().from(users).where(eq(users.slug, finalSlug)).get();
            if (!existingSlug) break;
            
            if (slug) {
                // If the user provided a slug and it exists, error out
                return NextResponse.json({ error: 'This Link ID is already taken' }, { status: 400 });
            } else {
                // If it was auto-generated, try another one
                finalSlug = generateNumericSlug(8);
            }
        }

        // Additional uniqueness checks for name/nickname
        const sameName = await db.select().from(users).where(eq(users.name, name)).get();
        if (sameName) return NextResponse.json({ error: 'Real Name already exists' }, { status: 400 });
        
        if (nickname) {
            const sameNick = await db.select().from(users).where(eq(users.nickname, nickname)).get();
            if (sameNick) return NextResponse.json({ error: 'Nickname already exists' }, { status: 400 });
        }

        const [newUser] = await db.insert(users).values({
            name,
            nickname: nickname || null,
            slug: finalSlug,
            gender: gender || 'OTHER',
            birthDate: birthDate ? new Date(birthDate) : null,
            zodiac: zodiac || null,
            chineseZodiac: chineseZodiac || null,
            pin: pin || null,
            avatarUrl: avatarUrl || null,
            role: role || 'CHILD',
            exhibitionEnabled: exhibitionEnabled !== undefined ? exhibitionEnabled : true
        }).returning()

        await db.insert(accountStats).values({
            userId: newUser.id,
            currency: 0,
            goldStars: 0,
            purpleStars: 0,
            angerPenalties: 0
        })

        // If a member is added, and the app is still in setup mode (needsSetup = true), clear the setup flag.
        // This covers the case where the user skips setup to explore, then adds their first member later.
        const settings = await db.select().from(systemSettings).where(eq(systemSettings.id, 'app_settings')).get()
        if (settings?.needsSetup) {
            await db.update(systemSettings)
                .set({ needsSetup: false })
                .where(eq(systemSettings.id, 'app_settings'))
        }

        return NextResponse.json(newUser)
    } catch (error) {
        console.error('Failed to create child:', error)
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}

export async function PATCH(req: NextRequest) {
    const auth = await getPermissionContext()
    if (!auth.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const body = await req.json()
        const { id, name, nickname, slug, gender, birthDate, pin, avatarUrl, role, isArchived, isDeleted, exhibitionEnabled, permissionRole } = body
        if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })
        
        // Safety check: Cannot modify SUPERADMIN unless you ARE the SUPERADMIN (and even then, limited)
        const target = await db.select().from(users).where(eq(users.id, id)).get()
        if (target?.permissionRole === 'SUPERADMIN' && !auth.isSuperAdmin) {
            return NextResponse.json({ error: 'Cannot modify Superadmin' }, { status: 403 })
        }
        if (target?.isLocked && !auth.isSuperAdmin) {
            return NextResponse.json({ error: 'Account is locked' }, { status: 403 })
        }

        if (birthDate !== undefined) {
            const { getZodiac, getChineseZodiac } = await import('@/lib/utils');
            if (!zodiac) zodiac = birthDate ? getZodiac(new Date(birthDate)) : null;
            if (!chineseZodiac) chineseZodiac = birthDate ? getChineseZodiac(new Date(birthDate)) : null;
        }

        let validatedSlug = slug;
        if (validatedSlug) {
            validatedSlug = validatedSlug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
            if (validatedSlug.length < 6) {
                return NextResponse.json({ error: 'Slug must be at least 6 characters' }, { status: 400 });
            }
        }
        
        const conditions = [];
        if (name) conditions.push(eq(users.name, name));
        if (nickname) conditions.push(eq(users.nickname, nickname));
        if (validatedSlug) conditions.push(eq(users.slug, validatedSlug));

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
                const hasSameSlug = validatedSlug && existing.some(u => u.slug === validatedSlug);

                if (hasSameName) return NextResponse.json({ error: 'Real Name already exists' }, { status: 400 });
                if (hasSameNickname) return NextResponse.json({ error: 'Nickname already exists' }, { status: 400 });
                if (hasSameSlug) return NextResponse.json({ error: 'This Link ID is already taken' }, { status: 400 });
            }
        }

        const updateData: Partial<typeof users.$inferInsert> = {}
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
        if (exhibitionEnabled !== undefined) updateData.exhibitionEnabled = exhibitionEnabled
        if (validatedSlug !== undefined) updateData.slug = validatedSlug
        
        // ONLY Superadmin can change permissionRole
        if (permissionRole !== undefined && auth.isSuperAdmin) {
            updateData.permissionRole = permissionRole
        }
        else if (nickname !== undefined || name !== undefined) {
             // Optionally auto-update slug if name changes and it wasn't specified? 
             // Better only if it doesn't already have one.
        }

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
    const auth = await getPermissionContext()
    if (!auth.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const { id } = await req.json()
        if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })

        const target = await db.select().from(users).where(eq(users.id, id)).get()
        if (target?.isLocked) {
            return NextResponse.json({ error: 'Cannot delete locked account' }, { status: 403 })
        }
        if (target?.permissionRole === 'SUPERADMIN') {
            return NextResponse.json({ error: 'Cannot delete Superadmin' }, { status: 403 })
        }

        await db.update(users)
            .set({ isDeleted: true })
            .where(eq(users.id, id))

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Failed to delete child:', error)
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}
