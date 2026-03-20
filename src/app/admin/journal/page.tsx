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
    const regularEntries = entries.filter(e => !e.isMilestone)
    const renderEntry = (entry: JournalEntry) => {
        const isChild = entry.authorRole === 'CHILD'

        let entryImages: string[] = []
        try {
            if (entry.imageUrls) {
                if (typeof entry.imageUrls === 'string' && entry.imageUrls.trim().startsWith('[')) {
                    const parsed = JSON.parse(entry.imageUrls)
                    entryImages = Array.isArray(parsed) ? parsed : (entry.imageUrl ? [entry.imageUrl] : [])
                } else if (Array.isArray(entry.imageUrls)) {
                    entryImages = entry.imageUrls
                } else if (entry.imageUrl) {
                    entryImages = [entry.imageUrl]
                }
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
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ y: -4 }}
                className="break-inside-avoid mb-4 w-full bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 hover:shadow-xl transition-all cursor-pointer group"
                onClick={() => router.push(`/admin/journal/${entry.id}`)}
            >
                {/* Image Section - Large Thumbnail */}
                {entryImages.length > 0 ? (
                    <div className="relative aspect-square w-full overflow-hidden bg-slate-50">
                        <img
                            src={entryImages[0]}
                            alt=""
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        {entryImages.length > 1 && (
                            <div className="absolute top-2 right-2 px-2 py-1 bg-black/30 backdrop-blur-md rounded-lg flex items-center gap-1">
                                <Layers className="w-3 h-3 text-white" />
                                <span className="text-[10px] font-black text-white">{entryImages.length}</span>
                            </div>
                        )}
                        {entry.isMilestone && (
                            <div className="absolute top-2 left-2 px-2 py-1 bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg shadow-lg">
                                <Star className="w-3 h-3 text-white fill-white" />
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="aspect-square w-full bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center p-6 text-center">
                        <BookOpen className="w-12 h-12 text-orange-200/50" />
                    </div>
                )}

                {/* Content Section */}
                <div className="p-3 md:p-4 space-y-3">
                    {/* Text Snippet */}
                    <p className="text-sm font-bold text-slate-800 leading-snug line-clamp-2">
                        {entry.text || t('journal.entry.preciousMoment')}
                    </p>

                    {/* Author Row */}
                    <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center gap-2 overflow-hidden">
                            <div className="w-5 h-5 md:w-6 md:h-6 rounded-full overflow-hidden border border-slate-100 flex-shrink-0">
                                {entry.authorAvatar ? (
                                    <img src={entry.authorAvatar} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-300">
                                        <UserRound className="w-2.5 h-2.5" />
                                    </div>
                                )}
                            </div>
                            <span className="text-[10px] md:text-xs font-medium text-slate-400 truncate">
                                {entry.authorName || 'User'}
                            </span>
                        </div>
                        <div className="flex items-center gap-1 text-slate-300 group-hover:text-rose-400 transition-colors">
                            <Star className="w-3.5 h-3.5" />
                        </div>
                    </div>
                </div>
            </motion.div>
        )
    }

    return (
        <div className="min-h-dvh flex flex-col relative overflow-hidden bg-orange-50/30 text-[#2c2416]">
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-tr from-amber-100/30 via-orange-50/20 to-emerald-50/10 pointer-events-none" />

            {/* Top Header */}
            <header className="relative z-10 flex justify-between items-center px-6 py-4 md:px-10 md:py-6 backdrop-blur-sm bg-white/40 border-b border-orange-100/50 shadow-sm">
                <div className="flex items-center gap-4">
                    <Link href="/" className="w-10 h-10 md:w-12 md:h-12 flex-shrink-0 flex items-center justify-center rounded-2xl bg-white shadow-sm text-orange-600 border border-orange-100 hover:bg-orange-50 transition-colors">
                        <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
                    </Link>
                    <div className="flex items-center gap-3">
                        <div className="hidden md:flex w-10 h-10 bg-orange-500 rounded-2xl items-center justify-center shadow-md shadow-orange-500/30 text-white flex-shrink-0">
                            <BookOpen className="w-5 h-5" />
                        </div>
                        <span className="font-extrabold text-xl md:text-2xl tracking-tight text-slate-800">
                            {t('journal.title')}
                        </span>
                    </div>
                </div>

                <Link
                    href="/admin/journal/new"
                    className="flex items-center gap-2 px-4 py-2.5 md:px-6 md:py-3 rounded-xl md:rounded-2xl bg-orange-500 hover:bg-orange-600 transition-colors text-sm md:text-base font-bold text-white shadow-md active:scale-95"
                >
                    <PlusCircle className="w-4 h-4 md:w-5 md:h-5" />
                    <span className="hidden md:inline">{t('journal.newPost')}</span>
                </Link>
            </header>

            {/* Main Content Area */}
            <main className="relative z-10 flex-1 w-full max-w-5xl mx-auto flex flex-col gap-6 px-4 md:px-6 pt-6 pb-24 overflow-y-auto hide-scrollbar">

                {/* View Selector Tabs */}
                <div className="flex justify-center mb-4">
                    <div className="flex p-1 bg-white/60 backdrop-blur-md rounded-2xl shadow-sm border border-white max-w-md w-full">
                        <button
                            onClick={() => setActiveTab('feed')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-black text-xs transition-all ${activeTab === 'feed' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <History className="w-4 h-4" /> {t('journal.dailyPost')}
                        </button>
                        <button
                            onClick={() => setActiveTab('timeline')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-black text-xs transition-all ${activeTab === 'timeline' ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <Clock className="w-4 h-4" /> {t('parent.timeline')}
                        </button>
                    </div>
                </div>

                {/* Feed Content */}
                <div className="w-full">
                    {activeTab === 'feed' ? (
                        <div className="w-full">
                            {loading && entries.length === 0 ? (
                                <div className="text-center font-bold text-orange-400 py-20 animate-pulse">{t('journal.loading')}</div>
                            ) : regularEntries.length === 0 && !hasMore ? (
                                <div className="text-center py-20 px-10 bg-white/40 rounded-xl border-2 border-dashed border-white flex flex-col items-center gap-6 max-w-2xl mx-auto">
                                    <Layers className="w-16 h-16 text-slate-300" />
                                    <p className="text-slate-500 font-bold">{t('journal.empty')}</p>
                                </div>
                            ) : (
                                <>
                                    <div className="columns-2 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 md:gap-6 space-y-4 md:space-y-6">
                                        {regularEntries.map(entry => renderEntry(entry))}
                                    </div>

                                    {hasMore && (
                                        <button
                                            onClick={loadMore}
                                            disabled={loadingMore}
                                            className="w-full max-w-xs mx-auto py-4 rounded-2xl bg-white border border-orange-100 text-orange-500 font-black text-sm uppercase tracking-widest hover:bg-orange-50 transition-all flex items-center justify-center gap-3 disabled:opacity-50 mt-12 shadow-sm"
                                        >
                                            {loadingMore ? (
                                                <>
                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                     {t('common.loading')}
                                                </>
                                            ) : (
                                                t('journal.exploreMore')
                                            )}
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                    ) : (
                        <TimelineView
                            entries={entries}
                            onImageClick={(imgs, idx) => setLightbox({ images: imgs, index: idx })}
                            onEntryClick={(id) => router.push(`/admin/journal/${id}`)}
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
