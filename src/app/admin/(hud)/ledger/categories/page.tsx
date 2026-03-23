'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trash2, Loader2, ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useI18n } from '@/contexts/I18nContext'
import dynamic from 'next/dynamic'

const EmojiPicker = dynamic(() => import('emoji-picker-react'), { ssr: false })

interface Category {
    id: string
    type: string
    name: string
    emoji: string
    isSystem: boolean
}

export default function CategoryManagerPage() {
    const router = useRouter()
    const { t } = useI18n()
    const [loading, setLoading] = useState(true)
    const [categories, setCategories] = useState<Category[]>([])
    const [submitting, setSubmitting] = useState(false)

    // Form State
    const [newCatName, setNewCatName] = useState('')
    const [newCatEmoji, setNewCatEmoji] = useState('💰')
    const [newCatType, setNewCatType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE')
    const [showEmojiPicker, setShowEmojiPicker] = useState(false)

    useEffect(() => {
        const checkAuthAndFetch = async () => {
            try {
                const statsRes = await fetch('/api/stats')
                const statsData = await statsRes.json()
                
                if (!statsData.isParent) {
                    router.push('/ledger')
                    return
                }

                const res = await fetch('/api/ledger/categories')
                const data = await res.json()
                setCategories(data)
            } catch (_error) {
                console.error('Fetch error:', error)
            } finally {
                setLoading(false)
            }
        }
        checkAuthAndFetch()
    }, [router])

    const handleAddCategory = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newCatName || !newCatEmoji) return
        setSubmitting(true)
        try {
            const res = await fetch('/api/ledger/categories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newCatName, emoji: newCatEmoji, type: newCatType })
            })
            if (res.ok) {
                setNewCatName('')
                const updated = await fetch('/api/ledger/categories').then(r => r.json())
                setCategories(updated)
            }
        } catch (_error) {
            console.error(_error)
        }
        setSubmitting(false)
    }

    const handleDeleteCategory = async (id: string) => {
        if (!confirm(t('ledger.categories.deleteConfirm'))) return
        try {
            const res = await fetch(`/api/ledger/categories/${id}`, { method: 'DELETE' })
            if (res.ok) {
                const updated = await fetch('/api/ledger/categories').then(r => r.json())
                setCategories(updated)
            } else {
                const data = await res.json()
                alert(data.error || 'Action failed')
            }
        } catch (_error) {
            console.error(_error)
        }
    }

    if (loading) {
        return (
            <div className="min-h-dvh flex flex-col items-center justify-center bg-slate-50 gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
                <span className="text-slate-400 font-bold">{t('ledger.loading')}</span>
            </div>
        )
    }

    return (
        <div className="min-h-dvh bg-slate-50 relative flex flex-col">
            {/* Header */}
            <header className="sticky top-0 z-10 px-6 py-5 md:px-10 md:py-8 backdrop-blur-md bg-white/80 border-b border-slate-100 flex items-center gap-6">
                <button
                    onClick={() => router.push('/ledger')}
                    className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-2xl bg-white hover:bg-slate-50 transition-colors shadow-sm text-slate-500 border border-slate-100"
                >
                    <ArrowLeft className="w-5 h-5 md:w-6 md:h-6" />
                </button>
                <div className="flex flex-col">
                    <h1 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                        {t('ledger.categories.manage')}
                    </h1>
                    <p className="text-[10px] md:text-xs font-bold text-slate-400 tracking-widest uppercase">{t('ledger.categories.setup')}</p>
                </div>
            </header>

            <main className="flex-1 max-w-5xl mx-auto w-full p-6 md:p-10 flex flex-col gap-10">
                {/* Add New Section */}
                <section className="bg-white p-6 md:p-10 rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col gap-6">
                    <div className="flex items-center gap-3">
                        <div className="w-1.5 h-6 bg-indigo-500 rounded-full" />
                        <h2 className="text-base font-black text-slate-800 tracking-wide uppercase">{t('ledger.categories.add')}</h2>
                    </div>

                    <form onSubmit={handleAddCategory} className="flex flex-col gap-6 lg:flex-row lg:items-center">
                        <div className="grid grid-cols-4 md:grid-cols-6 gap-3 flex-1 pb-2">
                            <div className="col-span-1 relative">
                                <button
                                    type="button"
                                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                    className="w-full h-16 bg-slate-50 rounded-2xl text-3xl flex items-center justify-center shadow-sm border-2 border-transparent hover:border-indigo-500 transition-all active:scale-95"
                                >
                                    {newCatEmoji || '🏷️'}
                                </button>
                                
                                <AnimatePresence>
                                    {showEmojiPicker && (
                                        <div className="absolute top-full mt-4 left-0 z-[100] shadow-[0_20px_50px_rgba(0,0,0,0.3)] rounded-2xl overflow-hidden">
                                            <EmojiPicker
                                                onEmojiClick={(emojiData) => {
                                                    setNewCatEmoji(emojiData.emoji)
                                                    setShowEmojiPicker(false)
                                                }}
                                                width={320}
                                                height={450}
                                                lazyLoadEmojis={true}
                                                previewConfig={{ showPreview: false }}
                                            />
                                        </div>
                                    )}
                                </AnimatePresence>
                            </div>

                            <input
                                type="text"
                                value={newCatName}
                                onChange={e => setNewCatName(e.target.value)}
                                className="col-span-3 md:col-span-3 h-16 bg-slate-50 rounded-2xl px-6 text-sm font-bold shadow-sm border-2 border-transparent focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300"
                                placeholder={t('ledger.categories.name')}
                                required
                            />

                            <select
                                value={newCatType}
                                onChange={e => setNewCatType(e.target.value as 'INCOME' | 'EXPENSE')}
                                className="col-span-2 md:col-span-1 h-16 bg-slate-50 rounded-2xl px-5 text-xs font-black text-slate-600 shadow-sm border-2 border-transparent focus:border-indigo-500 outline-none appearance-none"
                            >
                                <option value="EXPENSE">{t('ledger.add.expense')}</option>
                                <option value="INCOME">{t('ledger.add.income')}</option>
                            </select>

                            <button
                                type="submit"
                                disabled={submitting || !newCatName}
                                className="col-span-2 md:col-span-1 h-16 bg-indigo-500 text-white rounded-2xl font-black text-sm shadow-xl shadow-indigo-200 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                                {t('button.add')}
                            </button>
                        </div>
                    </form>
                </section>

                <div className="flex flex-col gap-12 pb-20">
                    {/* Expense List */}
                    <section className="flex flex-col gap-6">
                        <div className="flex items-center gap-3 pl-1">
                            <div className="w-2 h-7 bg-rose-400 rounded-full" />
                            <h3 className="text-lg font-black text-slate-700 tracking-widest uppercase">{t('ledger.add.expense')}</h3>
                            <span className="text-xs font-bold text-slate-300 ml-auto bg-slate-100 px-3 py-1 rounded-full">
                                {categories.filter(c => c.type === 'EXPENSE').length} Categories
                            </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {categories.filter(cat => cat.type === 'EXPENSE').map((cat) => (
                                <div key={cat.id} className="bg-white p-5 rounded-[28px] flex items-center justify-between group hover:shadow-xl hover:shadow-slate-200/50 transition-all border border-slate-100 border-transparent hover:border-slate-200">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-2xl shadow-sm border border-slate-100/50">
                                            {cat.emoji}
                                        </div>
                                        <span className="font-bold text-slate-800 tracking-tight">{cat.name}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {!cat.isSystem && (
                                            <button
                                                onClick={() => handleDeleteCategory(cat.id)}
                                                className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all opacity-0 group-hover:opacity-100"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Income List */}
                    <section className="flex flex-col gap-6">
                        <div className="flex items-center gap-3 pl-1">
                            <div className="w-2 h-7 bg-emerald-500 rounded-full" />
                            <h3 className="text-lg font-black text-slate-700 tracking-widest uppercase">{t('ledger.add.income')}</h3>
                            <span className="text-xs font-bold text-slate-300 ml-auto bg-slate-100 px-3 py-1 rounded-full">
                                {categories.filter(c => c.type === 'INCOME').length} Categories
                            </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {categories.filter(cat => cat.type === 'INCOME').map((cat) => (
                                <div key={cat.id} className="bg-white p-5 rounded-[28px] flex items-center justify-between group hover:shadow-xl hover:shadow-slate-200/50 transition-all border border-slate-100 border-transparent hover:border-slate-200">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-2xl shadow-sm border border-slate-100/50">
                                            {cat.emoji}
                                        </div>
                                        <span className="font-bold text-slate-800 tracking-tight">{cat.name}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {!cat.isSystem && (
                                            <button
                                                onClick={() => handleDeleteCategory(cat.id)}
                                                className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all opacity-0 group-hover:opacity-100"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </main>
        </div>
    )
}
