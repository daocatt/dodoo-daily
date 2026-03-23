import { cookies } from 'next/headers'
import { SignJWT, jwtVerify } from 'jose' // trigger refresh

const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || 'dodoo-daily-default-secret-change-me-in-production'
)



/**
 * Sign a JWT for a user session
 */
export async function signSessionJWT(userId: string, role: string) {
    return await new SignJWT({ userId, role, type: 'FAMILY' })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('365d') 
        .sign(JWT_SECRET)
}

/**
 * Sign a JWT for a visitor session
 */
export async function signVisitorJWT(visitorId: string) {
    return await new SignJWT({ visitorId, type: 'VISITOR' })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('30d')
        .sign(JWT_SECRET)
}

/**
 * Lightweight verification for Proxy/Middleware
 */
export async function verifyJWT(token: string) {
    try {
        const { payload } = await jwtVerify(token, JWT_SECRET)
        return payload
    } catch (e) {
        return null
    }
}

import { db } from './db'
import { users } from './schema'
import { eq, and } from 'drizzle-orm'

/**
 * Get the current session user from JWT or legacy cookies
 * Verifies existence in database to prevent ghost sessions
 */
export async function getSessionUser() {
    const cookieStore = await cookies()
    const token = cookieStore.get('dodoo_session')?.value

    let currentUserId: string | undefined

    // 1. Try JWT first
    if (token) {
        try {
            const { payload } = await jwtVerify(token, JWT_SECRET)
            currentUserId = payload.userId as string
        } catch (e) {
            console.error('JWT verification failed:', e)
        }
    }

    if (!currentUserId) return null

    // 3. PHYSICAL VERIFICATION - Ensure user still exists and not deleted/archived
    // This is crucial after DB resets or user deletions
    try {
        const userRecord = await db.select().from(users).where(
            and(
                eq(users.id, currentUserId),
                eq(users.isDeleted, false)
            )
        ).get()

        if (!userRecord) {
            console.warn(`[Auth] Session user ${currentUserId} not found in database or deleted`)
            return null
        }

        return {
            id: userRecord.id,
            userId: userRecord.id,
            role: userRecord.role
        }
    } catch (dbError) {
        console.error('[Auth] Database check failed during session validation:', dbError)
        return null
    }
}
