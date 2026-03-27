'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence, useAnimation } from 'framer-motion'
import { Wallet, Plus, X as XIcon, Loader2, BarChart3, ReceiptText, ChevronLeft, ChevronRight, PieChart, TrendingUp, TrendingDown, Settings, Check, Trash2, ShieldCheck, RotateCcw, CalendarDays } from 'lucide-react'
import { format, subMonths, addMonths, startOfMonth, endOfMonth } from 'date-fns'
import { useI18n } from '@/contexts/I18nContext'
import Link from 'next/link'
import Image from 'next/image'
import clsx from 'clsx'
import { BausteinAdminNavbar } from '@/components/BausteinAdminNavbar'
import { useRouter } from "next/navigation";interface LedgerRecord { id: string; type: string; amount: number; description: string; date: string; category?: { name: string; emoji: string; }; relatedUser?: { id: string; name: string; avatarUrl: string; }; }
interface Category { id: string; type: string; name: string; emoji: string; }
interface ChartData { fullDate: string; day: string; income: number; expense: number; }
interface CategoryStat { id: string; name: string; emoji: string; total: number | string; type: string; }
interface StatsData { totals?: { income: number; expense: number; }; chartData?: ChartData[]; categories?: CategoryStat[]; monthlyTrend?: { month: string; income: number; expense: number; }[]; }

const LedgerItem = ({ record, index, locale, t, onDelete }: { record: LedgerRecord, index: number, locale: string, t: (key: string, params?: Record<string, string>) => string, onDelete?: (id: string) => void }) => {
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

    const onDragEnd = (event: unknown, info: { offset: { x: number } }) => {
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
    const router = useRouter()
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
    const [showCategoryPicker, setShowCategoryPicker] = useState(false)
    const [showMemberPicker, setShowMemberPicker] = useState(false)
    const categoryScrollRef = useRef<HTMLDivElement>(null)
    const memberScrollRef = useRef<HTMLDivElement>(null)
     // Ultra-smooth mouse drag-to-scroll engine
    const handleDragScroll = (e: React.MouseEvent, ref: React.RefObject<HTMLDivElement>) => {
        if (!ref.current) return;
        const slider = ref.current;
        const startX = e.pageX - slider.offsetLeft;
        const scrollLeft = slider.scrollLeft;
        
        const onMouseMove = (moveE: MouseEvent) => {
            const x = moveE.pageX - slider.offsetLeft;
            const walk = (x - startX) * 2.5; // Optimized scroll multiplier
            slider.scrollLeft = scrollLeft - walk;
        };
        
        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            // Optional: reset cursor if needed
        };
        
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    };
    
    // Transfer State
    const [showTransferModal, setShowTransferModal] = useState(false)
    const [targetUserId, setTargetUserId] = useState('')
    const [transferAmount, setTransferAmount] = useState('')
    const [transferDesc, setTransferDesc] = useState('')

    const [filterMonth, setFilterMonth] = useState<string>(format(new Date(), 'yyyy-MM'))
    const [showMonthPicker, setShowMonthPicker] = useState(false)
    const [pickerYear, setPickerYear] = useState(new Date().getFullYear())

    const fetchData = useCallback(async (targetPage = 1, monthFilter = '') => {
        if (targetPage === 1) setLoading(true)
        try {
            const limit = 50;
            let url = `/api/ledger?page=${targetPage}&limit=${limit}`;
            
            if (monthFilter) {
                const start = startOfMonth(new Date(monthFilter + '-01'));
                const end = endOfMonth(new Date(monthFilter + '-01'));
                url += `&startDate=${format(start, 'yyyy-MM-dd')}&endDate=${format(end, 'yyyy-MM-dd')}`;
            }

            console.log('[LedgerPage] fetchData called:', { targetPage, monthFilter, url });
            const [ledgerRes, catRes, statsRes, membersRes] = await Promise.all([
                fetch(url),
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
            } else if (targetPage === 1) {
                setRecords([])
                setBalance(0)
                setHasMore(false)
            }
            if (Array.isArray(catData)) {
                setCategories(catData)
            }
            if (Array.isArray(membersData)) {
                setMembers(membersData)
            }
            setPage(targetPage)
        } catch (error) {
            console.error('Failed to fetch ledger data', error)
        }
        setLoading(false)
    }, [setLoading, setRecords, setBalance, setHasMore, setIsAdmin, setCurrentUserId, setCategories, setPage]);

    // Reload when month filter changes — pass value directly to avoid stale closure
    useEffect(() => {
        fetchData(1, filterMonth)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filterMonth])


    const loadMore = useCallback(() => {
        if (!loading && hasMore) {
            fetchData(page + 1, filterMonth)
        }
    }, [loading, hasMore, fetchData, page, filterMonth]);

    const handleAddSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault()
        if (!amount || !selectedCategoryId) return
        
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
                fetchData(1, filterMonth) // Preserving the current month filter
            } else {
                alert(data.error || 'Failed to add record')
            }
        } catch (error) {
            console.error(error)
        }
        setSubmitting(false)
    }, [amount, description, selectedCategoryId, txType, setSubmitting, setShowAddModal, setAmount, setDescription, fetchData, filterMonth]);

    const handleTransferSubmit = useCallback(async (e: React.FormEvent) => {
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
                fetchData(1, filterMonth) // Preserving the current month filter
            } else {
                alert(data.error || '转账失败')
            }
        } catch (error) {
            console.error(error)
        }
        setSubmitting(false)
    }, [targetUserId, transferAmount, transferDesc, setSubmitting, setShowTransferModal, setTransferAmount, setTransferDesc, fetchData, filterMonth]);

    const handleDeleteRecord = useCallback(async (id: string) => {
        if (!window.confirm(t('ledger.delete.confirm'))) return;
        try {
            const res = await fetch(`/api/ledger/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setRecords(prev => {
                    const record = prev.find(r => r.id === id);
                    if (record) {
                        const delta = record.type === 'EXPENSE' ? record.amount : -record.amount;
                        setBalance(currentBalance => currentBalance + delta);
                    }
                    return prev.filter(r => r.id !== id);
                });
            }
        } catch (error) {
            console.error('Delete failed:', error);
        }
    }, [t, setRecords, setBalance]);

    const fetchStats = useCallback(async () => {
        setStatsLoading(true)
        try {
            const res = await fetch(`/api/ledger/stats?startDate=${startDate}&endDate=${endDate}`)
            const data = await res.json()
            setStatsData(data)
        } catch (error) {
            console.error('Failed to fetch stats', error)
        }
        setStatsLoading(false)
    }, [startDate, endDate, setStatsLoading, setStatsData]);

    useEffect(() => {
        if (activeTab === 'STATS') {
            fetchStats()
        }
    }, [activeTab, startDate, endDate, fetchStats])

    // Custom SVG Line Chart Component
    const MonthlyLineChart = ({ trend }: { trend: { month: string; income: number; expense: number }[] }) => {
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
                const _xcp2 = (xmid + points[i+1].x) / 2;
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
                </svg>
                
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
    }, [fetchData])

    // Initialize default category when categories are loaded
    useEffect(() => {
        if (categories.length > 0 && !selectedCategoryId) {
            const expCats = categories.filter(c => c.type === "EXPENSE");
            if (expCats.length > 0) {
                setSelectedCategoryId(expCats[0].id);
            }
        }
    }, [categories, selectedCategoryId]);
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
                                className="w-full max-w-2xl flex flex-col gap-4"
                            >
                                {/* Section I: Compact Ledger HUD - MINIMALIST HARDWARE */}
                                <div className="w-full max-w-2xl hardware-well p-6 md:p-8 rounded-[2.2rem] bg-[#DADBD4]/40 shadow-[inset_0_2px_12px_rgba(0,0,0,0.1)] border border-black/5 relative overflow-hidden flex flex-col gap-6 mb-4">
                                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-2 mb-1 px-1">
                                                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] label-mono">{t('ledger.balance.total')}</span>
                                            </div>
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-2xl font-black text-slate-400 font-mono italic">¥</span>
                                                <span className="text-6xl font-black text-slate-800 tracking-tighter font-number leading-none">
                                                    {Intl.NumberFormat(locale).format(balance)}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Simplified Compact Side-by-Side Buttons at Bottom-Right */}
                                        <div className="w-full md:w-auto flex md:self-end justify-end items-center gap-3 mt-2">
                                            <button 
                                                onClick={() => router.push('/admin/ledger/category_manager')}
                                                className="w-11 h-11 flex items-center justify-center rounded-lg bg-slate-900/5 hover:bg-slate-900/10 transition-colors mr-2"
                                                title={t('ledger.categories.setup')}
                                            >
                                                <Settings className="w-5 h-5 text-slate-400" />
                                            </button>

                                            <button onClick={() => setShowAddModal(true)} className="hardware-btn group">
                                                <div className="hardware-well relative w-24 h-11 rounded-lg bg-[#DADBD4] shadow-well active:translate-y-0.5 transition-all flex items-center justify-center p-0.5">
                                                    <div className="hardware-cap absolute inset-0.5 bg-indigo-500 rounded-[6px] flex items-center justify-center gap-1.5 transition-all shadow-cap group-hover:bg-indigo-600">
                                                        <Plus className="w-3.5 h-3.5 text-white" />
                                                        <span className="text-[8px] font-black uppercase tracking-widest label-mono text-white">{t('ledger.add.title')}</span>
                                                    </div>
                                                </div>
                                            </button>

                                            <button onClick={() => setShowTransferModal(true)} className="hardware-btn group">
                                                <div className="hardware-well relative w-24 h-11 rounded-lg bg-[#DADBD4] shadow-well active:translate-y-0.5 transition-all flex items-center justify-center p-0.5">
                                                    <div className="hardware-cap absolute inset-0.5 bg-white rounded-[6px] flex items-center justify-center gap-1.5 transition-all shadow-cap group-hover:bg-slate-50">
                                                        <ReceiptText className="w-3.5 h-3.5 text-slate-400" />
                                                        <span className="text-[8px] font-black uppercase tracking-widest label-mono text-slate-400">{t('ledger.transfer.title')}</span>
                                                    </div>
                                                </div>
                                            </button>
                                        </div>
                                    </div>
                                    {/* Decorative Plate */}
                                    <div className="absolute top-0 right-10 w-16 h-1 bg-black/5 rounded-b-full" />
                                </div>

                                {/* Month Grouped Sections */}
                                <div className="flex flex-col gap-4">
                                    {records.length > 0 ? Object.entries(groupedRecords).sort(([mA], [mB]) => mB.localeCompare(mA)).map(([month, monthRecords]) => (
                                        <div key={month} className="flex flex-col gap-2">
                                            <div className="sticky top-0 z-20 flex items-center gap-4 py-1 bg-[#E2DFD2]/80 backdrop-blur-sm px-1">
                                                <div className="relative">
                                                    <button
                                                        onClick={() => setShowMonthPicker(p => !p)}
                                                        className="flex items-center gap-1.5 group px-2 py-1 rounded-lg hover:bg-slate-900/8 transition-colors"
                                                    >
                                                        <span className="text-[10px] font-bold text-slate-400 label-mono uppercase tracking-[0.2em] group-hover:text-indigo-500 transition-colors">
                                                            {format(new Date((filterMonth || month) + '-01'), 'MMMM yyyy')}
                                                        </span>
                                                        <CalendarDays className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-400 transition-colors" />
                                                    </button>
                                                    {showMonthPicker && (
                                                        <div className="absolute top-full left-0 mt-1 z-50 bg-white rounded-xl shadow-xl border border-black/10 p-3 w-52">
                                                            {/* Year Navigator */}
                                                            <div className="flex items-center justify-between mb-2">
                                                                <button onClick={() => setPickerYear(y => y - 1)} className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-slate-100 transition-colors">
                                                                    <ChevronLeft className="w-3.5 h-3.5 text-slate-500" />
                                                                </button>
                                                                <span className="label-mono text-xs font-black text-slate-700 tracking-widest">{pickerYear}</span>
                                                                <button onClick={() => setPickerYear(y => y + 1)} className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-slate-100 transition-colors">
                                                                    <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                                                                </button>
                                                            </div>
                                                            {/* Month Grid */}
                                                            <div className="grid grid-cols-3 gap-1">
                                                                {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m, i) => {
                                                                    const val = `${pickerYear}-${String(i + 1).padStart(2, '0')}`;
                                                                    const isActive = (filterMonth || month) === val;
                                                                    return (
                                                                        <button
                                                                            key={val}
                                                                            onClick={() => { setFilterMonth(val); setShowMonthPicker(false); }}
                                                                            className={clsx(
                                                                                'text-[9px] font-black label-mono uppercase py-1.5 rounded-lg transition-colors',
                                                                                isActive ? 'bg-indigo-500 text-white' : 'text-slate-500 hover:bg-slate-100'
                                                                            )}
                                                                        >
                                                                            {m}
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                            {filterMonth && (
                                                                <button onClick={() => { setFilterMonth(''); setShowMonthPicker(false); }} className="w-full mt-2 text-[9px] label-mono font-black uppercase text-slate-400 hover:text-indigo-500 transition-colors pt-1 border-t border-black/5">
                                                                    Reset Filter
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}
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
                                        <div className="py-16 flex flex-col items-center justify-center gap-3">
                                            <div className="w-10 h-10 rounded-full border-2 border-dashed border-slate-300 animate-[spin_8s_linear_infinite]" />
                                            <div className="text-center">
                                                <div className="label-mono text-xs font-black text-slate-400 uppercase tracking-widest">
                                                    {filterMonth ? `${filterMonth} · 当月无收支记录` : '暂无收支数据'}
                                                </div>
                                                {filterMonth && (
                                                    <button
                                                        onClick={() => setFilterMonth('')}
                                                        className="mt-2 text-[10px] label-mono text-indigo-400 hover:text-indigo-600 transition-colors font-black uppercase tracking-widest"
                                                    >
                                                        ← 查看所有月份
                                                    </button>
                                                )}
                                            </div>
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
                                                        {loading ? t('common.loading') : t('common.loadMore')}
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
                                                const totalInc = (statsData.monthlyTrend || []).reduce((acc: number, cur: { income: number }) => acc + cur.income, 0);
                                                const totalExp = (statsData.monthlyTrend || []).reduce((acc: number, cur: { expense: number }) => acc + cur.expense, 0);
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

                {/* Add Record Modal: TASKS STYLE REBALANCED */}
                <AnimatePresence>
                    {showAddModal && (
                        <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
                        onClick={() => setShowAddModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.93, y: 20, opacity: 0 }}
                            animate={{ scale: 1, y: 0, opacity: 1 }}
                            exit={{ scale: 0.95, y: 10, opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 420, damping: 30 }}
                            className="w-full max-w-lg baustein-panel shadow-2xl relative overflow-hidden bg-[#E6E2D1] border-4 border-white/20 rounded-[2.8rem]"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Panel Screws */}
                            <div className="absolute top-4 left-4 w-1.5 h-1.5 rounded-full bg-slate-900/10 shadow-inner" />
                            <div className="absolute top-4 right-4 w-1.5 h-1.5 rounded-full bg-slate-900/10 shadow-inner" />
                            <div className="absolute bottom-4 left-4 w-1.5 h-1.5 rounded-full bg-slate-900/10 shadow-inner" />
                            <div className="absolute bottom-4 right-4 w-1.5 h-1.5 rounded-full bg-slate-900/10 shadow-inner" />

                            <div className="p-6 md:p-8 flex flex-col">
                                <div className="flex justify-between items-center mb-5 border-b-2 border-black/5 pb-3">
                                    <h3 className="text-lg md:text-xl font-black text-slate-900 tracking-tighter uppercase flex items-center gap-3">
                                        <div className="hardware-well w-8 h-8 rounded-lg bg-[#DADBD4] shadow-well relative overflow-hidden">
                                            <div className="hardware-cap absolute inset-1 bg-indigo-500 rounded-md flex items-center justify-center">
                                                <Plus className="w-4 h-4 text-white" />
                                            </div>
                                        </div>
                                        {t('ledger.add.title')}
                                    </h3>
                                    <button onClick={() => setShowAddModal(false)} className="hardware-btn group">
                                        <div className="hardware-well w-8 h-8 rounded-lg bg-[#DADBD4] shadow-well flex items-center justify-center relative active:translate-y-0.5 overflow-hidden">
                                            <div className="hardware-cap absolute inset-0.5 bg-white rounded-md flex items-center justify-center transition-all group-hover:bg-slate-50 transition-colors">
                                                <XIcon className="w-4 h-4 text-slate-400" />
                                            </div>
                                        </div>
                                    </button>
                                </div>

                                <form onSubmit={handleAddSubmit} className="flex flex-col gap-5">
                                    {/* Type Toggle */}
                                    <div className="space-y-1.5">
                                        <label className="label-mono text-[9px] uppercase tracking-widest text-slate-400 ml-1">SYSTEM_CMD_TYPE</label>
                                        <div className="flex p-1 bg-[#DADBD4]/30 rounded-xl border border-black/5 shadow-inner">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setTxType('EXPENSE');
                                                    const cats = categories.filter(c => c.type === 'EXPENSE')
                                                    if (cats.length > 0) setSelectedCategoryId(cats[0].id)
                                                }}
                                                className={`flex-1 py-2.5 rounded-lg text-[9px] font-black uppercase tracking-widest label-mono transition-all ${txType === 'EXPENSE' ? 'bg-white text-emerald-500 shadow-sm border border-black/5' : 'text-slate-400 opacity-60'}`}
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
                                                className={`flex-1 py-2.5 rounded-lg text-[9px] font-black uppercase tracking-widest label-mono transition-all ${txType === 'INCOME' ? 'bg-white text-red-500 shadow-sm border border-black/5' : 'text-slate-400 opacity-60'}`}
                                            >
                                                {t('ledger.add.income')}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Amount Input */}
                                    <div className="space-y-1.5">
                                        <label className="label-mono text-[9px] uppercase tracking-widest text-slate-400 ml-1">{t('ledger.add.amount')}</label>
                                        <div className="hardware-well rounded-xl bg-[#DADBD4]/20 shadow-well border border-black/5 p-1.5">
                                            <div className="bg-white rounded-lg p-4 shadow-cap flex items-baseline gap-3 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
                                                <span className="text-xl font-black text-slate-300 font-mono select-none">¥</span>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    value={amount}
                                                    onChange={(e) => setAmount(e.target.value)}
                                                    placeholder="0.00"
                                                    className="w-full text-4xl font-black font-number bg-transparent text-slate-800 outline-none placeholder:text-slate-200"
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Category Selection — Click to open picker */}
                                    <div className="space-y-1.5">
                                        <label className="label-mono text-[9px] uppercase tracking-widest text-slate-400 ml-1">{t('ledger.add.category')}</label>
                                        
                                        {/* Selected Category Button */}
                                        {(() => {
                                            const selectedCat = categories.find(c => c.id === selectedCategoryId);
                                            return (
                                                <button
                                                    type="button"
                                                    onClick={() => setShowCategoryPicker(true)}
                                                    className="w-full hardware-well bg-[#DADBD4]/20 rounded-xl shadow-inner border border-black/5 p-1.5 group"
                                                >
                                                    <div className="bg-white rounded-lg px-4 py-3 shadow-cap flex items-center justify-between group-hover:bg-slate-50 transition-colors">
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-2xl leading-none">{selectedCat?.emoji || '📦'}</span>
                                                            <div className="text-left">
                                                                <div className="text-sm font-black text-slate-800">{selectedCat?.name || t('ledger.add.category')}</div>
                                                                <div className="label-mono text-[8px] text-slate-400 uppercase tracking-widest">{txType === 'EXPENSE' ? t('ledger.add.expense') : t('ledger.add.income')}</div>
                                                            </div>
                                                        </div>
                                                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
                                                    </div>
                                                </button>
                                            );
                                        })()}

                                        {/* Category Picker Sheet */}
                                        <AnimatePresence>
                                        {showCategoryPicker && (
                                            <motion.div
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                className="fixed inset-0 z-[200] flex items-end justify-center bg-black/50 backdrop-blur-sm"
                                                onClick={() => setShowCategoryPicker(false)}
                                            >
                                                <motion.div
                                                    initial={{ y: 80, opacity: 0 }}
                                                    animate={{ y: 0, opacity: 1 }}
                                                    exit={{ y: 80, opacity: 0 }}
                                                    transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                                                    className="w-full max-w-lg bg-[#E6E2D1] rounded-t-[2rem] p-5 pb-8"
                                                    onClick={e => e.stopPropagation()}
                                                >
                                                    <div className="w-10 h-1 bg-slate-400/30 rounded-full mx-auto mb-4" />
                                                    <div className="label-mono text-[9px] font-black uppercase tracking-widest text-slate-400 mb-3">
                                                        {txType === 'EXPENSE' ? t('ledger.add.expense') : t('ledger.add.income')} — {t('ledger.add.category')}
                                                    </div>
                                                    <div className="grid grid-cols-4 gap-2">
                                                        {categories.filter(c => c.type === txType).map(cat => (
                                                            <button
                                                                key={cat.id}
                                                                type="button"
                                                                onClick={() => { setSelectedCategoryId(cat.id); setShowCategoryPicker(false); }}
                                                                className={clsx(
                                                                    'flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl transition-all',
                                                                    selectedCategoryId === cat.id
                                                                        ? 'bg-indigo-500 shadow-lg'
                                                                        : 'bg-white/60 hover:bg-white'
                                                                )}
                                                            >
                                                                <span className="text-2xl leading-none">{cat.emoji}</span>
                                                                <span className={clsx(
                                                                    'label-mono text-[8px] font-black uppercase tracking-tight text-center leading-tight',
                                                                    selectedCategoryId === cat.id ? 'text-white' : 'text-slate-600'
                                                                )}>{cat.name}</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </motion.div>
                                            </motion.div>
                                        )}
                                        </AnimatePresence>
                                    </div>

                                    {/* Description Input */}
                                    <div className="space-y-1.5">
                                        <label className="label-mono text-[9px] uppercase tracking-widest text-slate-400 ml-1">{t('ledger.add.desc')}</label>
                                        <div className="hardware-well rounded-xl bg-[#DADBD4]/20 shadow-well border border-black/5 p-1.5">
                                            <input
                                                type="text"
                                                value={description}
                                                onChange={(e) => setDescription(e.target.value)}
                                                placeholder="..."
                                                className="w-full bg-white rounded-lg p-3 font-black text-slate-800 text-sm outline-none shadow-cap placeholder:text-slate-200"
                                            />
                                        </div>
                                    </div>

                                    {/* Submit */}
                                    <div className="mt-2">
                                        <button
                                            type="submit"
                                            disabled={submitting}
                                            className="hardware-btn group w-full"
                                        >
                                            <div className="hardware-well h-14 md:h-16 rounded-xl bg-[#DADBD4] shadow-well active:translate-y-0.5 overflow-hidden relative border-b-2 border-slate-400/20">
                                                <div className="hardware-cap absolute inset-1 rounded-lg bg-indigo-500 flex items-center justify-center gap-3 transition-all shadow-cap group-hover:brightness-110 active:translate-y-0.5">
                                                    {submitting ? (
                                                        <Loader2 className="w-5 h-5 animate-spin text-white" />
                                                    ) : (
                                                        <Check className="w-5 h-5 text-white" />
                                                    )}
                                                    <span className="label-mono text-base font-black uppercase tracking-[0.15em] text-white drop-shadow-sm">
                                                        {submitting ? 'Executing...' : t('ledger.add.save')}
                                                    </span>
                                                </div>
                                            </div>
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Transfer Modal: TASKS STYLE REBALANCED */}
            <AnimatePresence>
                {showTransferModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
                        onClick={() => setShowTransferModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.93, y: 20, opacity: 0 }}
                            animate={{ scale: 1, y: 0, opacity: 1 }}
                            exit={{ scale: 0.95, y: 10, opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                            className="w-full max-w-lg baustein-panel shadow-2xl relative overflow-hidden bg-[#E6E2D1] border-4 border-white/20 rounded-[2.8rem]"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Panel Screws */}
                            <div className="absolute top-4 left-4 w-1.5 h-1.5 rounded-full bg-slate-900/10 shadow-inner" />
                            <div className="absolute top-4 right-4 w-1.5 h-1.5 rounded-full bg-slate-900/10 shadow-inner" />
                            <div className="absolute bottom-4 left-4 w-1.5 h-1.5 rounded-full bg-slate-900/10 shadow-inner" />
                            <div className="absolute bottom-4 right-4 w-1.5 h-1.5 rounded-full bg-slate-900/10 shadow-inner" />

                            <div className="p-6 md:p-8 flex flex-col">
                                <div className="flex justify-between items-center mb-5 border-b-2 border-black/5 pb-3">
                                    <h3 className="text-lg md:text-xl font-black text-slate-900 tracking-tighter uppercase flex items-center gap-3">
                                        <div className="hardware-well w-8 h-8 rounded-lg bg-[#DADBD4] shadow-well relative overflow-hidden">
                                            <div className="hardware-cap absolute inset-1 bg-emerald-500 rounded-md flex items-center justify-center">
                                                <RotateCcw className="w-4 h-4 text-white" />
                                            </div>
                                        </div>
                                        {t('ledger.transfer.title')}
                                    </h3>
                                    <button onClick={() => setShowTransferModal(false)} className="hardware-btn group">
                                        <div className="hardware-well w-8 h-8 rounded-lg bg-[#DADBD4] shadow-well flex items-center justify-center relative active:translate-y-0.5 overflow-hidden">
                                            <div className="hardware-cap absolute inset-0.5 bg-white rounded-md flex items-center justify-center transition-all group-hover:bg-slate-50">
                                                <XIcon className="w-4 h-4 text-slate-400" />
                                            </div>
                                        </div>
                                    </button>
                                </div>

                                <form onSubmit={handleTransferSubmit} className="flex flex-col gap-5">
                                    {/* Member selection — Simple Grid for better UX */}
                                    <div className="space-y-2">
                                        <label className="label-mono text-[9px] uppercase tracking-widest text-slate-500 ml-1">{t('ledger.transfer.target')}</label>
                                        <div className="hardware-well bg-[#DADBD4]/20 rounded-xl p-1.5 shadow-inner border border-black/5">
                                            <div className="grid grid-cols-3 gap-2">
                                                {members.filter(m => m.id !== currentUserId).map(member => (
                                                    <button
                                                        key={member.id}
                                                        type="button"
                                                        onClick={() => setTargetUserId(member.id)}
                                                        className="hardware-btn group"
                                                    >
                                                        <div className={clsx(
                                                            "hardware-well h-14 rounded-lg shadow-well relative transition-all active:translate-y-0.5",
                                                            targetUserId === member.id ? "bg-emerald-900/5" : "bg-white/40"
                                                        )}>
                                                            <div className={clsx(
                                                                "hardware-cap absolute inset-0.5 rounded-md shadow-cap transition-all flex flex-col items-center justify-center gap-1 px-1.5",
                                                                targetUserId === member.id ? "bg-emerald-500" : "bg-white group-hover:bg-slate-50"
                                                            )}>
                                                                <div className={clsx(
                                                                    "w-4 h-4 rounded-full overflow-hidden border relative z-10 shadow-sm",
                                                                    targetUserId === member.id ? "border-emerald-300" : "border-[#F1F2E9]"
                                                                )}>
                                                                    {member.avatarUrl ? (
                                                                        <Image src={member.avatarUrl} width={16} height={16} alt={member.name} className="w-full h-full object-cover" />
                                                                    ) : (
                                                                        <div className="w-full h-full flex items-center justify-center bg-slate-100 text-[5px] font-black text-slate-400">
                                                                            {member.name[0]}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <span className={clsx(
                                                                    "text-[8px] label-mono font-black uppercase tracking-tight truncate w-full text-center leading-none",
                                                                    targetUserId === member.id ? "text-white" : "text-slate-500"
                                                                )}>
                                                                    {member.nickname || member.name}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Amount Input */}
                                    <div className="space-y-1.5">
                                        <label className="label-mono text-[9px] uppercase tracking-widest text-slate-400 ml-1">{t('ledger.transfer.amount')}</label>
                                        <div className="hardware-well rounded-xl bg-[#DADBD4]/20 shadow-well border border-black/5 p-1.5">
                                            <div className="bg-white rounded-lg p-4 shadow-cap flex items-baseline gap-3 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all">
                                                <span className="text-xl font-black text-slate-300 font-mono select-none">¥</span>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    value={transferAmount}
                                                    onChange={(e) => setTransferAmount(e.target.value)}
                                                    placeholder="0.00"
                                                    className="w-full text-4xl font-black font-number bg-transparent text-slate-800 outline-none placeholder:text-slate-200"
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center px-4 mt-1 opacity-50">
                                            <span className="text-[7px] font-black text-slate-400 label-mono uppercase">{t('ledger.transfer.available')}: ¥{Intl.NumberFormat(locale).format(balance)}</span>
                                        </div>
                                    </div>

                                    {/* Description Input */}
                                    <div className="space-y-1.5">
                                        <label className="label-mono text-[9px] uppercase tracking-widest text-slate-400 ml-1">{t('ledger.transfer.desc')}</label>
                                        <div className="hardware-well rounded-xl bg-[#DADBD4]/20 shadow-well border border-black/5 p-1.5">
                                            <input
                                                type="text"
                                                value={transferDesc}
                                                onChange={(e) => setTransferDesc(e.target.value)}
                                                placeholder="..."
                                                className="w-full bg-white rounded-lg p-3 font-black text-slate-800 text-sm outline-none shadow-cap placeholder:text-slate-200"
                                            />
                                        </div>
                                    </div>

                                    {/* Submit */}
                                    <div className="mt-2">
                                        <button
                                            type="submit"
                                            disabled={submitting || !targetUserId || !transferAmount}
                                            className="hardware-btn group w-full"
                                        >
                                            <div className="hardware-well h-14 md:h-16 rounded-xl bg-[#DADBD4] shadow-well active:translate-y-0.5 overflow-hidden relative border-b-2 border-slate-400/20">
                                                <div className="hardware-cap absolute inset-1 rounded-lg bg-indigo-500 flex items-center justify-center gap-3 transition-all shadow-cap group-hover:brightness-110 active:translate-y-0.5">
                                                    {submitting ? (
                                                        <Loader2 className="w-5 h-5 animate-spin text-white" />
                                                    ) : (
                                                        <ShieldCheck className="w-5 h-5 text-white" />
                                                    )}
                                                    <span className="label-mono text-base font-black uppercase tracking-[0.15em] text-white drop-shadow-sm">
                                                        {submitting ? t('common.loading') : t('ledger.transfer.confirm')}
                                                    </span>
                                                </div>
                                            </div>
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
