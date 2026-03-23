'use client'

import { useState, useEffect, useCallback } from 'react'

export interface AuthSession {
    user: {
        id: string
        name: string
        nickname?: string | null
        avatarUrl?: string | null
        role: 'PARENT' | 'CHILD'
        slug: string
        email?: string | null
        phone?: string | null
        address?: string | null
    } | null
    visitor: {
        id: string
        name: string
        currency: number
        email?: string | null
        phone?: string | null
    } | null
    loading: boolean
    isFamily: boolean
    isVisitor: boolean
    isAuthenticated: boolean
    logout: () => void
    refresh: () => Promise<void>
}

export function useAuthSession() {
    const [user, setUser] = useState<AuthSession['user']>(null)
    const [visitor, setVisitor] = useState<AuthSession['visitor']>(null)
    const [loading, setLoading] = useState(true)

    const fetchSession = useCallback(async () => {
        setLoading(true)
        try {
            // Check Unified Session API
            const res = await fetch('/api/public/session')
            if (res.ok) {
                const data = await res.json()
                setUser(data.user || null)
                setVisitor(data.visitor || null)
            } else {
                setUser(null)
                setVisitor(null)
            }
        } catch (err) {
            console.error('[AuthSession] Sync failed:', err)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchSession()
        
        // Listen for storage changes as a fallback/trigger
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'visitor_data' || e.key === 'dodoo_session_trigger') fetchSession()
        }
        window.addEventListener('storage', handleStorageChange)
        return () => window.removeEventListener('storage', handleStorageChange)
    }, [fetchSession])

    const logout = useCallback(async () => {
        try {
            // 1. Call Server-side Logout (Crucial for HttpOnly cookies)
            await fetch('/api/auth/logout', { method: 'POST' })
        } catch (err) {
            console.warn('[AuthSession] Server logout failed, falling back to client-only:', err)
        }

        // 2. Client-side explicit cleanup (fallback for non-HttpOnly)
        document.cookie = 'dodoo_session=; path=/; max-age=0'
        document.cookie = 'dodoo_visitor_session=; path=/; max-age=0'
        
        // 3. Storage cleanup
        localStorage.removeItem('visitor_data')
        
        // 4. Update state
        setUser(null)
        setVisitor(null)
    }, [])

    return {
        user,
        visitor,
        loading,
        isFamily: !!user,
        isVisitor: !!visitor,
        isAuthenticated: !!user || !!visitor,
        logout,
        refresh: fetchSession
    }
}
