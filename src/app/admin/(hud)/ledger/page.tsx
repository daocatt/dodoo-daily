'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence, useAnimation } from 'framer-motion'
import { Wallet, Plus, X as XIcon, Loader2, BarChart3, ReceiptText, ChevronLeft, ChevronRight, PieChart, TrendingUp, TrendingDown, Settings, Check, Trash2 } from 'lucide-react'
import { format, subMonths, addMonths, startOfMonth, endOfMonth } from 'date-fns'
import { useI18n } from '@/contexts/I18nContext'
import Link from 'next/link'
import Image from 'next/image'
import clsx from 'clsx'
import { BausteinAdminNavbar } from '@/components/BausteinAdminNavbar'
interface LedgerRecord { id: string; type: string; amount: number; description: string; date: string; category?: { name: string; emoji: string; }; relatedUser?: { id: string; name: string; avatarUrl: string; }; }
interface Category { id: string; type: string; name: string; emoji: string; }
interface ChartData { fullDate: string; day: string; income: number; expense: number; }
interface CategoryStat { id: string; name: string; emoji: string; total: number | string; type: string; }
interface StatsData { totals?: { income: number; expense: number; }; chartData?: ChartData[]; categories?: CategoryStat[]; }

const LedgerItem = ({ record, index, locale, t, onDelete }: { record: LedgerRecord, index: number, locale: string, t: any, onDelete?: (id: string) => void }) => {
    const controls = useAnimation();
    const isDragging = useRef(false);
    const isExpense = record.type === 'EXPENSE';

    useEffect(() => {
        controls.start({ 
            opacity: 1, 
            y: 0,
            transition: { 
                delay: index * 0.02,
                duration: 0.3,
                ease: [0.16, 1, 0.3, 1] 
            } 
        });
    }, [controls, index]);

    const onDragEnd = (_event: any, info: any) => {
        if (info.offset.x < -40) {
            controls.start({ x: -100 });
        } else {
            controls.start({ x: 0 });
        }
        setTimeout(() => isDragging.current = false, 50);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={controls}
            className="relative group overflow-hidden rounded-xl md:rounded-[1.25rem] bg-transparent"
        >
            {/* Background Layer: Action Button */}
            <div className="absolute inset-y-0 right-0 w-[100px] flex items-center justify-center bg-transparent">
                <button 
                    onClick={() => onDelete?.(record.id)}
                    className="hardware-btn group h-9"
                >
                    <div className="hardware-well relative h-full min-w-[70px] rounded-full bg-[#DADBD4] shadow-well active:translate-y-0.5 transition-all flex items-center justify-center p-0.5">
                        <div className="absolute inset-[2px] rounded-full bg-white flex items-center justify-center gap-1.5 border border-black/5 shadow-sm group-hover:bg-red-50 transition-colors px-3">
                            <Trash2 className="w-3.5 h-3.5 text-red-400" />
                            <span className="text-[9px] font-black uppercase tracking-[0.1em] label-mono text-red-400">Del</span>
                        </div>
                    </div>
                </button>
            </div>

            {/* Foreground Draggable Layer */}
            <motion.div
                drag="x"
                dragConstraints={{ left: -100, right: 0 }}
                dragElastic={0.02}
                animate={controls}
                onDragStart={() => { isDragging.current = true; }}
                onDragEnd={onDragEnd}
                className="relative z-10 bg-white border border-black/5 shadow-sm rounded-xl md:rounded-[1.25rem] p-3 md:p-4 flex items-center justify-between group-hover:border-black/10 transition-all active:cursor-grabbing"
            >
                <div className="flex items-center gap-3 md:gap-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={`p-3 rounded-2xl flex items-center justify-center ${record.type === 'INCOME' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}
                    >
                        {record.category?.emoji || '💰'}
                    </motion.div>
                    <div className="flex flex-col">
                        <span className="font-black text-slate-800 tracking-tight leading-tight">{record.description || record.category?.name}</span>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest label-mono">
                                {new Date(record.date).toLocaleDateString(locale, { month: 'short', day: 'numeric' })}
                            </span>
                            {record.category?.name && (
                                <span className="w-1 h-1 rounded-full bg-slate-200" />
                            )}
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest label-mono bg-slate-50 px-1.5 rounded-md border border-black/5">
                                {record.category?.name}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className={clsx(
                        "flex items-baseline gap-0.5 font-black font-number text-lg md:text-xl tracking-tighter",
                        isExpense ? "text-emerald-500" : "text-red-500"
                    )}>
                        <span className="text-sm opacity-40">{isExpense ? '-' : '+'}</span>
                        <span>{Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(record.amount)}</span>
                    </div>

                    {record.relatedUser && (
                        <div className="hardware-well p-0.5 rounded-full bg-[#DADBD4] shadow-well border border-black/5 w-8 h-8 flex items-center justify-center shrink-0">
                            <div className="w-full h-full rounded-full border border-white/50 overflow-hidden relative">
                                <Image 
                                    src={record.relatedUser.avatarUrl || "/dog.svg"} 
                                    fill
                                    alt={record.relatedUser.name}
                                    className="object-cover"
                                />
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
};

export default function LedgerPage() {
    const { t, locale } = useI18n()
    const [loading, setLoading] = useState(true)
    const [balance, setBalance] = useState(0)
    const [records, setRecords] = useState<LedgerRecord[]>([])
    const [page, setPage] = useState(1)
    const [hasMore, setHasMore] = useState(true)
    const [categories, setCategories] = useState<Category[]>([])
    const [members, setMembers] = useState<{id:string, name:string, nickname:string, avatarUrl:string, role:string}[]>([])
    const [currentUserId, setCurrentUserId] = useState('')
    const [isAdmin, setIsAdmin] = useState(false)
    
    // Stats State
    const [activeTab, setActiveTab] = useState<'RECORDS' | 'STATS'>('RECORDS')
    const [statsLoading, setStatsLoading] = useState(false)
    const [statsData, setStatsData] = useState<StatsData | null>(null)
    const [startDate, setStartDate] = useState(format(subMonths(new Date(), 5), 'yyyy-MM-dd'))
    const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'))

    // Modal State
    const [showAddModal, setShowAddModal] = useState(false)
    const [txType, setTxType] = useState<'EXPENSE' | 'INCOME'>('EXPENSE')
    const [amount, setAmount] = useState('')
    const [description, setDescription] = useState('')
    const [selectedCategoryId, setSelectedCategoryId] = useState('')
    const [submitting, setSubmitting] = useState(false)
    
    // Transfer State
    const [showTransferModal, setShowTransferModal] = useState(false)
    const [targetUserId, setTargetUserId] = useState('')
    const [transferAmount, setTransferAmount] = useState('')
    const [transferDesc, setTransferDesc] = useState('')

    const fetchData = async (targetPage = 1) => {
        if (targetPage === 1) setLoading(true)
        try {
            const limit = 50;
            const [ledgerRes, catRes, statsRes, membersRes] = await Promise.all([
                fetch(`/api/ledger?page=${targetPage}&limit=${limit}`),
                fetch('/api/ledger/categories'),
                fetch('/api/stats'),
                fetch('/api/family/members')
            ])
            const ledgerData = await ledgerRes.json()
            const catData = await catRes.json()
            const statsDataFromApi = await statsRes.json()
            const membersData = await membersRes.json()
            
            setIsAdmin(statsDataFromApi.isAdmin || false)
            setCurrentUserId(statsDataFromApi.userId)

            if (ledgerData.records) {
                if (targetPage === 1) {
                    setRecords(ledgerData.records)
                } else {
                    setRecords(prev => [...prev, ...ledgerData.records])
                }
                setBalance(ledgerData.balance)
                setHasMore(ledgerData.records.length === limit)
            }
            if (Array.isArray(catData)) {
                setCategories(catData)
                const expCats = catData.filter((c: Category) => c.type === 'EXPENSE')
                if (expCats.length > 0 && !selectedCategoryId) {
                    setSelectedCategoryId(expCats[0].id)
                }
            }
            if (Array.isArray(membersData)) {
                setMembers(membersData)
            }
            setPage(targetPage)
        } catch (_error) {
            console.error('Failed to fetch ledger data', _error)
        }
        setLoading(false)
    }

    const loadMore = () => {
        if (!loading && hasMore) {
            fetchData(page + 1)
        }
    }

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
                fetchData(1) // Refresh from start
            } else {
                alert(data.error || 'Failed to add record')
            }
        } catch (_error) {
            console.error(_error)
        }
        setSubmitting(false)
    }

    const handleTransferSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!targetUserId || !transferAmount) return
        
        setSubmitting(true)
        try {
            const res = await fetch('/api/ledger/transfer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    targetUserId,
                    amount: parseFloat(transferAmount),
                    description: transferDesc || '转账'
                })
            })
            const data = await res.json()
            if (data.success) {
                setShowTransferModal(false)
                setTransferAmount('')
                setTransferDesc('')
                fetchData(1) // Refresh
            } else {
                alert(data.error || '转账失败')
            }
        } catch (_error) {
            console.error(_error)
        }
        setSubmitting(false)
    }

    const handleDeleteRecord = async (id: string) => {
        if (!window.confirm(t('ledger.delete.confirm'))) return;
        try {
            const res = await fetch(`/api/ledger/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setRecords(prev => prev.filter(r => r.id !== id));
                const record = records.find(r => r.id === id);
                if (record) {
                    const delta = record.type === 'EXPENSE' ? record.amount : -record.amount;
                    setBalance(prev => prev + delta);
                }
            }
        } catch (e) {
            console.error('Delete failed:', e);
        }
    };

    const fetchStats = async () => {
        setStatsLoading(true)
        try {
            const res = await fetch(`/api/ledger/stats?startDate=${startDate}&endDate=${endDate}`)
            const data = await res.json()
            setStatsData(data)
        } catch (_error) {
            console.error('Failed to fetch stats', _error)
        }
        setStatsLoading(false)
    }

    useEffect(() => {
        if (activeTab === 'STATS') {
            fetchStats()
        }
    }, [activeTab, startDate, endDate])

    // Custom SVG Line Chart Component
    const MonthlyLineChart = ({ trend }: { trend: any[] }) => {
        if (!trend || trend.length === 0) return <div className="h-40 flex items-center justify-center opacity-30 label-mono text-xs">{t('ledger.noData')}</div>

        const padding = 40;
        const width = 600;
        const height = 240;
        const maxVal = Math.max(...trend.map(d => Math.max(d.income, d.expense)), 100);

        const getX = (index: number) => padding + (index * (width - 2 * padding) / Math.max(trend.length - 1, 1));
        const getY = (val: number) => height - padding - (val * (height - 2 * padding) / maxVal);

        // Bezier Curve Helper
        const getBezierPath = (points: {x: number, y: number}[]) => {
            if (points.length < 2) return "";
            let path = `M ${points[0].x},${points[0].y}`;
            for (let i = 0; i < points.length - 1; i++) {
                const xmid = (points[i].x + points[i+1].x) / 2;
                const ymid = (points[i].y + points[i+1].y) / 2;
                const xcp1 = (xmid + points[i].x) / 2;
                const xcp2 = (xmid + points[i+1].x) / 2;
                path += ` Q ${xcp1},${points[i].y} ${xmid},${ymid} T ${points[i+1].x},${points[i+1].y}`;
            }
            return path;
        };

        const incomePoints = trend.map((d, i) => ({ x: getX(i), y: getY(d.income) }));
        const expensePoints = trend.map((d, i) => ({ x: getX(i), y: getY(d.expense) }));

        return (
            <div className="relative w-full">
                <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible select-none">
                    {/* Grid Lines & Labels */}
                    {[0, 0.5, 1].map((p, i) => {
                        const val = maxVal * p;
                        const y = getY(val);
                        return (
                            <React.Fragment key={i}>
                                <line 
                                    x1={padding} y1={y} 
                                    x2={width - padding} y2={y} 
                                    stroke="rgba(0,0,0,0.05)" strokeWidth="1" strokeDasharray="4 4" 
                                />
                                <text x={padding - 10} y={y + 4} textAnchor="end" className="text-[8px] fill-slate-300 font-black label-mono">
                                    {val >= 1000 ? `${(val/1000).toFixed(1)}k` : val.toFixed(0)}
                                </text>
                            </React.Fragment>
                        );
                    })}

                    {/* Expense Line (GREEN) - Smooth Path */}
                    <motion.path
                        d={getBezierPath(expensePoints)}
                        fill="none"
                        stroke="#10B981"
                        strokeWidth="4"
                        strokeLinejoin="round"
                        strokeLinecap="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1.5, ease: "easeInOut" }}
                    />
                    
                    {/* Income Line (RED) - Smooth Path */}
                    <motion.path
                        d={getBezierPath(incomePoints)}
                        fill="none"
                        stroke="#EF4444"
                        strokeWidth="4"
                        strokeLinejoin="round"
                        strokeLinecap="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1.5, ease: "easeInOut", delay: 0.2 }}
                    />

                    {/* Data Interaction Nodes */}
                    {trend.map((d, i) => (
                        <React.Fragment key={i}>
                            <motion.circle 
                                initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5 + i * 0.1 }}
                                cx={getX(i)} cy={getY(d.income)} r="4" fill="#EF4444" className="shadow-lg" 
                            />
                            <motion.circle 
                                initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5 + i * 0.1 }}
                                cx={getX(i)} cy={getY(d.expense)} r="4" fill="#10B981" className="shadow-lg" 
                            />
                            <text 
                                x={getX(i)} 
                                y={height - 5} 
                                textAnchor="middle" 
                                className="text-[10px] fill-slate-400 font-black label-mono"
                            >
                                {d.month.split('-')[1]}
                            </text>
                        </React.Fragment>
                    ))}
                </svg>/n
                
                {/* Legend */}
                <div className="flex gap-6 mt-8 justify-center">
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-red-50/50 border border-red-100">
                        <div className="w-2 h-2 rounded-full bg-[#EF4444]" />
                        <span className="label-mono text-[9px] font-black uppercase text-red-600">{t('ledger.stats.income')}</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50/50 border border-emerald-100">
                        <div className="w-2 h-2 rounded-full bg-[#10B981]" />
                        <span className="label-mono text-[9px] font-black uppercase text-emerald-600">{t('ledger.stats.expense')}</span>
                    </div>
                </div>
            </div>
        );
    }

    useEffect(() => {
        fetchData()
    }, [])

    // Helper to group records by month
    const groupedRecords = records.reduce((groups, record) => {
        const month = format(new Date(record.date), 'yyyy-MM');
        if (!groups[month]) groups[month] = [];
        groups[month].push(record);
        return groups;
    }, {} as Record<string, LedgerRecord[]>);

    return (
        <div className="min-h-screen bg-[#E2DFD2] relative flex flex-col font-sans selection:bg-indigo-100">
            <BausteinAdminNavbar 
                title={t('nav.ledger')}
                onAdd={() => setShowAddModal(true)}
                onTransfer={() => setShowTransferModal(true)}
            />

            <main className="flex-1 flex flex-col items-center px-4 md:px-8 pt-6 pb-24 md:pt-10 max-w-7xl mx-auto w-full gap-8 md:gap-12 relative overflow-y-auto hide-scrollbar">
                {/* Navigation Tabs */}
                <div className="w-full max-w-2xl hardware-well p-1.5 rounded-[2rem] bg-slate-900/5 backdrop-blur-md shadow-inner flex items-center relative gap-1">
                    <button 
                        onClick={() => setActiveTab('RECORDS')}
                        className={clsx(
                            "flex-1 flex items-center justify-center gap-2 py-3 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest transition-all z-10",
                            activeTab === 'RECORDS' ? "bg-white text-slate-900 shadow-md" : "text-slate-400 hover:text-slate-600"
                        )}
                    >
                        <ReceiptText className={clsx("w-3.5 h-3.5", activeTab === 'RECORDS' ? "text-indigo-600" : "")} />
                        {t('ledger.tab.records') || 'Records'}
                    </button>
                    <button 
                        onClick={() => setActiveTab('STATS')}
                        className={clsx(
                            "flex-1 flex items-center justify-center gap-2 py-3 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest transition-all z-10",
                            activeTab === 'STATS' ? "bg-white text-slate-900 shadow-md" : "text-slate-400 hover:text-slate-600"
                        )}
                    >
                        <BarChart3 className={clsx("w-3.5 h-3.5", activeTab === 'STATS' ? "text-pink-600" : "")} />
                        {t('ledger.tab.stats') || 'Stats'}
                    </button>
                </div>

                {loading && page === 1 && activeTab === 'RECORDS' ? (
                    <div className="py-20 flex flex-col items-center gap-4">
                        <Loader2 className="w-10 h-10 animate-spin text-slate-400" />
                        <span className="label-mono text-xs font-black text-slate-400 uppercase tracking-widest">Inundating...</span>
                    </div>
                ) : (
                    <AnimatePresence mode="wait">
                        {activeTab === 'RECORDS' ? (
                            <motion.div
                                key="records-panel"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                className="w-full max-w-2xl flex flex-col gap-10"
                            >
                                {/* Physical POS Hardware Display: WARM EDITION */}
                                    <div className="w-full max-w-2xl hardware-well p-1 bg-[#8B735B] rounded-[2.5rem] shadow-[0_10px_50px_-10px_rgba(139,115,91,0.4),inset_0_2px_4px_rgba(255,255,255,0.3)] border-b-8 border-[#5D4037] relative group overflow-hidden">
                                        {/* Physical Bezel */}
                                        <div className="w-full h-full bg-[#3E2723] rounded-[2.2rem] p-6 shadow-[inset_0_4px_15px_rgba(0,0,0,0.9)] flex flex-col items-center relative overflow-hidden">
                                            
                                            {/* LCD Screen Plate: AMBER GLOW */}
                                            <div className="w-full bg-[#F5D76E] rounded-2xl p-8 flex flex-col items-center relative overflow-hidden shadow-[inset_0_6px_15px_rgba(8d,66,48,0.5),0_1px_rgba(255,236,179,0.4)] border border-[#8D6E63]/30">
                                                
                                                {/* Screen Headers */}
                                                <div className="w-full flex justify-between items-center mb-4 px-1">
                                                    <span className="text-[10px] font-black text-[#5D4037]/80 uppercase tracking-[0.25em] font-mono leading-none">
                                                        {t('ledger.balance.available')}
                                                    </span>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[8px] font-black text-[#5D4037]/60 font-mono">BAT: 98%</span>
                                                        <div className="w-1.5 h-1.5 rounded-full bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.8)] animate-pulse" />
                                                    </div>
                                                </div>

                                                {/* Amount Display */}
                                                <div className="flex items-baseline gap-4 relative">
                                                    <span className="text-3xl font-black text-[#795548]/40 font-mono italic">¥</span>
                                                    <span className="text-7xl font-black text-[#2D1B15] font-number tracking-tighter mix-blend-multiply drop-shadow-[0_1px_1px_rgba(255,255,255,0.4)]">
                                                        {Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(balance)}
                                                    </span>
                                                </div>

                                                {/* LCD Ghosting & Scanlines Overlay */}
                                                <div className="absolute inset-0 pointer-events-none">
                                                    {/* Screen Grain: WARMER */}
                                                    <div className="absolute inset-0 opacity-[0.15] bg-[url('/grain.png')] mix-blend-overlay" />
                                                    {/* Horizontal Scanlines */}
                                                    <div className="absolute inset-0 bg-[linear-gradient(rgba(93,64,55,0.08)_50%,transparent_50%)] bg-[length:100%_2px] opacity-30" />
                                                    {/* Golden Glass Glare */}
                                                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-amber-100/10 to-white/30 opacity-60 rotate-[-12deg] scale-150 translate-x-12 -translate-y-20" />
                                                </div>
                                            </div>

                                            {/* Hardware Detail: Brand Name or Serial */}
                                            <div className="mt-4 flex justify-between w-full px-6 opacity-40">
                                                <span className="text-[9px] font-black text-amber-100/60 label-mono uppercase">Model: DOD-LGR-95-AMB</span>
                                                <span className="text-[9px] font-black text-amber-100/60 label-mono uppercase tracking-widest">Digital Ledger Systems</span>
                                            </div>
                                        </div>
                                    </div>

                                {/* Month Grouped Sections */}
                                <div className="flex flex-col gap-12">
                                    {records.length > 0 ? Object.entries(groupedRecords).sort(([mA], [mB]) => mB.localeCompare(mA)).map(([month, monthRecords]) => (
                                        <div key={month} className="flex flex-col gap-5">
                                            <div className="sticky top-0 z-20 flex items-center gap-4 py-2 bg-[#E2DFD2]/80 backdrop-blur-sm px-1">
                                                <div className="text-[10px] font-bold text-slate-400 label-mono uppercase tracking-[0.2em]">
                                                    {format(new Date(month + '-01'), 'MMMM yyyy')}
                                                </div>
                                                <div className="h-[1px] flex-1 bg-slate-400/20" />
                                                <div className="text-[10px] font-bold text-slate-400 label-mono uppercase">
                                                    {t('ledger.transactionCount', { count: monthRecords.length.toString() })}
                                                </div>
                                            </div>

                                            <div className="flex flex-col gap-3">
                                                {monthRecords.map((record, idx) => (
                                                    <LedgerItem 
                                                        key={record.id} 
                                                        record={record} 
                                                        index={idx} 
                                                        locale={locale} 
                                                        t={t}
                                                        onDelete={handleDeleteRecord}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="py-20 flex flex-col items-center justify-center opacity-30 label-mono text-xs gap-4">
                                            <div className="w-12 h-12 rounded-full border-4 border-dashed border-slate-300 animate-[spin_10s_linear_infinite]" />
                                            {t('ledger.noData')} — SYSTEM IDLE
                                        </div>
                                    )}

                                    {hasMore && (
                                        <button 
                                            onClick={loadMore}
                                            disabled={loading}
                                            className="hardware-btn w-full h-20 group"
                                        >
                                            <div className="hardware-well relative h-full rounded-[1.8rem] bg-white shadow-well active:translate-y-1 transition-all flex items-center justify-center border border-black/5 hover:border-black/10">
                                                <div className="flex items-center gap-3">
                                                    {loading ? <Loader2 className="w-4 h-4 animate-spin text-slate-400" /> : <Plus className="w-4 h-4 text-slate-400" />}
                                                    <span className="text-xs font-black uppercase tracking-[0.2em] label-mono text-slate-500">
                                                        {loading ? 'Decrypting...' : t('common.loadMore')}
                                                    </span>
                                                </div>
                                            </div>
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        ) : (
                                <motion.div
                                    key="stats-panel"
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 10 }}
                                    className="w-full max-w-2xl flex flex-col gap-8"
                                >
                                    {/* Date Range Selector Panel */}
                                    <div className="hardware-well p-5 rounded-[2rem] bg-[#DADBD4]/30 shadow-well border border-black/5 flex flex-col gap-4">
                                        <div className="flex items-center justify-between px-2">
                                            <span className="label-mono text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{t('ledger.stats.periodSelect')}</span>
                                            <span className="text-[9px] font-bold text-slate-400 label-mono uppercase bg-white/50 px-2 py-0.5 rounded border border-black/5">Max 24 Months</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="flex flex-col gap-1.5">
                                                <label className="label-mono text-[9px] font-black text-slate-400 uppercase tracking-widest pl-2">Begin</label>
                                                <input 
                                                    type="month" 
                                                    value={startDate.substring(0, 7)}
                                                    onChange={(e) => setStartDate(`${e.target.value}-01`)}
                                                    className="hardware-well h-12 bg-white rounded-xl border-none text-xs font-black label-mono px-4 focus:ring-2 focus:ring-indigo-500/20"
                                                />
                                            </div>
                                            <div className="flex flex-col gap-1.5">
                                                <label className="label-mono text-[9px] font-black text-slate-400 uppercase tracking-widest pl-2">End</label>
                                                <input 
                                                    type="month" 
                                                    value={endDate.substring(0, 7)}
                                                    onChange={(e) => setEndDate(format(endOfMonth(new Date(`${e.target.value}-01`)), 'yyyy-MM-dd'))}
                                                    className="hardware-well h-12 bg-white rounded-xl border-none text-xs font-black label-mono px-4 focus:ring-2 focus:ring-indigo-500/20"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {statsLoading ? (
                                        <div className="py-20 flex flex-col items-center gap-3">
                                            <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
                                            <span className="label-mono text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Processing Series...</span>
                                        </div>
                                    ) : statsData ? (
                                        <div className="flex flex-col gap-8">
                                            
                                            {/* Financial Health Indicator */}
                                            {(() => {
                                                const totalInc = statsData.monthlyTrend.reduce((acc: any, cur: any) => acc + cur.income, 0);
                                                const totalExp = statsData.monthlyTrend.reduce((acc: any, cur: any) => acc + cur.expense, 0);
                                                const savings = totalInc - totalExp;
                                                const savingsRate = totalInc > 0 ? (savings / totalInc) * 100 : 0;
                                                
                                                return (
                                                    <div className="hardware-well p-8 rounded-[2.5rem] bg-white border border-black/5 shadow-well flex flex-col gap-6 relative overflow-hidden">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex flex-col gap-1">
                                                                <span className="label-mono text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('ledger.stats.financialHealth') || 'Financial Health'}</span>
                                                                <h4 className="text-xl font-black text-slate-800 tracking-tight">
                                                                    {savingsRate > 50 ? 'Excellent Surplus' : savingsRate > 20 ? 'Good Stability' : 'Needs Vigilance'}
                                                                </h4>
                                                            </div>
                                                            <div className="text-right">
                                                                <div className="text-2xl font-black font-number text-indigo-600 tracking-tighter">{savingsRate.toFixed(1)}%</div>
                                                                <div className="label-mono text-[9px] font-black uppercase text-slate-300">Net Surplus Rate</div>
                                                            </div>
                                                        </div>
                                                        
                                                        <div className="relative w-full h-8 hardware-well bg-slate-100 rounded-full overflow-hidden p-1 shadow-inner">
                                                            <motion.div 
                                                                initial={{ width: 0 }}
                                                                animate={{ width: `${Math.max(0, Math.min(100, savingsRate))}%` }}
                                                                transition={{ duration: 1.5, ease: "easeOut" }}
                                                                className={clsx(
                                                                    "h-full rounded-full shadow-lg relative",
                                                                    savingsRate > 30 ? "bg-gradient-to-r from-emerald-400 to-indigo-500" : "bg-gradient-to-r from-orange-400 to-red-500"
                                                                )}
                                                            >
                                                                <div className="absolute inset-0 bg-white/20 mix-blend-overlay animate-pulse" />
                                                            </motion.div>
                                                        </div>
                                                        <div className="flex justify-between px-2">
                                                            <span className="text-[9px] font-black text-slate-400 label-mono uppercase">Total Saved: ¥{Intl.NumberFormat(locale).format(savings)}</span>
                                                            <span className="text-[9px] font-black text-slate-300 label-mono uppercase">Operational Matrix V1.2</span>
                                                        </div>
                                                    </div>
                                                );
                                            })()}
                                            
                                            {/* Summary Tiles: This Month vs This Year */}
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="hardware-well p-6 rounded-[2rem] bg-indigo-50/10 shadow-well border border-black/5 flex flex-col gap-4 relative overflow-hidden group">
                                                    <div className="flex items-center justify-between">
                                                        <span className="label-mono text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">{t('ledger.stats.thisMonth')}</span>
                                                        <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                                                    </div>
                                                    <div className="flex flex-col gap-2">
                                                        <div className="flex justify-between items-center bg-white/40 p-2.5 rounded-xl border border-black/5">
                                                            <span className="text-[10px] font-black text-red-500 label-mono">INC</span>
                                                            <span className="font-number font-black text-slate-800 tracking-tighter">¥{Intl.NumberFormat(locale).format(statsData.currentMonthStats.income)}</span>
                                                        </div>
                                                        <div className="flex justify-between items-center bg-white/40 p-2.5 rounded-xl border border-black/5">
                                                            <span className="text-[10px] font-black text-emerald-500 label-mono">EXP</span>
                                                            <span className="font-number font-black text-slate-800 tracking-tighter">¥{Intl.NumberFormat(locale).format(statsData.currentMonthStats.expense)}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="hardware-well p-6 rounded-[2rem] bg-slate-50/10 shadow-well border border-black/5 flex flex-col gap-4 relative overflow-hidden group">
                                                    <div className="flex items-center justify-between">
                                                        <span className="label-mono text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">{t('ledger.stats.thisYear')}</span>
                                                        <span className="text-[9px] font-black text-slate-300 label-mono">{new Date().getFullYear()}</span>
                                                    </div>
                                                    <div className="flex flex-col gap-2">
                                                        <div className="flex justify-between items-center bg-white/40 p-2.5 rounded-xl border border-black/5">
                                                            <span className="text-[10px] font-black text-red-500 label-mono">INC</span>
                                                            <span className="font-number font-black text-slate-800 tracking-tighter">¥{Intl.NumberFormat(locale).format(statsData.currentYearStats.income)}</span>
                                                        </div>
                                                        <div className="flex justify-between items-center bg-white/40 p-2.5 rounded-xl border border-black/5">
                                                            <span className="text-[10px] font-black text-emerald-500 label-mono">EXP</span>
                                                            <span className="font-number font-black text-slate-800 tracking-tighter">¥{Intl.NumberFormat(locale).format(statsData.currentYearStats.expense)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Monthly Trend折线图 */}
                                            <div className="hardware-well p-8 rounded-[2.5rem] bg-white border border-black/5 shadow-well relative overflow-hidden">
                                                <div className="flex items-center justify-between mb-8 relative z-10">
                                                    <h3 className="label-mono text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                                        <TrendingUp className="w-4 h-4 text-indigo-500" />
                                                        {t('ledger.stats.monthlyTrend')}
                                                    </h3>
                                                    <div className="text-[9px] font-bold text-slate-300 label-mono tracking-tighter uppercase font-black">6-Month Trajectory</div>
                                                </div>
                                                <div className="relative z-10">
                                                    <MonthlyLineChart trend={statsData.monthlyTrend} />
                                                </div>
                                                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/30 blur-3xl -mr-16 -mt-16 rounded-full" />
                                            </div>

                                            {/* Category Breakdown (6 months composition) */}
                                            <div className="hardware-well p-8 rounded-[2.5rem] bg-white border border-black/5 shadow-well flex flex-col gap-8 relative overflow-hidden">
                                                <div className="flex items-center justify-between">
                                                    <h3 className="label-mono text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                                        <PieChart className="w-4 h-4 text-purple-500" />
                                                        {t('ledger.stats.categoryBreakdown')}
                                                    </h3>
                                                    <div className="text-[9px] font-bold text-slate-300 label-mono uppercase">Usage Matrix</div>
                                                </div>

                                                <div className="flex flex-col md:flex-row gap-12 items-center">
                                                    {/* SVG Donut Chart */}
                                                    <div className="relative w-48 h-48 shrink-0">
                                                        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                                                            {statsData.categories?.filter((c: CategoryStat) => c.type === 'EXPENSE').length > 0 ? (
                                                                (() => {
                                                                    const expCats = statsData.categories.filter((c: CategoryStat) => c.type === 'EXPENSE').sort((a: CategoryStat, b: CategoryStat) => Number(b.total) - Number(a.total));
                                                                    const total = expCats.reduce((acc: number, cur: CategoryStat) => acc + Number(cur.total), 0) || 1;
                                                                    let currentOffset = 0;
                                                                    return expCats.map((cat: CategoryStat, i: number) => {
                                                                        const percentage = (Number(cat.total) / total) * 100;
                                                                        const dashArray = `${percentage} ${100 - percentage}`;
                                                                        const dashOffset = -currentOffset;
                                                                        currentOffset += percentage;
                                                                        const colors = ['#6366F1', '#8B5CF6', '#EC4899', '#3B82F6', '#10B981', '#F59E0B', '#FACC15', '#94A3B8'];
                                                                        return (
                                                                            <motion.circle
                                                                                key={cat.id}
                                                                                cx="50" cy="50" r="40"
                                                                                pathLength={100}
                                                                                fill="transparent"
                                                                                stroke={colors[i % colors.length]}
                                                                                strokeWidth="14"
                                                                                strokeDasharray={dashArray}
                                                                                strokeDashoffset={dashOffset}
                                                                                strokeLinecap="round"
                                                                                initial={{ opacity: 0, strokeDasharray: "0 100" }}
                                                                                animate={{ opacity: 1, strokeDasharray: dashArray }}
                                                                                transition={{ duration: 1.2, delay: i * 0.05, ease: "easeOut" }}
                                                                            />
                                                                        );
                                                                    });
                                                                })()
                                                            ) : (
                                                                <circle cx="50" cy="50" r="40" fill="transparent" stroke="#F1F5F9" strokeWidth="12" />
                                                            )}
                                                        </svg>
                                                        <div className="absolute inset-0 flex flex-center items-center justify-center flex-col">
                                                            <span className="text-[10px] font-black text-slate-300 label-mono uppercase">Consumed</span>
                                                            <span className="text-sm font-black text-slate-900 font-number">
                                                                ¥{Intl.NumberFormat(locale).format(statsData.categories.filter((c: CategoryStat) => c.type === 'EXPENSE').reduce((acc: number, cur: CategoryStat) => acc + Number(cur.total), 0))}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Legend List */}
                                                    <div className="flex-1 w-full flex flex-col gap-4">
                                                        {statsData.categories?.filter((c: CategoryStat) => c.type === 'EXPENSE').length ? statsData.categories.filter((c: CategoryStat) => c.type === 'EXPENSE')
                                                            .sort((a: CategoryStat, b: CategoryStat) => Number(b.total) - Number(a.total))
                                                            .slice(0, 8)
                                                            .map((cat: CategoryStat, i: number) => {
                                                                const colors = ['#6366F1', '#8B5CF6', '#EC4899', '#3B82F6', '#10B981', '#F59E0B', '#FACC15', '#94A3B8'];
                                                                const totalExpense = statsData.categories.filter((c: CategoryStat) => c.type === 'EXPENSE').reduce((acc: number, cur: CategoryStat) => acc + Number(cur.total), 0) || 1;
                                                                const percentage = (Number(cat.total) / totalExpense) * 100;
                                                                return (
                                                                    <div key={cat.id} className="flex items-center justify-between group/row p-1 -m-1 rounded-xl hover:bg-slate-50 transition-colors">
                                                                        <div className="flex items-center gap-3">
                                                                            <div className="w-2.5 h-2.5 rounded-full shadow-inner ring-2 ring-white" style={{ backgroundColor: colors[i % colors.length] }} />
                                                                            <span className="text-[11px] font-black text-slate-600 label-mono tracking-tight uppercase">{cat.emoji} {cat.name}</span>
                                                                        </div>
                                                                        <div className="flex items-center gap-4">
                                                                            <span className="text-[10px] font-black text-slate-900 font-number tracking-tighter">¥{Intl.NumberFormat(locale).format(Number(cat.total))}</span>
                                                                            <div className="w-12 text-right">
                                                                                <span className="text-[9px] font-bold text-slate-300 label-mono">{percentage.toFixed(1)}%</span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                )
                                                            }) : <div className="py-8 text-center opacity-30 label-mono text-xs">{t('ledger.noData')}</div>}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : <div className="py-20 text-center opacity-30 label-mono">{t('ledger.noData')}</div>}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    )}
            </main>

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
                                    <XIcon className="w-5 h-5" />
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
                                        {categories.filter(c => c.type === txType).map(cat => (
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

            {/* Transfer Modal */}
            <AnimatePresence>
                {showTransferModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex flex-col justify-end"
                        onClick={() => setShowTransferModal(false)}
                    >
                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                            className="bg-white rounded-t-3xl min-h-[85vh] w-full p-8 flex flex-col gap-8 shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-black text-slate-800 tracking-tight">{t('ledger.transfer.title')}</h2>
                                <button onClick={() => setShowTransferModal(false)} className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400">
                                    <XIcon className="w-6 h-6" />
                                </button>
                            </div>

                            <form onSubmit={handleTransferSubmit} className="flex-1 flex flex-col gap-8">
                                {/* Target User Toggle */}
                                <div className="flex flex-col gap-4">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">{t('ledger.transfer.target')}</label>
                                    <div className="flex flex-wrap gap-3">
                                        {members.filter(m => m.id !== currentUserId).map(member => (
                                            <button
                                                key={member.id}
                                                type="button"
                                                onClick={() => setTargetUserId(member.id)}
                                                className={`flex items-center gap-3 p-1.5 pr-5 rounded-full border-2 transition-all ${targetUserId === member.id ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-200 scale-105' : 'bg-slate-50 border-slate-100 text-slate-500 hover:bg-white hover:border-slate-200'}`}
                                            >
                                                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-sm bg-slate-200">
                                                    {member.avatarUrl ? (
                                                        <Image src={member.avatarUrl} width={40} height={40} alt={member.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center bg-indigo-100 text-indigo-500 font-bold text-xs uppercase">
                                                            {(member.nickname || member.name)[0]}
                                                        </div>
                                                    )}
                                                </div>
                                                <span className="text-sm font-black">{member.nickname || member.name}</span>
                                                {targetUserId === member.id && <Check className="w-4 h-4" />}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Transfer Amount */}
                                <div className="flex flex-col gap-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">{t('ledger.transfer.amount')}</label>
                                    <div className="relative flex items-center">
                                        <span className="absolute left-0 text-3xl font-black text-slate-200">¥</span>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={transferAmount}
                                            onChange={(e) => setTransferAmount(e.target.value)}
                                            placeholder="0.00"
                                            className="w-full text-6xl font-black font-number bg-transparent border-b-4 border-slate-100 focus:border-indigo-500 pl-8 pb-4 outline-none transition-all placeholder:text-slate-50"
                                            required
                                        />
                                    </div>
                                    <span className="px-1 text-xs font-bold text-slate-500">
                                        {t('ledger.balance.available')}: ¥{Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(balance)}
                                    </span>
                                </div>

                                {/* Transfer Description */}
                                <div className="flex flex-col gap-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">{t('ledger.transfer.desc')}</label>
                                    <input
                                        type="text"
                                        value={transferDesc}
                                        onChange={(e) => setTransferDesc(e.target.value)}
                                        placeholder={t('ledger.transfer.desc')}
                                        className="w-full bg-slate-50 text-slate-700 font-bold p-5 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-100 transition-all placeholder:text-slate-200"
                                    />
                                </div>

                                {/* Submit Transfer */}
                                <div className="mt-auto pb-[env(safe-area-inset-bottom,2rem)]">
                                    <button
                                        type="submit"
                                        disabled={submitting || !targetUserId || !transferAmount}
                                        className="w-full bg-slate-900 text-white font-black text-xl py-6 rounded-[32px] shadow-2xl shadow-indigo-200 disabled:opacity-30 flex items-center justify-center gap-3 active:scale-[0.98] transition-all hover:bg-slate-800"
                                    >
                                        {submitting && <Loader2 className="w-6 h-6 animate-spin" />}
                                        {t('ledger.transfer.confirm')}
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
