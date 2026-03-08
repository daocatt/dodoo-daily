'use client'

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
    Star,
    Coins,
    ShieldCheck,
    Power,
    Users,
    TrendingUp,
    Scale,
    Ruler,
    X,
    Plus,
    Activity,
    LogOut,
    ArrowLeft
} from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useI18n } from '@/contexts/I18nContext'
import { formatNumber } from '@/lib/utils'

type Stats = {
    goldStars?: number
    purpleStars?: number
    angerPenalties?: number
    currency?: number
    isParent?: boolean
    avatarUrl?: string
    name?: string
    userId?: string
}

export default function AccountHUD() {
    const [stats, setStats] = useState<Stats | null>(null)
    const [children, setChildren] = useState<any[]>([])
    const [showGrowthModal, setShowGrowthModal] = useState(false)
    const [height, setHeight] = useState('')
    const [weight, setWeight] = useState('')
    const [targetChildId, setTargetChildId] = useState('')
    const [isSaving, setIsSaving] = useState(false)
    const [showRechargeModal, setShowRechargeModal] = useState(false)
    const [rechargeAmt, setRechargeAmt] = useState('100')
    const [rechargeType, setRechargeType] = useState<'CURRENCY' | 'GOLD_STAR'>('CURRENCY')

    const pathname = usePathname()
    const router = useRouter()
    const { t } = useI18n()


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
                        if (kids.length > 0 && !targetChildId) setTargetChildId(kids[0].id)
                    }
                }
            } else if (res.status === 401 || res.status === 404) {
                if (!pathname?.startsWith('/login') && !pathname?.startsWith('/setup')) {
                    handleLogout()
                }
            }
        } catch (err) {
            console.error(err)
        }
    }

    const handleLogout = async () => {
        try { await fetch('/api/auth/logout', { method: 'POST' }) } catch (e) { }
        window.location.href = '/login'
    }

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
                // Small delay to ensure DB write is finalized
                setTimeout(() => fetchData(), 200);
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
                    height,
                    weight,
                    date: new Date().toISOString()
                })
            })
            if (res.ok) {
                setShowGrowthModal(false)
                setHeight('')
                setWeight('')
            }
        } finally {
            setIsSaving(false)
        }
    }

    useEffect(() => {
        if (!pathname?.startsWith('/login') && !pathname?.startsWith('/setup')) {
            fetchData()
        }
        const interval = setInterval(() => {
            if (!pathname?.startsWith('/login') && !pathname?.startsWith('/setup')) fetchData()
        }, 30000)
        return () => clearInterval(interval)
    }, [pathname])

    // Hide HUD on specific flows
    const hiddenPrefixes = ['/buy', '/login', '/setup']
    const isGuestFlow = hiddenPrefixes.some(prefix => pathname?.startsWith(prefix))

    // New rule: Hide HUD in sub-pages if user is PARENT
    const subPages = ['/tasks', '/gallery', '/emotions', '/journal', '/shop']
    const isParentInSubPage = stats?.isParent && subPages.some(path => pathname?.startsWith(path))

    if (isGuestFlow || isParentInSubPage || !stats) return null

    // RENDER HELPERS
    const renderParentHUD = () => (
        <div className="flex items-center gap-2 group pointer-events-auto">
            {/* Stats Entry */}
            <Link href="/parent/stats" className="flex items-center gap-1.5 px-3 py-2 hover:opacity-80 transition-all">
                <Users className="w-4 h-4 text-purple-600" />
                <span className="text-xs font-black text-slate-700">{children.length} {children.length === 1 ? 'Child' : 'Children'}</span>
            </Link>

            {/* Parent Wallet - Own Coins & Stars */}
            <div className="flex items-center gap-4 px-2">
                <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setRechargeType('CURRENCY'); setShowRechargeModal(true); fetchData(); }}
                    className="flex items-center gap-1.5 hover:scale-105 active:scale-95 transition-all group/stat pointer-events-auto"
                    title={`Your Coins: ${stats.currency || 0}`}
                >
                    <Coins className="w-4 h-4 text-amber-500" />
                    <span className="text-sm font-black text-slate-700">{formatNumber(stats.currency || 0)}</span>
                    <Plus className="w-3 h-3 text-slate-300 opacity-0 group-hover/stat:opacity-100 transition-opacity" />
                </button>
                <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setRechargeType('GOLD_STAR'); setShowRechargeModal(true); fetchData(); }}
                    className="flex items-center gap-1.5 hover:scale-105 active:scale-95 transition-all group/stat pointer-events-auto"
                    title={`Your Stars: ${stats.goldStars || 0}`}
                >
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-400" />
                    <span className="text-sm font-black text-slate-700">{formatNumber(stats.goldStars || 0)}</span>
                    <Plus className="w-3 h-3 text-slate-300 opacity-0 group-hover/stat:opacity-100 transition-opacity" />
                </button>
            </div>

            {/* Growth Trigger */}
            <button
                onClick={() => setShowGrowthModal(true)}
                className="w-10 h-10 flex items-center justify-center text-emerald-500 hover:scale-110 active:scale-95 transition-all"
            >
                <Activity className="w-5 h-5" />
            </button>

            {/* Dash Link */}
            <Link href="/parent" className="w-10 h-10 flex items-center justify-center text-purple-400 hover:scale-110 transition-all">
                <ShieldCheck className="w-5 h-5" />
            </Link>

            {/* Exit (Unified with Child style) */}
            <button
                onClick={handleLogout}
                className="w-10 h-10 flex items-center justify-center bg-rose-50 hover:bg-rose-100 text-rose-500 rounded-2xl transition-all"
            >
                <Power className="w-4 h-4" />
            </button>
        </div>
    )

    const renderChildHUD = () => (
        <div className="flex items-center gap-4 pointer-events-auto px-2">
            {/* Self Stats Entry - Simplified to Icons + Numbers */}
            <Link href="/parent/stats" className="flex items-center gap-4 hover:opacity-80 transition-opacity">
                {/* Currency */}
                <div className="flex items-center gap-1.5" title={t('hud.coins')}>
                    <Coins className="w-4 h-4 text-amber-500" />
                    <span className="text-sm font-black text-slate-700">{formatNumber(stats.currency || 0)}</span>
                </div>

                {/* Gold Stars */}
                <div className="flex items-center gap-1.5" title={t('hud.goldStars')}>
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-400" />
                    <span className="text-sm font-black text-slate-700">{formatNumber(stats.goldStars || 0)}</span>
                </div>

                {/* Purple Stars */}
                <div className="flex items-center gap-1.5" title="Purple Stars">
                    <Star className="w-4 h-4 text-purple-500 fill-purple-400" />
                    <span className="text-sm font-black text-slate-700">{formatNumber(stats.purpleStars || 0)}</span>
                </div>
            </Link>

            {/* Growth Trigger */}
            <button
                onClick={() => setShowGrowthModal(true)}
                className="w-10 h-10 flex items-center justify-center text-emerald-500 hover:scale-110 transition-all"
            >
                <TrendingUp className="w-5 h-5" />
            </button>

            {/* Exit/Back if in subpage */}
            {pathname !== '/' ? (
                <Link href="/" className="w-10 h-10 bg-white/40 hover:bg-white rounded-2xl flex items-center justify-center">
                    <ArrowLeft className="w-5 h-5 text-slate-400" />
                </Link>
            ) : (
                <button
                    onClick={handleLogout}
                    className="w-10 h-10 bg-rose-50 hover:bg-rose-100 text-rose-500 rounded-2xl flex items-center justify-center"
                >
                    <Power className="w-4 h-4" />
                </button>
            )}
        </div>
    )

    return (
        <>
            <AnimatePresence>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="fixed bottom-6 lg:top-4 lg:bottom-auto left-0 right-0 z-50 pointer-events-none flex justify-center px-4"
                >
                    <div className="flex items-center gap-4 bg-white/60 backdrop-blur-xl border border-white/40 p-1.5 rounded-[24px] shadow-2xl">
                        {/* Avatar */}
                        <div className="pointer-events-auto">
                            <Link href={stats.isParent ? "/parent/stats" : "/parent/stats"} className="group relative block">
                                <motion.div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-white shadow-sm transition-transform group-hover:scale-110">
                                    <img src={stats.avatarUrl || "/dog.svg"} className="w-full h-full object-cover" />
                                </motion.div>
                                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100">
                                    <div className={`w-2 h-2 rounded-full ${stats.isParent ? 'bg-purple-500' : 'bg-emerald-500 animate-pulse'}`} />
                                </div>
                            </Link>
                        </div>

                        {stats.isParent ? renderParentHUD() : renderChildHUD()}
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* Growth Record Modal */}
            <AnimatePresence>
                {showGrowthModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[101] bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4">
                        <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-white w-full max-w-sm rounded-[32px] p-8 shadow-2xl relative">
                            <button onClick={() => setShowGrowthModal(false)} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-900 rounded-full"><X className="w-6 h-6" /></button>
                            <h2 className="text-2xl font-black text-slate-900 mb-6">Record Growth</h2>
                            <form onSubmit={handleSaveGrowth} className="space-y-6">
                                {stats.isParent && children.length > 1 && (
                                    <div>
                                        <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 pl-2">Select Child</label>
                                        <div className="flex gap-2">
                                            {children.map(c => (
                                                <button key={c.id} type="button" onClick={() => setTargetChildId(c.id)} className={`w-12 h-12 rounded-xl overflow-hidden border-4 transition-all ${targetChildId === c.id ? 'border-purple-500' : 'border-transparent opacity-60'}`}>
                                                    <img src={c.avatarUrl || "/dog.svg"} className="w-full h-full object-cover" />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 pl-2">Height (cm)</label>
                                        <input type="number" step="0.1" value={height} onChange={e => setHeight(e.target.value)} className="w-full bg-slate-50 rounded-2xl px-6 py-4 font-bold outline-none border-2 border-transparent focus:border-purple-200" placeholder="0.0" required />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 pl-2">Weight (kg)</label>
                                        <input type="number" step="0.1" value={weight} onChange={e => setWeight(e.target.value)} className="w-full bg-slate-50 rounded-2xl px-6 py-4 font-bold outline-none border-2 border-transparent focus:border-purple-200" placeholder="0.0" required />
                                    </div>
                                </div>
                                <button type="submit" disabled={isSaving} className="w-full bg-slate-900 text-white py-5 rounded-[24px] font-black shadow-xl hover:bg-slate-800 disabled:opacity-50">
                                    {isSaving ? 'SAVING...' : 'SAVE RECORD'}
                                </button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            {/* Recharge Modal */}
            <AnimatePresence>
                {showRechargeModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[101] bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4">
                        <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-white w-full max-w-sm rounded-[32px] p-8 shadow-2xl relative">
                            <button onClick={() => setShowRechargeModal(false)} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-900 rounded-full"><X className="w-6 h-6" /></button>
                            <h2 className="text-2xl font-black text-slate-900 mb-6">Recharge Wallet</h2>
                            <form onSubmit={handleRecharge} className="space-y-6">
                                <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl">
                                    <button
                                        type="button"
                                        onClick={() => setRechargeType('CURRENCY')}
                                        className={`flex-1 py-3 rounded-xl font-black text-xs transition-all ${rechargeType === 'CURRENCY' ? 'bg-white shadow-sm text-amber-600' : 'text-slate-400'}`}
                                    >
                                        COINS
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setRechargeType('GOLD_STAR')}
                                        className={`flex-1 py-3 rounded-xl font-black text-xs transition-all ${rechargeType === 'GOLD_STAR' ? 'bg-white shadow-sm text-yellow-600' : 'text-slate-400'}`}
                                    >
                                        STARS
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 pl-2">Amount</label>
                                    <input
                                        type="number"
                                        value={rechargeAmt}
                                        onChange={e => setRechargeAmt(e.target.value)}
                                        className="w-full bg-slate-50 rounded-2xl px-6 py-4 font-black text-2xl outline-none border-2 border-transparent focus:border-purple-200"
                                        placeholder="0"
                                        required
                                    />
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {[10, 50, 100, 500, 1000].map(val => (
                                            <button
                                                key={val}
                                                type="button"
                                                onClick={() => setRechargeAmt(val.toString())}
                                                className="px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-bold text-slate-500"
                                            >
                                                +{val}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <button type="submit" disabled={isSaving} className="w-full bg-slate-900 text-white py-5 rounded-[24px] font-black shadow-xl hover:bg-slate-800 disabled:opacity-50">
                                    {isSaving ? 'PROCESSING...' : 'CONFIRM RECHARGE'}
                                </button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}
