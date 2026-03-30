'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Camera, X, Calendar, Loader2, Star, Check, PenTool, Type } from 'lucide-react'
import { useI18n } from '@/contexts/I18nContext'
import Image from 'next/image'
import SmartDatePicker from '@/components/SmartDatePicker'
import clsx from 'clsx'
import { motion } from 'motion/react'

export default function NewJournalPage() {
    const { t } = useI18n()
    const router = useRouter()

    const getLocalISOString = () => {
        const d = new Date()
        const offset = d.getTimezoneOffset()
        const local = new Date(d.getTime() - (offset * 60 * 1000))
        return local.toISOString().slice(0, 16)
    }

    const [title, setTitle] = useState('')
    const [text, setText] = useState('')
    const [images, setImages] = useState<File[]>([])
    const [imagePreviews, setImagePreviews] = useState<string[]>([])
    const [isMilestone, setIsMilestone] = useState(false)
    const [postDate, setPostDate] = useState(getLocalISOString())
    const [posting, setPosting] = useState(false)

    // Revoke object URLs to prevent memory leaks
    React.useEffect(() => {
        return () => {
            imagePreviews.forEach(url => URL.revokeObjectURL(url))
        }
    }, [imagePreviews])

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
            // Upload in parallel
            const uploadPromises = images.map(async (file) => {
                const formData = new FormData()
                formData.append('file', file)
                formData.append('type', 'IMAGE')
                const upRes = await fetch('/api/media/upload', { method: 'POST', body: formData })
                if (!upRes.ok) throw new Error('Upload failed')
                const upData = await upRes.json()
                return upData.path as string
            })

            const imageUrls = await Promise.all(uploadPromises)

            const res = await fetch('/api/journal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    text,
                    imageUrls,
                    isMilestone,
                    milestoneDate: new Date(postDate).getTime()
                })
            })
            if (res.ok) {
                router.push('/admin/journal')
            }
        } catch (_err) {
            console.error(_err)
        } finally {
            setPosting(false)
        }
    }

    return (
        <div className="min-h-screen bg-[#D1CDBC] relative flex flex-col font-sans selection:bg-rose-100 selection:text-rose-900">
            {/* Background Texture */}
            <div className="fixed inset-0 bg-[radial-gradient(circle_at_1px_1px,#000_1px,transparent_0)] bg-[size:40px_40px] opacity-[0.03] pointer-events-none" />

            <header className="relative z-10 px-6 py-4 md:px-10 flex justify-between items-center max-w-5xl mx-auto w-full mt-4">
                <button
                    onClick={() => router.back()}
                    className="hardware-btn group"
                >
                    <div className="hardware-well w-12 h-12 rounded-xl bg-[#DADBD4] shadow-well flex items-center justify-center relative overflow-hidden active:translate-y-0.5 transition-all">
                        <div className="hardware-cap absolute inset-1 bg-white group-hover:bg-slate-50 rounded-lg shadow-cap transition-all flex items-center justify-center border border-black/5">
                            <ChevronLeft className="w-6 h-6 text-slate-400 group-hover:text-slate-600 transition-colors" />
                        </div>
                    </div>
                </button>
                <div className="flex flex-col items-center">
                    <h1 className="font-black text-xl md:text-2xl text-slate-800 uppercase italic tracking-tighter">Capture Moment</h1>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest label-mono italic opacity-60">System Registry // Entry Mode</span>
                </div>
                <div className="w-12"></div>
            </header>

            <main className="relative z-10 w-full max-w-4xl mx-auto px-6 mt-6 pb-24">
                <div className="baustein-panel bg-[#E2DFD2] rounded-[2.5rem] border-4 border-[#C8C4B0] shadow-2xl relative overflow-hidden ring-1 ring-black/5">
                    {/* Panel Screws */}
                    <div className="absolute top-4 left-4 w-2 h-2 rounded-full bg-slate-900/10 shadow-inner" />
                    <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-slate-900/10 shadow-inner" />
                    <div className="absolute bottom-4 left-4 w-2 h-2 rounded-full bg-slate-900/10 shadow-inner" />
                    <div className="absolute bottom-4 right-4 w-2 h-2 rounded-full bg-slate-900/10 shadow-inner" />

                    <form onSubmit={handlePost} className="p-8 md:p-12 space-y-12">
                        {/* 1. Visual Capture Section */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 hardware-well rounded-lg bg-[#DADBD4] flex items-center justify-center">
                                    <Camera className="w-4 h-4 text-slate-400" />
                                </div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] label-mono italic">Visual Manifest // Photos</label>
                            </div>
                            
                            <div className="hardware-well bg-[#D1CDBC] p-4 rounded-[2rem] shadow-inner grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4 border border-black/5">
                                <label className="hardware-btn group aspect-square">
                                    <div className="hardware-well h-full rounded-2xl bg-[#DADBD4] shadow-well flex flex-col items-center justify-center cursor-pointer relative overflow-hidden active:translate-y-1 transition-all">
                                        <div className="hardware-cap absolute inset-1 bg-white group-hover:bg-slate-50 rounded-xl shadow-cap transition-all flex flex-col items-center justify-center gap-2 border border-black/5">
                                            <Camera className="w-8 h-8 text-slate-200 group-hover:scale-110 transition-transform" />
                                            <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest label-mono italic opacity-60">ADD_MEDIA</span>
                                        </div>
                                    </div>
                                    <input type="file" multiple accept="image/*" onChange={handleImageChange} className="hidden" />
                                </label>
                                
                                {imagePreviews.map((prev, i) => (
                                    <div key={i} className="relative aspect-square rounded-2xl overflow-hidden shadow-inner border-2 border-white group">
                                        <Image src={prev} alt="Preview" fill className="object-cover" unoptimized />
                                        <button
                                            type="button"
                                            onClick={() => removeImage(i)}
                                            className="absolute inset-0 bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm"
                                        >
                                            <X className="w-8 h-8" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 2. Primary Registry Section (Title) */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 hardware-well rounded-lg bg-[#DADBD4] flex items-center justify-center">
                                    <PenTool className="w-3.5 h-3.5 text-slate-400" />
                                </div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] label-mono italic">Primary identifier // Title</label>
                            </div>
                            
                            <div className="hardware-well p-1 bg-[#D1CDBC] rounded-[1.2rem] shadow-well ring-1 ring-black/5">
                                <input
                                    type="text"
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    placeholder="Enter record title..."
                                    className="w-full px-8 py-5 bg-white rounded-xl border border-black/5 outline-none text-xl font-black tracking-tight transition-all shadow-inner italic uppercase text-slate-800 placeholder:opacity-30 selection:bg-rose-100"
                                />
                            </div>
                        </div>

                        {/* 3. Semantic Content Section */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 hardware-well rounded-lg bg-[#DADBD4] flex items-center justify-center">
                                    <Type className="w-4 h-4 text-slate-400" />
                                </div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] label-mono italic">Semantic Load // Narrative</label>
                            </div>
                            
                            <div className="hardware-well p-1 bg-[#D1CDBC] rounded-[1.5rem] shadow-well ring-1 ring-black/5">
                                <textarea
                                    value={text}
                                    onChange={e => setText(e.target.value)}
                                    placeholder={t('journal.placeholder')}
                                    className="w-full h-64 p-8 bg-white rounded-2xl border border-black/5 outline-none text-xl md:text-2xl font-medium leading-[1.8] resize-none transition-all shadow-inner italic selection:bg-rose-100 selection:text-rose-900"
                                />
                            </div>
                        </div>

                        {/* 4. Temporal & Categorical Matrix */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                             {/* Milestone Switch */}
                            <div 
                                onClick={() => setIsMilestone(!isMilestone)}
                                className="hardware-well p-3 bg-[#DADBD4] rounded-[1.5rem] flex items-center justify-between cursor-pointer group shadow-well border border-black/5 active:translate-y-0.5 transition-all"
                            >
                                <div className="flex items-center gap-4">
                                    <div className={clsx(
                                        "w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-500",
                                        isMilestone ? "bg-amber-400 shadow-lg ring-4 ring-amber-400/20" : "bg-[#D1CDBC]"
                                    )}>
                                        <Star className={clsx(
                                            "w-6 h-6 transition-colors duration-500",
                                            isMilestone ? "text-white fill-white" : "text-slate-400"
                                        )} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[11px] font-black text-slate-800 uppercase italic tracking-tighter leading-none">Milestone Matrix</span>
                                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1 opacity-60">CRITICAL_EVENT_FLAG</span>
                                    </div>
                                </div>
                                
                                <div className="hardware-well h-6 w-12 rounded-full bg-[#C8C4B0] p-1 relative overflow-hidden flex items-center">
                                    <motion.div 
                                        animate={{ x: isMilestone ? 24 : 0 }}
                                        className={clsx(
                                            "w-4 h-4 rounded-full shadow-cap border border-black/5 transition-colors duration-500",
                                            isMilestone ? "bg-amber-400" : "bg-white"
                                        )}
                                    />
                                </div>
                            </div>

                            {/* Temporal Control */}
                            <div className="hardware-well p-3 bg-[#DADBD4] rounded-[1.5rem] flex items-center gap-4 shadow-well border border-black/5 px-5">
                                <div className="w-12 h-12 rounded-xl bg-[#D1CDBC] flex items-center justify-center flex-shrink-0">
                                    <Calendar className="w-6 h-6 text-slate-400" />
                                </div>
                                <div className="flex flex-col flex-1 overflow-hidden">
                                     <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest label-mono italic opacity-60 mb-1">TEMPORAL_COORDINATE</span>
                                     <div className="bg-white/40 h-8 rounded-lg flex items-center px-3 border border-black/5">
                                        <SmartDatePicker
                                            selected={new Date(postDate)}
                                            onSelect={(date) => {
                                                const tzoffset = (new Date()).getTimezoneOffset() * 60000;
                                                const localISOTime = (new Date(date.getTime() - tzoffset)).toISOString().slice(0, 16);
                                                setPostDate(localISOTime);
                                            }}
                                            showTime
                                            triggerClassName="bg-transparent border-none p-0 !px-0 text-[11px] font-black uppercase italic tracking-tighter text-slate-700"
                                            placeholder="Journal Date"
                                        />
                                     </div>
                                </div>
                            </div>
                        </div>

                        {/* 5. Execution Matrix */}
                        <div className="flex flex-col sm:flex-row gap-6 pt-8 border-t border-black/5">
                            <button
                                type="submit"
                                disabled={posting || (!text && images.length === 0)}
                                className="hardware-btn group flex-1"
                            >
                                <div className={clsx(
                                    "hardware-well h-16 rounded-2xl flex items-center justify-center relative overflow-hidden active:translate-y-1 transition-all",
                                    posting || (!text && images.length === 0) ? "bg-[#DADBD4]" : "bg-rose-500 shadow-well"
                                )}>
                                    <div className={clsx(
                                        "hardware-cap absolute inset-1.5 rounded-xl shadow-cap flex items-center justify-center gap-4 border border-black/5 transition-all text-white font-black uppercase italic tracking-widest",
                                        posting || (!text && images.length === 0) ? "bg-[#DADBD4] opacity-50" : "bg-rose-400 group-hover:bg-rose-500"
                                    )}>
                                        {posting ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                                            <>
                                                <PenTool className="w-5 h-5 shadow-sm" />
                                                <span>Publish Moment</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </button>
                            <button
                                type="button"
                                onClick={() => router.back()}
                                className="hardware-btn group sm:w-48"
                            >
                                <div className="hardware-well h-16 rounded-2xl bg-[#DADBD4] shadow-well flex items-center justify-center relative active:translate-y-1 transition-all">
                                    <div className="hardware-cap absolute inset-1.5 bg-white group-hover:bg-slate-50 rounded-xl shadow-cap flex items-center justify-center border border-black/5 transition-all">
                                        <span className="text-[10px] font-black text-slate-400 uppercase italic tracking-[0.2em]">{t('button.cancel')}</span>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </form>
                </div>
            </main >
        </div >
    )
}
