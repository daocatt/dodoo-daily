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
    AlertCircle
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

    const { t, locale } = useI18n()
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
                            onClick={() => (window.location.href = stats.isParent ? '/admin/console' : '/admin/profile')}
                        >
                            <div className="w-8 h-8 rounded-full bg-slate-100 shadow-sm overflow-hidden flex items-center justify-center border border-black/[0.03]">
                                {stats.avatar && stats.avatar.length > 2 ? (
                                    <Image
                                        src={stats.avatar}
                                        alt={stats.name}
                                        width={32}
                                        height={32}
                                        className="w-full h-full object-cover"
                                        priority
                                    />
                                ) : (
                                    <span className="text-[13px] font-black text-slate-400">{stats.name?.[0]?.toUpperCase() || 'U'}</span>
                                )}
                            </div>
                        </motion.div>
                        <div className="flex flex-col">
                            <span className="text-[11px] font-black text-slate-800 leading-none">{stats.nickname || stats.name}</span>
                        </div>
                    </div>

                    {/* Children Section (Parent only) - Hidden on extreme mobile to save space */}
                    {stats.isParent && children.length > 0 && (
                        <Link href="/admin/stats" className="hidden sm:flex items-center gap-1.5 px-1 hover:opacity-70 transition-opacity">
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

                        {/* Member Center Link */}
                        <button
                            onClick={() => {
                                window.location.href = '/member'
                            }}
                            className="flex items-center text-indigo-500 hover:text-indigo-600 transition-colors p-1"
                            title="Member Center"
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </button>

                        {/* Growth Record */}
                        <button
                            onClick={() => setShowGrowthModal(true)}
                            className="flex items-center text-emerald-600 hover:text-emerald-700 transition-colors p-1"
                            title={t('parent.growth')}
                        >
                            <Ruler className="w-4 h-4" />
                        </button>
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
