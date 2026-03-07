'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
    ChevronLeft, User, UserRound, Calendar, Milestone as MilestoneIcon,
    Clock, Tag, Share2, Globe, Lock
} from 'lucide-react'
import Link from 'next/link'
import { useI18n } from '@/contexts/I18nContext'
import Lightbox from '@/components/Lightbox'

type JournalEntry = {
    id: string
    authorRole: 'CHILD' | 'PARENT'
    authorAvatar: string | null
    authorName: string | null
    text: string | null
    imageUrl: string | null
    imageUrls: string | null
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

export default function JournalDetailPage() {
    const { id } = useParams()
    const router = useRouter()
    const { t } = useI18n()
    const [entry, setEntry] = useState<JournalEntry | null>(null)
    const [loading, setLoading] = useState(true)
    const [lightbox, setLightbox] = useState<{ images: string[], index: number } | null>(null)

    useEffect(() => {
        const fetchDetail = async () => {
            try {
                const res = await fetch(`/api/journal/${id}`)
                if (res.ok) {
                    const data = await res.json()
                    setEntry(data)
                } else {
                    router.push('/journal')
                }
            } catch (error) {
                console.error('Failed to fetch journal detail:', error)
            } finally {
                setLoading(false)
            }
        }
        if (id) fetchDetail()
    }, [id])

    if (loading) {
        return (
            <div className="min-h-dvh flex items-center justify-center bg-orange-50/30">
                <div className="animate-bounce">
                    <div className="w-12 h-12 bg-orange-500 rounded-2xl flex items-center justify-center text-white shadow-lg">
                        <Clock className="w-6 h-6 animate-pulse" />
                    </div>
                </div>
            </div>
        )
    }

    if (!entry) return null

    const entryImages: string[] = entry.imageUrls ? (function () {
        try {
            return JSON.parse(entry.imageUrls!)
        } catch (e) {
            return entry.imageUrl ? [entry.imageUrl] : []
        }
    })() : (entry.imageUrl ? [entry.imageUrl] : [])

    const isChild = entry.authorRole === 'CHILD'

    return (
        <div className="min-h-dvh bg-[#fdfcfb] text-slate-800 pb-20 overflow-x-hidden">
            {/* Background Polish */}
            <div className="fixed inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-orange-100/20 via-transparent to-transparent pointer-events-none" />

            <header className="relative z-10 p-6 flex items-center justify-between max-w-4xl mx-auto w-full">
                <button
                    onClick={() => router.back()}
                    className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white shadow-xl shadow-orange-900/5 text-slate-600 border border-slate-50 active:scale-95 transition-transform"
                >
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <div className="flex items-center gap-2">
                    <div className="px-4 py-2 bg-white rounded-full border border-slate-100 shadow-sm flex items-center gap-2">
                        <Share2 className="w-4 h-4 text-slate-400" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('journal.shareMoment')}</span>
                    </div>
                </div>
            </header>

            <main className="relative z-10 max-w-4xl mx-auto px-6 mt-6">
                <article className="bg-white rounded-[2.5rem] shadow-2xl shadow-orange-900/5 border border-slate-50 overflow-hidden">
                    {/* Header Info */}
                    <div className="p-8 md:p-12 pb-6 border-b border-slate-50 bg-gradient-to-b from-slate-50/50 to-white">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="flex items-center gap-4">
                                <div className={`w-16 h-16 rounded-3xl overflow-hidden border-4 ${isChild ? 'border-orange-100 shadow-orange-200' : 'border-indigo-100 shadow-indigo-200'} shadow-lg flex-shrink-0`}>
                                    {entry.authorAvatar ? (
                                        <img src={entry.authorAvatar} alt={entry.authorName || ''} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-300">
                                            {isChild ? <User className="w-8 h-8" /> : <UserRound className="w-8 h-8" />}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <h1 className="text-2xl font-black text-slate-800 leading-tight">
                                        {entry.authorName || (isChild ? t('login.child') : t('login.parent'))}
                                    </h1>
                                    <div className="flex items-center gap-3 mt-1">
                                        <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-[0.2em] ${isChild ? 'bg-orange-100 text-orange-600' : 'bg-indigo-100 text-indigo-600'}`}>
                                            {isChild ? t('login.child') : t('login.parent')}
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-400">
                                            {formatDate(entry.updatedAt)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {entry.isMilestone && (
                                <div className="flex flex-col items-start md:items-end gap-2">
                                    <div className="px-5 py-2.5 bg-gradient-to-r from-orange-400 to-amber-500 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-orange-200 flex items-center gap-2">
                                        <MilestoneIcon className="w-4 h-4" />
                                        {t('parent.milestone')}
                                    </div>
                                    <div className="flex items-center gap-2 text-orange-400">
                                        <Calendar className="w-3 h-3" />
                                        <span className="text-[10px] font-black">{formatDate(entry.milestoneDate || entry.createdAt)}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Content Section */}
                    <div className="p-8 md:p-12">
                        {entry.text && (
                            <p className="text-xl md:text-2xl text-slate-700 font-medium leading-[1.8] mb-12 whitespace-pre-wrap">
                                {entry.text}
                            </p>
                        )}

                        {entryImages.length > 0 && (
                            <div className={`grid gap-4 ${entryImages.length === 1 ? 'grid-cols-1' : entryImages.length === 2 ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-3'}`}>
                                {entryImages.map((img, i) => (
                                    <motion.button
                                        key={i}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => setLightbox({ images: entryImages, index: i })}
                                        className="relative aspect-square rounded-[2rem] overflow-hidden border-2 border-white shadow-xl group"
                                    >
                                        <img src={img} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                        <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </motion.button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer Polish */}
                    <div className="p-8 bg-slate-50/50 flex items-center justify-between border-t border-slate-50">
                        <div className="flex items-center gap-4">
                            <div className="w-8 h-8 rounded-full bg-white border border-slate-100 flex items-center justify-center text-slate-300">
                                <Globe className="w-4 h-4" />
                            </div>
                            <div className="w-8 h-8 rounded-full bg-white border border-slate-100 flex items-center justify-center text-slate-300">
                                <Lock className="w-4 h-4" />
                            </div>
                        </div>
                        <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                            {t('journal.copyright')}
                        </p>
                    </div>
                </article>
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
