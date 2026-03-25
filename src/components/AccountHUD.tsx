'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'motion/react'
import {
    Coins,
    Star,
    X,
    Ruler,
    AlertCircle,
    IdCard,
    SquareActivity
} from 'lucide-react'
import Image from 'next/image'
import { useI18n } from '@/contexts/I18nContext'
import { clsx } from 'clsx'
import SmartDatePicker from '@/components/SmartDatePicker'

interface Stats {
    userId: string
    name: string
    nickname?: string
    avatar?: string
    permissionRole: string
    isAdmin: boolean
    coins: number
    slug?: string
    goldStars: number
    todayTasks: number
    completedTasks: number
    growthScore: number
    birthDate?: string | null
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

export default function AccountHUD({ inline = false }: { inline?: boolean }) {
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
    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' })
            window.location.href = '/admin/login'
        } catch (_error) {
            console.error('Logout failed:', _error)
            window.location.href = '/admin/login'
        }
    }

    const fetchData = useCallback(async (loadKids = false) => {
        try {
            const res = await fetch('/api/stats')
            if (res.ok) {
                const data = await res.json()
                setStats(data)

                if (data.isAdmin && loadKids) {
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
    }, [])

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
                body: JSON.stringify({ 
                    amount: parseInt(rechargeAmt), 
                    type: rechargeType 
                })
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
        if (!targetChildId && stats?.isAdmin) return
        setIsSaving(true)
        try {
            const res = await fetch('/api/growth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    targetUserId: stats?.isAdmin ? targetChildId : stats?.userId,
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
            <div className={clsx(
                inline ? "relative h-full" : "fixed top-2 left-1/2 -translate-x-1/2 z-[2000] h-[56px]",
                "pointer-events-none w-auto max-w-[90vw] px-2 flex items-center justify-center"
            )}>
                <motion.div
                    initial={inline ? false : { y: -50, opacity: 0 }}
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
                        </div>

                        {stats.isAdmin && (
                            <button
                                onClick={() => { setRechargeType('CURRENCY'); setShowRechargeModal(true); }}
                                className="hardware-btn group ml-1"
                                title={t('parent.bank')}
                            >
                                <div className="w-6 h-6 hardware-well rounded-lg bg-indigo-600 shadow-cap flex items-center justify-center text-white active:translate-y-px hover:brightness-110">
                                    <span className="text-[12px] font-black">+</span>
                                </div>
                            </button>
                        )}
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
                            {/* Growth Switch (Admin records for kids, Child records for self) */}
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

            {/* Growth Modal (System Baustein 3.0) */}
            <AnimatePresence>
                {showGrowthModal && (() => {
                    const childBirthDate = stats.isAdmin ? children.find(c => c.id === targetChildId)?.birthDate : stats.birthDate
                    return (
                        <div className="fixed inset-0 z-[2100] flex flex-col items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-black/60 backdrop-blur-md"
                                onClick={() => setShowGrowthModal(false)}
                            />
                            <motion.div
                                initial={{ scale: 0.9, y: 30, opacity: 0 }}
                                animate={{ scale: 1, y: 0, opacity: 1 }}
                                exit={{ scale: 0.9, y: 30, opacity: 0 }}
                                className="relative w-full max-w-md"
                            >
                                <div className="baustein-panel w-full bg-[#E2DFD2] rounded-[2rem] shadow-2xl relative overflow-hidden border-4 border-[#C8C4B0] flex flex-col">
                                    {/* Compact Header */}
                                    <div className="px-6 py-5 relative border-b border-black/5 bg-black/[0.02]">
                                        <button
                                            onClick={() => setShowGrowthModal(false)}
                                            className="hardware-btn group absolute top-3.5 right-6"
                                        >
                                            <div className="hardware-well w-9 h-9 rounded-lg flex items-center justify-center bg-[#DADBD4] shadow-well">
                                                <div className="hardware-cap absolute inset-1 bg-white rounded-md flex items-center justify-center transition-all shadow-cap">
                                                    <X className="w-3.5 h-3.5 text-slate-500" />
                                                </div>
                                            </div>
                                        </button>
                                        <h2 className="text-xl font-black text-slate-900 tracking-tight leading-none">{t('parent.growth')}</h2>
                                        <div className="flex items-center gap-2 mt-1.5">
                                            <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_4px_rgba(16,185,129,0.6)]" />
                                            <p className="label-mono text-[8px] text-slate-400 uppercase tracking-[0.1em]">Growth Telemetry Log</p>
                                        </div>
                                    </div>

                                    <div className="p-6 md:p-8 pt-4">
                                        {/* Child selector (parent only) */}
                                        {stats.isAdmin && (
                                            <div className="space-y-3 mb-8">
                                                <label className="label-mono text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('parent.selectChild')}</label>
                                                <div className="flex overflow-x-auto no-scrollbar gap-3 pb-2 -mx-2 px-2 snap-x snap-mandatory">
                                                    {children.map(child => (
                                                        <button
                                                            key={child.id}
                                                            type="button"
                                                            onClick={() => setTargetChildId(child.id)}
                                                            className="hardware-btn group flex-shrink-0 snap-start"
                                                        >
                                                            <div className={clsx(
                                                                "hardware-well px-4 py-3 rounded-xl flex items-center gap-3 transition-all",
                                                                targetChildId === child.id 
                                                                    ? "!bg-white border-2 border-emerald-500 shadow-cap scale-[1.02]" 
                                                                    : "bg-black/5 opacity-40 grayscale hover:grayscale-0 hover:opacity-100 border-2 border-transparent"
                                                            )}>
                                                                <div className="w-7 h-7 rounded-md overflow-hidden relative border border-black/5">
                                                                    <Image src={child.avatarUrl || "/dog.svg"} fill alt={child.name} className="object-cover" />
                                                                </div>
                                                                <span className="text-[10px] font-black text-slate-800 uppercase tracking-tight whitespace-nowrap">{child.name}</span>
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* No birth date warning */}
                                        {stats.isAdmin && !childBirthDate ? (
                                            <div className="flex flex-col items-center gap-6 py-10 text-center hardware-well bg-black/5 rounded-[2rem] border border-black/5 shadow-inner">
                                                <div className="w-16 h-16 rounded-2xl bg-white shadow-cap flex items-center justify-center relative group">
                                                    <AlertCircle className="w-8 h-8 text-amber-500 transition-transform group-hover:scale-110" />
                                                </div>
                                                <div className="space-y-2">
                                                    <p className="font-black text-slate-800 text-lg uppercase tracking-tight">{locale === 'zh-CN' ? '缺失出生日期' : 'Birth Date Missing'}</p>
                                                    <p className="label-mono text-[9px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed px-10">
                                                        {locale === 'zh-CN' ? '需要先补充出生日期，才能激活成长记录模块。' : 'Supplement birth date to activate the growth telemetry module.'}
                                                    </p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => { setShowGrowthModal(false); window.location.href = '/admin' }}
                                                    className="hardware-btn group w-full max-w-[200px]"
                                                >
                                                    <div className="hardware-well h-14 rounded-xl overflow-hidden relative">
                                                        <div className="hardware-cap absolute inset-1.5 bg-amber-500 rounded-lg flex items-center justify-center font-black text-white text-[10px] tracking-widest uppercase">
                                                            {locale === 'zh-CN' ? '前往设置' : 'Go to Settings'}
                                                        </div>
                                                    </div>
                                                </button>
                                            </div>
                                        ) : (
                                            <form onSubmit={handleSaveGrowth} className="space-y-6">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <label className="label-mono text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">{t('parent.height')} (CM)</label>
                                                        <div className="hardware-well rounded-xl p-1.5 bg-[#D1CDBC]">
                                                            <input
                                                                type="number"
                                                                step="0.1"
                                                                value={height}
                                                                onChange={e => setHeight(e.target.value)}
                                                                className="w-full h-14 !bg-white px-5 rounded-lg outline-none font-black text-slate-800 text-sm shadow-inner transition-colors border-2 border-transparent focus:border-indigo-500"
                                                                placeholder="0.0"
                                                                required
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="label-mono text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">{t('parent.weight')} (KG)</label>
                                                        <div className="hardware-well rounded-xl p-1.5 bg-[#D1CDBC]">
                                                            <input
                                                                type="number"
                                                                step="0.1"
                                                                value={weight}
                                                                onChange={e => setWeight(e.target.value)}
                                                                className="w-full h-14 !bg-white px-5 rounded-lg outline-none font-black text-slate-800 text-sm shadow-inner transition-colors border-2 border-transparent focus:border-emerald-500"
                                                                placeholder="0.0"
                                                                required
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="label-mono text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">{t('common.date') || 'Date'}</label>
                                                    <div className="hardware-well rounded-xl p-1.5 bg-[#D1CDBC]">
                                                        <SmartDatePicker
                                                            selected={recordDate || undefined}
                                                            onSelect={(date) => date && setRecordDate(date)}
                                                            minDate={childBirthDate ? new Date(childBirthDate) : undefined}
                                                            maxDate={new Date()}
                                                            triggerClassName="w-full h-14 !bg-white px-5 rounded-lg font-black text-slate-800 text-sm shadow-inner transition-colors flex items-center justify-between border-2 border-transparent"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="pt-4">
                                                    <button
                                                        type="submit"
                                                        disabled={isSaving}
                                                        className="hardware-btn w-full group relative"
                                                    >
                                                        <div className="hardware-well h-16 bg-[#D1CDBC] rounded-[1.25rem] relative overflow-hidden">
                                                            <div className="hardware-cap absolute inset-1.5 bg-emerald-600 rounded-xl flex items-center justify-center gap-3 group-hover:bg-emerald-700 active:translate-y-0.5 shadow-cap disabled:opacity-50">
                                                                <span className="label-mono text-[11px] font-black text-white uppercase tracking-[0.2em]">
                                                                    {isSaving ? t('parent.processing') : t('parent.saveGrowth')}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </button>
                                                </div>
                                            </form>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )
                })()}
            </AnimatePresence>

            {/* Recharge Modal (System Baustein 3.0) */}
            <AnimatePresence>
                {showRechargeModal && (
                    <div className="fixed inset-0 z-[2200] flex flex-col items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-md"
                            onClick={() => setShowRechargeModal(false)}
                        />
                        <motion.div
                            initial={{ scale: 0.9, y: 30, opacity: 0 }}
                            animate={{ scale: 1, y: 0, opacity: 1 }}
                            exit={{ scale: 0.9, y: 30, opacity: 0 }}
                            className="relative w-full max-w-sm"
                        >
                            <div className="baustein-panel w-full bg-[#E2DFD2] rounded-[2rem] shadow-2xl relative overflow-hidden border-4 border-[#C8C4B0] flex flex-col">
                                {/* Compact Header */}
                                <div className="px-6 py-5 relative border-b border-black/5 bg-black/[0.02]">
                                    <button
                                        onClick={() => setShowRechargeModal(false)}
                                        className="hardware-btn group absolute top-3.5 right-6"
                                    >
                                        <div className="hardware-well w-9 h-9 rounded-lg flex items-center justify-center bg-[#DADBD4] shadow-well">
                                            <div className="hardware-cap absolute inset-1 bg-white rounded-md flex items-center justify-center transition-all shadow-cap">
                                                <X className="w-3.5 h-3.5 text-slate-500" />
                                            </div>
                                        </div>
                                    </button>
                                    <h2 className="text-xl font-black text-slate-900 tracking-tight leading-none">
                                        {t('parent.recharge')}
                                    </h2>
                                    <div className="flex items-center gap-2 mt-1.5">
                                        <div className="w-1 h-1 rounded-full bg-amber-500 animate-pulse shadow-[0_0_4px_rgba(245,158,11,0.6)]" />
                                        <p className="label-mono text-[8px] text-slate-400 uppercase tracking-[0.1em]">Economy Node Authentication</p>
                                    </div>
                                </div>

                                <div className="p-6 md:p-8 pt-4">
                                    <form onSubmit={handleRecharge} className="space-y-6">
                                        <div className="space-y-3">
                                            <label className="label-mono text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">{t('parent.assetType')}</label>
                                            <div className="flex gap-2.5 hardware-well p-1.5 rounded-xl bg-[#D1CDBC]">
                                                <button
                                                    type="button"
                                                    onClick={() => setRechargeType('CURRENCY')}
                                                    className="hardware-btn group flex-1"
                                                >
                                                    <div className={clsx(
                                                        "px-3 py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all shadow-sm",
                                                        rechargeType === 'CURRENCY' ? "bg-white" : "opacity-40 grayscale hover:grayscale-0"
                                                    )}>
                                                        <Coins className={clsx("w-3.5 h-3.5", rechargeType === 'CURRENCY' ? "text-amber-500" : "text-slate-400")} />
                                                        <span className={clsx("label-mono text-[9px] font-black uppercase tracking-widest", rechargeType === 'CURRENCY' ? "text-slate-900" : "text-slate-400")}>{t('hud.coins')}</span>
                                                    </div>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setRechargeType('GOLD_STAR')}
                                                    className="hardware-btn group flex-1"
                                                >
                                                    <div className={clsx(
                                                        "px-3 py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all shadow-sm",
                                                        rechargeType === 'GOLD_STAR' ? "bg-white" : "opacity-40 grayscale hover:grayscale-0"
                                                    )}>
                                                        <Star className={clsx("w-3.5 h-3.5", rechargeType === 'GOLD_STAR' ? "text-amber-500 fill-amber-500" : "text-slate-400")} />
                                                        <span className={clsx("label-mono text-[9px] font-black uppercase tracking-widest", rechargeType === 'GOLD_STAR' ? "text-slate-900" : "text-slate-400")}>{t('hud.goldStars')}</span>
                                                    </div>
                                                </button>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <label className="label-mono text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">{t('parent.amount')}</label>
                                            <div className="grid grid-cols-3 gap-3">
                                                {['50', '100', '200', '500', '1000', '5000'].map(amt => (
                                                    <button
                                                        key={amt}
                                                        type="button"
                                                        onClick={() => setRechargeAmt(amt)}
                                                        className="hardware-btn group"
                                                    >
                                                        <div className={clsx(
                                                            "hardware-well h-11 rounded-lg flex items-center justify-center label-mono text-xs font-black transition-all !bg-white",
                                                            rechargeAmt === amt ? "border-2 border-amber-500 shadow-cap scale-[1.02]" : "border border-black/10 hover:shadow-well"
                                                        )}>
                                                            {amt}
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="pt-4">
                                            <button
                                                type="submit"
                                                disabled={isSaving}
                                                className="hardware-btn w-full group relative"
                                            >
                                                <div className="hardware-well h-16 bg-[#D1CDBC] rounded-[1.25rem] relative overflow-hidden">
                                                    <div className="hardware-cap absolute inset-1.5 bg-orange-600 rounded-xl flex items-center justify-center gap-3 group-hover:bg-orange-700 active:translate-y-0.5 shadow-cap disabled:opacity-50">
                                                        <span className="label-mono text-[11px] font-black text-white uppercase tracking-[0.2em] text-center px-4">
                                                            {isSaving ? t('parent.processing') : t('parent.rechargeAmount', { amount: rechargeAmt, type: rechargeType === 'CURRENCY' ? t('hud.coins') : t('hud.goldStars') })}
                                                        </span>
                                                    </div>
                                                </div>
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    )
}
