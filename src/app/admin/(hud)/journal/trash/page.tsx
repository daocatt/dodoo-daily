'use client'

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
    Clock, Calendar, Trash2, RotateCcw, 
    Search, Plus, Image as ImageIcon,
    X, History
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useI18n } from '@/contexts/I18nContext'
import Lightbox from '@/components/Lightbox'
import { BausteinAdminNavbar } from '@/components/BausteinAdminNavbar'
import ConfirmModal from '@/components/ConfirmModal'

type JournalEntry = {
    id: string
    authorRole: 'CHILD' | 'PARENT'
    text: string | null
    authorAvatar: string | null
    authorName: string | null
    imageUrl: string | null
    imageUrls: string | null
    isMilestone: boolean
    milestoneDate: string | null
    createdAt: string
    updatedAt: string
    title?: string
}

export default function JournalTrashPage() {
    const { t } = useI18n()
    const [entries, setEntries] = useState<JournalEntry[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [confirmAction, setConfirmAction] = useState<{ type: 'restore' | 'delete', id: string } | null>(null)

    useEffect(() => {
        fetchTrash()
    }, [])

    const fetchTrash = async () => {
        setLoading(true)
        try {
            const res = await fetch(`/api/journal?isDeleted=true&limit=100`)
            const data = await res.json()
            setEntries(data.entries || [])
        } catch (_err) {
            console.error(_err)
        } finally {
            setLoading(false)
        }
    }

    const handleRestore = async (id: string) => {
        setConfirmAction({ type: 'restore', id })
    }

    const performRestore = async (id: string) => {
        try {
            const res = await fetch(`/api/journal/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isDeleted: false })
            })
            if (res.ok) {
                setEntries(prev => prev.filter(e => e.id !== id))
            }
        } catch (_err) {
            console.error(_err)
        }
    }

    const handlePermanentDelete = async (id: string) => {
        setConfirmAction({ type: 'delete', id })
    }

    const performPermanentDelete = async (id: string) => {
        try {
            const res = await fetch(`/api/journal/${id}?permanent=true`, { method: 'DELETE' })
            if (res.ok) {
                setEntries(prev => prev.filter(e => e.id !== id))
            }
        } catch (_err) {
            console.error(_err)
        }
    }

    const getEntryImages = (entry: JournalEntry): string[] => {
        try {
            if (entry.imageUrls) {
                const parsed = typeof entry.imageUrls === 'string' ? JSON.parse(entry.imageUrls) : entry.imageUrls
                return Array.isArray(parsed) ? parsed : (entry.imageUrl ? [entry.imageUrl] : [])
            }
            return entry.imageUrl ? [entry.imageUrl] : []
        } catch {
            return entry.imageUrl ? [entry.imageUrl] : []
        }
    }

    return (
        <div className="min-h-screen bg-[#D1CDBC] relative flex flex-col font-sans selection:bg-rose-100 selection:text-rose-900">
            <BausteinAdminNavbar 
                actions={
                    <Link href="/admin/journal/new" className="hardware-btn group">
                        <div className="hardware-well h-12 w-44 rounded-xl bg-violet-500 shadow-well flex items-center justify-center relative overflow-hidden active:translate-y-0.5 transition-all">
                            <div className="hardware-cap absolute inset-1 bg-violet-400 group-hover:bg-violet-500 rounded-lg shadow-cap flex items-center justify-center gap-3 transition-all border border-violet-300/30">
                                <Plus className="w-4 h-4 text-white" />
                                <span className="text-[10px] font-black text-white uppercase italic tracking-tighter leading-none">{t('journal.newPost')}</span>
                            </div>
                        </div>
                    </Link>
                }
            />

            <main className="flex-1 flex flex-col items-center px-6 md:px-10 pt-6 pb-32 md:pt-10 max-w-7xl mx-auto w-full gap-8 md:gap-14 relative overflow-y-auto">
                
                {/* Header HUD - Industrial Manifest */}
                <div className="w-full flex flex-col lg:flex-row items-center justify-between gap-8 px-2">
                    <div className="flex flex-col gap-1 items-center lg:items-start">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 hardware-well rounded-xl bg-[#DADBD4] shadow-well flex items-center justify-center">
                                <Trash2 className="w-4 h-4 text-rose-500" />
                            </div>
                            <h1 className="text-2xl md:text-3xl font-black italic tracking-tighter uppercase text-slate-800 leading-none">
                                {t('journal.trash')}
                            </h1>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-6 w-full lg:w-auto">
                        <div className="hardware-well p-1 bg-[#DADBD4] rounded-2xl shadow-well flex gap-1 w-full sm:w-auto">
                            <Link
                                href="/admin/journal"
                                className="flex-1 sm:w-32 py-2.5 px-4 rounded-xl font-black text-[10px] uppercase tracking-tighter transition-all flex items-center justify-center gap-2 text-slate-400 hover:text-slate-500"
                            >
                                <Calendar className="w-3.5 h-3.5" />
                                <span>{t('journal.dailyPost')}</span>
                            </Link>
                            <Link
                                href="/admin/journal?tab=timeline"
                                className="flex-1 sm:w-32 py-2.5 px-4 rounded-xl font-black text-[10px] uppercase tracking-tighter transition-all flex items-center justify-center gap-2 text-slate-400 hover:text-slate-500"
                            >
                                <Clock className="w-3.5 h-3.5" />
                                <span>{t('parent.timeline')}</span>
                            </Link>
                            <div
                                className="flex-1 sm:w-32 py-2.5 px-4 rounded-xl font-black text-[10px] uppercase tracking-tighter transition-all flex items-center justify-center gap-2 bg-white text-rose-500 shadow-cap"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>{t('journal.trash')}</span>
                            </div>
                        </div>

                        {/* Search Chassis */}
                        <div className="hardware-well p-1 bg-[#DADBD4] rounded-2xl shadow-well flex-1 lg:w-72">
                            <div className="bg-white/80 rounded-xl px-4 flex items-center gap-3 border border-black/5 h-11 focus-within:bg-white transition-all ring-inset flex">
                                <Search className="w-4 h-4 text-slate-300" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    placeholder={t('journal.searchPlaceholder') || 'Search Logs...'}
                                    className="w-full bg-transparent border-none outline-none text-[10px] font-black text-slate-700 uppercase tracking-widest placeholder:text-slate-400 italic label-mono"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="w-full">
                    {loading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="hardware-well h-64 rounded-3xl bg-[#DADBD4] animate-pulse opacity-40 shadow-well" />
                            ))}
                        </div>
                    ) : entries.length === 0 ? (
                        <div className="w-full baustein-panel bg-[#E2DFD2] rounded-[2.5rem] p-16 md:p-32 flex flex-col items-center justify-center text-center gap-8 border-4 border-[#C8C4B0] shadow-2xl">
                             <div className="hardware-well w-24 h-24 rounded-full flex items-center justify-center bg-[#D1CDBC] mb-2 shadow-well">
                                <div className="hardware-cap absolute inset-2 bg-slate-100 rounded-full flex items-center justify-center shadow-cap border border-black/5">
                                    <Trash2 className="w-10 h-10 text-slate-300 opacity-30" />
                                </div>
                            </div>
                            <h3 className="text-2xl md:text-3xl font-black text-slate-400 uppercase tracking-tighter italic leading-none">回收站暂无内容</h3>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                            {entries.map((entry, idx) => (
                                <motion.div
                                    key={entry.id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="baustein-panel bg-white/60 backdrop-blur-sm p-4 rounded-3xl border border-black/5 flex flex-col gap-4 relative group"
                                >
                                    <div className="relative aspect-video rounded-xl overflow-hidden hardware-well bg-slate-100 grayscale opacity-40 group-hover:grayscale-0 group-hover:opacity-100 transition-all">
                                        {getEntryImages(entry).length > 0 ? (
                                            <Image src={getEntryImages(entry)[0]} alt="" fill className="object-cover" />
                                        ) : (
                                            <div className="flex flex-col items-center justify-center h-full gap-2 text-slate-300">
                                                <ImageIcon className="w-8 h-8" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="font-black text-slate-800 uppercase italic truncate leading-tight">
                                            {entry.title || entry.text || 'Untitled'}
                                        </h3>
                                        <span className="text-[9px] font-black text-slate-400 label-mono italic block">
                                            {(function(d){ return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` })(new Date(entry.createdAt))}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 mt-2">
                                        <button 
                                            onClick={() => handleRestore(entry.id)}
                                            className="hardware-btn group col-span-1"
                                        >
                                            <div className="hardware-well h-10 rounded-xl bg-green-500 shadow-well flex items-center justify-center relative active:translate-y-0.5 transition-all">
                                                <div className="hardware-cap absolute inset-1 bg-white group-hover:bg-green-50 rounded-lg shadow-cap flex items-center justify-center gap-2 border border-black/5">
                                                    <RotateCcw className="w-3.5 h-3.5 text-green-500" />
                                                    <span className="text-[9px] font-black text-green-600 uppercase italic tracking-tighter">{t('journal.restore')}</span>
                                                </div>
                                            </div>
                                        </button>
                                        <button 
                                            onClick={() => handlePermanentDelete(entry.id)}
                                            className="hardware-btn group col-span-1"
                                        >
                                            <div className="hardware-well h-10 rounded-xl bg-rose-500 shadow-well flex items-center justify-center relative active:translate-y-0.5 transition-all">
                                                <div className="hardware-cap absolute inset-1 bg-white group-hover:bg-rose-50 rounded-lg shadow-cap flex items-center justify-center gap-2 border border-black/5">
                                                    <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                                    <span className="text-[9px] font-black text-rose-600 uppercase italic tracking-tighter">{t('journal.permanentDelete')}</span>
                                                </div>
                                            </div>
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </main>

            <ConfirmModal
                isOpen={!!confirmAction}
                onClose={() => setConfirmAction(null)}
                onConfirm={() => {
                    if (confirmAction?.type === 'restore') performRestore(confirmAction.id)
                    else if (confirmAction?.id) performPermanentDelete(confirmAction.id)
                }}
                title={confirmAction?.type === 'restore' ? t('journal.restore') : t('journal.permanentDelete')}
                message={confirmAction?.type === 'restore' 
                    ? t('journal.restoreConfirm', { title: entries.find(e => e.id === confirmAction?.id)?.title || 'Untitled' }) 
                    : t('journal.deleteConfirm', { title: entries.find(e => e.id === confirmAction?.id)?.title || 'Untitled' })
                }
                confirmText={confirmAction?.type === 'restore' ? t('journal.restore') : t('journal.permanentDelete')}
                cancelText={t('common.cancel')}
                variant={confirmAction?.type === 'restore' ? 'warning' : 'danger'}
            />

            <AnimatePresence>
                {lightbox && (
                    <Lightbox
                        images={lightbox.images}
                        initialIndex={lightbox.index}
                        onClose={() => setLightbox(null)}
                    />
                )}
            </AnimatePresence>
        </div>
    )
}
