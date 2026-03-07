'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
    ChevronLeft, User, UserRound, Calendar, Milestone as MilestoneIcon,
    Clock, Tag, Share2, Globe, Lock, Edit2, Check, X as CloseIcon, Loader2
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
    const searchParams = useSearchParams()
    const { t } = useI18n()
    const [entry, setEntry] = useState<JournalEntry | null>(null)
    const [loading, setLoading] = useState(true)
    const [lightbox, setLightbox] = useState<{ images: string[], index: number } | null>(null)
    const [isEditing, setIsEditing] = useState(false)
    const [editText, setEditText] = useState('')
    const [editIsMilestone, setEditIsMilestone] = useState(false)
    const [editMilestoneDate, setEditMilestoneDate] = useState<string>('')
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        const fetchDetail = async () => {
            try {
                const res = await fetch(`/api/journal/${id}`)
                if (res.ok) {
                    const data = await res.json()
                    setEntry(data)
                    setEditText(data.text || '')
                    setEditIsMilestone(data.isMilestone)
                    const mDate = data.milestoneDate ? new Date(data.milestoneDate) : new Date(data.createdAt)
                    // Format for datetime-local: YYYY-MM-DDTHH:mm
                    const offset = mDate.getTimezoneOffset()
                    const localDate = new Date(mDate.getTime() - (offset * 60 * 1000))
                    setEditMilestoneDate(localDate.toISOString().slice(0, 16))

                    if (searchParams.get('edit') === 'true') {
                        setIsEditing(true)
                    }
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
    }, [id, router])

    const handleSave = async () => {
        if (!id) return
        setSaving(true)
        try {
            const res = await fetch(`/api/journal/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: editText,
                    isMilestone: editIsMilestone,
                    milestoneDate: editIsMilestone ? new Date(editMilestoneDate).getTime() : null
                })
            })
            if (res.ok) {
                const updated = await res.json()
                setEntry(prev => prev ? { ...prev, ...updated } : null)
                setIsEditing(false)
            }
        } catch (error) {
            console.error('Failed to update journal:', error)
        } finally {
            setSaving(false)
        }
    }

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
                    {!isEditing ? (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white shadow-xl shadow-orange-900/5 text-slate-400 hover:text-orange-500 border border-slate-50 active:scale-95 transition-all"
                        >
                            <Edit2 className="w-5 h-5" />
                        </button>
                    ) : (
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="w-12 h-12 flex items-center justify-center rounded-2xl bg-orange-500 shadow-xl shadow-orange-500/20 text-white border border-orange-400 active:scale-95 transition-all disabled:opacity-50"
                            >
                                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                            </button>
                            <button
                                onClick={() => {
                                    setIsEditing(false)
                                    setEditText(entry.text || '')
                                    setEditIsMilestone(entry.isMilestone)
                                }}
                                className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white shadow-xl shadow-orange-900/5 text-slate-400 hover:text-rose-500 border border-slate-50 active:scale-95 transition-all"
                            >
                                <CloseIcon className="w-5 h-5" />
                            </button>
                        </div>
                    )}
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
                        {isEditing ? (
                            <div className="space-y-8">
                                <textarea
                                    className="w-full h-80 p-8 bg-slate-50/50 rounded-[2.5rem] border-2 border-slate-50 focus:border-orange-100 focus:bg-white focus:ring-4 focus:ring-orange-50 outline-none text-xl md:text-2xl font-medium leading-[1.8] resize-none transition-all shadow-inner"
                                    value={editText}
                                    onChange={e => setEditText(e.target.value)}
                                    placeholder={t('journal.placeholder')}
                                />
                                <div className="flex flex-col md:flex-row md:items-center gap-6 p-6 bg-orange-50/50 rounded-3xl border border-orange-100/30">
                                    <div className="flex items-center gap-4">
                                        <button
                                            onClick={() => setEditIsMilestone(!editIsMilestone)}
                                            className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all ${editIsMilestone ? 'bg-orange-500 border-orange-500 shadow-lg shadow-orange-200' : 'bg-white border-orange-200'
                                                }`}
                                        >
                                            {editIsMilestone && <Check className="w-5 h-5 text-white stroke-[3]" />}
                                        </button>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-black text-orange-600 uppercase tracking-widest">{t('parent.milestone')}</span>
                                            <span className="text-[10px] text-orange-400 font-bold">{t('parent.milestoneTip')}</span>
                                        </div>
                                    </div>

                                    {editIsMilestone && (
                                        <div className="flex-1 relative flex items-center gap-3 bg-white p-4 rounded-2xl border border-orange-100 shadow-sm group hover:border-orange-200 transition-colors">
                                            <Calendar className="w-4 h-4 text-orange-500 flex-shrink-0" />
                                            <input
                                                type="datetime-local"
                                                className="font-bold text-slate-600 text-sm bg-transparent outline-none w-full cursor-pointer [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                                                value={editMilestoneDate}
                                                onChange={e => setEditMilestoneDate(e.target.value)}
                                                onClick={(e) => {
                                                    try {
                                                        (e.target as HTMLInputElement).showPicker();
                                                    } catch { }
                                                }}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            entry.text && (
                                <p className="text-xl md:text-2xl text-slate-700 font-medium leading-[1.8] mb-12 whitespace-pre-wrap">
                                    {entry.text}
                                </p>
                            )
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
