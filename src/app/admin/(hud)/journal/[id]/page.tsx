'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'motion/react'
import {
    ChevronLeft, ChevronRight, User, Calendar,
    Clock, Tag, Edit3, Check, Loader2, Camera, X, Star,
    ArrowLeft, Save, Trash2, Maximize2, ImageIcon, PenTool, Globe
} from 'lucide-react'

import { useI18n } from '@/contexts/I18nContext'
import Lightbox from '@/components/Lightbox'
import SmartDatePicker from '@/components/SmartDatePicker'
import Image from 'next/image'
import clsx from 'clsx'
import ConfirmModal from '@/components/ConfirmModal'

type JournalEntry = {
    id: string
    authorRole: 'CHILD' | 'PARENT'
    authorAvatar: string | null
    authorName: string | null
    text: string | null
    imageUrl: string | null
    imageUrls: string | null
    isMilestone: boolean
    isPublic: boolean
    milestoneDate: string | null
    createdAt: string
    updatedAt: string
    media?: { type: 'IMAGE' | 'VOICE'; url: string }[]
}

const formatDate = (date: string | number | Date) => {
    const d = new Date(date)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
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
    const [editTitle, setEditTitle] = useState('')
    const [editIsMilestone, setEditIsMilestone] = useState(false)
    const [editIsPublic, setEditIsPublic] = useState(false)
    const [editMilestoneDate, setEditMilestoneDate] = useState<string>('')
    const [editExistingImages, setEditExistingImages] = useState<string[]>([])
    const [newFiles, setNewFiles] = useState<File[]>([])
    const [newPreviews, setNewPreviews] = useState<string[]>([])
    const [saving, setSaving] = useState(false)
    const [activeIndex, setActiveIndex] = useState(0)
    const [showDeleteModal, setShowDeleteModal] = useState(false)

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
                    setEditTitle(data.title || '')
                    setEditIsMilestone(!!data.isMilestone)
                    setEditIsPublic(!!data.isPublic)

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
                    const offset = mDate.getTimezoneOffset()
                    const localDate = new Date(mDate.getTime() - (offset * 60 * 1000))
                    setEditMilestoneDate(localDate.toISOString().slice(0, 16))

                    if (searchParams.get('edit') === 'true') {
                        setIsEditing(true)
                    }
                } else {
                    router.push('/admin/journal')
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
                    title: editTitle,
                    text: editText,
                    imageUrls: finalImageUrls,
                    isMilestone: editIsMilestone,
                    isPublic: editIsPublic,
                    milestoneDate: new Date(editMilestoneDate).getTime()
                })
            })

            if (res.ok) {
                const updated = await res.json()
                setEntry(updated)
                newPreviews.forEach(url => URL.revokeObjectURL(url))
                setNewFiles([])
                setNewPreviews([])
                setIsEditing(false)
            }
        } catch (_error) {
            console.error('Failed to update journal:', _error)
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async () => {
        setShowDeleteModal(true)
    }

    const performDelete = async () => {
        if (!id) return
        try {
            const res = await fetch(`/api/journal/${id}`, { method: 'DELETE' })
            if (res.ok) router.push('/admin/journal')
        } catch (_err) {
             console.error(_err)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-[#D1CDBC] flex items-center justify-center">
                <div className="hardware-well w-16 h-16 rounded-2xl bg-[#DADBD4] flex items-center justify-center shadow-well animate-pulse">
                     <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
                </div>
            </div>
        )
    }

    if (!entry) return null

    const entryImages: string[] = (function () {
        if (entry.media && Array.isArray(entry.media)) {
            return entry.media
                .filter((m: { type: string; url: string }) => m.type === 'IMAGE')
                .map((m: { type: string; url: string }) => m.url)
        }
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
        <div className="min-h-screen bg-[#D1CDBC] relative flex flex-col font-sans selection:bg-rose-100 selection:text-rose-900">
            {/* Background Texture */}
            <div className="fixed inset-0 bg-[radial-gradient(circle_at_1px_1px,#000_1px,transparent_0)] bg-[size:40px_40px] opacity-[0.03] pointer-events-none" />

            <header className="relative z-10 px-6 py-2 md:px-10 flex items-center justify-between max-w-[1400px] mx-auto w-full">
                <button 
                    type="button" 
                    onClick={() => router.back()} 
                    className="hardware-btn group scale-75 origin-left"
                >
                    <div className="hardware-well w-10 h-10 rounded-xl bg-[#DADBD4] shadow-well flex items-center justify-center relative overflow-hidden active:translate-y-0.5 transition-all">
                        <div className="hardware-cap absolute inset-1 bg-white group-hover:bg-slate-50 rounded-lg shadow-cap transition-all flex items-center justify-center border border-black/5">
                            <ChevronLeft className="w-5 h-5 text-slate-400" />
                        </div>
                    </div>
                </button>

                <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none">
                    <h1 className="text-lg md:text-xl font-black text-slate-800 uppercase italic tracking-tighter leading-none">
                        {isEditing ? t('journal.editPost') : (entry.title || t('journal.dailyPost'))}
                    </h1>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] label-mono italic mt-1 opacity-60">
                        System Registry // {isEditing ? 'Maintenance' : 'Detail'} Mode
                    </span>
                </div>

                <div className="w-12"></div>
            </header>

            <main className={clsx(
                "relative z-10 w-full mx-auto p-4 md:px-20 md:pt-4 md:pb-20 mb-2 flex-1 transition-all duration-500",
                isEditing ? "max-w-4xl pb-24" : "max-w-full xl:max-w-7xl h-full"
            )}>
                <div className={clsx(
                    "baustein-panel bg-[#E2DFD2] rounded-[2.5rem] border-4 border-[#C8C4B0] shadow-2xl relative ring-1 ring-black/5 flex flex-col transition-all duration-500",
                    !isEditing ? "md:h-[calc(100vh-140px)] overflow-hidden" : "p-8 md:p-12"
                )}>
                    {!isEditing && (
                        <div className="flex flex-col md:flex-row h-full">
                            {/* MEDIA SECTOR: High-Fidelity Cinema View */}
                            <div className="w-full md:flex-1 h-[450px] md:h-auto bg-slate-900 relative border-b md:border-b-0 md:border-r border-[#C8C4B0] flex flex-col group/carousel shadow-2xl overflow-hidden">
                                <div className="relative w-full flex-1 flex items-center justify-center">
                                     <AnimatePresence mode="wait">
                                        <motion.div
                                            key={activeIndex}
                                            initial={{ opacity: 0, scale: 0.98 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 1.02 }}
                                            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                                            className="w-full h-full cursor-pointer flex items-center justify-center p-2"
                                            onClick={() => setLightbox({ images: entryImages, index: activeIndex })}
                                        >
                                            <div className="w-full h-full relative">
                                                {entryImages.length > 0 ? (
                                                     <Image
                                                        src={entryImages[activeIndex]}
                                                        alt=""
                                                        fill
                                                        className="object-contain"
                                                        priority
                                                    />
                                                ) : (
                                                    <div className="flex flex-col items-center justify-center h-full gap-4 opacity-20">
                                                        <ImageIcon className="w-16 h-16 text-white" />
                                                        <span className="text-xl font-black text-white italic uppercase tracking-tighter">No Photo</span>
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    </AnimatePresence>

                                    {/* Carousel HUD Controls */}
                                    {entryImages.length > 1 && (
                                        <>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    setActiveIndex((activeIndex - 1 + entryImages.length) % entryImages.length)
                                                }}
                                                className="absolute left-6 top-1/2 -translate-y-1/2 hardware-btn group scale-90 z-20"
                                            >
                                                <div className="hardware-well w-10 h-10 rounded-full bg-black/40 backdrop-blur-md shadow-well flex items-center justify-center relative active:translate-y-1 transition-all">
                                                    <div className="hardware-cap absolute inset-1 bg-white/10 group-hover:bg-white/20 rounded-full shadow-cap flex items-center justify-center border border-white/10">
                                                        <ChevronLeft className="w-5 h-5 text-white" />
                                                    </div>
                                                </div>
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    setActiveIndex((activeIndex + 1) % entryImages.length)
                                                }}
                                                className="absolute right-6 top-1/2 -translate-y-1/2 hardware-btn group scale-90 z-20"
                                            >
                                                <div className="hardware-well w-10 h-10 rounded-full bg-black/40 backdrop-blur-md shadow-well flex items-center justify-center relative active:translate-y-1 transition-all">
                                                    <div className="hardware-cap absolute inset-1 bg-white/10 group-hover:bg-white/20 rounded-full shadow-cap flex items-center justify-center border border-white/10">
                                                        <ChevronRight className="w-5 h-5 text-white" />
                                                    </div>
                                                </div>
                                            </button>
                                        </>
                                    )}

                                    {/* Media Status Bar */}
                                    <div className="absolute top-6 right-6 px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-full border border-white/10 shadow-2xl flex items-center gap-2 z-20">
                                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                                        <span className="text-[9px] font-black text-white/70 label-mono uppercase">{activeIndex + 1} / {entryImages.length}</span>
                                    </div>
                                    
                                    <button 
                                        onClick={() => setLightbox({ images: entryImages, index: activeIndex })}
                                        className="absolute bottom-6 right-6 hardware-btn group z-20"
                                    >
                                        <div className="hardware-well w-10 h-10 rounded-full bg-black/40 backdrop-blur-md shadow-well flex items-center justify-center active:translate-y-0.5 transition-all">
                                            <Maximize2 className="w-4 h-4 text-white" />
                                        </div>
                                    </button>
                                </div>
                            </div>

                            {/* DATA SECTOR: Narrative Sidebar */}
                            <div className="w-full md:w-[380px] lg:w-[420px] xl:w-[480px] flex flex-col md:h-full bg-[#E2DFD2] relative overflow-hidden">
                                <div className="flex-1 overflow-y-auto hide-scrollbar flex flex-col">
                                    {/* Sidebar Header (Author) */}
                                    <div className="p-6 border-b border-black/5 bg-[#DADBD4]/30">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 hardware-well rounded-xl bg-[#D1CDBC] shadow-well flex items-center justify-center relative overflow-hidden ring-1 ring-white/50">
                                                    {entry.authorAvatar ? (
                                                        <Image src={entry.authorAvatar} alt="" fill className="object-cover" />
                                                    ) : (
                                                        <User className="w-4 h-4 text-slate-300" />
                                                    )}
                                                </div>
                                                <div className="flex flex-col">
                                                    <h3 className="font-black text-sm text-slate-800 uppercase italic tracking-tighter leading-none">{entry.authorName || 'OPERATOR'}</h3>
                                                    <div className="flex items-center gap-1.5 mt-1">
                                                        <Clock className="w-2.5 h-2.5 text-slate-400" />
                                                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest label-mono italic">{formatDate(entry.createdAt)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {!!entry.isMilestone && (
                                                    <div className="hardware-well p-0.5 rounded-lg bg-orange-500 shadow-well">
                                                        <div className="hardware-cap px-2 py-0.5 bg-amber-400 rounded-md shadow-cap border border-amber-300 flex items-center gap-1">
                                                            <Star className="w-2 h-2 text-white fill-white" />
                                                            <span className="text-[7px] font-black text-white uppercase italic tracking-tighter leading-none">MILESTONE</span>
                                                        </div>
                                                    </div>
                                                )}
                                                
                                                <div className="flex items-center gap-1.5 ml-2">
                                                    <button onClick={handleDelete} className="hardware-btn group">
                                                        <div className="hardware-well w-8 h-8 rounded-lg bg-[#DADBD4] shadow-well flex items-center justify-center relative overflow-hidden active:translate-y-0.5 transition-all">
                                                            <div className="hardware-cap absolute inset-0.5 bg-white group-hover:bg-orange-50 rounded-md shadow-cap transition-all flex items-center justify-center border border-black/5">
                                                                <Trash2 className="w-3.5 h-3.5 text-orange-500" />
                                                            </div>
                                                        </div>
                                                    </button>
                                                    <button onClick={() => setIsEditing(true)} className="hardware-btn group">
                                                        <div className="hardware-well w-8 h-8 rounded-lg bg-[#DADBD4] shadow-well flex items-center justify-center relative overflow-hidden active:translate-y-0.5 transition-all">
                                                            <div className="hardware-cap absolute inset-0.5 bg-white group-hover:bg-rose-50 rounded-md shadow-cap transition-all flex items-center justify-center border border-black/5">
                                                                <Edit3 className="w-3.5 h-3.5 text-rose-500" />
                                                            </div>
                                                        </div>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Sidebar Content (Title & Text) */}
                                    <div className="flex-1 p-8 md:p-10 space-y-8">
                                        <div className="space-y-6">
                                            {entry.title && (
                                                <div className="space-y-2">
                                                    <h1 className="text-2xl font-black text-slate-800 uppercase italic tracking-tighter leading-[1.1]">{entry.title}</h1>
                                                </div>
                                            )}

                                            <div className="bg-white/40 p-6 md:p-8 rounded-[1.5rem] border border-black/5 shadow-inner italic leading-relaxed text-slate-700 min-h-[300px]">
                                                <p className="text-base md:text-lg font-medium tracking-tight whitespace-pre-wrap leading-relaxed">
                                                    {entry.text || '... NO_TEXT_LOADED ...'}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-2 pt-4" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* EDIT MATRIX */}
                    {isEditing && (
                        <form onSubmit={e => { e.preventDefault(); handleSave(); }} className="space-y-12">

                            {/* 1. Media Registry (Images) */}
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] label-mono italic ml-2">{t('journal.mediaInventory')}</label>
                                <div className="hardware-well bg-[#DADBD4] p-4 rounded-[1.5rem] shadow-inner grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                                    <label className="hardware-btn group aspect-square">
                                        <div className="hardware-well h-full rounded-xl bg-[#C8C4B0] shadow-well flex flex-col items-center justify-center cursor-pointer relative active:translate-y-1 transition-all">
                                            <div className="hardware-cap absolute inset-1 bg-white group-hover:bg-slate-50 rounded-[0.5rem] shadow-cap transition-all flex flex-col items-center justify-center gap-1 border border-black/5">
                                                <Camera className="w-6 h-6 text-slate-300" />
                                            </div>
                                        </div>
                                        <input type="file" multiple accept="image/*" onChange={handleImageChange} className="hidden" />
                                    </label>
                                    
                                    {editExistingImages.map((img, i) => (
                                        <div key={`exist-${i}`} className="relative aspect-square rounded-xl overflow-hidden shadow-inner border border-white group">
                                            <Image src={img} alt="" fill className="object-cover" />
                                            <button
                                                type="button"
                                                onClick={() => setEditExistingImages(editExistingImages.filter((_, idx) => idx !== i))}
                                                className="absolute inset-0 bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm"
                                            >
                                                <Trash2 className="w-6 h-6" />
                                            </button>
                                        </div>
                                    ))}

                                    {newPreviews.map((prev, i) => (
                                        <div key={`new-${i}`} className="relative aspect-square rounded-xl overflow-hidden shadow-inner border border-rose-200 group">
                                            <Image src={prev} alt="" fill className="object-cover" unoptimized />
                                            <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 shadow-lg" />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setNewFiles(newFiles.filter((_, idx) => idx !== i))
                                                    setNewPreviews(newPreviews.filter((_, idx) => idx !== i))
                                                }}
                                                className="absolute inset-0 bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm"
                                            >
                                                <X className="w-8 h-8" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* 2. Narrative Matrix (Title & Content) */}
                            <div className="space-y-8">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] label-mono italic ml-2">{t('journal.entryTitle')}</label>
                                    <div className="hardware-well p-1.5 bg-[#C8C4B0] rounded-2xl shadow-well ring-1 ring-black/10">
                                        <input
                                            type="text"
                                            className="w-full px-8 py-3.5 bg-white rounded-xl border border-black/5 outline-none text-xl font-black tracking-tight italic uppercase shadow-inner selection:bg-rose-100 text-slate-800"
                                            value={editTitle}
                                            onChange={e => setEditTitle(e.target.value)}
                                            placeholder="Entry Title..."
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] label-mono italic ml-2">{t('journal.entryContent')}</label>
                                    <div className="hardware-well p-1.5 bg-[#C8C4B0] rounded-3xl shadow-well ring-1 ring-black/10">
                                        <textarea
                                            className="w-full h-96 p-10 bg-white rounded-2xl border border-black/5 outline-none text-xl md:text-2xl font-medium leading-[1.8] italic shadow-inner selection:bg-rose-100"
                                            value={editText}
                                            onChange={e => setEditText(e.target.value)}
                                            placeholder="Update narrative..."
                                        />
                                    </div>
                                </div>
                            </div>

                                {/* Telemetry Sync */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                                     {/* Milestone Switch */}
                                     <div 
                                         onClick={() => setEditIsMilestone(!editIsMilestone)}
                                         className="hardware-well p-3 bg-[#DADBD4] rounded-2xl flex items-center justify-between cursor-pointer group shadow-well border border-black/5 active:translate-y-0.5 transition-all px-5 h-20"
                                     >
                                         <div className="flex items-center gap-4">
                                             <div className="hardware-well w-12 h-12 rounded-xl bg-[#C8C4B0] shadow-well flex items-center justify-center flex-shrink-0 transition-all duration-500">
                                                 <Star className={clsx("w-5 h-5 transition-all", editIsMilestone ? "text-amber-500 fill-amber-500" : "text-slate-400")} />
                                             </div>
                                             <div className="flex flex-col">
                                                 <span className="text-[11px] font-black text-slate-800 uppercase italic tracking-tighter">{t('journal.milestoneFlag')}</span>
                                                 <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1 opacity-60">CRITICAL_EVENT_FLAG</span>
                                             </div>
                                         </div>
                                         
                                         <div className="hardware-well h-6 w-12 rounded-full bg-[#C8C4B0] p-1 relative overflow-hidden flex items-center">
                                             <motion.div 
                                                 animate={{ x: editIsMilestone ? 24 : 0 }}
                                                 className={clsx(
                                                     "w-4 h-4 rounded-full shadow-cap border border-black/5 transition-colors duration-500",
                                                     editIsMilestone ? "bg-amber-400" : "bg-white"
                                                 )}
                                             />
                                         </div>
                                     </div>

                                     {/* Public Visibility Toggle */}
                                     <div 
                                         onClick={() => setEditIsPublic(!editIsPublic)}
                                         className="hardware-well p-3 bg-[#DADBD4] rounded-2xl flex items-center justify-between cursor-pointer group shadow-well border border-black/5 active:translate-y-0.5 transition-all px-5 h-20"
                                     >
                                         <div className="flex items-center gap-4">
                                             <div className="hardware-well w-12 h-12 rounded-xl bg-[#C8C4B0] shadow-well flex items-center justify-center flex-shrink-0 transition-all duration-500">
                                                 <Globe className={clsx("w-5 h-5 transition-all", editIsPublic ? "text-rose-500" : "text-slate-400")} />
                                             </div>
                                             <div className="flex flex-col">
                                                 <span className="text-[11px] font-black text-slate-800 uppercase italic tracking-tighter leading-none">{t('journal.publicVisibility') || 'Public Visibility'}</span>
                                                 <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1 opacity-60">{t('journal.publicDesc') || 'Visible to family'}</span>
                                             </div>
                                         </div>
                                         
                                         <div className="hardware-well h-6 w-12 rounded-full bg-[#C8C4B0] p-1 relative overflow-hidden flex items-center">
                                             <motion.div 
                                                 animate={{ x: editIsPublic ? 24 : 0 }}
                                                 className={clsx(
                                                     "w-4 h-4 rounded-full shadow-cap border border-black/5 transition-colors duration-500",
                                                     editIsPublic ? "bg-rose-500" : "bg-white"
                                                 )}
                                             />
                                         </div>
                                     </div>

                                     {/* Temporal Control */}
                                     <div className="hardware-well p-3 bg-[#DADBD4] rounded-2xl flex items-center gap-4 shadow-well border border-black/5 px-5 h-20">
                                         <div className="hardware-well w-12 h-12 rounded-xl bg-[#C8C4B0] shadow-well flex items-center justify-center flex-shrink-0 transition-all duration-500">
                                             <Calendar className="w-5 h-5 text-orange-500" />
                                         </div>
                                         <div className="flex flex-col flex-1 overflow-hidden">
                                             <div className="hardware-well h-12 rounded-xl bg-[#C8C4B0] p-1 flex items-center shadow-well ring-1 ring-black/5">
                                                 <div className="hardware-cap w-full h-full bg-white rounded-lg shadow-cap flex items-center px-4 border border-black/5">
                                                     <SmartDatePicker
                                                         selected={new Date(editMilestoneDate)}
                                                         onSelect={(date) => {
                                                             const tzoffset = (new Date()).getTimezoneOffset() * 60000;
                                                             const localISOTime = (new Date(date.getTime() - tzoffset)).toISOString().slice(0, 16);
                                                             setEditMilestoneDate(localISOTime);
                                                         }}
                                                         showTime
                                                         hideIcon
                                                         triggerClassName="bg-transparent hover:bg-transparent border-none p-0 !px-0 text-sm font-black uppercase italic tracking-tighter text-slate-800 w-full text-left"
                                                         placeholder="Journal Date"
                                                     />
                                                 </div>
                                             </div>
                                         </div>
                                     </div>
                                </div>

                            {/* Execution Cluster */}
                            <div className="flex flex-col sm:flex-row gap-6 pt-10 border-t-2 border-black/5">
                                <button type="button" onClick={() => setIsEditing(false)} className="hardware-btn group sm:w-48">
                                     <div className="hardware-well h-16 rounded-2xl bg-[#DADBD4] shadow-well flex items-center justify-center relative active:translate-y-1 transition-all">
                                         <div className="hardware-cap absolute inset-1 bg-white group-hover:bg-slate-50 rounded-xl shadow-cap transition-all flex items-center justify-center border border-black/5">
                                             <span className="text-[11px] font-black text-slate-400 uppercase italic tracking-tighter">{t('journal.abortSync')}</span>
                                         </div>
                                     </div>
                                 </button>
                                 <button type="submit" disabled={saving} className="hardware-btn group flex-1">
                                     <div className={clsx(
                                         "hardware-well h-16 rounded-2xl shadow-well flex items-center justify-center relative active:translate-y-1 transition-all",
                                         saving ? "bg-slate-400" : "bg-emerald-500"
                                     )}>
                                         <div className={clsx(
                                             "hardware-cap absolute inset-1.5 rounded-xl shadow-cap transition-all flex items-center justify-center gap-3 border border-black/5",
                                             saving ? "bg-slate-300" : "bg-emerald-400 group-hover:bg-emerald-500"
                                         )}>
                                             {saving ? <Loader2 className="w-5 h-5 text-white animate-spin" /> : <Check className="w-5 h-5 text-white" />}
                                             <span className="text-[11px] font-black text-white uppercase italic tracking-tighter">{t('journal.commitChanges')}</span>
                                         </div>
                                     </div>
                                 </button>
                            </div>
                        </form>
                    )}
                </div>

            </main>

            <ConfirmModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={performDelete}
                title={t('journal.deleteConfirmTitle')}
                message={t('journal.deleteConfirm', { title: entry.title || 'Untitled' })}
                confirmText={t('common.confirm')}
                cancelText={t('common.cancel')}
                variant="danger"
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
