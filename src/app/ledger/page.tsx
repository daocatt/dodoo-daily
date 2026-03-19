'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { ArrowLeft, Wallet, Landmark, Plus, X, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function LedgerPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [balance, setBalance] = useState(0)
    const [bankBalance, setBankBalance] = useState(0)
    const [records, setRecords] = useState<Record<string, unknown>[]>([])
    const [categories, setCategories] = useState<Record<string, unknown>[]>([])

    // Modal State
    const [showAddModal, setShowAddModal] = useState(false)
    const [txType, setTxType] = useState<'EXPENSE' | 'INCOME'>('EXPENSE')
    const [amount, setAmount] = useState('')
    const [description, setDescription] = useState('')
    const [selectedCategoryId, setSelectedCategoryId] = useState('')
    const [submitting, setSubmitting] = useState(false)


    const fetchData = async () => {
        setLoading(true)
        try {
            const [ledgerRes, catRes] = await Promise.all([
                fetch('/api/ledger'),
                fetch('/api/ledger/categories')
            ])
            const ledgerData = await ledgerRes.json()
            const catData = await catRes.json()

            if (ledgerData.records) {
                setRecords(ledgerData.records)
                setBalance(ledgerData.balance)
                setBankBalance(ledgerData.bankBalance)
            }
            if (Array.isArray(catData)) {
                setCategories(catData)
                // Set default selected category
                const expCats = catData.filter((c: Record<string, unknown>) => c.type === 'EXPENSE')
                if (expCats.length > 0) setSelectedCategoryId(expCats[0].id as string)
            }
        } catch (e) {
            console.error('Failed to fetch ledger data', e)
        }
        setLoading(false)
    }

    useEffect(() => {
        // eslint-disable-next-line
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
                    // relatedUserId: null // Not implementing family list picker in this step to keep it simple
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

    // Filter categories by selected tab type
    const activeCategories = categories.filter(c => c.type === txType)

    return (
        <div className="min-h-dvh bg-slate-50 relative flex flex-col">
            {/* Header */}
            <header className="px-5 pt-[env(safe-area-inset-top,1rem)] pb-4 bg-white/80 backdrop-blur-xl border-b border-slate-100 sticky top-0 z-10 flex items-center justify-between">
                <button
                    onClick={() => router.push('/')}
                    className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors"
                >
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <h1 className="text-xl font-bold tracking-tight text-slate-800">记账本</h1>
                <div className="w-10"></div> {/* Spacer for centering */}
            </header>

            {/* Content Array */}
            {loading ? (
                <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
                </div>
            ) : (
                <main className="flex-1 px-5 py-6 flex flex-col gap-6 overflow-y-auto pb-[env(safe-area-inset-bottom,2rem)]">
                    
                    {/* Balance Cards */}
                    <div className="grid grid-cols-2 gap-4">
                        {/* Fiat Wallet */}
                        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-3xl p-5 shadow-xl shadow-indigo-200/50 text-white relative overflow-hidden group">
                            <Wallet className="w-24 h-24 absolute -right-6 -bottom-6 opacity-10 group-hover:scale-110 transition-transform duration-500" />
                            <div className="flex items-center gap-2 mb-4 opacity-90">
                                <Wallet className="w-5 h-5" />
                                <span className="font-medium text-sm">可用零钱</span>
                            </div>
                            <div className="flex items-baseline gap-1">
                                <span className="text-xl">¥</span>
                                <span className="text-4xl font-black font-number tracking-tight">{balance.toFixed(2)}</span>
                            </div>
                        </div>

                        {/* Virtual Bank */}
                        <div className="bg-gradient-to-br from-emerald-500 to-teal-500 rounded-3xl p-5 shadow-xl shadow-emerald-200/50 text-white relative overflow-hidden group cursor-pointer" onClick={() => alert('虚拟银行后续开放！')}>
                            <Landmark className="w-24 h-24 absolute -right-6 -bottom-6 opacity-10 group-hover:scale-110 transition-transform duration-500" />
                            <div className="flex items-center gap-2 mb-4 opacity-90">
                                <Landmark className="w-5 h-5" />
                                <span className="font-medium text-sm">虚拟银行</span>
                            </div>
                            <div className="flex items-baseline gap-1">
                                <span className="text-xl">¥</span>
                                <span className="text-4xl font-black font-number tracking-tight">{bankBalance.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Timeline / Records */}
                    <div className="flex flex-col gap-3">
                        <h2 className="text-lg font-bold text-slate-700 px-1">近期明细</h2>
                        
                        {records.length === 0 ? (
                            <div className="py-12 text-center text-slate-400">暂无记账流水</div>
                        ) : (
                            <div className="bg-white rounded-3xl p-2 shadow-sm border border-slate-100 overflow-hidden flex flex-col gap-1">
                                {records.map(record => {
                                    const isExpense = record.type === 'EXPENSE'
                                    return (
                                        <div key={record.id} className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-inner ${isExpense ? 'bg-orange-50' : 'bg-indigo-50'}`}>
                                                    {record.category?.emoji || '🏷️'}
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
                                <h2 className="text-2xl font-black text-slate-800">记一笔</h2>
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
                                        支出
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
                                        收入
                                    </button>
                                </div>

                                {/* Amount Input */}
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1 mb-2 block">金额 (¥)</label>
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
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1 mb-2 block">分类</label>
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
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1 mb-2 block">备注事项</label>
                                    <input
                                        type="text"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="写点什么..."
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
                                        保存
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
