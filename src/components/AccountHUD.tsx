'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'motion/react'
import {
    UsersRound,
    Coins,
    Star,
    X,
    Ruler,
    Power,
    LayoutGrid,
    AlertCircle,
    IdCard,
    SquareActivity,
    Fan
} from 'lucide-react'
import Image from 'next/image'
import { useI18n, Locale } from '@/contexts/I18nContext'
import { clsx } from 'clsx'
import SmartDatePicker from '@/components/SmartDatePicker'

interface Stats {
    userId: string
    name: string
    nickname?: string
    avatar?: string
    isParent: boolean
    coins: number
    slug?: string
    goldStars: number
    todayTasks: number
    completedTasks: number
    growthScore: number
}

interface Child {
    id: string
    name: string
    avatar?: string
    avatarUrl?: string
    coins: number
    goldStars: number
    slug?: string
    birthDate?: string | null
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
    const [recordDate, setRecordDate] = useState<Date>(new Date())
    const [mounted, setMounted] = useState(false)
    const [currentTime, setCurrentTime] = useState(new Date())
    const { t, locale } = useI18n()

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000)
        return () => clearInterval(timer)
    }, [])
    const [isMobile, setIsMobile] = useState(false)
    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' })
            window.location.href = '/admin/login'
        } catch (_error) {
            console.error('Logout failed:', _error)
            window.location.href = '/admin/login'
        }
    }

    useEffect(() => {
        const checkMobile = () => window.innerWidth < 610
        setIsMobile(checkMobile())
        const handleResize = () => setIsMobile(checkMobile())
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    const fetchData = useCallback(async (loadKids = false) => {
        try {
            const res = await fetch('/api/stats')
            if (res.ok) {
                const data = await res.json()
                setStats(data)

                // Sync locale from database to localStorage if no local cache exists (Fresh Start)
                if (data.locale && data.locale !== locale) {
                    const localSaved = localStorage.getItem('dodoo-locale')
                    if (!localSaved && typeof setLocale === 'function') {
                        console.log('[AccountHUD] Fresh start detected, syncing locale from database:', data.locale)
                        setLocale(data.locale as Locale)
                    }
                }

                if (data.isParent && loadKids) {
                    const cRes = await fetch('/api/parent/children')
                    if (cRes.ok) {
                        const kids = await cRes.json()
                        setChildren(kids)
                        setTargetChildId(prev => (prev || (kids.length > 0 ? kids[0].id : '')))
                    }
                }
            } else if (res.status === 401 || res.status === 404) {
                console.warn(`[AccountHUD] Unauthorized (status: ${res.status}), logging out...`)
                handleLogout()
            }
        } catch (_err) {
            console.error("AccountHUD: Fetch failed", _err)
        }
    }, [locale])

    useEffect(() => {
        setMounted(true)
        fetchData(true)
        
        const interval = setInterval(() => {
            fetchData(false)
        }, 60000)
        
        return () => clearInterval(interval)
    }, [fetchData])

    if (!mounted) return null

    if (!stats) return null

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
                    date: recordDate.toISOString()
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

    return (
        <>
            <div className="fixed top-2 left-1/2 -translate-x-1/2 z-[2000] pointer-events-none w-auto max-w-[90vw] px-2 flex items-center justify-center h-[56px]">
                <motion.div
                    initial={{ y: -50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="h-10 bg-[var(--surface-warm)] border-2 border-black/20 shadow-[0_15px_40px_rgba(0,0,0,0.15)] rounded-xl flex items-center gap-4 px-4 pointer-events-auto relative active-panel overflow-hidden"
                >
                    {/* Industrial Panel Texture & Decorative Screws */}
                    <div className="absolute inset-0 pointer-events-none opacity-[0.04] bg-[radial-gradient(circle_at_center,black_1px,transparent_1px)] bg-[length:12px_12px]" />
                    <div className="absolute top-0.5 left-1 w-0.5 h-0.5 rounded-full bg-black/10" />
                    <div className="absolute top-0.5 right-1 w-0.5 h-0.5 rounded-full bg-black/10" />

                    {/* Left: VFD Terminal (Clock) */}
                    <div className="flex items-center gap-2 relative z-10 shrink-0 pr-3 border-r border-black/5">
                        <div className="px-2.5 py-1 bg-black/95 rounded shadow-inner border border-white/10 flex flex-col min-w-[60px] overflow-hidden relative">
                            {/* CRT Glow & Scanlines Overlay */}
                            <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0)_50%,rgba(16,185,129,0.05)_50%)] bg-[length:100%_2px] pointer-events-none" />
                            <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 to-transparent pointer-events-none" />
                            <span className="label-mono text-[10px] font-black text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.8)] relative z-10 text-center tracking-wider">
                                {currentTime.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    </div>

                    {/* Center: Curated Asset Wells */}
                    <div className="flex items-center gap-3 z-10 px-0.5">
                        <div className="flex items-center gap-1.5 group/asset">
                            <div className="flex items-center gap-1.5 px-2.5 py-1 hardware-well rounded-lg bg-[var(--well-bg)] border-b border-white/40">
                                <Coins className="w-3.5 h-3.5 text-amber-500 fill-amber-500 group-hover/asset:rotate-12 transition-transform" />
                                <span className="label-mono text-[13px] font-black text-slate-900 tracking-tighter">{stats.coins ?? 0}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-1.5 group/asset">
                            <div className="flex items-center gap-1.5 px-2.5 py-1 hardware-well rounded-lg bg-[var(--well-bg)] border-b border-white/40">
                                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 group-hover/asset:scale-110 transition-transform" />
                                <span className="label-mono text-[13px] font-black text-slate-900 tracking-tighter">{stats.goldStars ?? 0}</span>
                            </div>
                            {stats.isParent && (
                                <button
                                    onClick={() => { setRechargeType('GOLD_STAR'); setShowRechargeModal(true); }}
                                    className="hardware-btn group"
                                >
                                    <div className="w-4 h-4 hardware-well rounded-md bg-amber-500 shadow-cap flex items-center justify-center text-white active:translate-y-px hover:brightness-110">
                                        <span className="text-[9px] font-black">+</span>
                                    </div>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Right: Operations & Switches */}
                    <div className="flex items-center gap-3 relative z-10 shrink-0 pl-1 border-l border-black/5">
                        {/* Member Center Switch */}
                        <button
                            onClick={() => window.location.href = '/member'}
                            className="hardware-btn group relative"
                            title="Member Center"
                        >
                            <div className="w-7 h-7 hardware-well rounded-lg flex items-center justify-center bg-indigo-50/50">
                                <div className="hardware-cap absolute inset-0.5 bg-indigo-600 text-white rounded-md flex items-center justify-center group-hover:brightness-110 active:translate-y-0.5 shadow-cap">
                                    <IdCard className="w-4 h-4" />
                                </div>
                            </div>
                        </button>

                        <div className="flex items-center gap-2 px-1.5 py-1 bg-black/[0.03] rounded-lg">
                            {/* Growth Switch */}
                            <button
                                onClick={() => setShowGrowthModal(true)}
                                className="hardware-btn group relative"
                                title="Growth Record"
                            >
                                <div className="w-7 h-7 hardware-well rounded-lg flex items-center justify-center bg-emerald-50/50">
                                    <div className="hardware-cap absolute inset-0.5 bg-emerald-600 text-white rounded-md flex items-center justify-center group-hover:brightness-110 active:translate-y-0.5 shadow-cap">
                                        <Ruler className="w-3.5 h-3.5" />
                                    </div>
                                </div>
                            </button>

                            {/* Stats Switch */}
                            <Link
                                href="/admin/stats"
                                className="hardware-btn group relative"
                                title="Statistics"
                            >
                                <div className="w-7 h-7 hardware-well rounded-lg flex items-center justify-center bg-amber-50/50">
                                    <div className="hardware-cap absolute inset-0.5 bg-amber-600 text-white rounded-md flex items-center justify-center group-hover:brightness-110 active:translate-y-0.5 shadow-cap">
                                        <SquareActivity className="w-3.5 h-3.5" />
                                    </div>
                                </div>
                            </Link>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Growth Modal */}
            <AnimatePresence>
                {showGrowthModal && (() => {
                    const targetChild = children.find(c => c.id === targetChildId)
                    const childBirthDate = targetChild?.birthDate
                    return (
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
                                    <h3 className="text-xl font-black text-slate-800 tracking-tight">{t('parent.growth')}</h3>
                                    <button onClick={() => setShowGrowthModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                                        <X className="w-5 h-5 text-slate-400" />
                                    </button>
                                </div>

                                {/* Child selector (parent only) */}
                                {stats.isParent && (
                                    <div className="space-y-2 mb-6">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('parent.selectChild')}</label>
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
                                                    <div className="w-6 h-6 rounded-full bg-emerald-200 overflow-hidden">
                                                        {child.avatarUrl && <Image src={child.avatarUrl} width={24} height={24} alt={child.name} className="w-full h-full object-cover" />}
                                                    </div>
                                                    <span className="text-xs font-black text-slate-700">{child.name}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* No birth date warning */}
                                {stats.isParent && !childBirthDate ? (
                                    <div className="flex flex-col items-center gap-4 py-6 text-center">
                                        <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center">
                                            <AlertCircle className="w-7 h-7 text-amber-400" />
                                        </div>
                                        <p className="font-black text-slate-700">{locale === 'zh-CN' ? '请先设置出生日期' : 'Birth Date Required'}</p>
                                        <p className="text-sm text-slate-400">{locale === 'zh-CN' ? '需要先为该孩子补充出生日期，才能添加成长记录。' : 'Please set a birth date for this child before adding growth records.'}</p>
                                        <button
                                            type="button"
                                            onClick={() => { setShowGrowthModal(false); window.location.href = '/admin' }}
                                            className="mt-1 px-8 py-3 bg-amber-400 text-white rounded-2xl font-black shadow-lg shadow-amber-200 hover:bg-amber-500 transition-all active:scale-95"
                                        >
                                            {locale === 'zh-CN' ? '前往设置' : 'Go to Settings'}
                                        </button>
                                    </div>
                                ) : (
                                    <form onSubmit={handleSaveGrowth} className="space-y-5">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('parent.height')}</label>
                                                <input
                                                    type="number"
                                                    step="0.1"
                                                    value={height}
                                                    onChange={e => setHeight(e.target.value)}
                                                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-emerald-500 outline-none font-black text-slate-700"
                                                    placeholder="140"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('parent.weight')}</label>
                                                <input
                                                    type="number"
                                                    step="0.1"
                                                    value={weight}
                                                    onChange={e => setWeight(e.target.value)}
                                                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-emerald-500 outline-none font-black text-slate-700"
                                                    placeholder="35"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('common.date') || 'Date'}</label>
                                            <SmartDatePicker
                                                selected={recordDate || undefined}
                                                onSelect={(date) => date && setRecordDate(date)}
                                                minDate={childBirthDate ? new Date(childBirthDate) : undefined}
                                                maxDate={new Date()}
                                                triggerClassName="bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-3 font-black text-slate-700"
                                            />
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={isSaving}
                                            className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-emerald-200 hover:bg-emerald-600 transition-all disabled:opacity-50 active:scale-95"
                                        >
                                            {isSaving ? t('parent.processing') : t('parent.saveGrowth')}
                                        </button>
                                    </form>
                                )}
                            </motion.div>
                        </div>
                    )
                })()}
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
                                <h3 className="text-xl font-black text-slate-800 tracking-tight">{t('parent.bank')}</h3>
                                <button onClick={() => setShowRechargeModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                                    <X className="w-5 h-5 text-slate-400" />
                                </button>
                            </div>

                            <form onSubmit={handleRecharge} className="space-y-6">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('parent.assetType')}</label>
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
                                            <span className="text-xs font-black text-slate-700">{t('hud.coins')}</span>
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
                                            <span className="text-xs font-black text-slate-700">{t('hud.goldStars')}</span>
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('parent.amount')}</label>
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
                                    {isSaving ? t('parent.processing') : t('parent.rechargeAmount', { amount: rechargeAmt, type: rechargeType === 'CURRENCY' ? t('hud.coins') : t('hud.goldStars') })}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    )
}
