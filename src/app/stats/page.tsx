'use client'

import React, { useState, useEffect } from 'react'
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
    Coins,
    User,
    CalendarDays
} from 'lucide-react'
import { useI18n } from '@/contexts/I18nContext'
import { format, startOfWeek, endOfWeek, subWeeks, isSameDay } from 'date-fns'
import SmartDatePicker from '@/components/SmartDatePicker'

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

    // For recording modal
    const [showRecordModal, setShowRecordModal] = useState(false)
    const [recordingChildId, setRecordingChildId] = useState<string | null>(null)
    const [height, setHeight] = useState('')
    const [weight, setWeight] = useState('')
    const [recordDate, setRecordDate] = useState<Date>(new Date())

    const fetchData = async () => {
        try {
            setLoading(true)
            const res = await fetch('/api/parent/children/stats')
            if (res.ok) {
                const data = await res.json()
                setChildren(data)
            } else {
                setError(t('stats.error.load'))
            }
        } catch (err) {
            setError(t('settings.errorNetwork'))
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

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
        } catch (err) {
            console.error(err)
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
            }
        } catch (err) {
            console.error(err)
        }
    }

    const deleteRecord = async (id: string) => {
        if (!confirm(t('stats.deleteConfirm'))) return
        try {
            const res = await fetch(`/api/growth/${id}`, { method: 'DELETE' })
            if (res.ok) fetchData()
        } catch (err) {
            console.error(err)
        }
    }

    if (loading) return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} className="w-10 h-10 border-4 border-slate-200 border-t-purple-500 rounded-full" />
        </div>
    )

    if (error || !children || children.length === 0) return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8 text-center">
            <Activity className="w-16 h-16 text-slate-300 mb-4" />
            <h1 className="text-2xl font-black text-slate-800">{t('stats.noData')}</h1>
            <p className="text-slate-500 mt-2">{t('stats.noDataDesc')}</p>
            <button onClick={() => window.history.back()} className="mt-8 px-8 py-3 bg-white border border-slate-200 rounded-2xl font-black text-slate-700 shadow-sm hover:bg-slate-50">{t('stats.goBack')}</button>
        </div>
    )

    const currentChild = children[activeChildIdx]

    // Chart logic (Simple SVG bar chart for height/weight)
    const renderGrowthChart = (type: 'height' | 'weight') => {
        const data = [...currentChild.growthData].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(-7)
        if (data.length === 0) return (
            <div className="h-48 bg-slate-50 rounded-2xl flex items-center justify-center border border-dashed border-slate-200">
                <span className="text-slate-400 text-sm font-bold">{t('stats.noRecords', { type: type === 'height' ? t('stats.height') : t('stats.weight') })}</span>
            </div>
        )

        const values = data.map(d => (type === 'height' ? d.height : d.weight) || 0)
        const max = Math.max(...values, 1)
        const min = Math.min(...values.filter(v => v > 0), 0)
        const range = max - min || 1

        return (
            <div className="relative h-48 flex items-end justify-between gap-1 mt-4 px-2">
                {data.map((d, i) => {
                    const val = (type === 'height' ? d.height : d.weight) || 0
                    const heightPercent = val === 0 ? 0 : ((val - min) / range * 70) + 30
                    return (
                        <div key={d.id} className="flex-1 flex flex-col items-center group relative h-full">
                            <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: `${heightPercent}%` }}
                                className={`w-full max-w-[20px] rounded-t-lg shadow-sm transition-colors ${type === 'height' ? 'bg-sky-400' : 'bg-emerald-400'}`}
                            />
                            <div className="mt-2 text-[8px] font-black text-slate-400 uppercase tracking-tighter truncate w-full text-center">
                                {format(new Date(d.date), 'MM/dd')}
                            </div>
                            {/* Hover info */}
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] font-black px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                                {val} {type === 'height' ? 'cm' : 'kg'}
                            </div>
                        </div>
                    )
                })}
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
            {/* Nav */}
            <header className="px-6 py-5 bg-white border-b border-slate-100 flex items-center justify-between sticky top-0 z-40 backdrop-blur-md bg-white/80">
                <div className="flex items-center gap-4">
                    <button onClick={() => window.history.back()} className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center hover:bg-slate-100 border border-slate-100 transition-colors">
                        <ChevronLeft className="w-5 h-5 text-slate-500" />
                    </button>
                    <div>
                        <h1 className="text-xl font-black text-slate-900 leading-tight">{t('stats.title')}</h1>
                        <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest leading-tight">{t('stats.subtitle')}</p>
                    </div>
                </div>

                {/* Child Switcher if multiple */}
                {children.length > 1 && (
                    <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-full">
                        {children.map((child, idx) => (
                            <button
                                key={child.id}
                                onClick={() => setActiveChildIdx(idx)}
                                className={`w-10 h-10 rounded-full overflow-hidden border-2 transition-all ${activeChildIdx === idx ? 'border-purple-500 scale-105 shadow-md' : 'border-white opacity-50 grayscale hover:grayscale-0 hover:opacity-100'}`}
                            >
                                <img src={child.avatarUrl || "/dog.svg"} alt={child.name} className="w-full h-full object-cover" />
                            </button>
                        ))}
                    </div>
                )}
            </header>

            <main className="p-6 md:p-12 pb-32 md:pb-12 max-w-5xl mx-auto w-full space-y-8">
                {/* Child Quick Profile Card */}
                <div className="bg-white rounded-[32px] p-8 shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full translate-x-32 -translate-y-32 -z-0" />

                    <div className="relative z-10 w-32 h-32 md:w-40 md:h-40 rounded-[40px] overflow-hidden border-4 border-white shadow-2xl skew-y-2">
                        <img src={currentChild.avatarUrl || "/dog.svg"} alt={currentChild.name} className="w-full h-full object-cover" />
                    </div>

                    <div className="relative z-10 flex-1 text-center md:text-left">
                        <h2 className="text-4xl font-black text-slate-900 tracking-tight">{currentChild.nickname || currentChild.name}</h2>
                        <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-4">
                            <button
                                onClick={() => openHistory('CURRENCY')}
                                className="bg-amber-50 px-4 py-2 rounded-2xl flex items-center gap-2 border border-amber-100 hover:scale-105 transition-transform active:scale-95"
                            >
                                <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
                                <span className="text-lg font-black text-amber-600">{currentChild.stats.currency}</span>
                            </button>
                            <button
                                onClick={() => openHistory('GOLD_STAR')}
                                className="bg-yellow-50 px-4 py-2 rounded-2xl flex items-center gap-2 border border-yellow-100 hover:scale-105 transition-transform active:scale-95"
                            >
                                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                <span className="text-lg font-black text-yellow-600">{currentChild.stats.goldStars}</span>
                            </button>
                            <button
                                onClick={() => openHistory('PURPLE_STAR')}
                                className="bg-purple-50 px-4 py-2 rounded-2xl flex items-center gap-2 border border-purple-100 hover:scale-105 transition-transform active:scale-95"
                            >
                                <Trophy className="w-4 h-4 text-purple-500 fill-purple-500" />
                                <span className="text-lg font-black text-purple-600">{currentChild.stats.purpleStars}</span>
                            </button>
                        </div>
                    </div>

                    <button
                        onClick={() => {
                            setRecordingChildId(currentChild.id)
                            setShowRecordModal(true)
                        }}
                        className="relative z-10 bg-slate-900 text-white px-8 py-4 rounded-3xl font-black shadow-xl shadow-slate-200 hover:scale-105 hover:bg-slate-800 transition-all flex items-center gap-2"
                    >
                        <Plus className="w-5 h-5" /> {t('stats.recordBtn')}
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Activity Comparison */}
                    <div className="bg-white rounded-[32px] p-8 shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-black text-xl text-slate-900">{t('stats.weeklyProgress')}</h3>
                            <Activity className="w-5 h-5 text-purple-500" />
                        </div>

                        <div className="space-y-6">
                            {/* Coins Comparison */}
                            <div>
                                <div className="flex justify-between text-[10px] font-black uppercase text-slate-400 mb-2">
                                    <span>{t('stats.earnings')}</span>
                                    <span>{currentChild.thisWeekStats.currency} vs {currentChild.lastWeekStats.currency}</span>
                                </div>
                                <div className="h-4 bg-slate-100 rounded-full overflow-hidden flex">
                                    <div
                                        className="h-full bg-amber-400"
                                        style={{ width: `${(currentChild.thisWeekStats.currency / (currentChild.thisWeekStats.currency + currentChild.lastWeekStats.currency || 1)) * 100}%` }}
                                    />
                                </div>
                            </div>

                            {/* Stars Comparison */}
                            <div>
                                <div className="flex justify-between text-[10px] font-black uppercase text-slate-400 mb-2">
                                    <span>{t('stats.starsEarned')}</span>
                                    <span>{currentChild.thisWeekStats.goldStars} vs {currentChild.lastWeekStats.goldStars}</span>
                                </div>
                                <div className="h-4 bg-slate-100 rounded-full overflow-hidden flex">
                                    <div
                                        className="h-full bg-yellow-400"
                                        style={{ width: `${(currentChild.thisWeekStats.goldStars / (currentChild.thisWeekStats.goldStars + currentChild.lastWeekStats.goldStars || 1)) * 100}%` }}
                                    />
                                </div>
                            </div>

                            {/* Task Count Comparison */}
                            <div className="pt-4 mt-4 border-t border-slate-50 flex items-center justify-between">
                                <div className="text-sm font-bold text-slate-500">{t('stats.tasksCompleted')}</div>
                                <div className="text-2xl font-black text-slate-900">{currentChild.lastWeekTaskCount}</div>
                            </div>
                        </div>
                    </div>

                    {/* Weight & Height Growth */}
                    <div className="bg-white rounded-[32px] p-8 shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="font-black text-xl text-slate-900">{t('stats.recentGrowth')}</h3>
                            <TrendingUp className="w-5 h-5 text-emerald-500" />
                        </div>

                        <div className="flex-1 grid grid-cols-2 gap-4">
                            <div>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">{t('stats.height')}</span>
                                {renderGrowthChart('height')}
                            </div>
                            <div>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">{t('stats.weight')}</span>
                                {renderGrowthChart('weight')}
                            </div>
                        </div>
                    </div>
                </div>

                {/* History List */}
                <div className="bg-white rounded-[32px] p-8 shadow-xl shadow-slate-200/50 border border-slate-100">
                    <h3 className="font-black text-xl text-slate-900 mb-6">{t('stats.growthHistory')}</h3>
                    <div className="space-y-4 max-h-96 overflow-y-auto pr-4 custom-scrollbar">
                        {currentChild.growthData.length === 0 ? (
                            <div className="text-center py-12 text-slate-400 font-bold">{t('stats.noHistory')}</div>
                        ) : (
                            currentChild.growthData.map(record => (
                                <div key={record.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors group">
                                    <div className="flex items-center gap-6">
                                        <div className="text-xs font-black text-slate-400">
                                            {format(new Date(record.date), 'yyyy/MM/dd')}
                                        </div>
                                        <div className="flex gap-4">
                                            {record.height && (
                                                <div className="flex items-center gap-2">
                                                    <Ruler className="w-3.5 h-3.5 text-sky-500" />
                                                    <span className="font-black text-slate-700">{record.height}cm</span>
                                                </div>
                                            )}
                                            {record.weight && (
                                                <div className="flex items-center gap-2">
                                                    <Scale className="w-3.5 h-3.5 text-emerald-500" />
                                                    <span className="font-black text-slate-700">{record.weight}kg</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => deleteRecord(record.id)}
                                        className="p-2 text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </main>

            {/* Record Modal */}
            <AnimatePresence>
                {showRecordModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-white w-full max-w-md rounded-[32px] p-8 shadow-2xl relative"
                        >
                            <button
                                onClick={() => setShowRecordModal(false)}
                                className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-all"
                            >
                                <X className="w-6 h-6" />
                            </button>

                            <h2 className="text-2xl font-black text-slate-900 mb-1">{t('stats.newRecord')}</h2>
                            <p className="text-slate-400 text-sm mb-8">{t('stats.loggingFor', { name: currentChild.nickname || currentChild.name })}</p>

                            {/* No birth date warning */}
                            {!currentChild.birthDate ? (
                                <div className="flex flex-col items-center gap-4 py-8 text-center">
                                    <CalendarDays className="w-12 h-12 text-amber-400" />
                                    <p className="font-black text-slate-700 text-lg">{locale === 'zh-CN' ? '请先设置出生日期' : 'Birth Date Required'}</p>
                                    <p className="text-sm text-slate-400">{locale === 'zh-CN' ? '需要先为该孩子补充出生日期，才能添加成长记录。' : 'Please set a birth date for this child before adding growth records.'}</p>
                                    <button
                                        type="button"
                                        onClick={() => { setShowRecordModal(false); window.location.href = '/parent' }}
                                        className="mt-2 px-8 py-3 bg-amber-400 text-white rounded-2xl font-black shadow-lg shadow-amber-200 hover:bg-amber-500 transition-all"
                                    >
                                        {locale === 'zh-CN' ? '前往设置' : 'Go to Settings'}
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={handleRecord} className="space-y-6">
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 pl-2">{t('stats.height')}</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            value={height}
                                            onChange={e => setHeight(e.target.value)}
                                            placeholder="e.g. 120.5"
                                            className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-6 py-4 font-bold text-slate-800 focus:bg-white focus:border-purple-200 outline-none transition-all placeholder:text-slate-300"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 pl-2">{t('stats.weight')}</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            value={weight}
                                            onChange={e => setWeight(e.target.value)}
                                            placeholder="e.g. 25.4"
                                            className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-6 py-4 font-bold text-slate-800 focus:bg-white focus:border-purple-200 outline-none transition-all placeholder:text-slate-300"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 pl-2">{t('common.date') || 'Date'}</label>
                                        <SmartDatePicker
                                            selected={recordDate || undefined}
                                            onSelect={(date) => date && setRecordDate(date)}
                                            minDate={new Date(currentChild.birthDate)}
                                            maxDate={new Date()}
                                            triggerClassName="bg-slate-50 border-2 border-slate-50 rounded-2xl px-6 py-4 font-bold text-slate-800"
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        className="w-full bg-purple-600 text-white py-5 rounded-[24px] font-black text-lg shadow-xl shadow-purple-200 hover:scale-[1.02] hover:bg-purple-700 transition-all mt-4"
                                    >
                                        {t('stats.saveRecord')}
                                    </button>
                                </form>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* History Modal */}
            <AnimatePresence>
                {showHistoryModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[110] bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-white w-full max-w-2xl rounded-[32px] overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]"
                        >
                            {/* Modal Header */}
                            <div className="p-8 pb-4 relative">
                                <button
                                    onClick={() => setShowHistoryModal(false)}
                                    className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-all"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                                <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                                    <History className="w-6 h-6 text-purple-600" />
                                    {historyType === 'CURRENCY' ? t('stats.history.coins') :
                                        historyType === 'GOLD_STAR' ? t('stats.history.stars') : t('stats.history.purple')}
                                </h2>
                                <p className="text-slate-400 text-sm mt-1">{t('stats.history.desc', { name: currentChild.nickname || currentChild.name })}</p>

                                {/* Mini Tabs inside Modal */}
                                <div className="flex gap-2 mt-6">
                                    {[
                                        { id: 'CURRENCY', label: 'Coins', icon: Zap, color: 'text-amber-500' },
                                        { id: 'GOLD_STAR', label: 'Stars', icon: Star, color: 'text-yellow-500' },
                                        { id: 'PURPLE_STAR', label: 'Purple', icon: Trophy, color: 'text-purple-500' }
                                    ].map(tab => (
                                        <button
                                            key={tab.id}
                                            onClick={() => {
                                                const newType = tab.id as 'CURRENCY' | 'GOLD_STAR' | 'PURPLE_STAR'
                                                setHistoryType(newType)
                                                fetchHistory(currentChild.id, newType, 1)
                                            }}
                                            className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all ${historyType === tab.id ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
                                        >
                                            <tab.icon className={`w-3 h-3 ${tab.color}`} />
                                            {tab.id === 'CURRENCY' ? t('hud.coins') : tab.id === 'GOLD_STAR' ? t('hud.goldStars') : t('hud.purpleStars')}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Modal Content */}
                            <div className="flex-1 overflow-y-auto p-8 pt-2 min-h-[300px]">
                                {historyLoading ? (
                                    <div className="flex items-center justify-center h-64">
                                        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} className="w-8 h-8 border-4 border-slate-100 border-t-purple-500 rounded-full" />
                                    </div>
                                ) : historyLogs.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-64 text-slate-300">
                                        <History className="w-12 h-12 mb-2" />
                                        <p className="font-black">{t('stats.history.empty')}</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {historyLogs.map(log => (
                                            <div key={log.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100/50">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${log.amount > 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                                                        {log.amount > 0 ? `+${log.amount}` : log.amount}
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-black text-slate-800">{log.reason}</div>
                                                        <div className="flex items-center gap-3 mt-1">
                                                            <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold">
                                                                <CalendarDays className="w-3 h-3" />
                                                                {format(new Date(log.createdAt), 'yyyy/MM/dd HH:mm')}
                                                            </div>
                                                            {log.actorName && (
                                                                <div className="flex items-center gap-1 text-[10px] text-purple-500 font-bold">
                                                                    <User className="w-3 h-3" />
                                                                    {log.actorName}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-[10px] text-slate-400 font-black uppercase tracking-tighter">{t('stats.history.balance')}</div>
                                                    <div className="text-sm font-black text-slate-700">{log.balance}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Pagination Footer */}
                            {historyTotal > 10 && (
                                <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                                    <button
                                        disabled={historyPage <= 1 || historyLoading}
                                        onClick={() => fetchHistory(currentChild.id, historyType, historyPage - 1)}
                                        className="p-2 rounded-xl hover:bg-white disabled:opacity-30 transition-all"
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>
                                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
                                        {t('stats.history.page', { page: historyPage.toString(), total: Math.ceil(historyTotal / 10).toString() })}
                                    </span>
                                    <button
                                        disabled={historyPage >= Math.ceil(historyTotal / 10) || historyLoading}
                                        onClick={() => fetchHistory(currentChild.id, historyType, historyPage + 1)}
                                        className="p-2 rounded-xl hover:bg-white disabled:opacity-30 transition-all"
                                    >
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
