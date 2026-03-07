'use client'

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    ChevronLeft, BookOpen, User, UserRound, Camera, X, Star,
    Milestone as MilestoneIcon, Layers, History, Clock,
    PlusCircle, Loader2, Calendar
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

    // Post Modal State
    const [showPostModal, setShowPostModal] = useState(false)
    const [text, setText] = useState('')
    const getLocalISOString = () => {
        const d = new Date()
        const offset = d.getTimezoneOffset()
        const local = new Date(d.getTime() - (offset * 60 * 1000))
        return local.toISOString().slice(0, 16)
    }

    const [images, setImages] = useState<File[]>([])
    const [imagePreviews, setImagePreviews] = useState<string[]>([])
    const [isMilestone, setIsMilestone] = useState(false)
    const [postDate, setPostDate] = useState(getLocalISOString())
    const [posting, setPosting] = useState(false)

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

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return
        const files = Array.from(e.target.files).slice(0, 20 - images.length)
        setImages([...images, ...files])

        const newPreviews = files.map(f => URL.createObjectURL(f))
        setImagePreviews([...imagePreviews, ...newPreviews])
    }

    const removeImage = (idx: number) => {
        setImages(images.filter((_, i) => i !== idx))
        setImagePreviews(imagePreviews.filter((_, i) => i !== idx))
    }

    const handlePost = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!text && images.length === 0) return
        setPosting(true)

        try {
            const imageUrls: string[] = []

            // Upload images first
            for (const file of images) {
                const formData = new FormData()
                formData.append('file', file)
                const upRes = await fetch('/api/upload', { method: 'POST', body: formData })
                const upData = await upRes.json()
                if (upData.url) imageUrls.push(upData.url)
            }

            const res = await fetch('/api/journal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text,
                    imageUrls,
                    isMilestone,
                    milestoneDate: new Date(postDate).getTime()
                })
            })
            if (res.ok) {
                setText('')
                setImages([])
                setImagePreviews([])
                setIsMilestone(false)
                setPostDate(getLocalISOString())
                setShowPostModal(false)
                fetchJournal(1, true)
            }
        } catch (err) {
            console.error(err)
        } finally {
            setPosting(false)
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

            <header className="relative z-10 flex flex-col p-6 md:px-10 md:pt-10 gap-8">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-6">
                        <Link href="/" className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white shadow-xl shadow-orange-900/5 text-orange-600 border border-white">
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

                    <button
                        onClick={() => setShowPostModal(true)}
                        className="bg-orange-600 text-white px-6 py-4 rounded-2xl font-black shadow-xl shadow-orange-200 hover:bg-orange-700 transition-all active:scale-95 flex items-center gap-2"
                    >
                        <PlusCircle className="w-6 h-6" />
                        <span className="hidden md:inline">New Post</span>
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex p-1.5 bg-white/50 backdrop-blur-md rounded-2xl w-full max-w-sm self-center shadow-inner">
                    <button
                        onClick={() => setActiveTab('feed')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-black text-xs transition-all ${activeTab === 'feed' ? 'bg-white text-orange-600 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        <History className="w-4 h-4" /> {t('journal.dailyPost')}
                    </button>
                    <button
                        onClick={() => setActiveTab('timeline')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-black text-xs transition-all ${activeTab === 'timeline' ? 'bg-orange-500 text-white shadow-lg shadow-orange-200' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        <Clock className="w-4 h-4" /> {t('parent.timeline')}
                    </button>
                </div>
            </header>

            <main className="relative z-10 flex-1 overflow-y-auto p-4 md:p-8 hide-scrollbar flex justify-center items-start">
                <div className="w-full max-w-2xl flex flex-col gap-10 pb-24">

                    {activeTab === 'feed' ? (
                        <div className="flex flex-col gap-6">
                            {loading && entries.length === 0 ? (
                                <div className="text-center font-bold text-orange-400 py-20 animate-pulse">{t('journal.loading')}</div>
                            ) : entries.length === 0 ? (
                                <div className="text-center py-20 px-10 bg-white/40 rounded-[2.5rem] border-2 border-dashed border-white flex flex-col items-center gap-6">
                                    <Layers className="w-16 h-16 text-slate-200" />
                                    <p className="text-slate-400 font-bold">{t('journal.empty')}</p>
                                </div>
                            ) : (
                                <>
                                    {entries.map(entry => renderEntry(entry))}

                                    {hasMore && (
                                        <button
                                            onClick={loadMore}
                                            disabled={loadingMore}
                                            className="w-full py-6 rounded-[2rem] bg-white border border-orange-100 text-orange-500 font-black text-xs uppercase tracking-widest hover:bg-orange-50 transition-colors flex items-center justify-center gap-3 disabled:opacity-50"
                                        >
                                            {loadingMore ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 animate-spin" />
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
                {showPostModal && (
                    <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-md overflow-y-auto">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 30 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 30 }}
                            className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl p-8 md:p-10 border border-orange-50 my-auto"
                        >
                            <header className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center">
                                        <BookOpen className="w-6 h-6 text-orange-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-slate-800">Capture Moment</h3>
                                        <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest">Post to Journal</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowPostModal(false)} className="p-3 hover:bg-slate-50 rounded-2xl transition-colors">
                                    <X className="w-6 h-6 text-slate-400" />
                                </button>
                            </header>

                            <form onSubmit={handlePost} className="space-y-6">
                                <textarea
                                    value={text}
                                    onChange={e => setText(e.target.value)}
                                    placeholder={t('journal.placeholder')}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-[1.5rem] p-6 focus:ring-4 focus:ring-orange-100 outline-none font-medium text-lg min-h-[160px] resize-none transition-all"
                                />

                                <div className="flex flex-wrap gap-3">
                                    <label className="w-20 h-20 bg-slate-100 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-slate-200 transition-colors border-2 border-dashed border-slate-200 group">
                                        <Camera className="w-6 h-6 text-slate-400 group-hover:scale-110 transition-transform" />
                                        <span className="text-[8px] font-black text-slate-400 mt-1 uppercase">Photo</span>
                                        <input type="file" multiple accept="image/*" onChange={handleImageChange} className="hidden" />
                                    </label>

                                    {imagePreviews.map((prev, i) => (
                                        <div key={i} className="relative w-20 h-20 rounded-2xl overflow-hidden shadow-md group border-2 border-white">
                                            <img src={prev} className="w-full h-full object-cover" />
                                            <button
                                                onClick={(e) => { e.preventDefault(); removeImage(i); }}
                                                className="absolute inset-0 bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                                            >
                                                <X className="w-6 h-6" />
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                <div className="p-6 bg-slate-50 rounded-[2rem] space-y-4">
                                    <div className="flex items-center justify-between">
                                        <button
                                            type="button"
                                            onClick={() => setIsMilestone(!isMilestone)}
                                            className={`flex items-center gap-3 px-6 py-3 rounded-2xl font-black text-xs transition-all ${isMilestone ? 'bg-orange-500 text-white shadow-lg shadow-orange-200' : 'bg-white text-slate-400 border border-slate-200'}`}
                                        >
                                            <MilestoneIcon className={`w-5 h-5 ${isMilestone ? 'fill-white' : ''}`} />
                                            {t('parent.milestone')}
                                        </button>

                                        <div className="relative flex items-center gap-2 px-4 py-3 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden group hover:border-orange-200 transition-colors">
                                            <Calendar className="w-4 h-4 text-orange-500" />
                                            <span className="font-bold text-slate-600 text-xs">
                                                {formatDate(postDate)}
                                            </span>
                                            <input
                                                type="datetime-local"
                                                value={postDate}
                                                onChange={e => setPostDate(e.target.value)}
                                                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                            />
                                        </div>
                                    </div>

                                    {isMilestone && (
                                        <p className="text-[10px] text-orange-400 font-bold uppercase tracking-widest leading-relaxed">
                                            ✨ {t('parent.milestoneTip')}
                                        </p>
                                    )}
                                </div>

                                <div className="flex gap-4">
                                    <button
                                        type="submit"
                                        disabled={posting || (!text && images.length === 0)}
                                        className="flex-1 bg-orange-600 text-white font-black py-5 rounded-[1.5rem] shadow-xl shadow-orange-200 hover:bg-orange-700 disabled:opacity-50 transition-all active:scale-95 text-lg"
                                    >
                                        {posting ? 'Publishing...' : t('journal.post')}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowPostModal(false)}
                                        className="px-10 bg-slate-100 text-slate-500 font-bold rounded-[1.5rem] hover:bg-slate-200 transition-all"
                                    >
                                        {t('button.cancel')}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}

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
