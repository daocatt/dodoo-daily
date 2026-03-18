import { cookies } from 'next/headers'
import { SignJWT, jwtVerify } from 'jose' // trigger refresh

const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || 'dodoo-daily-default-secret-change-me-in-production'
)

/**
 * Clean potential quotes from cookie values (sometimes happens in certain environments)
 */
function cleanValue(val: string | undefined) {
    if (!val) return undefined
    return val.replace(/^["']|["']$/g, '').trim()
}

/**
 * Sign a JWT for a user session
 */
export async function signSessionJWT(userId: string, role: string) {
    return await new SignJWT({ userId, role })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('365d') // Long-lived session as per user preference
        .sign(JWT_SECRET)
}

/**
 * Get the current session user from JWT or legacy cookies
 */
export async function getSessionUser() {
    const cookieStore = await cookies()
    const token = cookieStore.get('dodoo_session')?.value
    const legacyUserId = cleanValue(cookieStore.get('dodoo_user_id')?.value)
    const legacyRole = cleanValue(cookieStore.get('dodoo_role')?.value)

    // 1. Try JWT first
    if (token) {
        try {
            const { payload } = await jwtVerify(token, JWT_SECRET)
            return {
                userId: payload.userId as string,
                role: payload.role as string
            }
        } catch (e) {
            console.error('JWT verification failed:', e)
            // If JWT fails, we might still have legacy cookies (or and invalid JWT)
        }
    }

    // 2. Fallback to legacy cookies (to prevent logging out all users immediately)
    // We should migrate them to JWT upon next login
    return {
        userId: legacyUserId,
        role: legacyRole
    }
}
