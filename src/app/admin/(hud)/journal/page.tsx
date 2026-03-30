'use client'

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
    ChevronLeft, BookOpen, Layers, History, Clock,
    Plus, Loader2, Star, Calendar, User, ArrowRight,
    Search, SlidersHorizontal, Image as ImageIcon
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useI18n } from '@/contexts/I18nContext'
import Lightbox from '@/components/Lightbox'
import TimelineView from '@/components/TimelineView'
import clsx from 'clsx'
import { BausteinAdminNavbar } from '@/components/BausteinAdminNavbar'

type JournalEntry = {
    id: string
    authorRole: 'CHILD' | 'PARENT'
    text: string | null
    authorAvatar: string | null
    authorName: string | null
    imageUrl: string | null
    imageUrls: string | null // JSON string
    voiceUrl: string | null
    isMilestone: boolean
    milestoneDate: string | null
    createdAt: string
    updatedAt: string
}

export default function JournalPage() {
    const { t } = useI18n()
    const router = useRouter()
    const [entries, setEntries] = useState<JournalEntry[]>([])
    const [loading, setLoading] = useState(true)
    const [loadingMore, setLoadingMore] = useState(false)
    const [activeTab, setActiveTab] = useState<'feed' | 'timeline'>('feed')
    const [page, setPage] = useState(1)
    const [hasMore, setHasMore] = useState(true)
    const [search, setSearch] = useState('')

    // Lightbox State
    const [lightbox, setLightbox] = useState<{ images: string[], index: number } | null>(null)

    useEffect(() => {
        fetchJournal(1, true)
    }, [])

    const fetchJournal = async (p: number, reset = false) => {
        if (p > 1) setLoadingMore(true)
        else setLoading(true)

        try {
            const searchParam = search ? `&search=${search}` : ''
            const res = await fetch(`/api/journal?page=${p}&limit=10${searchParam}`)
            const data = await res.json()
            const newEntries = data.entries || []

            if (reset) {
                setEntries(newEntries)
            } else {
                setEntries(prev => [...prev, ...newEntries])
            }

            setHasMore(newEntries.length === 10)
            setPage(p)
        } catch (_err) {
            console.error(_err)
        } finally {
            setLoading(false)
            setLoadingMore(false)
        }
    }

    const loadMore = () => {
        if (!loadingMore && hasMore) {
            fetchJournal(page + 1)
        }
    }

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        fetchJournal(1, true)
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

    const regularEntries = entries.filter(e => !e.isMilestone)

    return (
        <div className="min-h-screen bg-[#D1CDBC] relative flex flex-col font-sans selection:bg-rose-100 selection:text-rose-900">
            <BausteinAdminNavbar 
                actions={
                    <Link href="/admin/journal/new" className="hardware-btn group">
                        <div className="hardware-well h-12 w-44 rounded-xl bg-rose-500 shadow-well flex items-center justify-center relative overflow-hidden active:translate-y-0.5 transition-all">
                            <div className="hardware-cap absolute inset-1 bg-rose-400 group-hover:bg-rose-500 rounded-lg shadow-cap flex items-center justify-center gap-3 transition-all border border-rose-300/30">
                                <Plus className="w-4 h-4 text-white" />
                                <span className="text-[10px] font-black text-white uppercase italic tracking-tighter leading-none">{t('journal.newPost')}</span>
                            </div>
                        </div>
                    </Link>
                }
            />

            <main className="flex-1 flex flex-col items-center px-6 md:px-10 pt-6 pb-32 md:pt-10 max-w-7xl mx-auto w-full gap-8 md:gap-14 relative overflow-y-auto hide-scrollbar scroll-smooth">
                
                {/* Header HUD - Industrial Manifest */}
                <div className="w-full flex flex-col lg:flex-row items-center justify-between gap-8 px-2">
                    <div className="flex flex-col gap-1 items-center lg:items-start">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 hardware-well rounded-xl bg-[#DADBD4] shadow-well flex items-center justify-center">
                                <BookOpen className="w-4 h-4 text-slate-400" />
                            </div>
                            <h1 className="text-2xl md:text-3xl font-black italic tracking-tighter uppercase text-slate-800 leading-none">
                                {t('journal.title')}
                            </h1>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-6 w-full lg:w-auto">
                        {/* VIEW MODE SWITCHER - Hardware Well */}
                        <div className="hardware-well p-1 bg-[#DADBD4] rounded-2xl shadow-well flex gap-1 w-full sm:w-auto">
                            <button
                                onClick={() => setActiveTab('feed')}
                                className={clsx(
                                    "flex-1 sm:w-32 py-2.5 px-4 rounded-xl font-black text-[10px] uppercase tracking-tighter transition-all flex items-center justify-center gap-2 relative overflow-hidden",
                                    activeTab === 'feed' ? "bg-white text-rose-500 shadow-cap" : "text-slate-400 hover:text-slate-500"
                                )}
                            >
                                <History className="w-3.5 h-3.5" />
                                <span>{t('journal.dailyPost')}</span>
                                {activeTab === 'feed' && <motion.div layoutId="tab-active" className="absolute bottom-1 w-4 h-0.5 bg-rose-400 rounded-full" />}
                            </button>
                            <button
                                onClick={() => setActiveTab('timeline')}
                                className={clsx(
                                    "flex-1 sm:w-32 py-2.5 px-4 rounded-xl font-black text-[10px] uppercase tracking-tighter transition-all flex items-center justify-center gap-2 relative overflow-hidden",
                                    activeTab === 'timeline' ? "bg-white text-rose-500 shadow-cap" : "text-slate-400 hover:text-slate-500"
                                )}
                            >
                                <Clock className="w-3.5 h-3.5" />
                                <span>{t('parent.timeline')}</span>
                                {activeTab === 'timeline' && <motion.div layoutId="tab-active" className="absolute bottom-1 w-4 h-0.5 bg-rose-400 rounded-full" />}
                            </button>
                        </div>

                        {/* Search Chassis */}
                        <form onSubmit={handleSearch} className="hardware-well p-1 bg-[#DADBD4] rounded-2xl shadow-well flex-1 lg:w-72">
                            <div className="bg-white/80 rounded-xl px-4 flex items-center gap-3 border border-black/5 h-11 focus-within:bg-white transition-all ring-inset focus-within:ring-2 focus-within:ring-rose-500/20">
                                <Search className="w-4 h-4 text-slate-300" />
                                <input 
                                    type="text" 
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    placeholder="SCANNING LOG ENTRIES..." 
                                    className="bg-transparent border-none outline-none text-[11px] font-black uppercase text-slate-700 italic tracking-tight w-full placeholder:text-slate-300"
                                />
                            </div>
                        </form>
                    </div>
                </div>

                {/* CONTENT ENGINE */}
                <div className="w-full">
                    {activeTab === 'feed' ? (
                        <div className="w-full flex flex-col gap-12">
                            {loading && entries.length === 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                    {[1, 2, 3, 4, 5, 6].map(i => (
                                        <div key={i} className="hardware-well h-64 rounded-3xl bg-[#DADBD4] animate-pulse opacity-40 shadow-well" />
                                    ))}
                                </div>
                            ) : entries.length === 0 && !hasMore ? (
                                <div className="w-full baustein-panel bg-[#E2DFD2] rounded-[2.5rem] p-16 md:p-32 flex flex-col items-center justify-center text-center gap-8 border-4 border-[#C8C4B0] shadow-2xl">
                                    <div className="hardware-well w-24 h-24 rounded-full flex items-center justify-center bg-[#D1CDBC] mb-2 shadow-well relative overflow-hidden">
                                        <div className="hardware-cap absolute inset-2 bg-slate-100 rounded-full flex items-center justify-center shadow-cap border border-black/5">
                                            <History className="w-10 h-10 text-slate-300 opacity-60" />
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-3">
                                        <h3 className="text-2xl md:text-3xl font-black text-slate-800 uppercase tracking-tighter italic leading-none">{t('journal.empty')}</h3>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest max-w-xs">{t('journal.loading')}</p>
                                    </div>
                                    <Link href="/admin/journal/new" className="hardware-btn group">
                                         <div className="hardware-well h-12 w-48 rounded-xl bg-orange-500 shadow-well flex items-center justify-center relative active:translate-y-0.5 transition-all">
                                            <div className="hardware-cap absolute inset-1 bg-white group-hover:bg-orange-50 rounded-lg shadow-cap flex items-center justify-center gap-3 border border-black/5">
                                                <Plus className="w-4 h-4 text-orange-500" />
                                                <span className="text-[10px] font-black text-orange-500 uppercase italic tracking-tighter">CREATE_FIRST_LOG</span>
                                            </div>
                                        </div>
                                    </Link>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 px-2 pb-10">
                                    {entries.map((entry, idx) => {
                                        const images = getEntryImages(entry)
                                        return (
                                            <motion.div
                                                key={entry.id}
                                                initial={{ opacity: 0, y: 30 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: idx * 0.05, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                                                onClick={() => router.push(`/admin/journal/${entry.id}`)}
                                                className="group cursor-pointer h-full"
                                            >
                                                {/* Entry Chassis - Panel Style */}
                                                <div className="baustein-panel bg-white p-3 rounded-3xl border border-black/5 shadow-lg group-hover:shadow-2xl group-hover:-translate-y-2 transition-all duration-500 flex flex-col gap-4 relative overflow-hidden ring-1 ring-black/5 h-full">
                                                    {/* Media Sector */}
                                                    <div className="relative aspect-[3/2] rounded-2xl overflow-hidden hardware-well bg-slate-50 border border-black/5 shadow-inner">
                                                        {images.length > 0 ? (
                                                            <Image
                                                                src={images[0]}
                                                                alt=""
                                                                fill
                                                                className="object-cover transition-transform duration-700 group-hover:scale-110"
                                                            />
                                                        ) : (
                                                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-slate-50 to-rose-50/20">
                                                                <BookOpen className="w-10 h-10 text-slate-200" />
                                                                <span className="text-[8px] font-black text-slate-200 uppercase tracking-widest label-mono italic opacity-60">NO_VISUAL_LOG</span>
                                                            </div>
                                                        )}
                                                        
                                                        {/* Status Indicators */}
                                                        <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
                                                            {!!entry.isMilestone && (
                                                                <div className="hardware-well p-0.5 rounded-lg bg-orange-500 shadow-md">
                                                                    <div className="hardware-cap px-2 py-1 bg-amber-400 rounded-md shadow-cap border border-amber-300 flex items-center gap-1.5 min-w-[70px]">
                                                                        <Star className="w-2.5 h-2.5 text-white fill-white shadow-sm" />
                                                                        <span className="text-[8px] font-black text-white uppercase italic tracking-tighter leading-none">MILESTONE</span>
                                                                    </div>
                                                                </div>
                                                            )}
                                                            {images.length > 1 && (
                                                                <div className="ml-auto px-2 py-1 bg-black/40 backdrop-blur-md rounded-lg flex items-center gap-1.5 border border-white/10 shadow-lg">
                                                                    <ImageIcon className="w-2.5 h-2.5 text-white/70" />
                                                                    <span className="text-[9px] font-black text-white/90 label-mono">0{images.length}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                        
                                                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    </div>

                                                    {/* Data Sector */}
                                                    <div className="flex flex-col gap-3 px-1 pb-1">
                                                        <div className="flex flex-col gap-1.5 min-h-[3rem]">
                                                            {entry.title ? (
                                                                <h3 className="text-base font-black text-slate-800 leading-none uppercase italic tracking-tighter truncate">
                                                                    {entry.title}
                                                                </h3>
                                                            ) : null}
                                                            <p className={clsx(
                                                                "text-sm font-medium text-slate-600 line-clamp-2 leading-snug italic",
                                                                !entry.title && "text-slate-800 font-black uppercase tracking-tighter label-mono"
                                                            )}>
                                                                {entry.text || t('journal.entry.preciousMoment')}
                                                            </p>
                                                        </div>

                                                        <div className="h-px bg-black/5 w-full" />

                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-2.5">
                                                                <div className="w-8 h-8 hardware-well rounded-xl bg-[#DADBD4] shadow-well flex items-center justify-center relative overflow-hidden flex-shrink-0">
                                                                    {entry.authorAvatar ? (
                                                                        <Image src={entry.authorAvatar} fill alt="" className="object-cover" />
                                                                    ) : (
                                                                        <User className="w-3.5 h-3.5 text-slate-300" />
                                                                    )}
                                                                </div>
                                                                <div className="flex flex-col">
                                                                    <span className="text-[9px] font-black text-slate-800 uppercase tracking-tight leading-none italic">{entry.authorName || 'OPERATOR'}</span>
                                                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1 opacity-60 flex items-center gap-1">
                                                                        <Calendar className="w-2 h-2" />
                                                                        {new Date(entry.createdAt).toLocaleDateString()}
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            <div className="hardware-well w-7 h-7 rounded-lg bg-[#DADBD4] shadow-well flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all active:translate-y-0.5">
                                                                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )
                                    })}
                                </div>
                            )}

                            {hasMore && (
                                <div className="flex justify-center mt-8 pb-10">
                                    <button
                                        onClick={loadMore}
                                        disabled={loadingMore}
                                        className="hardware-btn group"
                                    >
                                        <div className="hardware-well h-12 w-56 rounded-xl bg-[#DADBD4] shadow-well flex items-center justify-center relative overflow-hidden active:translate-y-0.5 transition-all">
                                            <div className="hardware-cap absolute inset-1 bg-white group-hover:bg-slate-50 rounded-lg shadow-cap flex items-center justify-center gap-3 border border-black/5 transition-all">
                                                {loadingMore ? (
                                                    <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                                                ) : (
                                                    <div className="flex items-center justify-center gap-3">
                                                        <History className="w-4 h-4 text-slate-300" />
                                                        <span className="text-[10px] font-black text-slate-400 uppercase italic tracking-tighter">{t('journal.exploreMore')}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="w-full baustein-panel bg-[#E2DFD2] rounded-[2.5rem] p-6 md:p-8 border-4 border-[#C8C4B0] shadow-inner mb-20 relative overflow-hidden min-h-[600px]">
                            {/* Decorative Grid Lines */}
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,#000_1px,transparent_0)] bg-[size:40px_40px] opacity-[0.03]" />
                            
                            <div className="relative z-10">
                                <TimelineView
                                    entries={entries}
                                    onImageClick={(imgs, idx) => setLightbox({ images: imgs, index: idx })}
                                    onEntryClick={(id) => router.push(`/admin/journal/${id}`)}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </main>

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
