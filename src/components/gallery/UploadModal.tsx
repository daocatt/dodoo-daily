'use client'

import React, { useState } from 'react'
import { motion } from 'motion/react'
import { Upload, X, Camera, Sparkles, Star } from 'lucide-react'
import { useI18n } from '@/contexts/I18nContext'

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

    if (!isOpen) return null

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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col"
            >
                <div className="p-6 border-b border-[#f5f0e8] flex justify-between items-center bg-[#faf7f0]">
                    <h3 className="text-xl font-bold flex items-center gap-2"><Upload className="w-5 h-5 text-purple-500" /> {t('gallery.upload')}</h3>
                    <button onClick={onClose} className="text-[#a89880] hover:text-[#2c2416] font-bold text-xl">&times;</button>
                </div>
                <div className="overflow-y-auto max-h-[70vh] hide-scrollbar">
                    <form onSubmit={handleUpload} className="p-6 flex flex-col gap-4">
                        <div>
                            <label className="block text-sm font-bold text-[#6b5c45] mb-1">{t('gallery.form.titleLabel')}</label>
                            <input
                                type="text"
                                value={uploadTitle}
                                onChange={e => setUploadTitle(e.target.value)}
                                className="w-full bg-[#f5f0e8] border-none rounded-xl p-3 focus:ring-2 focus:ring-purple-400 outline-none"
                                placeholder={t('gallery.form.titlePlaceholder')}
                                required
                            />
                        </div>

                        {!defaultAlbumId && (
                            <div>
                                <label className="block text-sm font-bold text-[#6b5c45] mb-1">{t('gallery.form.albumLabel')}</label>
                                <select
                                    value={uploadAlbumId}
                                    onChange={e => setUploadAlbumId(e.target.value)}
                                    className="w-full bg-[#f5f0e8] border-none rounded-xl p-3 focus:ring-2 focus:ring-purple-400 outline-none"
                                    required
                                >
                                    <option value="" disabled>{t('gallery.form.selectAlbumFallback')}</option>
                                    {albums.map(a => (
                                        <option key={a.id} value={a.id}>{a.title}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-bold text-[#6b5c45] mb-2">{t('gallery.form.fileLabel')}</label>
                            <div className="flex flex-wrap gap-4">
                                <label className="w-24 h-24 bg-[#f5f0e8] rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-[#eadecc] transition-colors border-2 border-dashed border-[#eadecc] group">
                                    <Camera className="w-8 h-8 text-[#a89880] group-hover:scale-110 transition-transform" />
                                    <span className="text-[10px] font-black text-[#a89880] mt-2 uppercase">{t('gallery.photoLabel')}</span>
                                    <input type="file" multiple accept="image/*" onChange={handleImageChange} className="hidden" />
                                </label>

                                {uploadPreviews.map((prev, i) => (
                                    <div key={i} className="relative w-24 h-24 rounded-xl overflow-hidden shadow-md group border-2 border-white">
                                        <img src={prev} className="w-full h-full object-cover" alt="Preview" />
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
                                            className="absolute inset-0 bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                                        >
                                            <X className="w-6 h-6" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-purple-50 rounded-xl border border-purple-100">
                            <div className="flex items-center gap-2">
                                <Sparkles className={`w-4 h-4 ${uploadIsPublic ? 'text-purple-500' : 'text-slate-400'}`} />
                                <label className="text-xs font-bold text-slate-700">{t('gallery.form.isPublicLabel')}</label>
                            </div>
                            <button
                                type="button"
                                onClick={() => setUploadIsPublic(!uploadIsPublic)}
                                className={`w-10 h-5 rounded-full transition-all relative ${uploadIsPublic ? 'bg-purple-500' : 'bg-slate-200'}`}
                            >
                                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${uploadIsPublic ? 'left-5.5' : 'left-0.5'}`} />
                            </button>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-amber-50 rounded-xl border border-amber-100">
                            <div className="flex items-center gap-2">
                                <Star className={`w-4 h-4 ${uploadIsFeatured ? 'text-amber-500' : 'text-slate-400'}`} />
                                <label className="text-xs font-bold text-slate-700">精选 (Featured)</label>
                            </div>
                            <button
                                type="button"
                                onClick={() => setUploadIsFeatured(!uploadIsFeatured)}
                                className={`w-10 h-5 rounded-full transition-all relative ${uploadIsFeatured ? 'bg-amber-500' : 'bg-slate-200'}`}
                            >
                                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${uploadIsFeatured ? 'left-5.5' : 'left-0.5'}`} />
                            </button>
                        </div>

                        {uploadIsPublic && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="overflow-hidden space-y-4"
                            >
                                <div>
                                    <label className="block text-sm font-bold text-[#6b5c45] mb-1">{t('gallery.form.priceCoinsLabel')}</label>
                                    <input
                                        type="number"
                                        value={uploadPriceCoins}
                                        onChange={e => setUploadPriceCoins(e.target.value)}
                                        className="w-full bg-[#f5f0e8] border-none rounded-xl p-3 focus:ring-2 focus:ring-purple-400 outline-none"
                                        placeholder="0"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-[#6b5c45] mb-1">展厅描述</label>
                                    <textarea
                                        value={uploadExhibitionDescription}
                                        onChange={e => setUploadExhibitionDescription(e.target.value)}
                                        className="w-full bg-[#f5f0e8] border-none rounded-xl p-3 focus:ring-2 focus:ring-purple-400 outline-none resize-none h-24 text-sm"
                                        placeholder="写一点关于这件作品的小故事吧..."
                                    />
                                </div>
                            </motion.div>
                        )}

                        <button
                            type="submit"
                            disabled={uploading}
                            className="mt-2 w-full py-4 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-bold tracking-wide shadow-lg opacity-90 hover:opacity-100 transition-opacity disabled:grayscale"
                        >
                            {uploading ? t('gallery.form.uploading') : t('gallery.form.submit')}
                        </button>
                    </form>
                </div>
            </motion.div>
        </div>
    )
}
