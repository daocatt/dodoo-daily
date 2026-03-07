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
    name?: string
}

export default function AccountHUD() {
    const [stats, setStats] = useState<Stats | null>(null)
    const [children, setChildren] = useState<any[]>([])
    const pathname = usePathname()
    const router = useRouter()
    const { t } = useI18n()

    // Don't show HUD on checkout, auth flows, or any specific module pages
    const hiddenPrefixes = ['/buy', '/login', '/journal', '/task', '/gallery', '/emotion', '/shop']
    const isGuestFlow = hiddenPrefixes.some(prefix => pathname?.startsWith(prefix))

    const fetchData = async () => {
        try {
            const res = await fetch('/api/stats')
            if (res.ok) {
                const data = await res.json()
                setStats(data)

                if (data.isParent) {
                    const cRes = await fetch('/api/parent/children')
                    if (cRes.ok) {
                        const kids = await cRes.json()
                        setChildren(kids)
                    }
                }
            } else if (res.status === 401) {
                // If on homepage or other app pages but not auth flow
                if (!pathname?.startsWith('/login')) {
                    router.push('/login')
                }
            }
        } catch (err) {
            console.error(err)
        }
    }

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' })
        window.location.href = '/login'
    }

    useEffect(() => {
        if (!isGuestFlow) {
            fetchData()
            const interval = setInterval(fetchData, 15000)
            return () => clearInterval(interval)
        }
    }, [pathname, isGuestFlow])

    if (isGuestFlow || !stats) return null

    const totalCoins = children.reduce((acc, c) => acc + (c.stats?.currency || 0), 0)
    const totalStars = children.reduce((acc, c) => acc + (c.stats?.goldStars || 0), 0)

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -50 }}
                animate={{ opacity: 1, y: 0 }}
                className="fixed top-4 left-1/2 -translate-x-1/2 z-50 pointer-events-none w-full max-w-2xl px-4 flex justify-center"
            >
                <div className="bg-white/60 backdrop-blur-xl border border-[#4a3728]/10 shadow-lg px-4 py-2 rounded-full flex items-center justify-between pointer-events-auto min-w-[320px]">
                    <div className="flex items-center gap-4">
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
                            <div className="flex items-center gap-3 pr-2 border-r border-[#4a3728]/5">
                                <Link href="/parent" className="flex items-center gap-2 group">
                                    <div className="bg-purple-500 p-1.5 rounded-full shadow-inner border border-purple-400 group-hover:scale-110 transition-transform">
                                        <ShieldCheck className="w-4 h-4 text-white" />
                                    </div>
                                    <span className="font-black text-[#4a3728] text-xs group-hover:text-purple-600 transition-colors uppercase tracking-tight">{t('hud.parentMode')}</span>
                                </Link>

                                <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-1" title="Combined Coins">
                                        <Coins className="w-3.5 h-3.5 text-yellow-600" />
                                        <span className="text-xs font-black text-slate-600">{totalCoins}</span>
                                    </div>
                                    <div className="flex items-center gap-1" title="Combined Stars">
                                        <Star className="w-3.5 h-3.5 text-orange-400 fill-orange-400" />
                                        <span className="text-xs font-black text-slate-600">{totalStars}</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-3 pr-2 border-r border-[#4a3728]/5">
                                {/* Currency */}
                                <div className="flex items-center gap-1.5" title={t('hud.coins')}>
                                    <div className="bg-[#f8961e] p-1 rounded-full shadow-inner">
                                        <Coins className="w-3.5 h-3.5 text-white" />
                                    </div>
                                    <span className="text-sm font-bold text-[#4a3728]">{stats.currency}</span>
                                </div>

                                {/* Gold Stars */}
                                <div className="flex items-center gap-1" title={t('hud.goldStars')}>
                                    <Star className="w-4 h-4 text-[#f9c74f] fill-[#f9c74f]" />
                                    <span className="text-sm font-bold text-[#4a3728]">{stats.goldStars}</span>
                                </div>
                            </div>
                        )}

                    </div>

                    <button
                        onClick={handleLogout}
                        className="p-2 rounded-full hover:bg-rose-50 text-slate-400 hover:text-rose-500 transition-colors"
                        title={t('hud.logout')}
                    >
                        <Power className="w-4 h-4" />
                    </button>
                </div>
            </motion.div>
        </AnimatePresence >
    )
}
