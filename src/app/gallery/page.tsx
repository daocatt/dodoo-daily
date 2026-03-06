'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { Plus, Camera, Image as ImageIcon, ChevronLeft, Upload } from 'lucide-react'
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
}

type Album = {
    id: string
    title: string
    artworks: Artwork[]
}

export default function GalleryPage() {
    const [albums, setAlbums] = useState<Album[]>([])
    const [loading, setLoading] = useState(true)
    const [showUploadModal, setShowUploadModal] = useState(false)
    const { t } = useI18n()

    // Upload Form State
    const [uploadTitle, setUploadTitle] = useState('')
    const [uploadPriceRMB, setUploadPriceRMB] = useState('')
    const [uploadPriceCoins, setUploadPriceCoins] = useState('')
    const [uploadAlbumId, setUploadAlbumId] = useState('')
    const [uploadFile, setUploadFile] = useState<File | null>(null)
    const [uploading, setUploading] = useState(false)

    const [newAlbumName, setNewAlbumName] = useState('')
    const [showNewAlbumModal, setShowNewAlbumModal] = useState(false)

    const router = useRouter()

    useEffect(() => {
        fetchAlbums()
    }, [])

    const fetchAlbums = async () => {
        try {
            const res = await fetch('/api/albums')
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
        if (!uploadFile || !uploadTitle) return

        setUploading(true)
        const formData = new FormData()
        formData.append('file', uploadFile)
        formData.append('title', uploadTitle)
        formData.append('priceRMB', uploadPriceRMB)
        formData.append('priceCoins', uploadPriceCoins)

        // Option to put into selected album
        if (uploadAlbumId) {
            formData.append('albumId', uploadAlbumId)
        } else if (albums.length > 0) {
            formData.append('albumId', albums[0].id)
        }

        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            })
            if (res.ok) {
                setShowUploadModal(false)
                setUploadTitle('')
                setUploadFile(null)
                setUploadPriceRMB('')
                setUploadPriceCoins('')
                fetchAlbums() // Refresh
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
                body: JSON.stringify({ title: newAlbumName }),
            })
            if (res.ok) {
                setShowNewAlbumModal(false)
                setNewAlbumName('')
                fetchAlbums()
            }
        } catch (err) {
            console.error(err)
        }
    }

    return (
        <div className="min-h-dvh flex flex-col relative overflow-hidden bg-[#e0f2fe] text-[#2c2416]">
            <AnimatedSky />

            <header className="relative z-10 flex justify-between items-center p-6 backdrop-blur-sm bg-white/20 border-b border-white/30">
                <div className="flex items-center gap-4">
                    <Link href="/" className="w-10 h-10 flex items-center justify-center rounded-full bg-white/40 hover:bg-white/60 transition-colors shadow-sm text-white border border-white/50">
                        <ChevronLeft className="w-6 h-6" />
                    </Link>
                    <span className="font-extrabold text-2xl tracking-tight text-white drop-shadow-md flex items-center gap-2">
                        <ImageIcon className="w-6 h-6" />
                        {t('gallery.title')}
                    </span>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowUploadModal(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/80 hover:bg-purple-500 backdrop-blur-md transition-colors text-sm font-bold text-white shadow-sm border border-purple-400"
                    >
                        <Camera className="w-4 h-4" />
                        {t('gallery.upload')}
                    </button>
                    <button
                        onClick={() => setShowNewAlbumModal(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/40 hover:bg-white/60 backdrop-blur-md transition-colors text-sm font-bold text-white shadow-sm border border-white/50"
                    >
                        <Plus className="w-4 h-4" />
                        {t('gallery.newAlbum')}
                    </button>
                </div>
            </header>

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
                                                <img src={art.imageUrl} alt={art.title} className="w-full h-full object-cover" />
                                            </motion.div>
                                        ))
                                    )}
                                </div>
                                <div className="mt-8 text-center bg-white/60 backdrop-blur-md px-6 py-2 rounded-full shadow-sm border border-white/50 group-hover:bg-white/80 transition-colors">
                                    <h3 className="font-bold text-lg">{album.title}</h3>
                                    <p className="text-xs text-[#6b5c45] font-medium">{t('gallery.artworksCount', { count: album.artworks.length })}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </main>

            {/* Upload Modal */}
            {showUploadModal && (
                <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col"
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
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-[#6b5c45] mb-1">{t('gallery.form.priceRmbLabel')}</label>
                                    <input
                                        type="number"
                                        value={uploadPriceRMB}
                                        onChange={e => setUploadPriceRMB(e.target.value)}
                                        className="w-full bg-[#f5f0e8] border-none rounded-xl p-3 focus:ring-2 focus:ring-purple-400 outline-none"
                                    />
                                </div>
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
                                >
                                    <option value="">{t('gallery.form.noAlbumOption')}</option>
                                    {albums.map(a => (
                                        <option key={a.id} value={a.id}>{a.title}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-[#6b5c45] mb-1">{t('gallery.form.fileLabel')}</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={e => setUploadFile(e.target.files?.[0] || null)}
                                    className="w-full bg-[#f5f0e8] border-none rounded-xl p-3 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-100 file:text-purple-700 hover:file:bg-purple-200"
                                    required
                                />
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
            )}

            {/* New Album Modal */}
            {showNewAlbumModal && (
                <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col"
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
            )}
        </div>
    )
}
