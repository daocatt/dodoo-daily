'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { Plus, Camera, Image as ImageIcon, ChevronLeft, Archive, Sparkles, Store } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import AnimatedSky from '@/components/AnimatedSky'
import UploadModal from '@/components/gallery/UploadModal'
import { useI18n } from '@/contexts/I18nContext'

type Artwork = {
    id: string
    title: string
    imageUrl: string
    thumbnailMedium?: string | null
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

    const [newAlbumName, setNewAlbumName] = useState('')
    const [showNewAlbumModal, setShowNewAlbumModal] = useState(false)
    const [, setIsParent] = useState(false)
    const [selectedChildId] = useState<string | null>(null)
    const [children] = useState<Child[]>([])

    const router = useRouter()

    useEffect(() => {
        fetch('/api/stats')
            .then(res => res.json())
            .then(data => {
                setIsParent(data.isParent)
                if (data.isParent && data.children?.length > 0) {
                    // Possible future enhancement: setChildren(data.children)
                    // setSelectedChildId(data.children[0].id)
                }
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
                        onClick={() => router.push('/admin/gallery/exhibition')}
                        className="flex items-center justify-center p-2 rounded-2xl bg-amber-500/80 hover:bg-amber-500 backdrop-blur-md transition-colors text-white shadow-sm border border-amber-400 aspect-square"
                        title={t('gallery.exhibition') || 'Exhibition Settings'}
                    >
                        <Store className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => router.push('/admin/gallery/archive')}
                        className="flex items-center justify-center p-2 rounded-2xl bg-slate-200/80 hover:bg-slate-300 backdrop-blur-md transition-colors text-slate-600 shadow-sm border border-slate-300 aspect-square"
                        title={t('gallery.archives')}
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
                                onClick={() => router.push(`/admin/gallery/${album.id}`)}
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
                                                <img src={art.thumbnailMedium || art.imageUrl} alt={art.title} className="w-full h-full object-cover transition-transform group-hover:scale-105" />

                                                {art.isPublic && (
                                                    <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-indigo-500/90 text-white text-[8px] font-black rounded-lg shadow-lg backdrop-blur-md z-10 flex items-center gap-1 border border-white/20">
                                                        <Sparkles className="w-2.5 h-2.5 text-amber-300 fill-amber-300" />
                                                        {t('gallery.isPoster')}
                                                    </div>
                                                )}
                                            </motion.div>
                                        ))
                                    )}
                                </div>
                                <div className="mt-8 text-center bg-white/60 backdrop-blur-md px-6 py-2 rounded-full shadow-sm border border-white/50 group-hover:bg-white/80 transition-colors">
                                    <h3 className="font-bold text-lg">{album.title}</h3>
                                    <p className="text-xs text-[#6b5c45] font-medium">{t('gallery.artworksCount', { count: String(album.totalArtworks || album.artworks.length) })}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </main>

            {/* Upload Modal */}
            <UploadModal
                isOpen={showUploadModal}
                onClose={() => setShowUploadModal(false)}
                onSuccess={() => fetchAlbums(selectedChildId)}
                albums={albums}
                selectedChildId={selectedChildId}
            />

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
