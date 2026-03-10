'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'motion/react'
import {
    Users,
    UsersRound,
    Coins,
    Star,
    Plus,
    ChevronRight,
    Trophy,
    TrendingUp,
    Settings,
    LogOut,
    Check,
    X,
    CreditCard,
    Ruler,
    Power
} from 'lucide-react'
import { useI18n } from '@/contexts/I18nContext'
import { clsx } from 'clsx'

interface Stats {
    userId: string
    name: string
    avatar?: string
    isParent: boolean
    coins: number
    goldStars: number
    todayTasks: number
    completedTasks: number
    growthScore: number
}

interface Child {
    id: string
    name: string
    avatar?: string
    coins: number
    goldStars: number
}

export default function AccountHUD() {
    const [stats, setStats] = useState<Stats | null>(null)
    const [children, setChildren] = useState<Child[]>([])
    const [showGrowthModal, setShowGrowthModal] = useState(false)
    const [height, setHeight] = useState('')
    const [weight, setWeight] = useState('')
    const [targetChildId, setTargetChildId] = useState('')
    const [isSaving, setIsSaving] = useState(false)
    const [showRechargeModal, setShowRechargeModal] = useState(false)
    const [rechargeAmt, setRechargeAmt] = useState('100')
    const [rechargeType, setRechargeType] = useState<'CURRENCY' | 'GOLD_STAR'>('CURRENCY')
    const [mounted, setMounted] = useState(false)

    const pathname = usePathname()
    const { t } = useI18n()
    const [isMobile, setIsMobile] = useState(false)

    useEffect(() => {
        const checkMobile = () => window.innerWidth < 610
        setIsMobile(checkMobile())
        const handleResize = () => setIsMobile(checkMobile())
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    const fetchData = useCallback(async () => {
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
                        setTargetChildId(prev => (prev || (kids.length > 0 ? kids[0].id : '')))
                    }
                }
            } else if (res.status === 401 || res.status === 404) {
                if (pathname && !['/login', '/setup'].some(p => pathname.startsWith(p))) {
                    window.location.href = '/login'
                }
            }
        } catch (err) {
            console.error("AccountHUD: Fetch failed", err)
        }
    }, [pathname])

    useEffect(() => {
        setMounted(true)
        if (pathname && !['/login', '/setup'].some(p => pathname.startsWith(p))) {
            fetchData()
        }
        const interval = setInterval(() => {
            if (pathname && !['/login', '/setup'].some(p => pathname.startsWith(p))) fetchData()
        }, 60000)
        return () => clearInterval(interval)
    }, [pathname, fetchData])

    if (!mounted) return null

    const hideOn = ['/buy', '/login', '/setup', '/tasks', '/gallery', '/emotions', '/journal', '/shop', '/parent', '/notes']
    if (!pathname || hideOn.some(prefix => pathname.startsWith(prefix)) || !stats) return null

    const handleRecharge = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSaving(true)
        try {
            const res = await fetch('/api/parent/economy/recharge', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount: parseInt(rechargeAmt), type: rechargeType })
            })
            if (res.ok) {
                setShowRechargeModal(false)
                setTimeout(() => fetchData(), 300)
            }
        } finally {
            setIsSaving(false)
        }
    }

    const handleSaveGrowth = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!targetChildId && stats?.isParent) return
        setIsSaving(true)
        try {
            const res = await fetch('/api/growth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    targetUserId: stats?.isParent ? targetChildId : stats?.userId,
                    height: parseFloat(height),
                    weight: parseFloat(weight),
                    date: new Date().toISOString()
                })
            })
            if (res.ok) {
                setShowGrowthModal(false)
                setHeight('')
                setWeight('')
                fetchData()
            }
        } finally {
            setIsSaving(false)
        }
    }
    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' })
            window.location.href = '/login'
        } catch (error) {
            console.error('Logout failed:', error)
            // Fallback: forcefully redirect
            window.location.href = '/login'
        }
    }

    return (
        <>
            <div
                className={clsx(
                    "fixed left-1/2 -translate-x-1/2 z-[1000] pointer-events-none w-auto max-w-[95vw] px-2 transition-all duration-500",
                    isMobile ? "bottom-6" : "top-6"
                )}
            >
                <motion.div
                    initial={{ y: isMobile ? 100 : -100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="bg-white/80 backdrop-blur-2xl px-4 py-2 rounded-full border border-white/80 shadow-[0_12px_40px_rgba(0,0,0,0.12)] flex items-center gap-3 sm:gap-4 pointer-events-auto ring-1 ring-black/[0.05]"
                >
                    {/* Profile Section */}
                    <div className="flex items-center gap-3 pr-4 border-r border-black/[0.05]">
                        <motion.div
                            whileTap={{ scale: 0.95 }}
                            className="relative cursor-pointer"
                            onClick={() => (window.location.href = '/settings')}
                        >
                            <div className="w-8 h-8 rounded-full bg-slate-100 shadow-sm overflow-hidden flex items-center justify-center border border-black/[0.03]">
                                {stats.avatar && stats.avatar.length > 2 ? (
                                    <img
                                        src={stats.avatar}
                                        alt={stats.name}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.style.display = 'none';
                                            const parent = target.parentElement;
                                            if (parent) {
                                                const span = document.createElement('span');
                                                span.className = "text-[13px] font-black text-slate-400";
                                                span.innerText = stats.name?.[0]?.toUpperCase() || 'U';
                                                parent.appendChild(span);
                                            }
                                        }}
                                    />
                                ) : (
                                    <span className="text-[13px] font-black text-slate-400">{stats.name?.[0]?.toUpperCase() || 'U'}</span>
                                )}
                            </div>
                        </motion.div>
                        <div className="flex flex-col">
                            <span className="text-[11px] font-black text-slate-800 leading-none">{stats.name}</span>
                        </div>
                    </div>

                    {/* Children Section (Parent only) - Hidden on extreme mobile to save space */}
                    {stats.isParent && children.length > 0 && (
                        <Link href="/stats" className="hidden sm:flex items-center gap-1.5 px-1 hover:opacity-70 transition-opacity">
                            <UsersRound className="w-4 h-4 text-slate-400 fill-slate-400 shrink-0" />
                            <span className="text-[13px] font-medium text-slate-600">{children.length}</span>
                        </Link>
                    )}

                    {/* Economy Section */}
                    <div className="flex items-center gap-2 sm:gap-4">
                        {/* Coins */}
                        {stats.isParent ? (
                            <button
                                onClick={() => { setRechargeType('CURRENCY'); setShowRechargeModal(true); }}
                                className="flex items-center gap-1.5 hover:scale-105 active:scale-95 transition-transform"
                            >
                                <Coins className="w-4 h-4 text-amber-500 fill-amber-500" />
                                <span className="text-[13px] font-medium text-slate-600">{stats.coins ?? 0}</span>
                            </button>
                        ) : (
                            <div className="flex items-center gap-1.5">
                                <Coins className="w-4 h-4 text-amber-500 fill-amber-500" />
                                <span className="text-[13px] font-medium text-slate-600">{stats.coins ?? 0}</span>
                            </div>
                        )}

                        {/* Stars */}
                        {stats.isParent ? (
                            <button
                                onClick={() => { setRechargeType('GOLD_STAR'); setShowRechargeModal(true); }}
                                className="flex items-center gap-1.5 hover:scale-105 active:scale-95 transition-transform"
                            >
                                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                <span className="text-[13px] font-medium text-slate-600">{stats.goldStars ?? 0}</span>
                            </button>
                        ) : (
                            <div className="flex items-center gap-1.5">
                                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                <span className="text-[13px] font-medium text-slate-600">{stats.goldStars ?? 0}</span>
                            </div>
                        )}

                        {/* Growth Record */}
                        <button
                            onClick={() => setShowGrowthModal(true)}
                            className="flex items-center text-emerald-600 hover:text-emerald-700 transition-colors p-1"
                            title="Growth Record"
                        >
                            <Ruler className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Close/Exit Action */}
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={handleLogout}
                        className="w-7 h-7 flex items-center justify-center bg-rose-50 rounded-full text-rose-500 hover:bg-rose-500 hover:text-white transition-all ml-1 border border-rose-100"
                    >
                        <Power className="w-4 h-4" />
                    </motion.button>
                </motion.div>
            </div>

            {/* Growth Modal */}
            <AnimatePresence>
                {showGrowthModal && (
                    <div className="fixed inset-0 z-[1100] flex flex-col items-center justify-start p-4 pointer-events-auto overflow-y-auto">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                            onClick={() => setShowGrowthModal(false)}
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative w-full max-w-md bg-white rounded-2xl p-8 shadow-2xl my-auto"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-black text-slate-800 tracking-tight">Growth Record</h3>
                                <button onClick={() => setShowGrowthModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                                    <X className="w-5 h-5 text-slate-400" />
                                </button>
                            </div>

                            <form onSubmit={handleSaveGrowth} className="space-y-5">
                                {stats.isParent && (
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Select Child</label>
                                        <div className="grid grid-cols-2 gap-3">
                                            {children.map(child => (
                                                <button
                                                    key={child.id}
                                                    type="button"
                                                    onClick={() => setTargetChildId(child.id)}
                                                    className={clsx(
                                                        "flex items-center gap-2 p-3 rounded-2xl border-2 transition-all",
                                                        targetChildId === child.id ? "border-emerald-500 bg-emerald-50" : "border-slate-100 bg-slate-50 opacity-60"
                                                    )}
                                                >
                                                    <div className="w-6 h-6 rounded-full bg-emerald-200" />
                                                    <span className="text-xs font-black text-slate-700">{child.name}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Height (cm)</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            value={height}
                                            onChange={e => setHeight(e.target.value)}
                                            className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-emerald-500 outline-none font-black text-slate-700"
                                            placeholder="140"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Weight (kg)</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            value={weight}
                                            onChange={e => setWeight(e.target.value)}
                                            className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-emerald-500 outline-none font-black text-slate-700"
                                            placeholder="35"
                                            required
                                        />
                                    </div>
                                </div>

                                <button
                                    disabled={isSaving}
                                    className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-emerald-200 hover:bg-emerald-600 transition-all disabled:opacity-50"
                                >
                                    {isSaving ? "Saving..." : "Save Growth Data"}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Recharge Modal */}
            <AnimatePresence>
                {showRechargeModal && (
                    <div className="fixed inset-0 z-[1100] flex flex-col items-center justify-start p-4 pointer-events-auto overflow-y-auto">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                            onClick={() => setShowRechargeModal(false)}
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative w-full max-w-md bg-white rounded-2xl p-8 shadow-2xl my-auto"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-black text-slate-800 tracking-tight">Parent Bank</h3>
                                <button onClick={() => setShowRechargeModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                                    <X className="w-5 h-5 text-slate-400" />
                                </button>
                            </div>

                            <form onSubmit={handleRecharge} className="space-y-6">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Asset Type</label>
                                    <div className="flex gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setRechargeType('CURRENCY')}
                                            className={clsx(
                                                "flex-1 flex items-center justify-center gap-2 p-3 rounded-2xl border-2 transition-all",
                                                rechargeType === 'CURRENCY' ? "border-amber-500 bg-amber-50" : "border-slate-100 bg-slate-50"
                                            )}
                                        >
                                            <Coins className="w-4 h-4 text-amber-500" />
                                            <span className="text-xs font-black text-slate-700">Coins</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setRechargeType('GOLD_STAR')}
                                            className={clsx(
                                                "flex-1 flex items-center justify-center gap-2 p-3 rounded-2xl border-2 transition-all",
                                                rechargeType === 'GOLD_STAR' ? "border-indigo-500 bg-indigo-50" : "border-slate-100 bg-slate-50"
                                            )}
                                        >
                                            <Star className="w-4 h-4 text-indigo-500 fill-indigo-500" />
                                            <span className="text-xs font-black text-slate-700">Stars</span>
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Amount</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {['50', '100', '200', '500', '1000', '5000'].map(amt => (
                                            <button
                                                key={amt}
                                                type="button"
                                                onClick={() => setRechargeAmt(amt)}
                                                className={clsx(
                                                    "py-3 rounded-xl border-2 font-black transition-all",
                                                    rechargeAmt === amt ? "border-indigo-600 bg-indigo-50 text-indigo-600" : "border-slate-100 text-slate-400"
                                                )}
                                            >
                                                {amt}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <button
                                    disabled={isSaving}
                                    className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all disabled:opacity-50"
                                >
                                    {isSaving ? "Processing..." : `Recharge ${rechargeAmt} ${rechargeType === 'CURRENCY' ? 'Coins' : 'Stars'}`}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    )
}
