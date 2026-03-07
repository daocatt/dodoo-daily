'use client'

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    ChevronLeft, BookOpen, User, UserRound, Camera, X, Star,
    Milestone as MilestoneIcon, Layers, History, Clock,
    PlusCircle, Loader2, Calendar, Edit2
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useI18n } from '@/contexts/I18nContext'
import Lightbox from '@/components/Lightbox'
import TimelineView from '@/components/TimelineView'
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

const formatDate = (date: string | number | Date) => {
    const d = new Date(date)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const h = String(d.getHours()).padStart(2, '0')
    const min = String(d.getMinutes()).padStart(2, '0')
    return `${y}-${m}-${day} ${h}:${min}`
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


    // Lightbox State
    const [lightbox, setLightbox] = useState<{ images: string[], index: number } | null>(null)

    useEffect(() => {
        fetchJournal(1, true)
    }, [])

    const fetchJournal = async (p: number, reset = false) => {
        if (p > 1) setLoadingMore(true)
        else setLoading(true)

        try {
            const res = await fetch(`/api/journal?page=${p}&limit=10`)
            const data = await res.json()
            const newEntries = data.entries || []

            if (reset) {
                setEntries(newEntries)
            } else {
                setEntries(prev => [...prev, ...newEntries])
            }

            setHasMore(newEntries.length === 10)
            setPage(p)
        } catch (err) {
            console.error(err)
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


    const milestoneEntries = entries.filter(e => e.isMilestone)

    const renderEntry = (entry: JournalEntry) => {
        const isChild = entry.authorRole === 'CHILD'

        // Robust image parsing
        let entryImages: string[] = []
        try {
            if (entry.imageUrls) {
                entryImages = JSON.parse(entry.imageUrls)
            } else if (entry.imageUrl) {
                entryImages = [entry.imageUrl]
            }
        } catch (e) {
            console.error("Failed to parse journal images", e)
            if (entry.imageUrl) entryImages = [entry.imageUrl]
        }

        return (
            <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full bg-white rounded-3xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => router.push(`/journal/${entry.id}`)}
            >
                <div className="flex gap-6 items-start">
                    <div className="flex-1 min-w-0 flex flex-col gap-3">
                        {/* Author & Time Info */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-orange-100 flex-shrink-0">
                                    {entry.authorAvatar ? (
                                        <img src={entry.authorAvatar} alt={entry.authorName || ''} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-slate-50 flex items-center justify-center text-slate-300">
                                            <UserRound className="w-4 h-4" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xs font-black text-slate-800 leading-none mb-0.5">
                                        {entry.authorName || (isChild ? t('login.child') : t('login.parent'))}
                                    </span>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                                        {formatDate(entry.updatedAt)}
                                    </span>
                                </div>
                            </div>

                            {entry.isMilestone && (
                                <div className="flex flex-col items-end gap-1">
                                    <div className="px-2 py-0.5 bg-orange-100 text-orange-600 text-[8px] font-black uppercase tracking-widest rounded-full flex items-center gap-1">
                                        <MilestoneIcon className="w-3 h-3" />
                                        {t('parent.milestone')}
                                    </div>
                                    <span className="text-[8px] font-bold text-orange-400">
                                        {formatDate(entry.milestoneDate || entry.createdAt)}
                                    </span>
                                </div>
                            )}

                            {/* Edit Action */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    router.push(`/journal/${entry.id}?edit=true`);
                                }}
                                className="ml-2 p-2 rounded-xl bg-slate-50 text-slate-300 hover:text-orange-500 hover:bg-orange-50 transition-all border border-transparent hover:border-orange-100"
                            >
                                <Edit2 className="w-3.5 h-3.5" />
                            </button>
                        </div>

                        {/* Text Content */}
                        {entry.text && (
                            <p className="text-slate-600 font-medium leading-relaxed line-clamp-3 overflow-hidden text-ellipsis">
                                {entry.text}
                            </p>
                        )}
                    </div>

                    {/* Right Side Thumbnail */}
                    {entryImages.length > 0 && (
                        <div
                            className="w-24 h-24 rounded-xl overflow-hidden border border-slate-100 flex-shrink-0 relative group"
                            onClick={(e) => {
                                e.stopPropagation();
                                setLightbox({ images: entryImages, index: 0 });
                            }}
                        >
                            <img src={entryImages[0]} alt="Thumbnail" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                            {entryImages.length > 1 && (
                                <div className="absolute inset-0 bg-black/20 flex items-center justify-center pointer-events-none">
                                    <span className="text-white font-black text-xs">+{entryImages.length - 1}</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </motion.div>
        )
    }

    return (
        <div className="min-h-dvh flex flex-col relative overflow-hidden bg-orange-50/30 text-[#2c2416]">
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-tr from-amber-100/30 via-orange-50/20 to-emerald-50/10 pointer-events-none" />

            {/* Top Bar Navigation */}
            <header className="relative z-10 flex items-center justify-between p-6 w-full max-w-[1200px] mx-auto">
                <div className="flex items-center gap-6">
                    <Link href="/" className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white shadow-xl shadow-orange-900/5 text-orange-600 border border-white hover:bg-orange-50 transition-colors">
                        <ChevronLeft className="w-6 h-6" />
                    </Link>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/30 text-white">
                            <BookOpen className="w-6 h-6" />
                        </div>
                        <span className="font-black text-3xl tracking-tight text-slate-800">
                            {t('journal.title')}
                        </span>
                    </div>
                </div>

                {/* Mobile New Post (shown only on small screens) */}
                <Link
                    href="/journal/new"
                    className="md:hidden bg-orange-600 text-white w-12 h-12 rounded-2xl shadow-xl shadow-orange-200 flex items-center justify-center"
                >
                    <PlusCircle className="w-6 h-6" />
                </Link>
            </header>

            {/* Main Content Area */}
            <main className="relative z-10 flex-1 w-full max-w-[1200px] mx-auto flex flex-col md:flex-row gap-6 md:gap-12 px-6 pb-24 overflow-y-auto hide-scrollbar items-start">

                {/* Left Sidebar (Tabs & Actions) */}
                <aside className="w-full md:w-[280px] flex flex-col gap-6 md:sticky md:top-6 flex-shrink-0 z-20">
                    {/* Desktop New Post */}
                    <Link
                        href="/journal/new"
                        className="hidden md:flex bg-orange-600 text-white px-6 py-4 rounded-2xl font-black shadow-xl shadow-orange-200 hover:bg-orange-700 transition-all active:scale-95 items-center justify-center gap-3 text-lg"
                    >
                        <PlusCircle className="w-6 h-6" />
                        New Post
                    </Link>

                    {/* Tabs */}
                    <div className="flex md:flex-col p-1.5 md:p-2 bg-white/60 backdrop-blur-md rounded-2xl md:rounded-3xl w-full shadow-inner border border-white">
                        <button
                            onClick={() => setActiveTab('feed')}
                            className={`flex-1 md:w-full flex items-center justify-center md:justify-start gap-3 py-3 md:py-4 md:px-6 rounded-xl md:rounded-2xl font-black text-sm transition-all ${activeTab === 'feed' ? 'bg-white text-orange-600 shadow-md' : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'}`}
                        >
                            <History className="w-5 h-5" /> {t('journal.dailyPost')}
                        </button>
                        <button
                            onClick={() => setActiveTab('timeline')}
                            className={`flex-1 md:w-full flex items-center justify-center md:justify-start gap-3 py-3 md:py-4 md:px-6 rounded-xl md:rounded-2xl font-black text-sm transition-all ${activeTab === 'timeline' ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'}`}
                        >
                            <Clock className="w-5 h-5" /> {t('parent.timeline')}
                        </button>
                    </div>
                </aside>

                {/* Feed Content */}
                <div className="flex-1 w-full max-w-2xl flex flex-col gap-10">

                    {activeTab === 'feed' ? (
                        <div className="flex flex-col gap-6 w-full">
                            {loading && entries.length === 0 ? (
                                <div className="text-center font-bold text-orange-400 py-20 animate-pulse">{t('journal.loading')}</div>
                            ) : entries.length === 0 ? (
                                <div className="text-center py-20 px-10 bg-white/40 rounded-[2.5rem] border-2 border-dashed border-white flex flex-col items-center gap-6">
                                    <Layers className="w-16 h-16 text-slate-300" />
                                    <p className="text-slate-500 font-bold">{t('journal.empty')}</p>
                                </div>
                            ) : (
                                <>
                                    {entries.map(entry => renderEntry(entry))}

                                    {hasMore && (
                                        <button
                                            onClick={loadMore}
                                            disabled={loadingMore}
                                            className="w-full py-6 rounded-[2rem] bg-white border border-orange-100 text-orange-500 font-black text-sm uppercase tracking-widest hover:bg-orange-50 transition-colors flex items-center justify-center gap-3 disabled:opacity-50 mt-4 shadow-sm"
                                        >
                                            {loadingMore ? (
                                                <>
                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                    {t('common.loading')}
                                                </>
                                            ) : (
                                                'Load More Stories'
                                            )}
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                    ) : (
                        <TimelineView
                            entries={entries as any}
                            onImageClick={(imgs, idx) => setLightbox({ images: imgs, index: idx })}
                            onEntryClick={(id) => router.push(`/journal/${id}`)}
                        />
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
