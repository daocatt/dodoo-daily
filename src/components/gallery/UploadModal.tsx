'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Upload, X as XIcon, Camera, Sparkles, Star, Loader2, Image as ImageIcon } from 'lucide-react'
import { useI18n } from '@/contexts/I18nContext'
import Image from 'next/image'
import { clsx } from 'clsx'

type Album = {
    id: string
    title: string
}

type UploadModalProps = {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
    albums: Album[]
    defaultAlbumId?: string
    selectedChildId?: string | null
}

export default function UploadModal({ isOpen, onClose, onSuccess, albums, defaultAlbumId, selectedChildId }: UploadModalProps) {
    const { t } = useI18n()
    const [uploadTitle, setUploadTitle] = useState('')
    const [uploadPriceCoins, setUploadPriceCoins] = useState('')
    const [uploadAlbumId, setUploadAlbumId] = useState(defaultAlbumId || '')
    const [uploadIsPublic, setUploadIsPublic] = useState(false)
    const [uploadIsFeatured, setUploadIsFeatured] = useState(false)
    const [uploadExhibitionDescription, setUploadExhibitionDescription] = useState('')
    const [uploadFiles, setUploadFiles] = useState<File[]>([])
    const [uploadPreviews, setUploadPreviews] = useState<string[]>([])
    const [uploading, setUploading] = useState(false)

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return
        const files = Array.from(e.target.files)
        setUploadFiles([...uploadFiles, ...files])
        const previews = files.map(f => URL.createObjectURL(f))
        setUploadPreviews([...uploadPreviews, ...previews])
    }

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault()
        if (uploadFiles.length === 0) return
        
        const finalAlbumId = uploadAlbumId || defaultAlbumId || (albums.length > 0 ? albums[0].id : null)
        if (!finalAlbumId) {
            alert(t('gallery.album.required'))
            return
        }

        setUploading(true)
        const formData = new FormData()
        uploadFiles.forEach((file) => {
            formData.append('file', file)
        })
        formData.append('title', uploadTitle || uploadFiles[0].name.split('.')[0])
        
        // Logic: if not public, coins = 0
        const coins = uploadIsPublic ? (uploadPriceCoins || '0') : '0'
        formData.append('priceCoins', coins)
        formData.append('isPublic', uploadIsPublic.toString())
        formData.append('isFeatured', uploadIsFeatured.toString())
        formData.append('exhibitionDescription', uploadExhibitionDescription)

        if (selectedChildId) {
            formData.append('targetUserId', selectedChildId)
        }
        formData.append('albumId', finalAlbumId)

        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            })
            if (res.ok) {
                setUploadTitle('')
                uploadPreviews.forEach(URL.revokeObjectURL)
                setUploadFiles([])
                setUploadPreviews([])
                setUploadPriceCoins('')
                setUploadIsPublic(false)
                setUploadIsFeatured(false)
                setUploadExhibitionDescription('')
                onSuccess()
                onClose()
            }
        } catch (_err) {
            console.error(_err)
        } finally {
            setUploading(false)
        }
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
                >
                    <motion.div
                        initial={{ scale: 0.9, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.9, y: 20 }}
                        className="w-full max-w-lg relative"
                    >
                        {/* Inner Casing (The Panel) */}
                        <div className="baustein-panel w-full bg-[#E6E2D1] rounded-[2rem] shadow-2xl relative overflow-hidden border-4 border-[#C8C4B0] flex flex-col">
                            {/* Panel Texture & Screws */}
                            <div className="absolute top-3 left-3 w-2 h-2 rounded-full bg-slate-900/10 shadow-inner" />
                            <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-slate-900/10 shadow-inner" />
                            <div className="absolute bottom-3 left-3 w-2 h-2 rounded-full bg-slate-900/10 shadow-inner" />
                            <div className="absolute bottom-3 right-3 w-2 h-2 rounded-full bg-slate-900/10 shadow-inner" />

                            <div className="p-6 md:p-8 flex flex-col">
                                <div className="flex justify-between items-center mb-6 border-b-2 border-black/5 pb-4">
                                    <h3 className="text-xl font-black text-slate-900 tracking-tighter uppercase flex items-center gap-3">
                                        <div className="hardware-well w-8 h-8 rounded-lg bg-[#DADBD4] shadow-well relative overflow-hidden">
                                            <div className="hardware-cap absolute inset-1 bg-purple-500 rounded flex items-center justify-center">
                                                <Upload className="w-4 h-4 text-white" />
                                            </div>
                                        </div>
                                        {t('gallery.upload')}
                                    </h3>
                                    <button 
                                        onClick={onClose}
                                        className="hardware-btn group z-50"
                                    >
                                        <div className="hardware-well w-10 h-10 rounded-full bg-[#DADBD4] shadow-well flex items-center justify-center relative overflow-hidden active:translate-y-0.5 transition-all">
                                            <div className="hardware-cap absolute inset-1 bg-white group-hover:bg-rose-50 rounded-full shadow-cap transition-all flex items-center justify-center border border-black/5">
                                                <XIcon className="w-5 h-5 text-slate-400 group-hover:text-rose-500 transition-colors" />
                                            </div>
                                        </div>
                                    </button>
                                </div>

                                <div className="overflow-y-auto max-h-[65vh] hide-scrollbar -mx-2 px-2">
                                    <form onSubmit={handleUpload} className="flex flex-col gap-6">
                                        <div className="space-y-5">
                                            {/* Photo Upload Well */}
                                            <div>
                                                <label className="block label-mono text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">
                                                    {t('gallery.form.fileLabel')}
                                                </label>
                                                <div className="flex flex-wrap gap-4 p-4 rounded-2xl bg-white/40 shadow-inner border border-[#C8C4B0]/50">
                                                    <label className="w-20 h-20 bg-[#DADBD4] rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 transition-all border-2 border-dashed border-[#C8C4B0] group hardware-btn">
                                                        <Camera className="w-6 h-6 text-slate-500 group-hover:scale-110 transition-transform" />
                                                        <span className="text-[8px] font-black text-slate-500 mt-1 uppercase tracking-tighter">{t('gallery.photoLabel')}</span>
                                                        <input type="file" multiple accept="image/*" onChange={handleImageChange} className="hidden" />
                                                    </label>

                                                    {uploadPreviews.map((prev, i) => (
                                                        <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden shadow-lg group border-2 border-white hardware-well">
                                                            <Image src={prev} alt="Preview" fill className="object-cover" unoptimized />
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const newFiles = [...uploadFiles]
                                                                    newFiles.splice(i, 1)
                                                                    setUploadFiles(newFiles)

                                                                    const newPreviews = [...uploadPreviews]
                                                                    URL.revokeObjectURL(newPreviews[i])
                                                                    newPreviews.splice(i, 1)
                                                                    setUploadPreviews(newPreviews)
                                                                }}
                                                                className="absolute inset-0 bg-red-500/80 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                                                            >
                                                                <XIcon className="w-6 h-6" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Title Field */}
                                            <div>
                                                <label className="block label-mono text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
                                                    {t('gallery.form.titleLabel')}
                                                </label>
                                                <div className="hardware-well rounded-xl p-1.5 bg-[#D1CDBC] shadow-well">
                                                    <input
                                                        type="text"
                                                        value={uploadTitle}
                                                        onChange={e => setUploadTitle(e.target.value)}
                                                        className="w-full bg-white/90 px-4 py-3 rounded-lg border-2 border-transparent focus:border-purple-500 outline-none font-black text-slate-800 text-sm shadow-inner transition-colors"
                                                        placeholder={t('gallery.form.titlePlaceholder')}
                                                    />
                                                </div>
                                            </div>

                                            {/* Album Select */}
                                            {!defaultAlbumId && (
                                                <div>
                                                    <label className="block label-mono text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
                                                        {t('gallery.form.albumLabel')}
                                                    </label>
                                                    <div className="hardware-well rounded-xl p-1.5 bg-[#D1CDBC] shadow-well">
                                                        <select
                                                            value={uploadAlbumId}
                                                            onChange={e => setUploadAlbumId(e.target.value)}
                                                            className="w-full bg-white/90 px-4 py-3 rounded-lg border-2 border-transparent focus:border-purple-500 outline-none font-black text-slate-800 text-sm shadow-inner transition-colors appearance-none"
                                                            required
                                                        >
                                                            <option value="" disabled>{t('gallery.form.selectAlbumFallback')}</option>
                                                            <option value="archive">{t('gallery.form.archiveOption')}</option>
                                                            {albums.map(a => (
                                                                <option key={a.id} value={a.id}>{a.title}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Toggles (Public & Featured) */}
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="hardware-well rounded-xl p-3 bg-white/40 border border-[#C8C4B0]/50 flex items-center justify-between">
                                                    <div className="flex flex-col">
                                                        <span className="label-mono text-[9px] font-black text-slate-500 uppercase tracking-[0.1em]">{t('gallery.form.isPublicLabel')}</span>
                                                        <Sparkles className={clsx("w-3.5 h-3.5 mt-1 transition-colors", uploadIsPublic ? "text-purple-500" : "text-slate-300")} />
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => setUploadIsPublic(!uploadIsPublic)}
                                                        className={clsx(
                                                            "hardware-well w-11 h-6 rounded-full transition-all relative p-1",
                                                            uploadIsPublic ? "bg-purple-500/20" : "bg-slate-200"
                                                        )}
                                                    >
                                                        <div className={clsx(
                                                            "w-4 h-4 rounded-full transition-all shadow-cap hardware-cap",
                                                            uploadIsPublic ? "translate-x-5 bg-purple-500" : "translate-x-0 bg-white"
                                                        )} />
                                                    </button>
                                                </div>

                                                <div className="hardware-well rounded-xl p-3 bg-white/40 border border-[#C8C4B0]/50 flex items-center justify-between">
                                                    <div className="flex flex-col">
                                                        <span className="label-mono text-[9px] font-black text-slate-500 uppercase tracking-[0.1em]">Featured</span>
                                                        <Star className={clsx("w-3.5 h-3.5 mt-1 transition-colors", uploadIsFeatured ? "text-amber-500" : "text-slate-300")} />
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => setUploadIsFeatured(!uploadIsFeatured)}
                                                        className={clsx(
                                                            "hardware-well w-11 h-6 rounded-full transition-all relative p-1",
                                                            uploadIsFeatured ? "bg-amber-500/20" : "bg-slate-200"
                                                        )}
                                                    >
                                                        <div className={clsx(
                                                            "w-4 h-4 rounded-full transition-all shadow-cap hardware-cap",
                                                            uploadIsFeatured ? "translate-x-5 bg-amber-500" : "translate-x-0 bg-white"
                                                        )} />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Exhibition Fields (Conditional) */}
                                            {uploadIsPublic && (
                                                <motion.div
                                                    initial={{ opacity: 0, scale: 0.95 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    className="space-y-5 pt-2 border-t-2 border-black/5"
                                                >
                                                    <div>
                                                        <label className="block label-mono text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
                                                            {t('gallery.form.priceCoinsLabel')} (Coins)
                                                        </label>
                                                        <div className="hardware-well rounded-xl p-1.5 bg-[#D1CDBC] shadow-well">
                                                            <input
                                                                type="number"
                                                                value={uploadPriceCoins}
                                                                onChange={e => setUploadPriceCoins(e.target.value)}
                                                                className="w-full bg-white/90 px-4 py-3 rounded-lg border-2 border-transparent focus:border-purple-500 outline-none font-black text-slate-800 text-sm shadow-inner transition-colors"
                                                                placeholder="0"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="block label-mono text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
                                                            展厅描述 / MINI STORY
                                                        </label>
                                                        <div className="hardware-well rounded-xl p-1.5 bg-[#D1CDBC] shadow-well">
                                                            <textarea
                                                                value={uploadExhibitionDescription}
                                                                onChange={e => setUploadExhibitionDescription(e.target.value)}
                                                                className="w-full bg-white/90 px-4 py-3 rounded-lg border-2 border-transparent focus:border-purple-500 outline-none font-black text-slate-800 text-sm shadow-inner transition-colors resize-none h-24"
                                                                placeholder="Write a mini story about this artwork..."
                                                            />
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={uploading || uploadFiles.length === 0}
                                            className="hardware-btn group mt-2"
                                        >
                                            <div className="hardware-well h-14 w-full rounded-xl overflow-hidden relative bg-[#DADBD4] shadow-well active:translate-y-0.5">
                                                <div className="hardware-cap absolute inset-1.5 bg-purple-500 rounded-lg flex items-center justify-center transition-all shadow-cap group-hover:bg-purple-600 disabled:grayscale disabled:opacity-50">
                                                    <span className="label-mono text-[11px] font-black text-white uppercase tracking-widest flex items-center gap-2">
                                                        {uploading ? (
                                                            <>
                                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                                {t('gallery.form.uploading')}
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Upload className="w-4 h-4" />
                                                                {t('gallery.form.submit')}
                                                            </>
                                                        )}
                                                    </span>
                                                </div>
                                            </div>
                                        </button>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
