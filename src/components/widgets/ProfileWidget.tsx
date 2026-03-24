'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Coins, Star, Trophy, User, Scale, Ruler } from 'lucide-react'
import { useI18n } from '@/contexts/I18nContext'
import Image from 'next/image'

interface UserStats {
    name: string
    nickname: string
    avatarUrl: string | null
    currency: number
    goldStars: number
    purpleStars: number
    isAdmin: boolean
}

interface GrowthRecord {
    height: number | null
    weight: number | null
    date: string
}

export default function ProfileWidget() {
    const { t } = useI18n()
    const [stats, setStats] = useState<UserStats | null>(null)
    const [growthRecords, setGrowthRecords] = useState<GrowthRecord[]>([])

    useEffect(() => {
        fetch('/api/stats')
            .then(res => res.json())
            .then(data => setStats(data))

        fetch('/api/growth')
            .then(res => res.json())
            .then(data => setGrowthRecords(data))
    }, [])

    if (!stats) return (
        <div className="w-full h-full bg-white/40 backdrop-blur-md rounded-3xl animate-pulse border border-white/20" />
    )

    const totalStars = stats.goldStars + stats.purpleStars
    const level = Math.floor(totalStars / 20) + 1
    const progress = (totalStars % 20) * 5 // Progress to next level (0-100%)

    const latestGrowth = growthRecords.length > 0 ? growthRecords[0] : null

    return (
        <motion.div
            whileHover={{ scale: 1.01 }}
            className="w-full h-full bg-white/60 backdrop-blur-xl rounded-3xl p-6 lg:p-8 border border-white/40 shadow-xl shadow-slate-200/50 flex flex-col justify-between group overflow-hidden relative"
        >
            {/* Background Accent */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-[60px] rounded-full -mr-16 -mt-16 group-hover:bg-indigo-500/10 transition-colors" />

            <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <div className="w-16 h-16 rounded-3xl border-4 border-white shadow-xl overflow-hidden bg-slate-100 transition-transform group-hover:scale-110">
                            {stats.avatarUrl ? (
                                <Image 
                                    src={stats.avatarUrl} 
                                    alt={stats.name} 
                                    width={80} 
                                    height={80} 
                                    className="w-full h-full object-cover" 
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-400">
                                    <User className="w-8 h-8" />
                                </div>
                            )}
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-amber-400 rounded-xl border-2 border-white flex items-center justify-center text-[10px] font-black text-amber-900 shadow-lg">
                            {level}
                        </div>
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-slate-800 tracking-tight leading-none mb-1">{stats.nickname || stats.name}</h3>
                        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-900/5 rounded-full w-fit">
                            <Trophy className="w-3 h-3 text-indigo-500" />
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('widget.profile.explorer')}</span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col items-end">
                    <div className="flex -space-x-2">
                        <div className="w-8 h-8 rounded-full bg-amber-100 border-2 border-white flex items-center justify-center shadow-sm">
                            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                        </div>
                        <div className="w-8 h-8 rounded-full bg-indigo-100 border-2 border-white flex items-center justify-center shadow-sm">
                            <Coins className="w-4 h-4 text-indigo-500" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Growth Stats Row */}
            <div className="grid grid-cols-2 gap-4 my-4">
                <div className="bg-slate-50/80 rounded-2xl p-3 border border-slate-100 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm text-blue-500">
                        <Ruler className="w-4 h-4" />
                    </div>
                    <div>
                        <span className="text-[8px] font-black text-slate-300 uppercase block tracking-tighter">{t('widget.profile.height')}</span>
                        <span className="text-xs font-black text-slate-700">{latestGrowth?.height ? `${latestGrowth.height} cm` : '--'}</span>
                    </div>
                </div>
                <div className="bg-slate-50/80 rounded-2xl p-3 border border-slate-100 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm text-emerald-500">
                        <Scale className="w-4 h-4" />
                    </div>
                    <div>
                        <span className="text-[8px] font-black text-slate-300 uppercase block tracking-tighter">{t('widget.profile.weight')}</span>
                        <span className="text-xs font-black text-slate-700">{latestGrowth?.weight ? `${latestGrowth.weight} kg` : '--'}</span>
                    </div>
                </div>
            </div>

            {/* Growth Progress Bar */}
            <div className="space-y-2">
                <div className="flex justify-between items-end px-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('widget.profile.growthLevel', { level: level.toString() })}</span>
                    <span className="text-[10px] font-black text-indigo-500 uppercase">{totalStars % 20} / 20 ⭐</span>
                </div>
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-white/50">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        className="h-full bg-gradient-to-r from-indigo-500 to-blue-400 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.2)]"
                    />
                </div>
            </div>

            {/* Currency Stats */}
            <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="bg-[#FFFBEB] p-4 rounded-3xl border border-amber-100 flex flex-col items-center justify-center group/stat transition-all hover:bg-amber-100/50">
                    <div className="flex items-center gap-2 mb-1">
                        <Coins className="w-4 h-4 text-amber-500 group-hover/stat:rotate-12 transition-transform" />
                        <span className="text-sm font-black text-amber-700">{stats.currency}</span>
                    </div>
                    <span className="text-[9px] font-black text-amber-400/80 uppercase tracking-[0.2em]">{t('hud.coins')}</span>
                </div>
                <div className="bg-[#EEF2FF] p-4 rounded-3xl border border-indigo-100 flex flex-col items-center justify-center group/stat transition-all hover:bg-indigo-100/50">
                    <div className="flex items-center gap-2 mb-1">
                        <Star className="w-4 h-4 text-indigo-500 fill-indigo-500 group-hover/stat:scale-110 transition-transform" />
                        <span className="text-sm font-black text-indigo-700">{totalStars}</span>
                    </div>
                    <span className="text-[9px] font-black text-indigo-400/80 uppercase tracking-[0.2em]">{t('hud.goldStars')}</span>
                </div>
            </div>
        </motion.div>
    )
}
