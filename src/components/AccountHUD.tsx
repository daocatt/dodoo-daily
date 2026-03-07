'use client'

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Star, Zap, CircleDashed, Coins, ShieldCheck, Power } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useI18n } from '@/contexts/I18nContext'

type Stats = {
    goldStars?: number
    purpleStars?: number
    angerPenalties?: number
    currency?: number
    isParent?: boolean
    avatarUrl?: string
}

export default function AccountHUD() {
    const [stats, setStats] = useState<Stats | null>(null)
    const pathname = usePathname()
    const router = useRouter()
    const { t } = useI18n()

    // Don't show HUD on checkout or specific external views if needed (like /buy)
    const isGuestFlow = pathname?.startsWith('/buy') || pathname?.startsWith('/login')

    const fetchStats = async () => {
        try {
            const res = await fetch('/api/stats')
            if (res.ok) {
                const data = await res.json()
                setStats(data)
            } else if (res.status === 401) {
                router.push('/login')
            }
        } catch (err) {
            console.error(err)
        }
    }

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' })
        window.location.href = '/login'
    }

    // Refresh HUD on pathname change (simple navigation reactivity)
    useEffect(() => {
        if (!isGuestFlow) {
            fetchStats()
            // Also poll every 10 seconds just to stay updated if parent modifies it via remote
            const interval = setInterval(fetchStats, 10000)
            return () => clearInterval(interval)
        }
    }, [pathname, isGuestFlow])

    if (isGuestFlow || !stats) return null

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -50 }}
                animate={{ opacity: 1, y: 0 }}
                className="fixed top-4 left-1/2 -translate-x-1/2 z-50 pointer-events-none w-full max-w-2xl px-4 flex justify-center"
            >
                <div className="bg-white/60 backdrop-blur-xl border border-[#4a3728]/10 shadow-md px-4 py-2 rounded-2xl flex items-center justify-between pointer-events-auto min-w-[300px]">
                    <div className="flex items-center gap-5">
                        {/* App Logo / User Avatar */}
                        <Link href="/">
                            <motion.div
                                whileHover={{ scale: 1.1 }}
                                className="w-10 h-10 bg-white/60 rounded-full overflow-hidden border border-white/80 shadow-sm flex items-center justify-center -ml-2"
                            >
                                <img
                                    src={`${stats.avatarUrl || "/dog.svg"}?v=4`}
                                    alt="User Avatar"
                                    className={`w-full h-full object-cover ${!stats.avatarUrl ? 'p-1.5' : ''}`}
                                    onError={(e) => { e.currentTarget.src = "/dog.svg"; e.currentTarget.className = "w-full h-full object-contain p-1.5"; }}
                                />
                            </motion.div>
                        </Link>

                        {stats.isParent ? (
                            <div className="flex items-center gap-2 pr-4">
                                <div className="bg-purple-500 p-1.5 rounded-full shadow-inner border border-purple-400">
                                    <ShieldCheck className="w-4 h-4 text-white" />
                                </div>
                                <span className="font-bold text-[#4a3728]">{t('hud.parentMode')}</span>
                            </div>
                        ) : (
                            <>
                                {/* Currency */}
                                <div className="flex items-center gap-1.5" title={t('hud.coins')}>
                                    <div className="bg-[#f8961e] p-1.5 rounded-lg shadow-inner border border-white/20">
                                        <Coins className="w-4 h-4 text-white" />
                                    </div>
                                    <span className="font-bold text-[#4a3728]">{stats.currency}</span>
                                </div>

                                <div className="w-px h-6 bg-[#4a3728]/10 hidden sm:block" />

                                {/* Gold Stars */}
                                <div className="flex items-center gap-1.5 hidden sm:flex" title={t('hud.goldStars')}>
                                    <Star className="w-5 h-5 text-[#f9c74f] fill-[#f9c74f] drop-shadow-sm" />
                                    <span className="font-bold text-[#4a3728]">{stats.goldStars}</span>
                                </div>

                                {/* Purple Stars */}
                                <div className="flex items-center gap-1.5 hidden sm:flex" title={t('hud.purpleStars')}>
                                    <Zap className="w-5 h-5 text-[#277da1] fill-[#277da1] drop-shadow-sm" />
                                    <span className="font-bold text-[#4a3728]">{stats.purpleStars}</span>
                                </div>

                                <div className="w-px h-6 bg-[#4a3728]/10 hidden sm:block" />

                                {/* Anger Penalties */}
                                <div className="flex items-center gap-1.5" title={t('hud.penalties')}>
                                    <CircleDashed className="w-5 h-5 text-[#907a67] drop-shadow-sm" />
                                    <span className="font-bold text-[#907a67]">{stats.angerPenalties}</span>
                                </div>
                            </>
                        )}
                    </div>

                    <button
                        onClick={handleLogout}
                        className="ml-4 p-2 rounded-full hover:bg-white/50 text-slate-500 hover:text-red-500 transition-colors"
                        title={t('hud.logout')}
                    >
                        <Power className="w-5 h-5" />
                    </button>
                </div>
            </motion.div>
        </AnimatePresence >
    )
}
