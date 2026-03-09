'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { Plus, Camera, Image as ImageIcon, ChevronLeft, Upload, Archive, X, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import AnimatedSky from '@/components/AnimatedSky'
import { useI18n } from '@/contexts/I18nContext'

type Artwork = {
    id: string
    title: string
    imageUrl: string
    priceRMB: number
    priceCoins: number
    isPublic: boolean
}

type Album = {
    id: string
    title: string
    artworks: Artwork[]
}

type Child = {
    id: string
    name: string
    avatarUrl: string | null
}

export default function GalleryPage() {
    const [albums, setAlbums] = useState<Album[]>([])
    const [loading, setLoading] = useState(true)
    const [showUploadModal, setShowUploadModal] = useState(false)
    const { t } = useI18n()

    // Upload Form State
    const [uploadTitle, setUploadTitle] = useState('')
    const [uploadPriceCoins, setUploadPriceCoins] = useState('')
    const [uploadAlbumId, setUploadAlbumId] = useState('')
    const [uploadIsPublic, setUploadIsPublic] = useState(false)
    const [uploadFiles, setUploadFiles] = useState<File[]>([])
    const [uploadPreviews, setUploadPreviews] = useState<string[]>([])
    const [uploading, setUploading] = useState(false)

    const [newAlbumName, setNewAlbumName] = useState('')
    const [showNewAlbumModal, setShowNewAlbumModal] = useState(false)
    const [isParent, setIsParent] = useState(false)
    const [selectedChildId, setSelectedChildId] = useState<string | null>(null)
    const [children, setChildren] = useState<Child[]>([])

    const router = useRouter()

    useEffect(() => {
        fetch('/api/stats')
            .then(res => res.json())
            .then(data => {
                setIsParent(data.isParent)
                fetchAlbums(null)
            })
    }, [])



    const fetchAlbums = async (targetId: string | null) => {
        setLoading(true)
        try {
            const url = targetId ? `/api/albums?userId=${targetId}` : '/api/albums'
            const res = await fetch(url)
            const data = await res.json()
            setAlbums(data)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault()
        if (uploadFiles.length === 0) return
        if (!uploadAlbumId && albums.length === 0) {
            alert(t('gallery.album.required'))
            return
        }

        setUploading(true)
        const formData = new FormData()
        uploadFiles.forEach((file) => {
            formData.append('file', file)
        })
        formData.append('title', uploadTitle || uploadFiles[0].name.split('.')[0])
        formData.append('priceCoins', uploadPriceCoins || '0')
        formData.append('isPublic', uploadIsPublic.toString())

        if (selectedChildId) {
            formData.append('targetUserId', selectedChildId)
        }

        // Option to put into selected album
        const finalAlbumId = uploadAlbumId || (albums.length > 0 ? albums[0].id : null)
        if (finalAlbumId) {
            formData.append('albumId', finalAlbumId)
        } else {
            setUploading(false)
            alert('Please create an album first.')
            return
        }
        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            })
            if (res.ok) {
                setShowUploadModal(false)
                setUploadTitle('')
                uploadPreviews.forEach(URL.revokeObjectURL)
                setUploadFiles([])
                setUploadPreviews([])
                setUploadPriceCoins('')
                setUploadIsPublic(false) // Reset public status
                fetchAlbums(selectedChildId) // Refresh
            }
        } catch (err) {
            console.error(err)
        } finally {
            setUploading(false)
        }
    }

    const handleCreateAlbum = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newAlbumName) return

        try {
            const res = await fetch('/api/albums', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: newAlbumName, targetUserId: selectedChildId }),
            })
            if (res.ok) {
                setShowNewAlbumModal(false)
                setNewAlbumName('')
                fetchAlbums(selectedChildId)
            }
        } catch (err) {
            console.error(err)
        }
    }

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return
        const files = Array.from(e.target.files)
        setUploadFiles([...uploadFiles, ...files])
        const previews = files.map(f => URL.createObjectURL(f))
        setUploadPreviews([...uploadPreviews, ...previews])
    }

    return (
        <div className="min-h-dvh flex flex-col relative overflow-hidden bg-[#e0f2fe] text-[#2c2416]">
            <AnimatedSky />

            <header className="relative z-10 flex justify-between items-center px-6 py-4 md:px-10 md:py-6 backdrop-blur-sm bg-white/40 border-b border-white/50 shadow-sm">
                <div className="flex items-center gap-4">
                    <Link href="/" className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-2xl bg-white/40 hover:bg-white/60 transition-colors shadow-sm text-slate-800 border border-slate-200">
                        <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
                    </Link>
                    <span className="font-extrabold text-xl md:text-2xl tracking-tight text-slate-800 flex items-center gap-2">
                        <ImageIcon className="w-6 h-6 text-indigo-500" />
                        {t('gallery.title')}
                    </span>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowUploadModal(true)}
                        className="flex items-center justify-center p-2 rounded-2xl bg-purple-500/80 hover:bg-purple-500 backdrop-blur-md transition-colors text-white shadow-sm border border-purple-400 aspect-square"
                        title={t('gallery.upload')}
                    >
                        <Camera className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => setShowNewAlbumModal(true)}
                        className="flex items-center justify-center p-2 rounded-2xl bg-slate-800 hover:bg-slate-700 backdrop-blur-md transition-colors text-white shadow-sm border border-slate-700 aspect-square"
                        title={t('gallery.newAlbum')}
                    >
                        <Plus className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => router.push('/gallery/archive')}
                        className="flex items-center justify-center p-2 rounded-2xl bg-slate-200/80 hover:bg-slate-300 backdrop-blur-md transition-colors text-slate-600 shadow-sm border border-slate-300 aspect-square"
                        title="Archives"
                    >
                        <Archive className="w-5 h-5" />
                    </button>
                </div>
            </header >

            <main className="relative z-10 flex-1 overflow-y-auto p-6 md:p-12 pb-24 hide-scrollbar">
                {loading ? (
                    <div className="flex justify-center items-center h-full">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
                    </div>
                ) : albums.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-white/80">
                        <ImageIcon className="w-16 h-16 mb-4 opacity-50" />
                        <p className="text-xl font-bold">{t('gallery.noAlbums')}</p>
                        <p className="text-sm">{t('gallery.noAlbumsSub')}</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-12">
                        {albums.map((album, idx) => (
                            <motion.div
                                key={album.id}
                                initial={{ opacity: 0, y: 50 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1, type: "spring" }}
                                onClick={() => router.push(`/gallery/${album.id}`)}
                                className="group cursor-pointer flex flex-col items-center"
                            >
                                {/* Album Cover - overlapping effect */}
                                <div className="relative w-48 h-64 md:w-56 md:h-72 flex justify-center perspective-1000">
                                    {album.artworks.length === 0 ? (
                                        <div className="absolute w-full h-full rounded-2xl bg-white/40 backdrop-blur-sm border-4 border-white/60 shadow-lg flex items-center justify-center">
                                            <span className="text-white/70 font-bold">{t('gallery.empty')}</span>
                                        </div>
                                    ) : (
                                        album.artworks.map((art, artIdx) => (
                                            <motion.div
                                                key={art.id}
                                                className="absolute w-full h-full rounded-2xl bg-white border-4 border-white shadow-xl overflow-hidden"
                                                style={{
                                                    zIndex: 10 - artIdx,
                                                    transform: `rotate(${artIdx * 8 - 4}deg) translateX(${artIdx * 5}px) scale(${1 - artIdx * 0.05})`,
                                                }}
                                                whileHover={{ scale: 1.05, rotate: 0, zIndex: 20 }}
                                            >
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img src={art.imageUrl} alt={art.title} className="w-full h-full object-cover transition-transform group-hover:scale-105" />

                                                {art.isPublic && (
                                                    <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-indigo-500/90 text-white text-[8px] font-black rounded-lg shadow-lg backdrop-blur-md z-10 flex items-center gap-1 border border-white/20">
                                                        <Sparkles className="w-2.5 h-2.5 text-amber-300 fill-amber-300" />
                                                        POSTER
                                                    </div>
                                                )}
                                            </motion.div>
                                        ))
                                    )}
                                </div>
                                <div className="mt-8 text-center bg-white/60 backdrop-blur-md px-6 py-2 rounded-full shadow-sm border border-white/50 group-hover:bg-white/80 transition-colors">
                                    <h3 className="font-bold text-lg">{album.title}</h3>
                                    <p className="text-xs text-[#6b5c45] font-medium">{t('gallery.artworksCount', { count: String(album.artworks.length) })}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </main>

            {/* Upload Modal */}
            {
                showUploadModal && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col"
                        >
                            <div className="p-6 border-b border-[#f5f0e8] flex justify-between items-center bg-[#faf7f0]">
                                <h3 className="text-xl font-bold flex items-center gap-2"><Upload className="w-5 h-5 text-purple-500" /> {t('gallery.upload')}</h3>
                                <button onClick={() => setShowUploadModal(false)} className="text-[#a89880] hover:text-[#2c2416] font-bold text-xl">&times;</button>
                            </div>
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
                                <div className="grid grid-cols-1 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-[#6b5c45] mb-1">{t('gallery.form.priceCoinsLabel')}</label>
                                        <input
                                            type="number"
                                            value={uploadPriceCoins}
                                            onChange={e => setUploadPriceCoins(e.target.value)}
                                            className="w-full bg-[#f5f0e8] border-none rounded-xl p-3 focus:ring-2 focus:ring-purple-400 outline-none"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-[#6b5c45] mb-1">{t('gallery.form.albumLabel')}</label>
                                    <select
                                        value={uploadAlbumId}
                                        onChange={e => setUploadAlbumId(e.target.value)}
                                        className="w-full bg-[#f5f0e8] border-none rounded-xl p-3 focus:ring-2 focus:ring-purple-400 outline-none"
                                        required
                                    >
                                        <option value="" disabled>{t('gallery.form.selectAlbum') || 'Select an album'}</option>
                                        {albums.map(a => (
                                            <option key={a.id} value={a.id}>{a.title}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-[#6b5c45] mb-2">{t('gallery.form.fileLabel')}</label>
                                    <div className="flex flex-wrap gap-4">
                                        <label className="w-24 h-24 bg-[#f5f0e8] rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-[#eadecc] transition-colors border-2 border-dashed border-[#eadecc] group">
                                            <Camera className="w-8 h-8 text-[#a89880] group-hover:scale-110 transition-transform" />
                                            <span className="text-[10px] font-black text-[#a89880] mt-2 uppercase">Photo</span>
                                            <input type="file" multiple accept="image/*" onChange={handleImageChange} className="hidden" />
                                        </label>

                                        {uploadPreviews.map((prev, i) => (
                                            <div key={i} className="relative w-24 h-24 rounded-xl overflow-hidden shadow-md group border-2 border-white">
                                                <img src={prev} className="w-full h-full object-cover" />
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
                                    {uploadFiles.length === 0 && (
                                        <p className="mt-2 text-xs text-red-500 font-bold opacity-0 h-0 overflow-hidden group-invalid:opacity-100 group-invalid:h-auto group-invalid:mt-2">
                                            Please select at least one image.
                                        </p>
                                    )}
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
                                <button
                                    type="submit"
                                    disabled={uploading}
                                    className="mt-2 w-full py-4 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-bold tracking-wide shadow-lg opacity-90 hover:opacity-100 transition-opacity disabled:grayscale"
                                >
                                    {uploading ? t('gallery.form.uploading') : t('gallery.form.submit')}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )
            }

            {/* New Album Modal */}
            {
                showNewAlbumModal && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="w-full max-w-sm bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col"
                        >
                            <div className="p-6 border-b border-[#f5f0e8] flex justify-between items-center bg-[#faf7f0]">
                                <h3 className="text-xl font-bold flex items-center gap-2"><Plus className="w-5 h-5 text-indigo-500" /> {t('gallery.newAlbum')}</h3>
                                <button onClick={() => setShowNewAlbumModal(false)} className="text-[#a89880] hover:text-[#2c2416] font-bold text-xl">&times;</button>
                            </div>
                            <form onSubmit={handleCreateAlbum} className="p-6 flex flex-col gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-[#6b5c45] mb-1">{t('gallery.album.nameLabel')}</label>
                                    <input
                                        type="text"
                                        value={newAlbumName}
                                        onChange={e => setNewAlbumName(e.target.value)}
                                        className="w-full bg-[#f5f0e8] border-none rounded-xl p-3 focus:ring-2 focus:ring-indigo-400 outline-none"
                                        placeholder={t('gallery.album.namePlaceholder')}
                                        required
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="mt-2 w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-blue-500 text-white font-bold tracking-wide shadow-lg opacity-90 hover:opacity-100 transition-opacity"
                                >
                                    {t('gallery.album.create')}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )
            }
        </div >
    )
}
