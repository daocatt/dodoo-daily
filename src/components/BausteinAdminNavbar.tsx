'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useI18n } from '@/contexts/I18nContext'
import { usePathname } from 'next/navigation'
import AccountHUD from './AccountHUD'
import { LogoTitle } from './navbar/LogoTitle'
import { BackButton } from './navbar/BackButton'
import { RightMenuModule } from './navbar/RightMenuModule'

interface Stats {
    userId: string
    name: string
    nickname?: string
    avatar?: string
    isAdmin: boolean
    coins: number
    goldStars: number
    role: string
    permissionRole: string
    systemName: string
}

export default function BausteinAdminNavbar({ 
    isEditing, 
    onToggleEdit,
    onBack,
    actions
}: { 
    isEditing?: boolean, 
    onToggleEdit?: () => void,
    onBack?: () => void,
    actions?: React.ReactNode
}) {
    const { locale, setLocale } = useI18n()
    const [stats, setStats] = useState<Stats | null>(null)
    const [status, setStatus] = useState('NOMINAL')
    const pathname = usePathname()

    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' })
            window.location.href = '/admin/login'
        } catch (_error) {
            window.location.href = '/admin/login'
        }
    }

    const fetchData = useCallback(async () => {
        try {
            const res = await fetch('/api/stats')
            if (res.ok) {
                const data = await res.json()
                setStats(data)
            } else if (res.status === 401) {
                handleLogout()
            }
        } catch (_err) {
            setStatus('DEGRADED')
        }
    }, [])

    useEffect(() => {
        const load = async () => {
            await fetchData()
        }
        load()
        const interval = setInterval(fetchData, 60000)
        return () => clearInterval(interval)
    }, [fetchData])

    if (!stats) return null

    const isSubpage = pathname !== '/admin'
    
    // HUD Visibility Logic - ONLY visible on the main dashboard index
    const showHUD = !isSubpage

    // Default back behavior for subpages: return to /admin dashboard
    const handleBack = onBack || (isSubpage ? () => window.location.href = '/admin' : undefined)

    // Dynamic Module Name for Subtitle
    const getSubtitle = () => {
        if (pathname.includes('/tasks')) return 'Tasks'
        if (pathname.includes('/gallery')) return 'Gallery'
        if (pathname.includes('/notes')) return 'Notes'
        if (pathname === '/admin/console') return 'Console'
        if (pathname === '/admin') return 'Dashboard'
        return undefined
    }

    return (
        <header className="sticky top-0 z-[100] w-full bg-transparent px-6 md:px-10 flex items-center justify-between font-sans select-none h-[56px] pointer-events-none">
            {/* Left Section: Logo & Back Button */}
            <div className="flex items-center gap-4 relative z-10 pointer-events-auto">
                <LogoTitle 
                    systemName={stats.systemName} 
                    subtitle={getSubtitle()}
                    status={status} 
                />
                <BackButton onBack={handleBack} />
            </div>

            {/* Center Section: HUD (Telemetry) - Higher z-index to allow modals to cover everything */}
            {showHUD && (
                <div className="flex-1 flex justify-center z-[2000]">
                    <AccountHUD inline />
                </div>
            )}

            {/* Right Section: Right Menu Module */}
            <div className="relative z-10 pointer-events-auto">
                <RightMenuModule
                    stats={stats}
                    pathname={pathname}
                    locale={locale}
                    setLocale={setLocale}
                    isEditing={isEditing}
                    onToggleEdit={onToggleEdit}
                    actions={actions}
                    isSubpage={isSubpage}
                />
            </div>
        </header>
    )
}
