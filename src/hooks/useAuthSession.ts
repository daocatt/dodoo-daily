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
            // 1. Check Family Member Session
            const statsRes = await fetch('/api/public/session')
            if (statsRes.ok) {
                const data = await statsRes.json()
                if (data && (data.id || data.userId)) {
                    setUser({
                        id: data.id || data.userId,
                        name: data.name,
                        nickname: data.nickname,
                        avatarUrl: data.avatarUrl,
                        role: data.role,
                        slug: data.slug
                    })
                }
            } else {
                setUser(null)
            }

            // 2. Check Visitor Session
            const storedVisitor = localStorage.getItem('visitor_data')
            if (storedVisitor) {
                try {
                    const vData = JSON.parse(storedVisitor)
                    setVisitor(vData)
                } catch {
                    setVisitor(null)
                }
            } else {
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
        
        // Listen for storage changes (visitor login/logout)
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'visitor_data') fetchSession()
        }
        window.addEventListener('storage', handleStorageChange)
        return () => window.removeEventListener('storage', handleStorageChange)
    }, [fetchSession])

    const logout = useCallback(() => {
        // Only clear visitor for now in public pages
        // Family member logout usually happens via /api/auth/logout which clears cookies
        localStorage.removeItem('visitor_data')
        document.cookie = 'dodoo_visitor_id=; path=/; max-age=0'
        setVisitor(null)
        // If they want to logout family member, redirect to logout endpoint
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
