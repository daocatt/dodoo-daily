'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trash2, Loader2, ArrowLeft, XIcon, ShieldCheck, Settings, Plus, Pencil, RotateCcw } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useI18n } from '@/contexts/I18nContext'
import { BausteinAdminNavbar } from '@/components/BausteinAdminNavbar'
import clsx from 'clsx'

interface Category {
    id: string
    type: 'INCOME' | 'EXPENSE'
    name: string
    emoji: string
    isSystem: boolean
}

export default function CategoryManagerPage() {
    const router = useRouter()
    const { t, locale } = useI18n()
    const [loading, setLoading] = useState(true)
    const [categories, setCategories] = useState<Category[]>([])
    
    // Form State
    const [name, setName] = useState('')
    const [emoji, setEmoji] = useState('🍔')
    const [type, setType] = useState<'EXPENSE' | 'INCOME'>('EXPENSE')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isDeleting, setIsDeleting] = useState<string | null>(null)
    const [editingCategory, setEditingCategory] = useState<Category | null>(null)

    const expenseEmojis = ['🍔', '🚌', '🕹️', '📚', '🛒', '👔', '🏠', '💊', '🎾', '✈️', '💄', '🐱', '☕', '🎬']
    const incomeEmojis = ['💰', '🧧', '🔄', '📈', '🎁', '💎', '🏧', '💼', '💸']
    const currentEmojis = type === 'EXPENSE' ? expenseEmojis : incomeEmojis

    const fetchCategories = async () => {
        try {
            const res = await fetch('/api/ledger/categories')
            const data = await res.json()
            if (Array.isArray(data)) setCategories(data)
        } catch (e) { console.error(e) }
    }

    useEffect(() => {
        const init = async () => {
            await fetchCategories()
            setLoading(false)
        }
        init()
    }, [])

    const handleEdit = (cat: Category) => {
        setEditingCategory(cat)
        setName(cat.name)
        setEmoji(cat.emoji)
        setType(cat.type)
    }

    const cancelEdit = () => {
        setEditingCategory(null)
        setName('')
        // Keep type/emoji as defaults or current
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!name || !emoji) return
        setIsSubmitting(true)
        try {
            const url = editingCategory ? `/api/ledger/categories/${editingCategory.id}` : '/api/ledger/categories'
            const method = editingCategory ? 'PATCH' : 'POST'
            
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, emoji, type })
            })
            if (res.ok) {
                setName('')
                setEditingCategory(null)
                await fetchCategories()
            }
        } catch (e) { console.error(e) }
        setIsSubmitting(false)
    }

    const handleDelete = async (id: string, isSystem: boolean) => {
        if (isSystem) return
        if (!window.confirm(t('ledger.categories.deleteConfirm'))) return
        setIsDeleting(id)
        try {
            const res = await fetch(`/api/ledger/categories/${id}`, { method: 'DELETE' })
            if (res.ok) {
                setCategories(prev => prev.filter(c => c.id !== id))
            } else {
                const data = await res.json()
                alert(data.error || 'Delete failed')
            }
        } catch (e) { console.error(e) }
        setIsDeleting(null)
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-[#E2DFD2] flex flex-col items-center justify-center gap-6">
                <div className="w-16 h-16 rounded-full border-4 border-dashed border-slate-400 animate-[spin_10s_linear_infinite]" />
                <span className="label-mono text-xs font-black uppercase text-slate-500 tracking-[0.3em] animate-pulse">Initializing Interface...</span>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#E2DFD2] relative flex flex-col font-sans selection:bg-indigo-100 pb-20">
            <BausteinAdminNavbar 
                title={t('ledger.categories.manage')}
                onBack={() => router.push('/admin/ledger')}
            />

            <main className="flex-1 max-w-5xl mx-auto w-full px-4 md:px-8 pt-8 flex flex-col gap-12">
                {/* Section I: Registry Console */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    
                    {/* Left: Input Console */}
                    <div className="lg:col-span-5 flex flex-col gap-8">
                        <div className="baustein-panel bg-[#E6E2D1] rounded-[2.8rem] p-1 border-4 border-white/20 shadow-2xl relative overflow-hidden">
                             {/* Panel Decoration */}
                            <div className="absolute top-4 right-6 flex gap-1.5 opacity-20">
                                <div className="w-1.5 h-1.5 rounded-full bg-slate-900 shadow-inner" />
                                <div className="w-1.5 h-1.5 rounded-full bg-slate-900 shadow-inner" />
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 md:p-8 flex flex-col gap-8">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] label-mono mb-1">{t('ledger.categories.setup')}</span>
                                </div>

                                {/* Type Sector Switch */}
                                <div className={clsx(
                                    "flex p-1 hardware-well rounded-xl bg-[#DADBD4]/60 shadow-inner border border-black/5 transition-opacity",
                                    editingCategory && "opacity-50 pointer-events-none"
                                )}>
                                    <button 
                                        type="button"
                                        onClick={() => setType('EXPENSE')} 
                                        className={clsx(
                                            "flex-1 py-3 rounded-lg text-[10px] font-black uppercase tracking-widest label-mono transition-all",
                                            type === 'EXPENSE' ? "bg-white text-emerald-500 shadow-sm" : "text-slate-400"
                                        )}
                                    >
                                        {t('ledger.categories.expense')}
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={() => setType('INCOME')} 
                                        className={clsx(
                                            "flex-1 py-3 rounded-lg text-[10px] font-black uppercase tracking-widest label-mono transition-all",
                                            type === 'INCOME' ? "bg-white text-rose-500 shadow-sm" : "text-slate-400"
                                        )}
                                    >
                                        {t('ledger.categories.income')}
                                    </button>
                                </div>

                                <div className="space-y-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 flex items-center justify-center text-3xl hardware-well rounded-2xl bg-white shadow-cap border border-black/5 transition-transform hover:scale-105 active:scale-95 duration-200">
                                            {emoji}
                                        </div>
                                        <div className="flex-1 hardware-well rounded-2xl bg-[#DADBD4]/20 shadow-inner p-2 border border-black/5">
                                            <input 
                                                value={name} 
                                                onChange={e => setName(e.target.value)} 
                                                placeholder={t('ledger.categories.name')}
                                                className="w-full bg-white rounded-xl px-4 py-3 text-xs font-black uppercase tracking-widest label-mono text-slate-800 outline-none shadow-cap border-b-2 border-slate-100" 
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest label-mono ml-1">{t('ledger.categories.icon')}</span>
                                        <div className="grid grid-cols-7 gap-2.5 p-3 rounded-2xl bg-slate-900/5 shadow-inner border border-white/40">
                                            {currentEmojis.map(e => (
                                                <button 
                                                    key={e} 
                                                    type="button"
                                                    onClick={() => setEmoji(e)} 
                                                    className={clsx(
                                                        "w-full aspect-square flex items-center justify-center rounded-xl transition-all hover:scale-105 active:scale-90",
                                                        emoji === e ? "bg-white shadow-well ring-2 ring-indigo-400 ring-offset-2 scale-105" : "bg-white/80 shadow-sm grayscale opacity-60 hover:grayscale-0 hover:opacity-100"
                                                    )}
                                                >
                                                    <span className="text-lg">{e}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex gap-4 pt-2">
                                        {editingCategory && (
                                            <button 
                                                type="button"
                                                onClick={cancelEdit} 
                                                className="hardware-btn group flex-1"
                                            >
                                                <div className="hardware-well relative w-full h-14 rounded-xl bg-[#DADBD4] shadow-well active:translate-y-1 transition-all flex items-center justify-center p-0.5 border-b-2 border-slate-400/20">
                                                    <div className="hardware-cap absolute inset-1 bg-white rounded-lg flex items-center justify-center gap-3 shadow-cap group-hover:bg-slate-50">
                                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] label-mono text-slate-400">
                                                            {t('ledger.categories.cancel')}
                                                        </span>
                                                    </div>
                                                </div>
                                            </button>
                                        )}
                                        <button 
                                            type="submit" 
                                            disabled={isSubmitting || !name} 
                                            className="hardware-btn group flex-[2]"
                                        >
                                            <div className="hardware-well relative w-full h-14 rounded-xl bg-[#DADBD4] shadow-well active:translate-y-1 transition-all flex items-center justify-center p-0.5 border-b-2 border-slate-400/20">
                                                <div className={clsx(
                                                    "hardware-cap absolute inset-1 rounded-lg flex items-center justify-center gap-3 shadow-cap",
                                                    editingCategory ? "bg-emerald-500 group-hover:bg-emerald-600" : "bg-indigo-500 group-hover:bg-indigo-600"
                                                )}>
                                                    {isSubmitting ? (
                                                        <Loader2 className="w-5 h-5 animate-spin text-white" />
                                                    ) : (
                                                        editingCategory ? <ShieldCheck className="w-5 h-5 text-white" /> : <Plus className="w-5 h-5 text-white" />
                                                    )}
                                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] label-mono text-white">
                                                        {editingCategory ? t('ledger.categories.update') : t('ledger.categories.save')}
                                                    </span>
                                                </div>
                                            </div>
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* Right: Registry Display */}
                    <div className="lg:col-span-7 flex flex-col gap-6">
                        <section className="flex flex-col gap-6">
                            <div className="flex items-center gap-3 px-2">
                                <div className="w-1.5 h-6 bg-slate-900/10 rounded-full" />
                                <h3 className="text-xs font-black text-slate-400 label-mono uppercase tracking-[0.3em]">{t('ledger.categories.list')}</h3>
                                <div className="h-[1px] flex-1 bg-slate-900/5" />
                                <span className="label-mono text-[9px] font-black uppercase text-slate-300 bg-slate-400/5 px-3 py-1 rounded-full border border-black/5">
                                    {categories.filter(c => c.type === type).length} Records
                                </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <AnimatePresence mode="popLayout">
                                    {categories.filter(c => c.type === type).map((cat, idx) => (
                                        <motion.div 
                                            layout
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                            transition={{ delay: idx * 0.03 }}
                                            key={cat.id} 
                                            className={clsx(
                                                "group hardware-well p-4 rounded-xl bg-white shadow-cap border transition-colors flex items-center justify-between",
                                                editingCategory?.id === cat.id ? "border-indigo-500 ring-2 ring-indigo-100" : "border-black/5 hover:border-indigo-200"
                                            )}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 flex items-center justify-center text-2xl hardware-well rounded-2xl bg-slate-50 shadow-inner border border-black/5">
                                                    {cat.emoji}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-black uppercase tracking-widest label-mono text-slate-800">{cat.name}</span>
                                                </div>
                                            </div>
                                            
                                            <div className="flex gap-2">
                                                <button 
                                                    onClick={() => handleEdit(cat)}
                                                    className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white transition-all shadow-sm active:scale-95"
                                                    title={t('common.edit')}
                                                >
                                                    <Pencil className="w-3.5 h-3.5" />
                                                </button>

                                                {!cat.isSystem && (
                                                    <button 
                                                        onClick={() => handleDelete(cat.id, cat.isSystem)} 
                                                        disabled={!!isDeleting}
                                                        className="w-9 h-9 flex items-center justify-center rounded-xl bg-rose-50 text-rose-300 hover:bg-rose-500 hover:text-white transition-all shadow-sm active:scale-95"
                                                    >
                                                        {isDeleting === cat.id ? (
                                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                        ) : (
                                                            <Trash2 className="w-4 h-4" />
                                                        )}
                                                    </button>
                                                )}
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                                
                                {categories.filter(c => c.type === type).length === 0 && (
                                    <div className="col-span-full py-20 flex flex-col items-center justify-center opacity-30 gap-4">
                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-ping" />
                                        <span className="label-mono text-[9px] font-black uppercase tracking-[0.2em]">{t('ledger.categories.noCustom')}</span>
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>
                </div>
            </main>
        </div>
    )
}
