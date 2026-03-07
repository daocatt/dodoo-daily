'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, Camera, X, Milestone as MilestoneIcon, Calendar, BookOpen, Loader2 } from 'lucide-react'
import { useI18n } from '@/contexts/I18nContext'
import Link from 'next/link'

const formatDate = (date: string | number | Date) => {
    const d = new Date(date)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const h = String(d.getHours()).padStart(2, '0')
    const min = String(d.getMinutes()).padStart(2, '0')
    return `${y}-${m}-${day} ${h}:${min}`
}

export default function NewJournalPage() {
    const { t } = useI18n()
    const router = useRouter()

    const getLocalISOString = () => {
        const d = new Date()
        const offset = d.getTimezoneOffset()
        const local = new Date(d.getTime() - (offset * 60 * 1000))
        return local.toISOString().slice(0, 16)
    }

    const [text, setText] = useState('')
    const [images, setImages] = useState<File[]>([])
    const [imagePreviews, setImagePreviews] = useState<string[]>([])
    const [isMilestone, setIsMilestone] = useState(false)
    const [postDate, setPostDate] = useState(getLocalISOString())
    const [posting, setPosting] = useState(false)

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
                    text,
                    imageUrls,
                    isMilestone,
                    milestoneDate: new Date(postDate).getTime()
                })
            })
            if (res.ok) {
                router.push('/journal')
            }
        } catch (err) {
            console.error(err)
        } finally {
            setPosting(false)
        }
    }

    return (
        <div className="min-h-dvh flex flex-col relative overflow-x-hidden bg-orange-50/30 text-[#2c2416] pb-20">
            {/* Background */}
            <div className="fixed inset-0 bg-gradient-to-tr from-amber-100/30 via-orange-50/20 to-emerald-50/10 pointer-events-none" />

            <header className="relative z-10 px-6 py-3 md:py-4 flex items-center max-w-4xl mx-auto w-full">
                <button
                    onClick={() => router.back()}
                    className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white shadow-xl shadow-orange-900/5 text-slate-600 border border-slate-50 active:scale-95 transition-transform"
                >
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <div className="flex-1 text-center">
                    <h1 className="font-black text-xl text-slate-800 tracking-tight">Capture Moment</h1>
                </div>
                <div className="w-12"></div>
            </header>

            <main className="relative z-10 w-full max-w-4xl mx-auto px-6 mt-6">
                <div className="bg-white rounded-xl shadow-2xl shadow-orange-900/5 border border-slate-50 overflow-hidden">
                    <form onSubmit={handlePost} className="p-8 md:p-12">
                        <div className="space-y-8">
                            <textarea
                                value={text}
                                onChange={e => setText(e.target.value)}
                                placeholder={t('journal.placeholder')}
                                className="w-full h-80 p-8 bg-slate-50/50 rounded-xl border-2 border-slate-50 focus:border-orange-100 focus:bg-white focus:ring-4 focus:ring-orange-50 outline-none text-xl md:text-2xl font-medium leading-[1.8] resize-none transition-all shadow-inner"
                            />

                            <div className="flex flex-wrap gap-4">
                                <label className="w-24 h-24 bg-slate-50 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 transition-colors border-2 border-dashed border-slate-200 group">
                                    <Camera className="w-8 h-8 text-slate-400 group-hover:scale-110 transition-transform" />
                                    <span className="text-[10px] font-black text-slate-400 mt-2 uppercase">Photo</span>
                                    <input type="file" multiple accept="image/*" onChange={handleImageChange} className="hidden" />
                                </label>

                                {imagePreviews.map((prev, i) => (
                                    <div key={i} className="relative w-24 h-24 rounded-lg overflow-hidden shadow-md group border-2 border-white">
                                        <img src={prev} className="w-full h-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={() => removeImage(i)}
                                            className="absolute inset-0 bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                                        >
                                            <X className="w-6 h-6" />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <div className="flex flex-col md:flex-row md:items-center gap-6 p-6 bg-orange-50/50 rounded-xl border border-orange-100/30">
                                <div className="flex items-center gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsMilestone(!isMilestone)}
                                        className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all ${isMilestone ? 'bg-orange-500 border-orange-500 shadow-lg shadow-orange-200' : 'bg-white border-orange-200'
                                            }`}
                                    >
                                        {isMilestone && <X className="w-5 h-5 text-transparent stroke-white stroke-[3] rotate-45" style={{ display: 'none' }} />}
                                        {isMilestone && <div className="w-3 h-3 rounded-full bg-white"></div>}
                                    </button>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-black text-orange-600 uppercase tracking-widest">{t('parent.milestone')}</span>
                                        <span className="text-[10px] text-orange-400 font-bold">{t('parent.milestoneTip')}</span>
                                    </div>
                                </div>

                                <div className="flex-1 flex gap-2 min-w-[240px]">
                                    <div className="flex-1 flex items-center gap-2 px-4 py-3 bg-white rounded-2xl border border-orange-100 shadow-sm transition-colors focus-within:border-orange-300">
                                        <Calendar className="w-4 h-4 text-orange-400" />
                                        <input
                                            type="date"
                                            className="w-full bg-transparent text-slate-600 font-bold text-sm outline-none cursor-pointer"
                                            value={postDate.split('T')[0]}
                                            onChange={e => e.target.value && setPostDate(`${e.target.value}T${postDate.split('T')[1]}`)}
                                        />
                                    </div>
                                    <div className="flex items-center justify-center gap-2 px-4 py-3 bg-white rounded-2xl border border-orange-100 shadow-sm transition-colors focus-within:border-orange-300">
                                        <input
                                            type="time"
                                            className="w-full min-w-[80px] bg-transparent text-slate-600 font-bold text-sm outline-none cursor-pointer"
                                            value={postDate.split('T')[1]}
                                            onChange={e => e.target.value && setPostDate(`${postDate.split('T')[0]}T${e.target.value}`)}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-slate-100">
                            <button
                                type="submit"
                                disabled={posting || (!text && images.length === 0)}
                                className="flex-1 h-14 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-black rounded-2xl shadow-xl shadow-orange-500/20 hover:shadow-orange-500/40 disabled:opacity-50 transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                                {posting ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Publish</span>}
                            </button>
                            <button
                                type="button"
                                onClick={() => router.back()}
                                className="sm:w-32 h-14 bg-white border border-slate-200 text-slate-500 font-bold rounded-2xl hover:bg-slate-50 transition-all"
                            >
                                {t('button.cancel')}
                            </button>
                        </div>
                    </form>
                </div>
            </main >
        </div >
    )
}
