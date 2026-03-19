'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Wallet, Landmark, Plus, X, Loader2, BarChart3, ReceiptText, ChevronLeft, ChevronRight, PieChart, TrendingUp, TrendingDown, Settings } from 'lucide-react'
import { format, subMonths, addMonths, startOfMonth } from 'date-fns'
import { useI18n } from '@/contexts/I18nContext'
import Link from 'next/link'
interface LedgerRecord { id: string; type: string; amount: number; description: string; date: string; category?: { name: string; emoji: string; }; }
interface Category { id: string; type: string; name: string; emoji: string; }
interface ChartData { fullDate: string; day: string; income: number; expense: number; }
interface CategoryStat { id: string; name: string; emoji: string; total: number | string; type: string; }
interface StatsData { totals?: { income: number; expense: number; }; chartData?: ChartData[]; categories?: CategoryStat[]; }

export default function LedgerPage() {
    const { t, locale } = useI18n()
    const [loading, setLoading] = useState(true)
    const [balance, setBalance] = useState(0)
    const [bankBalance, setBankBalance] = useState(0)
    const [records, setRecords] = useState<LedgerRecord[]>([])
    const [categories, setCategories] = useState<Category[]>([])
    
    // Stats State
    const [activeTab, setActiveTab] = useState<'RECORDS' | 'STATS'>('RECORDS')
    const [statsLoading, setStatsLoading] = useState(false)
    const [statsData, setStatsData] = useState<StatsData | null>(null)
    const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()))
    const [isParent, setIsParent] = useState(false)

    // Modal State
    const [showAddModal, setShowAddModal] = useState(false)
    const [txType, setTxType] = useState<'EXPENSE' | 'INCOME'>('EXPENSE')
    const [amount, setAmount] = useState('')
    const [description, setDescription] = useState('')
    const [selectedCategoryId, setSelectedCategoryId] = useState('')
    const [submitting, setSubmitting] = useState(false)
    
    // Bank State
    const [showBankModal, setShowBankModal] = useState(false)
    const [bankTxType, setBankTxType] = useState<'DEPOSIT' | 'WITHDRAWAL'>('DEPOSIT')
    const [bankAmount, setBankAmount] = useState('')



    const fetchData = async () => {
        setLoading(true)
        try {
            const [ledgerRes, catRes, statsRes] = await Promise.all([
                fetch('/api/ledger'),
                fetch('/api/ledger/categories'),
                fetch('/api/stats')
            ])
            const ledgerData = await ledgerRes.json()
            const catData = await catRes.json()
            const statsData = await statsRes.json()
            
            setIsParent(statsData.isParent || false)

            if (ledgerData.records) {
                setRecords(ledgerData.records)
                setBalance(ledgerData.balance)
                setBankBalance(ledgerData.bankBalance)
            }
            if (Array.isArray(catData)) {
                setCategories(catData)
                // Set default selected category
                const expCats = catData.filter((c: Category) => c.type === 'EXPENSE')
                if (expCats.length > 0) setSelectedCategoryId(expCats[0].id)
            }
        } catch (e) {
            console.error('Failed to fetch ledger data', e)
        }
        setLoading(false)
    }

    const fetchStats = async (month: Date) => {
        setStatsLoading(true)
        try {
            const monthStr = format(month, 'yyyy-MM')
            const res = await fetch(`/api/ledger/stats?month=${monthStr}`)
            const data = await res.json()
            setStatsData(data)
        } catch (e) {
            console.error('Failed to fetch stats', e)
        }
        setStatsLoading(false)
    }

    useEffect(() => {
        if (activeTab === 'STATS') {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            fetchStats(currentMonth)
        }
    }, [activeTab, currentMonth])

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchData()
    }, [])

    const handleAddSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!amount || !description || !selectedCategoryId) return
        
        setSubmitting(true)
        try {
            const res = await fetch('/api/ledger', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: parseFloat(amount),
                    categoryId: selectedCategoryId,
                    type: txType,
                    description,
                })
            })
            const data = await res.json()
            if (data.success) {
                setShowAddModal(false)
                setAmount('')
                setDescription('')
                fetchData() // Refresh list
            } else {
                alert(data.error || 'Failed to add record')
            }
        } catch (error) {
            console.error(error)
        }
        setSubmitting(false)
    }

    const handleBankTransfer = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!bankAmount) return
        
        setSubmitting(true)
        try {
            const res = await fetch('/api/ledger/bank/transfer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: parseFloat(bankAmount),
                    type: bankTxType,
                    description: bankTxType === 'DEPOSIT' ? '存入储蓄' : '提取现金'
                })
            })
            const data = await res.json()
            if (data.success) {
                setShowBankModal(false)
                setBankAmount('')
                fetchData() // Refresh balances
            } else {
                alert(data.error || '操作失败')
            }
        } catch (error) {
            console.error(error)
        }
        setSubmitting(false)
    }


    // Filter categories by selected tab type
    const activeCategories = categories.filter(c => c.type === txType)

    return (
        <div className="min-h-dvh bg-slate-50 relative flex flex-col">
            {/* Header */}
            <header className="relative z-10 flex justify-between items-center px-6 py-4 md:px-10 md:py-6 backdrop-blur-sm bg-white/40 border-b border-white/30 shadow-sm">
                <div className="flex items-center gap-4">
                    <Link
                        href="/"
                        className="w-10 h-10 md:w-12 md:h-12 flex-shrink-0 flex items-center justify-center rounded-2xl bg-white/40 hover:bg-white/60 transition-colors shadow-sm text-slate-800 border border-slate-200"
                    >
                        <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
                    </Link>
                    <div className="flex items-center gap-3">
                        <div className="hidden md:flex w-10 h-10 bg-indigo-500 rounded-2xl items-center justify-center shadow-md shadow-indigo-500/30 text-white flex-shrink-0">
                            <Wallet className="w-5 h-5" />
                        </div>
                        <span className="font-extrabold text-xl md:text-2xl tracking-tight text-slate-800">
                            {t('ledger.title')}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-2 md:gap-3">
                    {isParent && (
                        <Link
                            href="/ledger/categories"
                            className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-2xl bg-white/40 hover:bg-white/60 transition-colors shadow-sm text-slate-500 border border-slate-200"
                            title={t('ledger.categories.manage')}
                        >
                            <Settings className="w-5 h-5 md:w-6 md:h-6" />
                        </Link>
                    )}
                </div>
            </header>

            {loading ? (
                <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
                </div>
            ) : (
                <main className="flex-1 px-5 py-6 flex flex-col gap-6 overflow-y-auto pb-[env(safe-area-inset-bottom,2rem)]">
                    
                    {/* Tab Switcher */}
                    <div className="flex p-1 bg-slate-200/50 rounded-2xl w-full max-w-[240px] mx-auto mb-2">
                        <button
                            onClick={() => setActiveTab('RECORDS')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-black transition-all ${activeTab === 'RECORDS' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400'}`}
                        >
                            <ReceiptText className="w-4 h-4" />
                            {t('ledger.tabs.records')}
                        </button>
                        <button
                            onClick={() => setActiveTab('STATS')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-black transition-all ${activeTab === 'STATS' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}
                        >
                            <BarChart3 className="w-4 h-4" />
                            {t('ledger.tabs.stats')}
                        </button>
                    </div>

                    {activeTab === 'RECORDS' ? (
                        <AnimatePresence mode="wait">
                            <motion.div
                                key="records-view"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                className="flex flex-col gap-6"
                            >
                    
                    {/* Balance Cards */}
                    <div className="grid grid-cols-2 gap-4">
                        {/* Fiat Wallet */}
                        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-3xl p-5 shadow-xl shadow-indigo-200/50 text-white relative overflow-hidden group">
                            <Wallet className="w-24 h-24 absolute -right-6 -bottom-6 opacity-10 group-hover:scale-110 transition-transform duration-500" />
                            <div className="flex items-center gap-2 mb-4 opacity-90">
                                <Wallet className="w-5 h-5" />
                                <span className="font-medium text-sm">{t('ledger.balance.available')}</span>
                            </div>
                            <div className="flex items-baseline gap-1">
                                <span className="text-xl">¥</span>
                                <span className="text-4xl font-black font-number tracking-tight">{balance.toFixed(2)}</span>
                            </div>
                        </div>

                        {/* Virtual Bank */}
                        <div className="bg-gradient-to-br from-emerald-500 to-teal-500 rounded-3xl p-5 shadow-xl shadow-emerald-200/50 text-white relative overflow-hidden group cursor-pointer" onClick={() => setShowBankModal(true)}>
                            <Landmark className="w-24 h-24 absolute -right-6 -bottom-6 opacity-10 group-hover:scale-110 transition-transform duration-500" />
                            <div className="flex items-center gap-2 mb-4 opacity-90">
                                <Landmark className="w-5 h-5" />
                                <span className="font-medium text-sm">{t('ledger.balance.bank')}</span>
                            </div>
                            <div className="flex items-baseline gap-1">
                                <span className="text-xl">¥</span>
                                <span className="text-4xl font-black font-number tracking-tight">{bankBalance.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Timeline / Records */}
                    <div className="flex flex-col gap-3">
                        <h2 className="text-lg font-bold text-slate-700 px-1">{t('ledger.recentHistory')}</h2>
                        
                        {records.length === 0 ? (
                            <div className="py-12 text-center text-slate-400">{t('ledger.noRecords')}</div>
                        ) : (
                            <div className="bg-white rounded-3xl p-2 shadow-sm border border-slate-100 overflow-hidden flex flex-col gap-1">
                                {records.map(record => {
                                    const isExpense = record.type === 'EXPENSE'
                                    return (
                                        <div key={record.id} className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-inner ${isExpense ? 'bg-orange-50' : 'bg-indigo-50'}`}>
                                                    {record.category?.emoji || '💰'}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-700">{record.description || record.category?.name}</span>
                                                    <span className="text-xs text-slate-400 font-medium">{new Date(record.date).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                            <div className={`flex items-baseline gap-1 font-black font-number text-lg ${isExpense ? 'text-slate-700' : 'text-emerald-500'}`}>
                                                <span>{isExpense ? '-' : '+'}</span>
                                                <span>{record.amount.toFixed(2)}</span>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </motion.div>
            </AnimatePresence>
        ) : (
            <AnimatePresence mode="wait">
                <motion.div
                    key="stats-view"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="flex flex-col gap-6"
                >
                    {/* Month Picker */}
                    <div className="flex items-center justify-between px-2">
                        <h2 className="text-xl font-black text-slate-800">{format(currentMonth, locale === 'zh-CN' ? 'yyyy年MM月' : 'MMMM yyyy')}</h2>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentMonth(prev => subMonths(prev, 1))}
                                className="w-8 h-8 rounded-full bg-white border border-slate-100 flex items-center justify-center text-slate-400 active:scale-95"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => setCurrentMonth(prev => addMonths(prev, 1))}
                                className="w-8 h-8 rounded-full bg-white border border-slate-100 flex items-center justify-center text-slate-400 active:scale-95"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {statsLoading ? (
                        <div className="py-20 flex items-center justify-center">
                            <Loader2 className="w-8 h-8 animate-spin text-indigo-200" />
                        </div>
                    ) : statsData ? (
                        <>
                            {/* Stats Summary Tiles */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex flex-col gap-1">
                                    <div className="flex items-center gap-2 text-emerald-500 mb-2">
                                        <TrendingUp className="w-4 h-4" />
                                        <span className="text-[10px] font-black uppercase tracking-widest leading-none">{t('ledger.stats.income')}</span>
                                    </div>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-xs font-bold text-slate-400">¥</span>
                                        <span className="text-2xl font-black text-slate-800 font-number">{(statsData.totals?.income || 0).toFixed(2)}</span>
                                    </div>
                                </div>
                                <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex flex-col gap-1">
                                    <div className="flex items-center gap-2 text-orange-500 mb-2">
                                        <TrendingDown className="w-4 h-4" />
                                        <span className="text-[10px] font-black uppercase tracking-widest leading-none">{t('ledger.stats.expense')}</span>
                                    </div>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-xs font-bold text-slate-400">¥</span>
                                        <span className="text-2xl font-black text-slate-800 font-number">{(statsData.totals?.expense || 0).toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Spending Trend Chart */}
                            <div className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm">
                                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                    <BarChart3 className="w-4 h-4 text-indigo-500" />
                                    {t('ledger.stats.trend')}
                                </h3>
                                
                                {statsData.chartData?.length > 0 ? (
                                    <div className="relative h-48 flex items-end justify-between gap-1 group">
                                        {/* Max guide lines */}
                                        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pr-2">
                                            <div className="w-full border-t border-slate-50 relative">
                                                <span className="absolute -top-3 right-0 text-[8px] font-black text-slate-300">MAX</span>
                                            </div>
                                            <div className="w-full border-t border-slate-50" />
                                        </div>
                                        
                                        {statsData.chartData.map((d: ChartData) => {
                                            const maxAmount = Math.max(...(statsData.chartData || []).map((cd: ChartData) => Math.max(cd.income, cd.expense)), 10)
                                            const expenseHeight = (d.expense / maxAmount) * 100
                                            const incomeHeight = (d.income / maxAmount) * 100

                                            return (
                                                <div key={d.fullDate} className="flex-1 h-full flex flex-col justify-end items-center gap-0.5 group/bar relative">
                                                    {incomeHeight > 0 && (
                                                        <motion.div
                                                            initial={{ height: 0 }}
                                                            animate={{ height: `${incomeHeight}%` }}
                                                            className="w-full max-w-[6px] bg-emerald-400 rounded-t-sm"
                                                        />
                                                    )}
                                                    <motion.div
                                                        initial={{ height: 0 }}
                                                        animate={{ height: `${expenseHeight}%` }}
                                                        className="w-full max-w-[6px] bg-indigo-500 rounded-t-sm"
                                                    />
                                                    
                                                    {/* Date label (sparse) */}
                                                    {(parseInt(d.day) % 5 === 0 || d.day === '01') && (
                                                        <span className="mt-2 text-[8px] font-black text-slate-300 shrink-0">
                                                            {d.day}
                                                        </span>
                                                    )}

                                                    {/* Tooltip on hover bar */}
                                                    <div className="absolute bottom-full mb-2 bg-slate-800 text-white text-[8px] font-black px-1.5 py-1 rounded opacity-0 group-hover/bar:opacity-100 transition-opacity whitespace-nowrap z-20 pointer-events-none text-center">
                                                        {d.fullDate}<br/>
                                                        {t('ledger.add.expense').substring(0,1)}: {d.expense.toFixed(1)}<br/>
                                                        {t('ledger.add.income').substring(0,1)}: {d.income.toFixed(1)}
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                ) : (
                                    <div className="h-48 flex items-center justify-center italic text-slate-300">{t('ledger.noRecords')}</div>
                                )}
                            </div>

                            {/* Category Breakdown */}
                            <div className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm flex flex-col gap-6">
                                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <PieChart className="w-4 h-4 text-purple-500" />
                                        {t('ledger.stats.categoryBreakdown')}
                                    </div>
                                </h3>

                                <div className="space-y-5">
                                    {statsData.categories?.filter((c: CategoryStat) => c.type === 'EXPENSE').length > 0 ? (
                                        statsData.categories
                                            .filter((c: CategoryStat) => c.type === 'EXPENSE')
                                            .sort((a: CategoryStat, b: CategoryStat) => Number(b.total) - Number(a.total))
                                            .map((cat: CategoryStat) => {
                                                const totalExpense = statsData.totals?.expense || 1
                                                const percentage = (Number(cat.total) / totalExpense) * 100
                                                return (
                                                    <div key={cat.id} className="flex flex-col gap-2">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-3">
                                                                <span className="text-xl leading-none">{cat.emoji}</span>
                                                                <span className="text-sm font-black text-slate-700">{cat.name}</span>
                                                            </div>
                                                            <div className="text-right">
                                                                <div className="text-sm font-black text-slate-800">¥{Number(cat.total).toFixed(2)}</div>
                                                                <div className="text-[10px] font-bold text-slate-400 leading-none">{percentage.toFixed(1)}%</div>
                                                            </div>
                                                        </div>
                                                        <div className="w-full h-2 bg-slate-50 rounded-full overflow-hidden">
                                                            <motion.div
                                                                initial={{ width: 0 }}
                                                                animate={{ width: `${percentage}%` }}
                                                                className="h-full bg-indigo-500/80 rounded-full"
                                                            />
                                                        </div>
                                                    </div>
                                                )
                                            })
                                    ) : (
                                        <div className="py-8 text-center text-slate-300 italic">{t('ledger.stats.noBreakdown')}</div>
                                    )}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="py-20 text-center text-slate-300">{t('ledger.noData')}</div>
                    )}
                </motion.div>
            </AnimatePresence>
        )}
    </main>
)}


            {/* FAB */}
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowAddModal(true)}
                className="fixed bottom-8 right-6 w-14 h-14 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-xl shadow-indigo-300 z-20"
            >
                <Plus className="w-6 h-6" />
            </motion.button>

            {/* Add Record Modal */}
            <AnimatePresence>
                {showAddModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex flex-col justify-end"
                        onClick={() => setShowAddModal(false)}
                    >
                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                            className="bg-white rounded-t-3xl min-h-[70vh] w-full p-6 flex flex-col gap-6"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-black text-slate-800">{t('ledger.add.title')}</h2>
                                <button onClick={() => setShowAddModal(false)} className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleAddSubmit} className="flex-1 flex flex-col gap-6">
                                {/* Type Toggle */}
                                <div className="flex p-1 bg-slate-100 rounded-2xl">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setTxType('EXPENSE');
                                            const cats = categories.filter(c => c.type === 'EXPENSE')
                                            if (cats.length > 0) setSelectedCategoryId(cats[0].id)
                                        }}
                                        className={`flex-1 py-3 rounded-xl text-sm font-bold flex flex-col items-center gap-1 transition-all ${txType === 'EXPENSE' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400'}`}
                                    >
                                        {t('ledger.add.expense')}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setTxType('INCOME');
                                            const cats = categories.filter(c => c.type === 'INCOME')
                                            if (cats.length > 0) setSelectedCategoryId(cats[0].id)
                                        }}
                                        className={`flex-1 py-3 rounded-xl text-sm font-bold flex flex-col items-center gap-1 transition-all ${txType === 'INCOME' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-400'}`}
                                    >
                                        {t('ledger.add.income')}
                                    </button>
                                </div>

                                {/* Amount Input */}
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1 mb-2 block">{t('ledger.add.amount')}</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        placeholder="0.00"
                                        className="w-full text-5xl font-black font-number bg-transparent border-b-2 border-slate-100 focus:border-indigo-500 py-2 outline-none transition-colors"
                                        required
                                        autoFocus
                                    />
                                </div>

                                {/* Category Selection */}
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1 mb-2 block">{t('ledger.add.category')}</label>
                                    <div className="grid grid-cols-4 gap-3">
                                        {activeCategories.map(cat => (
                                            <button
                                                key={cat.id}
                                                type="button"
                                                onClick={() => setSelectedCategoryId(cat.id)}
                                                className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all ${selectedCategoryId === cat.id ? 'bg-indigo-50 border-indigo-200' : 'bg-slate-50 border-transparent hover:bg-slate-100'}`}
                                            >
                                                <span className="text-2xl">{cat.emoji}</span>
                                                <span className={`text-[10px] font-bold ${selectedCategoryId === cat.id ? 'text-indigo-600' : 'text-slate-500'}`}>{cat.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1 mb-2 block">{t('ledger.add.desc')}</label>
                                    <input
                                        type="text"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder={t('ledger.add.desc') + '...'}
                                        className="w-full bg-slate-50 text-slate-700 font-medium p-4 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-100 transition-all border border-transparent focus:border-indigo-200"
                                        required
                                    />
                                </div>

                                {/* Submit */}
                                <div className="mt-auto pt-4 pb-[env(safe-area-inset-bottom)]">
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="w-full bg-indigo-600 text-white font-bold text-lg py-4 rounded-2xl shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
                                    >
                                        {submitting && <Loader2 className="w-5 h-5 animate-spin" />}
                                        {t('ledger.add.save')}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Bank Modal */}
            <AnimatePresence>
                {showBankModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex flex-col justify-end"
                        onClick={() => setShowBankModal(false)}
                    >
                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                            className="bg-white rounded-t-[40px] h-[85vh] w-full p-8 flex flex-col gap-8 shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex flex-col gap-1">
                                    <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                                        <Landmark className="w-8 h-8 text-emerald-500" />
                                        {t('ledger.balance.bank')}
                                    </h2>
                                    <p className="text-slate-400 font-bold text-sm tracking-wide">FAMILY VIRTUAL BANKING</p>
                                </div>
                                <button onClick={() => setShowBankModal(false)} className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-600 active:scale-95 transition-all">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            {/* Bank Balance Display */}
                            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-8 rounded-[32px] text-white shadow-xl shadow-emerald-200/50 flex flex-col items-center gap-2 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16" />
                                <span className="font-bold text-sm uppercase tracking-widest opacity-80">{t('ledger.activeBalance')}</span>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-2xl font-black opacity-60">¥</span>
                                    <span className="text-5xl font-black font-number">{bankBalance.toFixed(2)}</span>
                                </div>
                                <div className="mt-4 px-4 py-1.5 bg-white/20 rounded-full text-[10px] font-black tracking-widest">EST. APR: 4.8%</div>
                            </div>

                            <form onSubmit={handleBankTransfer} className="flex-1 flex flex-col gap-8">
                                {/* Action Type Toggle */}
                                <div className="flex p-1.5 bg-slate-100/80 rounded-[24px]">
                                    <button
                                        type="button"
                                        onClick={() => setBankTxType('DEPOSIT')}
                                        className={`flex-1 py-4 rounded-2xl text-sm font-black flex items-center justify-center gap-2 transition-all ${bankTxType === 'DEPOSIT' ? 'bg-white shadow-md text-emerald-600' : 'text-slate-400 hover:text-slate-500'}`}
                                    >
                                        <TrendingDown className="w-4 h-4" />
                                        {t('ledger.deposit')}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setBankTxType('WITHDRAWAL')}
                                        className={`flex-1 py-4 rounded-2xl text-sm font-black flex items-center justify-center gap-2 transition-all ${bankTxType === 'WITHDRAWAL' ? 'bg-white shadow-md text-indigo-600' : 'text-slate-400 hover:text-slate-500'}`}
                                    >
                                        <TrendingUp className="w-4 h-4" />
                                        {t('ledger.withdraw')}
                                    </button>
                                </div>

                                {/* Amount Input */}
                                <div className="flex flex-col gap-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pl-1">{t('ledger.add.amount')}</label>
                                    <div className="relative flex items-center">
                                        <span className="absolute left-0 text-3xl font-black text-slate-300">¥</span>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={bankAmount}
                                            onChange={(e) => setBankAmount(e.target.value)}
                                            placeholder="0.00"
                                            className="w-full text-6xl font-black font-number bg-transparent border-b-4 border-slate-100 focus:border-emerald-500 pl-8 pb-4 outline-none transition-all placeholder:text-slate-100"
                                            required
                                        />
                                    </div>
                                    <div className="flex justify-between px-1">
                                        <span className="text-xs font-bold text-slate-400">
                                            {bankTxType === 'DEPOSIT' ? `${t('ledger.balance.available')}: ¥${balance.toFixed(2)}` : `${t('ledger.balance.bank')}: ¥${bankBalance.toFixed(2)}`}
                                        </span>
                                        <button 
                                            type="button"
                                            onClick={() => setBankAmount((bankTxType === 'DEPOSIT' ? balance : bankBalance).toString())}
                                            className="text-xs font-black text-emerald-500 uppercase tracking-widest hover:text-emerald-600"
                                        >
                                            {t('common.all')}
                                        </button>
                                    </div>
                                </div>

                                {/* Dynamic Advice/Stat */}
                                <div className="bg-amber-50 rounded-3xl p-5 border border-amber-100 flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-2xl bg-amber-500 flex items-center justify-center text-white shrink-0 shadow-lg shadow-amber-200">
                                        <TrendingUp className="w-5 h-5" />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="font-black text-amber-800 text-sm">{t('ledger.bankAdvice.title') || '理财小贴士'}</span>
                                        <span className="text-amber-700/70 text-xs font-bold leading-relaxed">{t('ledger.bankAdvice.desc') || '储蓄可以复利增长，存款金额越高，未来的奖励就越多哦！'}</span>
                                    </div>
                                </div>

                                {/* Submit */}
                                <div className="mt-auto pb-[env(safe-area-inset-bottom,1.5rem)]">
                                    <button
                                        type="submit"
                                        disabled={submitting || !bankAmount}
                                        className="w-full bg-emerald-500 text-white font-black text-xl py-6 rounded-[28px] shadow-2xl shadow-emerald-200 disabled:opacity-50 disabled:grayscale disabled:shadow-none flex items-center justify-center gap-3 active:scale-[0.98] transition-all"
                                    >
                                        {submitting && <Loader2 className="w-6 h-6 animate-spin" />}
                                        {t('common.confirm')}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    )
}
