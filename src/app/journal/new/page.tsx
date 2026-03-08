'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, Camera, X, Milestone as MilestoneIcon, Calendar, BookOpen, Loader2 } from 'lucide-react'
import { useI18n } from '@/contexts/I18nContext'
import Link from 'next/link'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'

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

            <main className="relative z-10 w-full max-w-4xl mx-auto px-6 mt-6 pb-24">
                <div className="bg-white rounded-[2rem] shadow-2xl shadow-orange-900/5 border border-slate-50 overflow-hidden">
                    <form onSubmit={handlePost} className="p-8 md:p-12 space-y-10">
                        {/* 1. Image Uploader at TOP */}
                        <div className="space-y-4">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Moment Photos</label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
                                <label className="aspect-square bg-slate-50 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 transition-colors border-2 border-dashed border-slate-200 group">
                                    <Camera className="w-10 h-10 text-slate-400 group-hover:scale-110 transition-transform" />
                                    <span className="text-[10px] font-black text-slate-400 mt-2 uppercase tracking-widest">Add Photo</span>
                                    <input type="file" multiple accept="image/*" onChange={handleImageChange} className="hidden" />
                                </label>

                                {imagePreviews.map((prev, i) => (
                                    <div key={i} className="relative aspect-square rounded-2xl overflow-hidden shadow-md group border-2 border-white">
                                        <img src={prev} className="w-full h-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={() => removeImage(i)}
                                            className="absolute inset-0 bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                                        >
                                            <X className="w-8 h-8" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 2. Text Content */}
                        <div className="space-y-4">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Share Your Story</label>
                            <textarea
                                value={text}
                                onChange={e => setText(e.target.value)}
                                placeholder={t('journal.placeholder')}
                                className="w-full h-80 p-8 bg-slate-50/50 rounded-2xl border-2 border-slate-50 focus:border-orange-100 focus:bg-white focus:ring-4 focus:ring-orange-50 outline-none text-xl md:text-2xl font-medium leading-[1.8] resize-none transition-all shadow-inner"
                            />
                        </div>

                        {/* 3. Settings Box */}
                        <div className="flex flex-col md:flex-row md:items-center gap-6 p-6 bg-orange-50/50 rounded-2xl border border-orange-100/30">
                            <div className="flex items-center gap-4">
                                <button
                                    type="button"
                                    onClick={() => setIsMilestone(!isMilestone)}
                                    className={`w-10 h-10 rounded-xl border-2 flex items-center justify-center transition-all ${isMilestone ? 'bg-orange-500 border-orange-500 shadow-lg shadow-orange-200' : 'bg-white border-orange-200'
                                        }`}
                                >
                                    {isMilestone && <div className="w-4 h-4 rounded-full bg-white"></div>}
                                </button>
                                <div className="flex flex-col">
                                    <span className="text-sm font-black text-orange-600 uppercase tracking-widest leading-none">Milestone</span>
                                    <span className="text-[10px] text-orange-400 font-bold mt-1">A special moment to remember</span>
                                </div>
                            </div>

                            <div className="flex-1 flex gap-2 min-w-[240px]">
                                <div className="flex-1 flex items-center gap-3 px-5 py-4 bg-white rounded-2xl border border-orange-100 shadow-sm transition-colors focus-within:border-orange-300">
                                    <Calendar className="w-5 h-5 text-orange-400 shrink-0" />
                                    <DatePicker
                                        selected={new Date(postDate)}
                                        onChange={(date: Date | null) => {
                                            if (date) {
                                                const tzoffset = (new Date()).getTimezoneOffset() * 60000;
                                                const localISOTime = (new Date(date.getTime() - tzoffset)).toISOString().slice(0, 16);
                                                setPostDate(localISOTime);
                                            }
                                        }}
                                        showTimeSelect
                                        showMonthDropdown
                                        showYearDropdown
                                        dropdownMode="select"
                                        timeFormat="HH:mm"
                                        timeIntervals={15}
                                        dateFormat="yyyy-MM-dd HH:mm"
                                        className="w-full bg-transparent text-slate-800 font-bold text-base outline-none cursor-pointer"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* 4. Actions */}
                        <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-slate-100">
                            <button
                                type="submit"
                                disabled={posting || (!text && images.length === 0)}
                                className="flex-1 h-16 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-black text-lg rounded-2xl shadow-xl shadow-orange-500/20 hover:shadow-orange-500/40 disabled:opacity-50 transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                                {posting ? <Loader2 className="w-6 h-6 animate-spin" /> : <span>Publish Moment</span>}
                            </button>
                            <button
                                type="button"
                                onClick={() => router.back()}
                                className="sm:w-40 h-16 bg-white border border-slate-200 text-slate-500 font-bold rounded-2xl hover:bg-slate-50 transition-all"
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
