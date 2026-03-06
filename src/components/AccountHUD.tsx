'use client'

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Star, Zap, CircleDashed, Coins, ShieldCheck, Power } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'

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
                <div className="bg-white/40 backdrop-blur-xl border border-white/50 shadow-lg px-4 py-2 rounded-full flex items-center justify-between pointer-events-auto min-w-[300px]">
                    <div className="flex items-center gap-5">
                        {/* App Logo / User Avatar */}
                        <Link href="/">
                            <motion.div
                                whileHover={{ scale: 1.1 }}
                                className="w-10 h-10 bg-white/60 rounded-full overflow-hidden border border-white/80 shadow-sm flex items-center justify-center -ml-2"
                            >
                                <img src={stats.avatarUrl || "/dog.svg"} alt="User Avatar" className={`w-full h-full object-cover ${!stats.avatarUrl && 'p-1.5'}`} />
                            </motion.div>
                        </Link>

                        {stats.isParent ? (
                            <div className="flex items-center gap-2 pr-4">
                                <div className="bg-purple-500 p-1.5 rounded-full shadow-inner border border-purple-400">
                                    <ShieldCheck className="w-4 h-4 text-white" />
                                </div>
                                <span className="font-bold text-purple-700">Parent Mode</span>
                            </div>
                        ) : (
                            <>
                                {/* Currency */}
                                <div className="flex items-center gap-1.5" title="Coins (金币)">
                                    <div className="bg-amber-400 p-1.5 rounded-full shadow-inner border border-amber-300">
                                        <Coins className="w-4 h-4 text-white" />
                                    </div>
                                    <span className="font-black text-amber-700">{stats.currency}</span>
                                </div>

                                <div className="w-px h-6 bg-white/50 hidden sm:block" />

                                {/* Gold Stars */}
                                <div className="flex items-center gap-1.5 hidden sm:flex" title="Task Gold Stars (任务金星)">
                                    <Star className="w-5 h-5 text-yellow-400 fill-yellow-400 drop-shadow-sm" />
                                    <span className="font-bold text-[#6b5c45]">{stats.goldStars}</span>
                                </div>

                                {/* Purple Stars */}
                                <div className="flex items-center gap-1.5 hidden sm:flex" title="Art Purple Stars (艺术紫星)">
                                    <Zap className="w-5 h-5 text-purple-500 fill-purple-400 drop-shadow-sm" />
                                    <span className="font-bold text-[#6b5c45]">{stats.purpleStars}</span>
                                </div>

                                <div className="w-px h-6 bg-white/50 hidden sm:block" />

                                {/* Anger Penalties */}
                                <div className="flex items-center gap-1.5" title="Anger Penalties (发脾气惩罚)">
                                    <CircleDashed className="w-5 h-5 text-slate-500 fill-slate-200 drop-shadow-sm" />
                                    <span className="font-bold text-slate-600">{stats.angerPenalties}</span>
                                </div>
                            </>
                        )}
                    </div>

                    <button
                        onClick={handleLogout}
                        className="ml-4 p-2 rounded-full hover:bg-white/50 text-slate-500 hover:text-red-500 transition-colors"
                        title="Logout"
                    >
                        <Power className="w-5 h-5" />
                    </button>
                </div>
            </motion.div>
        </AnimatePresence>
    )
}
