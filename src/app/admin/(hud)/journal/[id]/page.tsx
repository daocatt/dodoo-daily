'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
    ChevronLeft, ChevronRight, UserRound, Calendar,
    Clock, Tag, Edit2, Check, Loader2, Camera, X, Star
} from 'lucide-react'

import { useI18n } from '@/contexts/I18nContext'
import Lightbox from '@/components/Lightbox'
import SmartDatePicker from '@/components/SmartDatePicker'
import Image from 'next/image'

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
    media?: { type: 'IMAGE' | 'VOICE'; url: string }[]
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
    const [editExistingImages, setEditExistingImages] = useState<string[]>([])
    const [newFiles, setNewFiles] = useState<File[]>([])
    const [newPreviews, setNewPreviews] = useState<string[]>([])
    const [saving, setSaving] = useState(false)
    const [activeIndex, setActiveIndex] = useState(0)

    // Revoke object URLs on unmount to prevent memory leaks
    useEffect(() => {
        return () => {
            newPreviews.forEach(url => URL.revokeObjectURL(url))
        }
    }, [newPreviews])

    useEffect(() => {
        const fetchDetail = async () => {
            try {
                const res = await fetch(`/api/journal/${id}`)
                if (res.ok) {
                    const data = await res.json()
                    setEntry(data)
                    setEditText(data.text || '')
                    setEditIsMilestone(data.isMilestone)

                    let parsedImages: string[] = []
                    if (data.media && Array.isArray(data.media)) {
                        parsedImages = data.media
                            .filter((m: { type: string; url: string }) => m.type === 'IMAGE')
                            .map((m: { type: string; url: string }) => m.url)
                    } else {
                        try {
                            if (data.imageUrls) parsedImages = JSON.parse(data.imageUrls)
                            else if (data.imageUrl) parsedImages = [data.imageUrl]
                        } catch (_e) {
                            if (data.imageUrl) parsedImages = [data.imageUrl]
                        }
                    }
                    setEditExistingImages(parsedImages)

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
            } catch (_error) {
                console.error('Failed to fetch journal detail:', _error)
            } finally {
                setLoading(false)
            }
        }
        if (id) fetchDetail()
    }, [id, router, searchParams])

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return
        const totalCount = editExistingImages.length + newFiles.length
        const files = Array.from(e.target.files).slice(0, 20 - totalCount)
        setNewFiles([...newFiles, ...files])
        const previews = files.map(f => URL.createObjectURL(f))
        setNewPreviews([...newPreviews, ...previews])
    }

    const handleSave = async () => {
        if (!id) return
        setSaving(true)
        try {
            // Upload images in parallel for better performance
            const uploadPromises = newFiles.map(async (file) => {
                const formData = new FormData()
                formData.append('file', file)
                formData.append('type', 'IMAGE')
                const upRes = await fetch('/api/media/upload', { method: 'POST', body: formData })
                if (!upRes.ok) throw new Error('Upload failed')
                const upData = await upRes.json()
                return upData.path as string
            })

            const uploadedUrls = await Promise.all(uploadPromises)
            const finalImageUrls = [...editExistingImages, ...uploadedUrls]

            const res = await fetch(`/api/journal/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: editText,
                    imageUrls: finalImageUrls,
                    isMilestone: editIsMilestone,
                    milestoneDate: new Date(editMilestoneDate).getTime()
                })
            })

            if (res.ok) {
                const updated = await res.json()
                setEntry(updated)
                // Cleanup previews to avoid memory leaks
                newPreviews.forEach(url => URL.revokeObjectURL(url))
                setNewFiles([])
                setNewPreviews([])
                setIsEditing(false)
            } else {
                const error = await res.json()
                alert(`Failed to save: ${error.error || 'Unknown error'}`)
            }
        } catch (_error) {
            console.error('Failed to update journal:', _error)
            alert('Failed to update journal. Please try again.')
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

    const entryImages: string[] = (function () {
        try {
            if (entry.imageUrls && typeof entry.imageUrls === 'string' && entry.imageUrls.trim().startsWith('[')) {
                return JSON.parse(entry.imageUrls!)
            }
            if (Array.isArray(entry.imageUrls)) return entry.imageUrls
            return entry.imageUrl ? [entry.imageUrl] : []
        } catch (_e) {
            return entry.imageUrl ? [entry.imageUrl] : []
        }
    })()



    return (
        <div className="min-h-dvh flex flex-col relative overflow-x-hidden bg-orange-50/30 text-[#2c2416] pb-20">
            {/* Background */}
            <div className="fixed inset-0 bg-gradient-to-tr from-amber-100/30 via-orange-50/20 to-emerald-50/10 pointer-events-none" />

            <header className="relative z-10 px-6 py-3 md:py-4 flex items-center max-w-[1200px] mx-auto w-full">
                <button
                    onClick={() => router.back()}
                    className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white shadow-xl shadow-orange-900/5 text-slate-600 border border-slate-50 active:scale-95 transition-transform"
                >
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <div className="flex-1 text-center pr-12">
                    <span className="font-black text-xl text-slate-800 tracking-tight">Journal Detail</span>
                </div>
            </header>
            <main className={`relative z-10 w-full ${isEditing ? 'max-w-4xl' : 'max-w-6xl'} mx-auto px-4 md:px-6 mt-6 pb-24 lg:pb-10`}>
                <div className={`bg-white rounded-[2rem] overflow-hidden shadow-2xl shadow-orange-900/5 border border-slate-50 ${!isEditing ? 'lg:h-[80vh] lg:max-h-[850px] lg:min-h-[600px]' : ''}`}>
                    {!isEditing && (
                        <div className="flex flex-col lg:flex-row h-full">
                            {/* 1. Left Side: Image Carousel */}
                            {entryImages.length > 0 ? (
                                <div className="w-full lg:w-3/5 bg-slate-100 relative border-b lg:border-b-0 lg:border-r border-slate-100 flex flex-col items-stretch group/carousel">
                                    <div className="relative w-full aspect-[3/4] lg:aspect-auto lg:h-full min-h-[400px] md:min-h-[500px] overflow-hidden">
                                        <AnimatePresence mode="wait">
                                            <motion.div
                                                key={activeIndex}
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -20 }}
                                                transition={{ duration: 0.3 }}
                                                className="w-full h-full cursor-pointer"
                                                onClick={() => setLightbox({ images: entryImages, index: activeIndex })}
                                            >
                                                <Image
                                                    src={entryImages[activeIndex]}
                                                    alt=""
                                                    fill
                                                    className="object-cover"
                                                />
                                            </motion.div>
                                        </AnimatePresence>

                                        {/* Navigation Arrows */}
                                        {entryImages.length > 1 && (
                                            <>
                                                <div className="absolute inset-y-0 left-0 w-1/4 flex items-center justify-start pl-4 pointer-events-none">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            setActiveIndex((activeIndex - 1 + entryImages.length) % entryImages.length)
                                                        }}
                                                        className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-md shadow-lg flex items-center justify-center text-slate-800 opacity-0 group-hover/carousel:opacity-100 transition-opacity z-10 hover:bg-white pointer-events-auto"
                                                    >
                                                        <ChevronLeft className="w-6 h-6" />
                                                    </button>
                                                </div>
                                                <div className="absolute inset-y-0 right-0 w-1/4 flex items-center justify-end pr-4 pointer-events-none">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            setActiveIndex((activeIndex + 1) % entryImages.length)
                                                        }}
                                                        className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-md shadow-lg flex items-center justify-center text-slate-800 opacity-0 group-hover/carousel:opacity-100 transition-opacity z-10 hover:bg-white pointer-events-auto"
                                                    >
                                                        <ChevronRight className="w-6 h-6" />
                                                    </button>
                                                </div>
                                            </>
                                        )}

                                        {/* Pagination Dots */}
                                        {entryImages.length > 1 && (
                                            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5 z-10 px-3 py-1.5 bg-black/10 backdrop-blur-sm rounded-full">
                                                {entryImages.map((_, i) => (
                                                    <button
                                                        key={i}
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            setActiveIndex(i)
                                                        }}
                                                        className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${i === activeIndex ? 'bg-white scale-125 w-4' : 'bg-white/40'}`}
                                                    />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="hidden lg:flex lg:w-3/5 bg-orange-50/30 items-center justify-center border-r border-slate-100">
                                    <Camera className="w-16 h-16 text-orange-200" />
                                </div>
                            )}

                            {/* 2. Right Side: Content Section */}
                            <div className="flex-1 flex flex-col h-full lg:overflow-y-auto custom-scrollbar">
                                <div className="p-6 md:p-10 space-y-8">
                                    {/* Author & Header */}
                                    <div className="flex items-center justify-between pb-6 border-b border-slate-50">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-orange-100 shadow-sm shrink-0 relative">
                                                {entry.authorAvatar ? (
                                                    <Image src={entry.authorAvatar} alt="" fill className="object-cover" />
                                                ) : (
                                                    <div className="w-full h-full bg-slate-50 flex items-center justify-center text-slate-300">
                                                        <UserRound className="w-6 h-6" />
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-black text-slate-800 text-lg leading-tight">{entry.authorName || 'User'}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Clock className="w-3 h-3 text-slate-400" />
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{formatDate(entry.createdAt)}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setIsEditing(true)}
                                            className="p-3 bg-slate-50 rounded-2xl text-slate-400 hover:text-orange-500 hover:bg-orange-50 transition-all active:scale-90"
                                        >
                                            <Edit2 className="w-5 h-5" />
                                        </button>
                                    </div>

                                    {/* Text Body */}
                                    <div className="space-y-6">
                                        {entry.isMilestone && (
                                            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-full shadow-lg shadow-orange-200">
                                                <Star className="w-3.5 h-3.5 fill-white" />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Milestone</span>
                                            </div>
                                        )}
                                        <p className="text-xl text-slate-700 font-medium leading-[1.8] whitespace-pre-wrap selection:bg-orange-100">
                                            {entry.text}
                                        </p>
                                    </div>

                                    {/* Footer Info */}
                                    <div className="pt-10 border-t border-slate-50">
                                        <div className="flex items-center gap-2 text-slate-300">
                                            <Tag className="w-4 h-4" />
                                            <span className="text-xs font-bold uppercase tracking-widest">Journal Moment</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Editing Section */}
                    {isEditing && (
                        <div className="p-8 md:p-12 space-y-10">
                            {/* 1. Image Upload at TOP */}
                            <div className="space-y-4">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Moment Photos</label>
                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                                    <label className="aspect-square bg-slate-50 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 transition-colors border-2 border-dashed border-slate-200 group">
                                        <Camera className="w-8 h-8 text-slate-400 group-hover:scale-110 transition-transform" />
                                        <input type="file" multiple accept="image/*" onChange={handleImageChange} className="hidden" />
                                    </label>
                                    {editExistingImages.map((img, i) => (
                                        <div key={`exist-${i}`} className="relative aspect-square rounded-2xl overflow-hidden shadow-sm group border-2 border-white">
                                            <Image src={img} alt="" fill className="object-cover" />
                                            <button
                                                type="button"
                                                onClick={() => setEditExistingImages(editExistingImages.filter((_, idx) => idx !== i))}
                                                className="absolute inset-0 bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                                            >
                                                <X className="w-6 h-6" />
                                            </button>
                                        </div>
                                    ))}

                                    {newPreviews.map((prev, i) => (
                                        <div key={`new-${i}`} className="relative aspect-square rounded-2xl overflow-hidden shadow-sm group border-2 border-white">
                                            <Image src={prev} alt="" fill className="object-cover" unoptimized />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setNewFiles(newFiles.filter((_, idx) => idx !== i))
                                                    setNewPreviews(newPreviews.filter((_, idx) => idx !== i))
                                                }}
                                                className="absolute inset-0 bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                                            >
                                                <X className="w-6 h-6" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* 2. Text Input */}
                            <div className="space-y-4">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Description</label>
                                <textarea
                                    className="w-full h-64 p-8 bg-slate-50/50 rounded-2xl border-2 border-slate-50 focus:border-orange-100 focus:bg-white focus:ring-4 focus:ring-orange-50 outline-none text-xl font-medium leading-[1.8] resize-none transition-all shadow-inner"
                                    value={editText}
                                    onChange={e => setEditText(e.target.value)}
                                    placeholder={t('journal.placeholder')}
                                />
                            </div>

                            {/* Milestone & Date */}
                            <div className="flex flex-col md:flex-row md:items-center gap-6 p-6 bg-orange-50/50 rounded-2xl border border-orange-100/30">
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={() => setEditIsMilestone(!editIsMilestone)}
                                        className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all ${editIsMilestone ? 'bg-orange-500 border-orange-500 shadow-lg shadow-orange-200' : 'bg-white border-orange-200'}`}
                                    >
                                        {editIsMilestone && <Check className="w-5 h-5 text-white stroke-[3]" />}
                                    </button>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-black text-orange-600 uppercase tracking-widest">Milestone</span>
                                        <span className="text-[10px] text-orange-400 font-bold">A special achievement</span>
                                    </div>
                                </div>

                                <div className="flex-1 flex items-center gap-2 px-4 py-3 bg-white rounded-2xl border border-orange-100 shadow-sm transition-colors focus-within:border-orange-300">
                                    <Calendar className="w-4 h-4 text-orange-400 shrink-0" />
                                    <SmartDatePicker
                                        selected={new Date(editMilestoneDate)}
                                        onSelect={(date) => {
                                            const tzoffset = (new Date()).getTimezoneOffset() * 60000;
                                            const localISOTime = (new Date(date.getTime() - tzoffset)).toISOString().slice(0, 16);
                                            setEditMilestoneDate(localISOTime);
                                        }}
                                        showTime
                                        triggerClassName="bg-white border-none p-0 !px-0"
                                        placeholder="Journal Date"
                                    />
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex flex-col md:flex-row gap-4 pt-8 border-t border-slate-100">
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="flex-1 h-14 bg-orange-500 text-white font-black rounded-2xl shadow-xl shadow-orange-500/20 hover:shadow-orange-500/40 disabled:opacity-50 transition-all active:scale-95 flex items-center justify-center gap-2"
                                >
                                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Save Changes</span>}
                                </button>
                                <button
                                    onClick={() => {
                                        setIsEditing(false)
                                        setNewFiles([])
                                        setNewPreviews([])
                                    }}
                                    className="md:w-32 h-14 bg-white border border-slate-200 text-slate-500 font-bold rounded-2xl hover:bg-slate-50 transition-all"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {!isEditing && (
                    <div className="text-center w-full pt-4 md:pt-6 pb-8">
                        <span className="text-xs font-bold text-slate-400/80 uppercase tracking-widest">
                            Updated at {formatDate(entry.updatedAt)}
                        </span>
                    </div>
                )}
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
