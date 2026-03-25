'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
    Activity,
    ChevronRight,
    ChevronLeft,
    X,
    Trash2,
    Plus,
    TrendingUp,
    Trophy,
    Star,
    Zap,
    Scale,
    Ruler,
    History,
    User,
    CalendarDays,
    Disc,
    Coins
} from 'lucide-react'
import { useI18n } from '@/contexts/I18nContext'
import { format } from 'date-fns'
import SmartDatePicker from '@/components/SmartDatePicker'
import Image from 'next/image'
import BausteinAdminNavbar from '@/components/BausteinAdminNavbar'
import { clsx } from 'clsx'

interface GrowthRecord {
    id: string
    userId: string
    height: number | null
    weight: number | null
    date: string | Date
}

interface ChildStats {
    id: string
    name: string
    nickname: string | null
    avatarUrl: string | null
    birthDate: string | null
    stats: {
        currency: number
        goldStars: number
        purpleStars: number
    }
    thisWeekStats: {
        currency: number
        goldStars: number
        purpleStars: number
    }
    lastWeekStats: {
        currency: number
        goldStars: number
        purpleStars: number
    }
    lastWeekTaskCount: number
    thisMonthTaskCount: number
    thisYearTaskCount: number
    growthData: GrowthRecord[]
}

interface HistoryLog {
    id: string
    userId: string
    type: 'CURRENCY' | 'GOLD_STAR' | 'PURPLE_STAR' | 'ANGER_PENALTY'
    amount: number
    balance: number
    reason: string
    createdAt: string
    actorId?: string | null
    actorName?: string | null
}

export default function GrowthStatsPage() {
    const { t, locale } = useI18n()
    const [children, setChildren] = useState<ChildStats[] | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [activeChildIdx, setActiveChildIdx] = useState(0)
    const [showHistoryModal, setShowHistoryModal] = useState(false)
    const [historyType, setHistoryType] = useState<'CURRENCY' | 'GOLD_STAR' | 'PURPLE_STAR'>('CURRENCY')
    const [historyLogs, setHistoryLogs] = useState<HistoryLog[]>([])
    const [historyLoading, setHistoryLoading] = useState(false)
    const [historyPage, setHistoryPage] = useState(1)
    const [historyTotal, setHistoryTotal] = useState(0)
    
    // For Growth History Pagination
    const [growthHistory, setGrowthHistory] = useState<GrowthRecord[]>([])
    const [growthLoading, setGrowthLoading] = useState(false)
    const [growthPage, setGrowthPage] = useState(1)
    const [growthTotal, setGrowthTotal] = useState(0)

    // For recording modal
    const [showRecordModal, setShowRecordModal] = useState(false)
    const [recordingChildId, setRecordingChildId] = useState<string | null>(null)
    const [height, setHeight] = useState('')
    const [weight, setWeight] = useState('')
    const [recordDate, setRecordDate] = useState<Date>(new Date())

    const fetchData = useCallback(async () => {
        try {
            setLoading(true)
            const res = await fetch('/api/parent/children/stats')
            if (res.ok) {
                const data = await res.json()
                setChildren(data)
            } else {
                setError(t('stats.error.load'))
            }
        } catch (_err) {
            setError(t('settings.errorNetwork'))
        } finally {
            setLoading(false)
        }
    }, [t])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    const fetchGrowthRecords = async (userId: string, page: number = 1) => {
        try {
            setGrowthLoading(true)
            const res = await fetch(`/api/growth?userId=${userId}&page=${page}&limit=10`)
            if (res.ok) {
                const data = await res.json()
                setGrowthHistory(data.records)
                setGrowthTotal(data.pagination.total)
                setGrowthPage(data.pagination.page)
            }
        } catch (_err) {
            console.error(_err)
        } finally {
            setGrowthLoading(false)
        }
    }

    useEffect(() => {
        if (children && children[activeChildIdx]) {
            fetchGrowthRecords(children[activeChildIdx].id, 1)
        }
    }, [activeChildIdx, children])

    const fetchHistory = async (userId: string, type: string, page: number = 1) => {
        try {
            setHistoryLoading(true)
            const res = await fetch(`/api/stats/logs?userId=${userId}&type=${type}&page=${page}&limit=10`)
            if (res.ok) {
                const data = await res.json()
                setHistoryLogs(data.logs)
                setHistoryTotal(data.pagination.total)
                setHistoryPage(data.pagination.page)
            }
        } catch (_err) {
            console.error(_err)
        } finally {
            setHistoryLoading(false)
        }
    }

    const openHistory = (type: 'CURRENCY' | 'GOLD_STAR' | 'PURPLE_STAR') => {
        setHistoryType(type)
        setHistoryPage(1)
        setShowHistoryModal(true)
        if (currentChild) {
            fetchHistory(currentChild.id, type, 1)
        }
    }

    const handleRecord = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!recordingChildId) return

        try {
            const res = await fetch('/api/growth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    targetUserId: recordingChildId,
                    height,
                    weight,
                    date: recordDate.toISOString()
                })
            })
            if (res.ok) {
                setShowRecordModal(false)
                setHeight('')
                setWeight('')
                fetchData()
                fetchGrowthRecords(recordingChildId, 1)
            }
        } catch (_err) {
            console.error(_err)
        }
    }

    const deleteRecord = async (id: string) => {
        if (!confirm(t('stats.deleteConfirm'))) return
        try {
            const res = await fetch(`/api/growth/${id}`, { method: 'DELETE' })
            if (res.ok) {
                fetchData()
                if (currentChild) fetchGrowthRecords(currentChild.id, growthPage)
            }
        } catch (_err) {
            console.error(_err)
        }
    }

    if (loading) return (
        <div className="h-dvh flex items-center justify-center bg-[#E5E5E0] app-bg-pattern">
             <div className="hardware-well w-16 h-16 rounded-2xl flex items-center justify-center shadow-well bg-[#DADBD4]">
                <Disc className="w-8 h-8 text-indigo-500 animate-spin-slow" />
            </div>
        </div>
    )

    if (error || !children || children.length === 0) return (
        <div className="min-h-dvh bg-slate-50 flex flex-col items-center justify-center p-8 text-center app-bg-pattern">
            <div className="baustein-panel p-12 flex flex-col items-center gap-6 max-w-md bg-[#E6E2D1]">
                <Activity className="w-16 h-16 text-slate-400" />
                <h1 className="text-2xl font-black text-slate-800">{t('stats.noData')}</h1>
                <p className="text-slate-500">{t('stats.noDataDesc')}</p>
                <button 
                    onClick={() => window.history.back()} 
                    className="hardware-btn group w-full"
                >
                    <div className="hardware-well h-16 rounded-xl overflow-hidden relative">
                        <div className="hardware-cap absolute inset-1.5 bg-[#F4F4F2] rounded-lg flex items-center justify-center font-black text-slate-700">
                            {t('stats.goBack')}
                        </div>
                    </div>
                </button>
            </div>
        </div>
    )

    const currentChild = children[activeChildIdx]

    // Chart logic
    const renderGrowthChart = (type: 'height' | 'weight') => {
        const data = [...currentChild.growthData]
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .slice(-7)
            
        if (data.length === 0) return (
            <div className="flex-1 flex flex-col items-center justify-center p-4">
                 <div className="w-8 h-8 rounded-full border-2 border-dashed border-black/10 flex items-center justify-center mb-2">
                    <TrendingUp className="w-3 h-3 text-black/10" />
                 </div>
                 <span className="text-black/20 text-[8px] font-black uppercase tracking-widest">{t('stats.noRecords', { type: type === 'height' ? t('stats.height') : t('stats.weight') })}</span>
            </div>
        )

        const values = data.map(d => (type === 'height' ? d.height : d.weight) || 0)
        const max = Math.max(...values, 1)
        const min = Math.min(...values.filter(v => v > 0), 0)
        const range = max - min || 1

        const points = data.map((d, i) => {
            const val = (type === 'height' ? d.height : d.weight) || 0
            const x = data.length > 1 ? (i / (data.length - 1)) * 100 : 50
            const y = val === 0 ? 100 : 100 - (((val - min) / range) * 60 + 20)
            return { x, y, val, date: d.date }
        })

        const linePath = points.length > 1 
            ? points.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(' ')
            : ''

        const areaPath = points.length > 1
            ? `${linePath} L 100 100 L 0 100 Z`
            : ''

        const gradId = `areaGrad-${type}-${currentChild.id}`

        return (
            <div className="relative flex-1 h-full pt-2">
                {/* SVG Layer for stretching paths (Lines/Areas) */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <defs>
                        <linearGradient id={gradId} x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor={type === 'height' ? '#6366F1' : '#10B981'} stopOpacity="0.12" />
                            <stop offset="100%" stopColor={type === 'height' ? '#6366F1' : '#10B981'} stopOpacity="0" />
                        </linearGradient>
                    </defs>

                    {points.length > 1 && (
                        <motion.path
                            d={areaPath}
                            fill={`url(#${gradId})`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                        />
                    )}

                    <motion.path
                        d={linePath}
                        fill="none"
                        stroke={type === 'height' ? '#6366F1' : '#10B981'}
                        strokeWidth="1"
                        strokeLinecap="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1.2 }}
                    />
                </svg>

                {/* HTML Layer for non-stretching elements (Dots/Labels) */}
                <div className="absolute inset-0 w-full h-full pointer-events-none">
                    {points.map((p, i) => (
                        <div 
                            key={i} 
                            className="absolute"
                            style={{ 
                                left: `${p.x}%`, 
                                top: `${p.y}%`,
                                transform: 'translate(-50%, -50%)'
                            }}
                        >
                            {/* Marker Dot */}
                            <div className={clsx(
                                "w-1.5 h-1.5 rounded-full border bg-white shadow-sm",
                                type === 'height' ? "border-indigo-500" : "border-emerald-500"
                            )} />
                            
                            {/* Value Label (Top) */}
                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-[8px] font-black text-slate-600 whitespace-nowrap leading-none pt-0.5">
                                {p.val}
                            </div>

                            {/* Date Label (Bottom - Single Implementation) */}
                            <div 
                                className="absolute left-1/2 -translate-x-1/2 text-[6px] text-slate-400 font-medium tracking-tighter whitespace-nowrap"
                                style={{ top: `calc(${100 - p.y}% + 28px)` }}
                            >
                                {format(new Date(p.date), 'yyyy.MM.dd')}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="h-dvh flex flex-col relative overflow-hidden app-bg-pattern">
            <BausteinAdminNavbar />

            <div className="absolute inset-0 pointer-events-none opacity-10 bg-[radial-gradient(ellipse_at_center,var(--surface-warm)_0%,transparent_100%)] z-0" />

            <main className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col items-center relative z-10 scroll-smooth">
                <div className="w-full max-w-4xl flex flex-col gap-6 md:gap-8 pb-12">
                    
                    {/* Header Section: Child Switcher & Model Info */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div className="flex flex-col gap-1">
                            <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter uppercase">{t('stats.title')}</h1>
                            <div className="flex items-center gap-3">
                                <div className="px-2 py-0.5 bg-indigo-600 rounded text-[9px] font-black text-white tracking-widest leading-none">
                                    DoDoo GROWTH
                                </div>
                            </div>
                        </div>

                        {/* Child Switcher Well */}
                        {children.length > 1 && (
                            <div className="hardware-well p-1 rounded-2xl flex items-center gap-1 bg-[#DADBD4] shadow-well self-start">
                                {children.map((child, idx) => (
                                    <button
                                        key={child.id}
                                        onClick={() => setActiveChildIdx(idx)}
                                        className="hardware-btn group"
                                    >
                                        <div className={clsx(
                                            "hardware-cap w-11 h-11 rounded-xl flex items-center justify-center transition-all overflow-hidden",
                                            activeChildIdx === idx ? "bg-white shadow-cap" : "bg-transparent opacity-60 grayscale hover:grayscale-0 hover:opacity-100"
                                        )}>
                                            <Image 
                                                src={child.avatarUrl || "/dog.svg"} 
                                                width={44} height={44} 
                                                alt={child.name} 
                                                className="w-full h-full object-cover" 
                                            />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="hardware-groove opacity-30" />

                    {/* 2-Column Dashboard Layout - Aligned Heights */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
                        
                        {/* LEFT COLUMN: Identity & Analytics (Merged Section) */}
                        <div className="md:col-span-4 flex flex-col gap-6 h-full">
                            
                            {/* Block 1: Profile & Wallet Merged */}
                            <div className="baustein-panel bg-[#E6E2D1] overflow-hidden">
                                <div className="p-5 pb-4 flex flex-col items-center gap-4">
                                    <div className="hardware-well w-28 h-28 rounded-[2rem] p-1.5 bg-[#DADBD4] shadow-well overflow-hidden">
                                         <div className="hardware-cap w-full h-full rounded-[1.5rem] bg-white overflow-hidden shadow-cap relative group">
                                            <Image src={currentChild.avatarUrl || "/dog.svg"} fill alt={currentChild.name} className="object-cover transition-transform group-hover:scale-110" />
                                         </div>
                                    </div>
                                    <div className="text-center">
                                        <h2 className="text-xl font-black text-slate-900 tracking-tight leading-none">{currentChild.nickname || currentChild.name}</h2>
                                        <p className="label-mono text-[8px] text-slate-500 mt-1 uppercase tracking-widest leading-none">{currentChild.id.slice(0, 8)}</p>
                                    </div>
                                </div>

                                <div className="hardware-groove opacity-10" />

                                {/* Mini Stats Grid (Icons Top, Numbers Bottom) */}
                                <div className="px-5 py-4">
                                    <div className="hardware-well p-3 rounded-xl bg-[#DADBD4] shadow-well">
                                        <div className="grid grid-cols-3 gap-1 mb-2">
                                            {[
                                                { id: 'CURRENCY', icon: Coins, color: 'text-amber-500' },
                                                { id: 'GOLD_STAR', icon: Star, color: 'text-yellow-500' },
                                                { id: 'PURPLE_STAR', icon: Trophy, color: 'text-purple-500' }
                                            ].map(stat => (
                                                <button key={stat.id} onClick={() => openHistory(stat.id as 'CURRENCY' | 'GOLD_STAR' | 'PURPLE_STAR')} className="flex justify-center items-center py-2 hover:bg-black/5 rounded-lg transition-colors">
                                                    <stat.icon className={clsx("w-4 h-4", stat.color, "fill-current/20")} />
                                                </button>
                                            ))}
                                        </div>
                                        <div className="hardware-groove opacity-5 mb-2" />
                                        <div className="grid grid-cols-3 gap-1">
                                            {[
                                                { id: 'CURRENCY', val: currentChild.stats.currency },
                                                { id: 'GOLD_STAR', val: currentChild.stats.goldStars },
                                                { id: 'PURPLE_STAR', val: currentChild.stats.purpleStars }
                                            ].map(stat => (
                                                <button key={stat.id} onClick={() => openHistory(stat.id as 'CURRENCY' | 'GOLD_STAR' | 'PURPLE_STAR')} className="flex justify-center items-center group">
                                                    <span className="text-base font-black text-slate-800 tracking-tighter group-hover:text-indigo-600">{stat.val}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="px-5 pb-5">
                                    <button
                                        onClick={() => {
                                            setRecordingChildId(currentChild.id)
                                            setShowRecordModal(true)
                                        }}
                                        className="hardware-btn group w-full"
                                    >
                                        <div className="hardware-well h-11 rounded-lg overflow-hidden relative bg-[#D1CDBC]">
                                            <div className="hardware-cap absolute inset-1 !bg-white rounded flex items-center justify-center gap-2 text-indigo-600 font-black text-[10px] hover:!bg-slate-50 shadow-cap transition-colors">
                                                <Plus className="w-3 h-3" /> {t('stats.recordBtn')}
                                            </div>
                                        </div>
                                    </button>
                                </div>
                            </div>

                            {/* Block 2: Weekly Progress Metrics */}
                            <div className="baustein-panel p-5 flex-1 flex flex-col gap-4 bg-[#E6E2D1]">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">{t('stats.weeklyProgress')}</h3>
                                    <Activity className="w-3.5 h-3.5 text-indigo-500" />
                                </div>

                                <div className="space-y-4 flex-1 flex flex-col justify-center">
                                    <div className="grid grid-cols-3 gap-2">
                                         <div className="flex flex-col items-center justify-center hardware-well py-2 rounded-lg bg-[#DADBD4] shadow-well">
                                            <div className="label-mono text-[7px] text-slate-500 mb-0.5 font-medium">WEEK</div>
                                            <div className="text-xs font-black text-slate-800 leading-none">{currentChild.lastWeekTaskCount}</div>
                                        </div>
                                        <div className="flex flex-col items-center justify-center hardware-well py-2 rounded-lg bg-[#DADBD4] shadow-well">
                                            <div className="label-mono text-[7px] text-slate-500 mb-0.5 font-medium">MONTH</div>
                                            <div className="text-xs font-black text-slate-800 leading-none">{currentChild.thisMonthTaskCount}</div>
                                        </div>
                                        <div className="flex flex-col items-center justify-center hardware-well py-2 rounded-lg bg-[#DADBD4] shadow-well">
                                            <div className="label-mono text-[7px] text-slate-500 mb-0.5 font-medium">YEAR</div>
                                            <div className="text-xs font-black text-slate-800 leading-none">{currentChild.thisYearTaskCount}</div>
                                        </div>
                                    </div>

                                    <div className="space-y-2 pt-1">
                                        <div className="space-y-1">
                                            <div className="flex justify-between label-mono text-[8px] text-slate-500">
                                                <span>COINS</span>
                                                <span>+{currentChild.thisWeekStats.currency}</span>
                                            </div>
                                            <div className="hardware-well h-2 rounded-full overflow-hidden bg-black/5">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${Math.min(100, (currentChild.thisWeekStats.currency / (currentChild.thisWeekStats.currency + currentChild.lastWeekStats.currency || 1)) * 100)}%` }}
                                                    className="h-full bg-amber-500 rounded-full"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex justify-between label-mono text-[8px] text-slate-500">
                                                <span>STARS</span>
                                                <span>+{currentChild.thisWeekStats.goldStars}</span>
                                            </div>
                                            <div className="hardware-well h-2 rounded-full overflow-hidden bg-black/5">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${Math.min(100, (currentChild.thisWeekStats.goldStars / (currentChild.thisWeekStats.goldStars + currentChild.lastWeekStats.goldStars || 1)) * 100)}%` }}
                                                    className="h-full bg-yellow-400 rounded-full"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT COLUMN: Growth Trajectory (Stacked Vertical) */}
                        <div className="md:col-span-8 h-full">
                            <div className="baustein-panel p-6 bg-[#E6E2D1] flex flex-col h-full">
                                <div className="flex items-center justify-between mb-4 border-b border-black/5 pb-3 shrink-0">
                                    <div className="flex flex-col">
                                         <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-900">{t('stats.recentGrowth')}</h3>
                                         <p className="label-mono text-[8px] text-slate-400 mt-0.5 uppercase tracking-widest leading-none text-indigo-500/50 font-bold">Live Data Field</p>
                                    </div>
                                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                                </div>

                                <div className="flex-1 flex flex-col justify-around gap-6">
                                    {/* Height Stack */}
                                    <div className="flex flex-col gap-2.5 flex-1">
                                        <div className="flex items-center justify-between px-1">
                                            <div className="flex items-center gap-2">
                                                <Ruler className="w-2.5 h-2.5 text-indigo-500" />
                                                <span className="label-mono text-[8px] font-black text-slate-700">{t('stats.height')}</span>
                                            </div>
                                        </div>
                                        <div className="hardware-well p-4 pb-1 group-hover:bg-white transition-colors rounded-xl flex-1 min-h-[140px] max-h-[180px] !bg-white shadow-inner overflow-hidden border border-black/5">
                                            {renderGrowthChart('height')}
                                        </div>
                                    </div>

                                    {/* Weight Stack */}
                                    <div className="flex flex-col gap-2.5 flex-1">
                                        <div className="flex items-center justify-between px-1">
                                            <div className="flex items-center gap-2">
                                                <Scale className="w-2.5 h-2.5 text-emerald-500" />
                                                <span className="label-mono text-[8px] font-black text-slate-700">{t('stats.weight')}</span>
                                            </div>
                                        </div>
                                        <div className="hardware-well p-4 pb-1 group-hover:bg-white transition-colors rounded-xl flex-1 min-h-[140px] max-h-[180px] !bg-white shadow-inner overflow-hidden border border-black/5">
                                            {renderGrowthChart('weight')}
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="mt-6 border-t border-black/5 pt-4 flex justify-end shrink-0">
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-1.5 opacity-50">
                                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                            <span className="label-mono text-[7px] text-slate-500 tracking-tighter uppercase leading-none">{t('stats.height')}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 opacity-50">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                            <span className="label-mono text-[7px] text-slate-500 tracking-tighter uppercase leading-none">{t('stats.weight')}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Growth Log Terminal */}
                    <div className="baustein-panel bg-[#E6E2D1] overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-black/5 flex items-center justify-between bg-black/5">
                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-900">{t('stats.growthHistory')}</h3>
                            <History className="w-4 h-4 text-slate-400" />
                        </div>
                        
                        <div className="p-2">
                             {growthLoading ? (
                                <div className="flex items-center justify-center py-12">
                                    <Disc className="w-6 h-6 text-indigo-400 animate-spin-slow" />
                                </div>
                            ) : (
                                <div className="flex flex-col gap-1">
                                    {growthHistory.length === 0 ? (
                                        <div className="text-center py-12 label-mono text-[10px] text-slate-400">{t('stats.noHistory')}</div>
                                    ) : (
                                        growthHistory.map(record => (
                                            <div key={record.id} className="flex items-center justify-between p-4 rounded-xl hover:bg-black/5 transition-colors group">
                                                <div className="flex items-center gap-8">
                                                    <div className="label-mono text-[10px] text-slate-400 w-24 shrink-0">
                                                        {format(new Date(record.date), 'yyyy.MM.dd')}
                                                    </div>
                                                    <div className="flex gap-8">
                                                        {record.height && (
                                                            <div className="flex items-center gap-2">
                                                                <Ruler className="w-3 h-3 text-indigo-400" />
                                                                <span className="font-black text-slate-700 text-sm">{record.height} CM</span>
                                                            </div>
                                                        )}
                                                        {record.weight && (
                                                            <div className="flex items-center gap-2">
                                                                <Scale className="w-3 h-3 text-emerald-400" />
                                                                <span className="font-black text-slate-700 text-sm">{record.weight} KG</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => deleteRecord(record.id)}
                                                    className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all opacity-0 group-hover:opacity-100"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Terminal Pagination */}
                        {growthTotal > 10 && (
                            <div className="p-4 border-t border-black/5 flex items-center justify-between bg-black/5">
                                <button
                                    disabled={growthPage <= 1 || growthLoading}
                                    onClick={() => fetchGrowthRecords(currentChild.id, growthPage - 1)}
                                    className="hardware-btn group"
                                >
                                    <div className="hardware-well w-10 h-10 rounded-lg flex items-center justify-center bg-[#DADBD4] shadow-well active:translate-y-0.5 disabled:opacity-30">
                                        <ChevronLeft className="w-4 h-4 text-slate-600" />
                                    </div>
                                </button>
                                <span className="label-mono text-[9px] text-slate-500 tracking-[0.2em]">
                                    PAGE {growthPage} / {Math.ceil(growthTotal / 10)}
                                </span>
                                <button
                                    disabled={growthPage >= Math.ceil(growthTotal / 10) || growthLoading}
                                    onClick={() => fetchGrowthRecords(currentChild.id, growthPage + 1)}
                                    className="hardware-btn group"
                                >
                                    <div className="hardware-well w-10 h-10 rounded-lg flex items-center justify-center bg-[#DADBD4] shadow-well active:translate-y-0.5 disabled:opacity-30">
                                        <ChevronRight className="w-4 h-4 text-slate-600" />
                                    </div>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Renovatied Record Modal (System Baustein Style) */}
            <AnimatePresence>
                {showRecordModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-md"
                            onClick={() => setShowRecordModal(false)}
                        />
                        <motion.div
                            initial={{ scale: 0.9, y: 30, opacity: 0 }}
                            animate={{ scale: 1, y: 0, opacity: 1 }}
                            exit={{ scale: 0.9, y: 30, opacity: 0 }}
                            className="w-full max-w-md relative"
                        >
                            <div className="baustein-panel w-full bg-[#E2DFD2] rounded-[2rem] shadow-2xl relative overflow-hidden border-4 border-[#C8C4B0] flex flex-col">
                                {/* Modal Header */}
                                <div className="px-6 py-5 relative border-b border-black/5 bg-black/[0.02]">
                                    <button
                                        onClick={() => setShowRecordModal(false)}
                                        className="hardware-btn group absolute top-3.5 right-6"
                                    >
                                        <div className="hardware-well w-9 h-9 rounded-lg flex items-center justify-center bg-[#DADBD4] shadow-well">
                                            <div className="hardware-cap absolute inset-1 bg-white rounded-md flex items-center justify-center transition-all shadow-cap">
                                                <X className="w-3.5 h-3.5 text-slate-500" />
                                            </div>
                                        </div>
                                    </button>
                                    <h2 className="text-xl font-black text-slate-900 tracking-tight leading-none">{t('stats.newRecord')}</h2>
                                    <div className="flex items-center gap-2 mt-1.5">
                                        <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_4px_rgba(16,185,129,0.6)]" />
                                        <p className="label-mono text-[8px] text-slate-400 uppercase tracking-[0.1em]">{t('stats.loggingFor', { name: currentChild.nickname || currentChild.name })}</p>
                                    </div>
                                </div>

                                <div className="p-6 md:p-8 pt-6">
                                     {!currentChild.birthDate ? (
                                        <div className="hardware-well p-8 rounded-2xl flex flex-col items-center gap-4 text-center bg-black/5 shadow-inner">
                                            <CalendarDays className="w-12 h-12 text-amber-500" />
                                            <p className="font-black text-slate-700 text-lg uppercase tracking-tight">{locale === 'zh-CN' ? '需先设置出生日期' : 'Birth Date Required'}</p>
                                            <button
                                                type="button"
                                                onClick={() => { setShowRecordModal(false); window.location.href = '/admin' }}
                                                className="hardware-btn group w-full mt-4"
                                            >
                                                 <div className="hardware-well h-14 rounded-xl overflow-hidden relative">
                                                    <div className="hardware-cap absolute inset-1 bg-amber-500 rounded-lg flex items-center justify-center font-black text-white">
                                                        {locale === 'zh-CN' ? '前往设置' : 'Go to Settings'}
                                                    </div>
                                                </div>
                                            </button>
                                        </div>
                                    ) : (
                                        <form onSubmit={handleRecord} className="space-y-6">
                                            <div className="space-y-2">
                                                <label className="label-mono text-[9px] pl-1">{t('stats.height')} (CM)</label>
                                                <div className="hardware-well rounded-xl p-1.5 bg-[#D1CDBC]">
                                                    <input
                                                        type="number"
                                                        step="0.1"
                                                        value={height}
                                                        onChange={e => setHeight(e.target.value)}
                                                        placeholder="0.0"
                                                        className="w-full bg-white/90 px-4 py-3.5 rounded-lg border-2 border-transparent focus:border-indigo-500 outline-none font-black text-slate-800 text-base shadow-inner transition-colors"
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="label-mono text-[9px] pl-1">{t('stats.weight')} (KG)</label>
                                                <div className="hardware-well rounded-xl p-1.5 bg-[#D1CDBC]">
                                                    <input
                                                        type="number"
                                                        step="0.1"
                                                        value={weight}
                                                        onChange={e => setWeight(e.target.value)}
                                                        placeholder="0.0"
                                                        className="w-full bg-white/90 px-4 py-3.5 rounded-lg border-2 border-transparent focus:border-emerald-500 outline-none font-black text-slate-800 text-base shadow-inner transition-colors"
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="label-mono text-[9px] pl-1 uppercase">{t('common.date') || 'Event Timestamp'}</label>
                                                <div className="hardware-well rounded-xl p-1.5 bg-[#D1CDBC]">
                                                    <SmartDatePicker
                                                        selected={recordDate || undefined}
                                                        onSelect={(date) => date && setRecordDate(date)}
                                                        minDate={new Date(currentChild.birthDate)}
                                                        maxDate={new Date()}
                                                        triggerClassName="w-full bg-white/90 px-4 py-3.5 rounded-lg border-2 border-transparent font-black text-slate-800 text-sm shadow-inner transition-colors flex items-center justify-between"
                                                    />
                                                </div>
                                            </div>

                                            <button
                                                type="submit"
                                                className="hardware-btn group w-full pt-4"
                                            >
                                                <div className="hardware-well h-16 rounded-[1.25rem] overflow-hidden relative bg-[#D1CDBC]">
                                                    <div className="hardware-cap absolute inset-1.5 bg-indigo-600 rounded-xl flex items-center justify-center font-black text-white text-lg group-hover:bg-indigo-700 shadow-cap uppercase tracking-widest">
                                                        {t('stats.saveRecord')}
                                                    </div>
                                                </div>
                                            </button>
                                        </form>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Renovatied History Modal */}
            <AnimatePresence>
                {showHistoryModal && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-md"
                            onClick={() => setShowHistoryModal(false)}
                        />
                        <motion.div
                            initial={{ scale: 0.9, y: 30, opacity: 0 }}
                            animate={{ scale: 1, y: 0, opacity: 1 }}
                            exit={{ scale: 0.9, y: 30, opacity: 0 }}
                            className="w-full max-w-2xl relative"
                        >
                            <div className="baustein-panel w-full bg-[#E2DFD2] rounded-[2rem] shadow-2xl relative overflow-hidden border-4 border-[#C8C4B0] flex flex-col max-h-[85vh]">
                                {/* Header */}
                                <div className="px-6 py-5 relative border-b border-black/5 bg-black/[0.02]">
                                     <button
                                        onClick={() => setShowHistoryModal(false)}
                                        className="hardware-btn group absolute top-3.5 right-6"
                                    >
                                        <div className="hardware-well w-9 h-9 rounded-lg flex items-center justify-center bg-[#DADBD4] shadow-well">
                                            <div className="hardware-cap absolute inset-1 bg-white rounded-md flex items-center justify-center transition-all shadow-cap">
                                                <X className="w-3.5 h-3.5 text-slate-500" />
                                            </div>
                                        </div>
                                    </button>
                                    <h2 className="text-xl font-black text-slate-900 flex items-center gap-2.5 leading-none">
                                        <History className="w-5 h-5 text-indigo-600" />
                                        {historyType === 'CURRENCY' ? t('stats.history.coins') :
                                            historyType === 'GOLD_STAR' ? t('stats.history.stars') : t('stats.history.purple')}
                                    </h2>
                                    <div className="flex items-center gap-2 mt-1.5">
                                         <div className="w-1 h-1 rounded-full bg-indigo-500 animate-pulse" />
                                         <p className="label-mono text-[8px] text-slate-400 uppercase tracking-[0.1em]">{t('stats.history.desc', { name: currentChild.nickname || currentChild.name })}</p>
                                    </div>

                                    {/* Sub-tabs in Modal */}
                                    <div className="hardware-well p-1 rounded-xl bg-black/5 shadow-inner mt-4 flex gap-0.5 self-start w-fit">
                                        {[
                                            { id: 'CURRENCY', label: 'Coins', icon: Zap, color: 'text-amber-500' },
                                            { id: 'GOLD_STAR', label: 'Stars', icon: Star, color: 'text-yellow-500' },
                                            { id: 'PURPLE_STAR', label: 'Purple', icon: Trophy, color: 'text-purple-500' }
                                        ].map(tab => (
                                            <button
                                                key={tab.id}
                                                onClick={() => {
                                                    const newType = tab.id as 'CURRENCY' | 'GOLD_STAR' | 'PURPLE_STAR' | 'height' | 'weight'
                                                    setHistoryType(newType)
                                                    fetchHistory(currentChild.id, newType, 1)
                                                }}
                                                className="hardware-btn group"
                                            >
                                                <div className={clsx(
                                                    "px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-2 transition-all",
                                                    historyType === tab.id ? "bg-white text-slate-900 shadow-cap" : "text-slate-400 hover:text-slate-600"
                                                )}>
                                                    <tab.icon className={clsx("w-3 h-3", tab.color)} />
                                                    {tab.id === 'CURRENCY' ? t('hud.coins') : tab.id === 'GOLD_STAR' ? t('hud.goldStars') : t('hud.purpleStars')}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Body */}
                                <div className="flex-1 overflow-y-auto p-8 pt-2 custom-scrollbar bg-black/5 mx-2 mb-2 rounded-b-[1.75rem] shadow-inner min-h-[300px]">
                                    {historyLoading ? (
                                        <div className="flex items-center justify-center h-64">
                                            <Disc className="w-8 h-8 text-indigo-500 animate-spin-slow" />
                                        </div>
                                    ) : historyLogs.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                                            <History className="w-12 h-12 mb-2 opacity-20" />
                                            <p className="label-mono text-[10px]">{t('stats.history.empty')}</p>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col gap-1.5">
                                            {historyLogs.map(log => (
                                                <div key={log.id} className="flex items-center justify-between p-4 bg-white/70 rounded-xl border border-white/40 shadow-sm transition-colors hover:bg-white">
                                                    <div className="flex items-center gap-5">
                                                        <div className={clsx(
                                                            "w-12 h-12 rounded-xl flex items-center justify-center font-black text-sm shadow-inner",
                                                            log.amount > 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                                                        )}>
                                                            {log.amount > 0 ? `+${log.amount}` : log.amount}
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-black text-slate-800 tracking-tight">{log.reason}</div>
                                                            <div className="flex items-center gap-4 mt-1.5">
                                                                <div className="flex items-center gap-1.5 label-mono text-[8px]">
                                                                    <CalendarDays className="w-3 h-3" />
                                                                    {format(new Date(log.createdAt), 'yyyy.MM.dd HH:mm')}
                                                                </div>
                                                                {log.actorName && (
                                                                    <div className="flex items-center gap-1.5 label-mono text-[8px] text-indigo-500">
                                                                        <User className="w-3 h-3" />
                                                                        {log.actorName}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="label-mono text-[8px] text-slate-400 mb-1">{t('stats.history.balance')}</div>
                                                        <div className="text-base font-black text-slate-700 tracking-tighter">{log.balance}</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Pagination Footer */}
                                {historyTotal > 10 && (
                                    <div className="p-6 bg-black/10 border-t border-black/5 flex items-center justify-between">
                                         <button
                                            disabled={historyPage <= 1 || historyLoading}
                                            onClick={() => fetchHistory(currentChild.id, historyType, historyPage - 1)}
                                            className="hardware-btn group"
                                        >
                                            <div className="hardware-well w-10 h-10 rounded-lg flex items-center justify-center bg-[#DADBD4] shadow-well active:translate-y-0.5 disabled:opacity-30">
                                                <ChevronLeft className="w-4 h-4 text-slate-600" />
                                            </div>
                                        </button>
                                        <span className="label-mono text-[9px] text-slate-500 uppercase tracking-widest">
                                            PAGE {historyPage} / {Math.ceil(historyTotal / 10)}
                                        </span>
                                        <button
                                            disabled={historyPage >= Math.ceil(historyTotal / 10) || historyLoading}
                                            onClick={() => fetchHistory(currentChild.id, historyType, historyPage + 1)}
                                            className="hardware-btn group"
                                        >
                                            <div className="hardware-well w-10 h-10 rounded-lg flex items-center justify-center bg-[#DADBD4] shadow-well active:translate-y-0.5 disabled:opacity-30">
                                                <ChevronRight className="w-4 h-4 text-slate-600" />
                                            </div>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* V3 UI Overlays */}
            <div className="hud-overlay" />
            <div className="hud-vignette" />
        </div>
    )
}
