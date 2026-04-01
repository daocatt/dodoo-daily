'use client'

import { BausteinAdminNavbar } from '@/components/BausteinAdminNavbar'
import React, { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'motion/react'
import { ChevronLeft, ChevronRight, Download, Image as ImageIcon, Settings, Trash, Archive, Edit3, AlertTriangle, Star, Sparkles, Camera, X as XIcon, Fan } from 'lucide-react'
import PosterGenerator from '@/components/PosterGenerator'
import UploadModal from '@/components/gallery/UploadModal'
import { useI18n } from '@/contexts/I18nContext'
import Image from 'next/image'
import { clsx } from 'clsx'

type Artwork = {
    id: string
    title: string
    imageUrl: string
    thumbnailMedium?: string | null
    thumbnailLarge?: string | null
    priceRMB: number
    priceCoins: number
    isSold: boolean
    isFeatured: boolean
    albumId?: string | null
    isArchived?: boolean
    isPublic?: boolean
    creatorNickname?: string | null
    creatorName?: string | null
    exhibitionDescription?: string | null
}

type AlbumDetail = {
    id: string
    title: string
    artworks: Artwork[]
}

type AvailableAlbum = {
    id: string
    title: string
}

export default function AlbumDetailPage() {
    const params = useParams()
    const router = useRouter()
    const [album, setAlbum] = useState<AlbumDetail | null>(null)
    const [loading, setLoading] = useState(true)
    const [posterArtwork, setPosterArtwork] = useState<Artwork | null>(null)
    const [showUploadModal, setShowUploadModal] = useState(false)
    const [selectedChildId, setSelectedChildId] = useState<string | null>(null)

    // Edit State
    const [editingArtwork, setEditingArtwork] = useState<Artwork | null>(null)
    const [editTitle, setEditTitle] = useState('')
    const [editPriceCoins, setEditPriceCoins] = useState('')
    const [editAlbumId, setEditAlbumId] = useState('')
    const [editIsPublic, setEditIsPublic] = useState(false)
    const [editIsFeatured, setEditIsFeatured] = useState(false)
    const [availableAlbums, setAvailableAlbums] = useState<AvailableAlbum[]>([])
    const [editingAlbumTitle, setEditingAlbumTitle] = useState(false)
    const [editAlbumName, setEditAlbumName] = useState('')
    const [editExhibitionDescription, setEditExhibitionDescription] = useState('')
    const [updating, setUpdating] = useState(false)
    const [confirmModal, setConfirmModal] = useState<{
        type: 'delete_artwork' | 'delete_album' | 'archive_artwork' | 'unarchive_artwork' | 'error',
        title: string,
        message: string,
        onConfirm?: () => void
    } | null>(null)
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

    const { t } = useI18n()

    const nextImage = useCallback(() => {
        if (!album || lightboxIndex === null) return
        setLightboxIndex((prev) => (prev! + 1) % album.artworks.length)
    }, [album, lightboxIndex])

    const prevImage = useCallback(() => {
        if (!album || lightboxIndex === null) return
        setLightboxIndex((prev) => (prev! - 1 + album.artworks.length) % album.artworks.length)
    }, [album, lightboxIndex])

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (lightboxIndex === null) return
            if (e.key === 'ArrowRight') nextImage()
            if (e.key === 'ArrowLeft') prevImage()
            if (e.key === 'Escape') setLightboxIndex(null)
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [lightboxIndex, nextImage, prevImage])

    const handleDownload = async (url: string, title: string) => {
        try {
            const response = await fetch(url)
            const blob = await response.blob()
            const link = document.createElement('a')
            link.href = URL.createObjectURL(blob)
            link.download = `${title}.jpg`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
        } catch (_err) {
            console.error('Download failed', _err)
            window.open(url, '_blank')
        }
    }

    useEffect(() => {
        if (!params?.id) return
        fetchAlbumDetail(params.id as string)

        fetch('/api/stats')
            .then(res => res.json())
            .then(data => {
                const searchParams = new URLSearchParams(window.location.search)
                const targetId = searchParams.get('userId')

                if (data.isAdmin) {
                    if (targetId) setSelectedChildId(targetId)
                }

                const albumsUrl = targetId && data.isAdmin ? `/api/albums?userId=${targetId}` : '/api/albums'
                fetch(albumsUrl).then(r => r.json()).then(albums => {
                    if (Array.isArray(albums)) setAvailableAlbums(albums)
                })
            })
    }, [params])

    const fetchAlbumDetail = async (id: string) => {
        try {
            const url = new URL(`${window.location.origin}/api/albums/${id}`)
            // Try to find if we're looking at a specific user's gallery from the parent view
            const searchParams = new URLSearchParams(window.location.search)
            const targetId = searchParams.get('userId')
            if (targetId) url.searchParams.set('userId', targetId)

            const res = await fetch(url.toString())
            if (res.ok) {
                const data = await res.json()
                setAlbum(data)
            } else {
                console.error('Album not found')
            }
        } catch (_err) {
            console.error(_err)
        } finally {
            setLoading(false)
        }
    }

    const handleUpdateArtwork = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!editingArtwork) return

        setUpdating(true)
        try {
            const res = await fetch(`/api/artworks/${editingArtwork.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: editTitle,
                    priceCoins: editIsPublic ? (editPriceCoins || '0') : '0',
                    albumId: editAlbumId === 'archive' ? null : editAlbumId,
                    isArchived: editAlbumId === 'archive',
                    isPublic: editIsPublic,
                    isFeatured: editIsFeatured,
                    exhibitionDescription: editIsPublic ? editExhibitionDescription : null
                })
            })
            if (res.ok) {
                setEditingArtwork(null)
                fetchAlbumDetail(params.id as string)
            }
        } catch (_err) {
            console.error(_err)
        } finally {
            setUpdating(false)
        }
    }

    const handleArchiveArtwork = async () => {
        if (!editingArtwork) return

        setConfirmModal({
            type: 'delete_artwork',
            title: editingArtwork.isSold ? t('parent.confirmArchive') : t('parent.confirmDelete'),
            message: editingArtwork.isSold ? t('parent.confirmArchiveDesc') : t('parent.confirmDeleteDesc'),
            onConfirm: performArchiveArtwork
        })
    }

    const performArchiveArtwork = async () => {
        if (!editingArtwork) return
        setConfirmModal(null)
        try {
            const res = await fetch(`/api/artworks/${editingArtwork.id}`, {
                method: 'DELETE'
            })
            if (res.ok) {
                setEditingArtwork(null)
                fetchAlbumDetail(params.id as string)
            }
        } catch (_err) {
            console.error(_err)
        } finally {
            setUpdating(false)
        }
    }

    const handleUpdateAlbum = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!editAlbumName) return

        setUpdating(true)
        try {
            const res = await fetch(`/api/albums/${params.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: editAlbumName })
            })
            if (res.ok) {
                setEditingAlbumTitle(false)
                fetchAlbumDetail(params.id as string)
            }
        } catch (_err) {
            console.error(_err)
        } finally {
            setUpdating(false)
        }
    }

    const handleDeleteAlbum = async () => {
        if (!album) return

        if (album.artworks.length > 0) {
            setConfirmModal({
                type: 'error',
                title: 'Cannot Delete Album',
                message: 'This album still contains artworks. Please move or delete them first before removing the album.'
            })
            return
        }

        setConfirmModal({
            type: 'delete_album',
            title: 'Delete Album?',
            message: 'Are you sure you want to permanently delete this album? This action cannot be undone.',
            onConfirm: performDeleteAlbum
        })
    }

    const performDeleteAlbum = async () => {
        setConfirmModal(null)
        setUpdating(true)
        try {
            const res = await fetch(`/api/albums/${params.id}`, { method: 'DELETE' })
            if (res.ok) router.push('/gallery')
        } catch (_err) {
            console.error(_err)
        } finally {
            setUpdating(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-dvh flex items-center justify-center bg-[#E2DFD2]">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-slate-400"></div>
            </div>
        )
    }

    if (!album) {
        return (
            <div className="min-h-dvh flex flex-col items-center justify-center bg-[#E2DFD2]">
                <p className="text-xl font-black text-slate-400 uppercase tracking-tighter mb-6">{t('gallery.detail.notFound')}</p>
                <button
                    onClick={() => router.push('/admin/gallery')}
                    className="hardware-btn group"
                >
                    <div className="hardware-well h-12 px-6 rounded-xl flex items-center gap-2 bg-[#DADBD4] shadow-well active:translate-y-0.5">
                        <div className="hardware-cap absolute inset-1 bg-white rounded-lg transition-all shadow-cap group-active:translate-y-0.5" />
                        <span className="label-mono text-[11px] font-black text-slate-500 relative z-10 uppercase tracking-widest">{t('gallery.detail.back')}</span>
                    </div>
                </button>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#D1CDBC] relative flex flex-col font-sans selection:bg-amber-100 selection:text-amber-900 text-slate-900">
            <BausteinAdminNavbar 
                onBack={() => router.push('/admin/gallery')}
                actions={
                    <div className="flex items-center gap-2 md:gap-3">
                        {album.id !== 'archive' && album.id !== 'uncategorized' && (
                            <button
                                onClick={() => {
                                    setEditAlbumName(album.title)
                                    setEditingAlbumTitle(true)
                                }}
                                className="hardware-btn group"
                                title="Edit Album Name"
                            >
                                <div className="hardware-well h-10 md:h-12 px-3 rounded-xl flex items-center bg-[#DADBD4] shadow-well active:translate-y-0.5 relative border-b-2 border-slate-400/20">
                                    <div className="hardware-cap absolute inset-1 bg-white rounded-lg flex items-center justify-center transition-all shadow-cap group-hover:bg-slate-50 active:translate-y-0.5" />
                                    <Edit3 className="w-4 h-4 md:w-5 md:h-5 text-slate-500 relative z-10" />
                                </div>
                            </button>
                        )}
                        <button
                            onClick={() => setShowUploadModal(true)}
                            className="hardware-btn group"
                            title={t('gallery.upload')}
                        >
                            <div className="hardware-well h-10 md:h-12 px-3 md:px-5 rounded-xl flex items-center gap-2 bg-[#DADBD4] shadow-well active:translate-y-0.5 overflow-hidden relative border-b-2 border-slate-400/20">
                                <div className="hardware-cap absolute inset-1 md:inset-1.5 bg-purple-500 rounded-lg flex items-center justify-center transition-all shadow-cap group-hover:bg-purple-600 active:translate-y-0.5" />
                                <Camera className="w-4 h-4 md:w-5 md:h-5 text-white relative z-10" />
                                <span className="hidden md:inline label-mono text-[11px] font-black text-white uppercase tracking-widest relative z-10 drop-shadow-sm">
                                    {t('gallery.upload')}
                                </span>
                            </div>
                        </button>
                    </div>
                }
            />

            <main className="relative z-10 flex-1 overflow-y-auto p-6 md:p-8 pb-32 hide-scrollbar">
                <div className="mb-8 flex items-center gap-4">
                    <div className="hardware-well px-4 py-2 rounded-xl bg-white/40 shadow-inner flex items-center gap-3 border border-white/40 grayscale opacity-60">
                         <ImageIcon className="w-5 h-5 text-slate-500" />
                         <h2 className="label-mono text-[12px] font-black uppercase tracking-[0.2em]">
                             {album.id === 'uncategorized' ? (t('gallery.uncategorized') || 'Uncategorized') : album.title}
                         </h2>
                    </div>
                </div>

                {album.artworks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                        <ImageIcon className="w-16 h-16 mb-4 opacity-30" />
                        <p className="text-xl font-black uppercase tracking-tighter">{t('gallery.detail.empty')}</p>
                        <p className="text-sm font-bold opacity-60 uppercase">{t('gallery.detail.emptySub')}</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-8">
                        {album.artworks.map((art, idx) => (
                            <motion.div
                                key={art.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ 
                                    opacity: 1, 
                                    scale: 1,
                                    transition: { delay: idx * 0.03, duration: 0.3, ease: [0.16, 1, 0.3, 1] }
                                }}
                                className="group relative"
                            >
                                <div className="hardware-well p-2 rounded-xl md:rounded-2xl bg-[#DADBD4]/60 shadow-well border border-black/5 relative group-hover:bg-[#DADBD4]/80 transition-colors">
                                    {/* Image Container Well */}
                                    <div 
                                        className="aspect-square rounded-lg md:rounded-xl bg-[#C8C4B0] overflow-hidden relative cursor-pointer border border-black/5"
                                        onClick={() => setLightboxIndex(idx)}
                                    >
                                        <Image
                                            src={art.thumbnailMedium || art.imageUrl}
                                            alt={art.title}
                                            fill
                                            className="object-cover transition-transform duration-700 group-hover:scale-110"
                                        />

                                        {/* Badges */}
                                        <div className="absolute top-2 left-2 flex flex-col gap-1.5 pointer-events-none">
                                            {art.isPublic && (
                                                <div className="px-1.5 py-1 bg-indigo-500/90 text-white text-[8px] font-black rounded-lg shadow-lg backdrop-blur-md flex items-center gap-1 border border-white/20 uppercase tracking-widest">
                                                    <Fan className="w-2.5 h-2.5 text-white" />
                                                    EXHB
                                                </div>
                                            )}
                                            {art.isFeatured && (
                                                <div className="px-1.5 py-1 bg-amber-500 text-white text-[8px] font-black rounded-lg shadow-xl uppercase tracking-widest flex items-center gap-1 border border-white/20">
                                                    <Star className="w-2.5 h-2.5 fill-white" />
                                                    FEAT
                                                </div>
                                            )}
                                        </div>

                                        {/* Status Overlays */}
                                        {art.isSold && (
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[2px]">
                                                <div className="hardware-well px-4 py-1.5 rounded-full bg-emerald-500 shadow-well border border-emerald-400 rotate-[-12deg]">
                                                    <span className="label-mono text-[10px] font-black text-white uppercase tracking-[0.2em] drop-shadow-sm">{t('gallery.detail.collected')}</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Control Bar */}
                                    <div className="mt-3 flex justify-between items-center px-1">
                                        <div className="flex-1 min-w-0 pr-2">
                                            <h4 className="font-black text-slate-800 text-[11px] md:text-[13px] tracking-tight uppercase truncate">
                                                {art.title}
                                            </h4>
                                            {!art.isSold && (
                                                <div className="flex items-center gap-1.5 grayscale opacity-60">
                                                    <div className="w-1 h-1 rounded-full bg-amber-500" />
                                                    <span className="label-mono text-[9px] font-bold text-slate-500 uppercase tracking-tighter">
                                                        {art.priceCoins ?? 0} COINS
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        
                                        <div className="flex gap-2">
                                            {art.isPublic && !art.isSold && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        setPosterArtwork(art)
                                                    }}
                                                    className="hardware-well w-8 h-8 rounded-lg flex items-center justify-center bg-indigo-50/50 shadow-well-sm border border-indigo-200/50 group/post"
                                                    title={t('gallery.detail.genPoster')}
                                                >
                                                    <Sparkles className="w-3.5 h-3.5 text-indigo-400 group-hover/post:text-indigo-600 transition-colors" />
                                                </button>
                                            )}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    setConfirmModal({
                                                        type: art.isArchived ? 'unarchive_artwork' : 'archive_artwork',
                                                        title: art.isArchived ? t('gallery.unarchive') : t('gallery.archive'),
                                                        message: art.isArchived ? t('gallery.confirmUnarchive') : t('gallery.confirmArchive'),
                                                        onConfirm: async () => {
                                                            try {
                                                                const res = await fetch(`/api/artworks/${art.id}`, {
                                                                    method: 'PUT',
                                                                    headers: { 'Content-Type': 'application/json' },
                                                                    body: JSON.stringify({ 
                                                                        isArchived: !art.isArchived,
                                                                        albumId: art.isArchived ? (availableAlbums.length > 0 ? availableAlbums[0].id : null) : null
                                                                    }),
                                                                })
                                                                if (res.ok) {
                                                                    fetchAlbumDetail(params.id as string)
                                                                    setConfirmModal(null)
                                                                }
                                                            } catch (err) {
                                                                console.error(err)
                                                            }
                                                        }
                                                    })
                                                }}
                                                className="hardware-well w-8 h-8 rounded-lg flex items-center justify-center bg-white/60 shadow-well-sm border border-white/20 group/archive"
                                                title={art.isArchived ? t('gallery.unarchive') : t('gallery.archive')}
                                            >
                                                <Archive className={clsx("w-3.5 h-3.5 transition-colors", art.isArchived ? "text-emerald-400 group-hover/archive:text-emerald-600" : "text-slate-400 group-hover/archive:text-slate-600")} />
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    setEditTitle(art.title)
                                                    setEditPriceCoins(art.priceCoins?.toString() || '0')
                                                    setEditAlbumId(art.isArchived ? 'archive' : (art.albumId || ''))
                                                    setEditIsPublic(art.isPublic || false)
                                                    setEditIsFeatured(art.isFeatured || false)
                                                    setEditExhibitionDescription(art.exhibitionDescription || '')
                                                    setEditingArtwork(art)
                                                }}
                                                className="hardware-well w-8 h-8 rounded-lg flex items-center justify-center bg-white/60 shadow-well-sm border border-white/20 group/edit"
                                            >
                                                <Settings className="w-3.5 h-3.5 text-slate-400 group-hover/edit:text-slate-600 transition-colors" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </main>

            {/* Edit Modal */}
            <AnimatePresence>
                {editingArtwork && (
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
                            className="w-full max-w-md relative"
                        >
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
                                                <div className="hardware-cap absolute inset-1 bg-indigo-500 rounded flex items-center justify-center">
                                                    <Settings className="w-4 h-4 text-white" />
                                                </div>
                                            </div>
                                            {t('gallery.editArtwork')}
                                        </h3>
                                        <button 
                                            onClick={() => setEditingArtwork(null)}
                                            className="hardware-btn group z-50"
                                        >
                                            <div className="hardware-well w-10 h-10 rounded-full bg-[#DADBD4] shadow-well flex items-center justify-center relative overflow-hidden active:translate-y-0.5 transition-all">
                                                <div className="hardware-cap absolute inset-1 bg-white group-hover:bg-rose-50 rounded-full shadow-cap transition-all flex items-center justify-center border border-black/5">
                                                    <XIcon className="w-5 h-5 text-slate-400 group-hover:text-rose-500 transition-colors" />
                                                </div>
                                            </div>
                                        </button>
                                    </div>

                                    <form onSubmit={handleUpdateArtwork} className="flex flex-col gap-6">
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block label-mono text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">{t('gallery.form.titleLabel')}</label>
                                                <div className="hardware-well rounded-xl p-1.5 bg-[#D1CDBC] shadow-well">
                                                    <input
                                                        type="text"
                                                        value={editTitle}
                                                        onChange={e => setEditTitle(e.target.value)}
                                                        className="w-full bg-white/90 px-4 py-3 rounded-lg border-2 border-transparent focus:border-indigo-500 outline-none font-black text-slate-800 text-sm shadow-inner transition-colors"
                                                        required
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block label-mono text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">{t('gallery.form.albumLabel')}</label>
                                                <div className="hardware-well rounded-xl p-1.5 bg-[#D1CDBC] shadow-well">
                                                    <select
                                                        value={editAlbumId}
                                                        onChange={e => setEditAlbumId(e.target.value)}
                                                        className="w-full bg-white/90 px-4 py-3 rounded-lg border-2 border-transparent focus:border-indigo-500 outline-none font-black text-slate-800 text-sm shadow-inner transition-colors appearance-none"
                                                        required
                                                    >
                                                        <option value="archive">{t('gallery.form.archiveOption')}</option>
                                                        {availableAlbums.map(a => (
                                                            <option key={a.id} value={a.id}>{a.title}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4 pt-2">
                                                <div className="hardware-well rounded-xl p-3 bg-white/40 border border-[#C8C4B0]/50 flex items-center justify-between">
                                                    <div className="flex flex-col">
                                                        <span className="label-mono text-[9px] font-black text-slate-500 uppercase tracking-[0.1em]">{t('gallery.form.isPublicLabel')}</span>
                                                        <Sparkles className={clsx("w-3.5 h-3.5 mt-1 transition-colors", editIsPublic ? "text-purple-500" : "text-slate-300")} />
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => setEditIsPublic(!editIsPublic)}
                                                        className={clsx(
                                                            "hardware-well w-11 h-6 rounded-full transition-all relative p-1",
                                                            editIsPublic ? "bg-purple-500/20" : "bg-slate-200"
                                                        )}
                                                    >
                                                        <div className={clsx(
                                                            "w-4 h-4 rounded-full transition-all shadow-cap hardware-cap",
                                                            editIsPublic ? "translate-x-5 bg-purple-500" : "translate-x-0 bg-white"
                                                        )} />
                                                    </button>
                                                </div>

                                                <div className="hardware-well rounded-xl p-3 bg-white/40 border border-[#C8C4B0]/50 flex items-center justify-between">
                                                    <div className="flex flex-col">
                                                        <span className="label-mono text-[9px] font-black text-slate-500 uppercase tracking-[0.1em]">Featured</span>
                                                        <Star className={clsx("w-3.5 h-3.5 mt-1 transition-colors", editIsFeatured ? "text-amber-500" : "text-slate-300")} />
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => setEditIsFeatured(!editIsFeatured)}
                                                        className={clsx(
                                                            "hardware-well w-11 h-6 rounded-full transition-all relative p-1",
                                                            editIsFeatured ? "bg-amber-500/20" : "bg-slate-200"
                                                        )}
                                                    >
                                                        <div className={clsx(
                                                            "w-4 h-4 rounded-full transition-all shadow-cap hardware-cap",
                                                            editIsFeatured ? "translate-x-5 bg-amber-500" : "translate-x-0 bg-white"
                                                        )} />
                                                    </button>
                                                </div>
                                            </div>

                                            {editIsPublic && (
                                                <motion.div
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    className="pt-2"
                                                >
                                                    <label className="block label-mono text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">{t('gallery.form.priceCoinsLabel')}</label>
                                                    <div className="hardware-well rounded-xl p-1.5 bg-[#D1CDBC] shadow-well">
                                                        <input
                                                            type="number"
                                                            value={editPriceCoins}
                                                            onChange={e => setEditPriceCoins(e.target.value)}
                                                            className="w-full bg-white/90 px-4 py-3 rounded-lg border-2 border-transparent focus:border-indigo-500 outline-none font-black text-slate-800 text-sm shadow-inner transition-colors"
                                                            placeholder="0"
                                                        />
                                                    </div>
                                                    <div className="mt-4">
                                                        <label className="block label-mono text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">{t('gallery.form.descriptionLabel')}</label>
                                                        <div className="hardware-well rounded-xl p-1.5 bg-[#D1CDBC] shadow-well">
                                                            <textarea
                                                                value={editExhibitionDescription}
                                                                onChange={e => setEditExhibitionDescription(e.target.value)}
                                                                className="w-full bg-white/90 px-4 py-3 rounded-lg border-2 border-transparent focus:border-indigo-500 outline-none font-black text-slate-800 text-sm shadow-inner transition-colors resize-none h-24"
                                                                placeholder="Write a mini story about this artwork..."
                                                            />
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </div>

                                        <div className="flex gap-4 mt-2">
                                            <button
                                                type="button"
                                                onClick={handleArchiveArtwork}
                                                disabled={updating}
                                                className="hardware-btn group"
                                            >
                                                <div className="hardware-well h-14 w-14 rounded-xl flex items-center justify-center bg-[#DADBD4] shadow-well active:translate-y-0.5">
                                                    <div className="hardware-cap absolute inset-1.5 bg-red-100 rounded-lg flex items-center justify-center transition-all shadow-cap group-hover:bg-red-200 group-active:translate-y-0.5">
                                                        {editingArtwork.isSold ? <Archive className="w-5 h-5 text-red-500" /> : <Trash className="w-5 h-5 text-red-500" />}
                                                    </div>
                                                </div>
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={updating}
                                                className="hardware-btn group flex-1"
                                            >
                                                <div className="hardware-well h-14 w-full rounded-xl flex items-center justify-center bg-[#DADBD4] shadow-well active:translate-y-0.5">
                                                    <div className="hardware-cap absolute inset-1.5 bg-indigo-500 rounded-lg flex items-center justify-center transition-all shadow-cap group-hover:bg-indigo-600 disabled:grayscale group-active:translate-y-0.5">
                                                        <span className="label-mono text-[11px] font-black text-white uppercase tracking-widest">
                                                            {updating ? 'SAVING...' : 'SAVE CHANGES'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Edit Album Modal */}
            <AnimatePresence>
                {editingAlbumTitle && (
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
                            className="w-full max-w-sm relative"
                        >
                            <div className="baustein-panel w-full bg-[#E6E2D1] rounded-[2rem] shadow-2xl relative overflow-hidden border-4 border-[#C8C4B0] flex flex-col">
                                <div className="p-6 md:p-8 flex flex-col">
                                    <div className="flex justify-between items-center mb-6 border-b-2 border-black/5 pb-4">
                                        <h3 className="text-xl font-black text-slate-900 tracking-tighter uppercase flex items-center gap-3">
                                            <div className="hardware-well w-8 h-8 rounded-lg bg-[#DADBD4] shadow-well relative overflow-hidden">
                                                <div className="hardware-cap absolute inset-1 bg-blue-500 rounded flex items-center justify-center">
                                                    <Edit3 className="w-4 h-4 text-white" />
                                                </div>
                                            </div>
                                            Album Config
                                        </h3>
                                        <button 
                                            onClick={() => setEditingAlbumTitle(false)}
                                            className="hardware-well w-8 h-8 rounded-full flex items-center justify-center bg-[#DADBD4] shadow-well hover:bg-slate-200 transition-colors"
                                        >
                                            <XIcon className="w-4 h-4 text-slate-500" />
                                        </button>
                                    </div>

                                    <form onSubmit={handleUpdateAlbum} className="flex flex-col gap-6">
                                        <div>
                                            <label className="block label-mono text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">New Name</label>
                                            <div className="hardware-well rounded-xl p-1.5 bg-[#D1CDBC] shadow-well">
                                                <input
                                                    type="text"
                                                    value={editAlbumName}
                                                    onChange={e => setEditAlbumName(e.target.value)}
                                                    className="w-full bg-white/90 px-4 py-3 rounded-lg border-2 border-transparent focus:border-blue-500 outline-none font-black text-slate-800 text-sm shadow-inner transition-colors"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="flex gap-4">
                                            <button
                                                type="button"
                                                onClick={handleDeleteAlbum}
                                                disabled={updating}
                                                className="hardware-btn group"
                                            >
                                                <div className="hardware-well h-14 w-14 rounded-xl flex items-center justify-center bg-[#DADBD4] shadow-well active:translate-y-0.5">
                                                    <div className="hardware-cap absolute inset-1.5 bg-red-100 rounded-lg flex items-center justify-center transition-all shadow-cap group-hover:bg-red-200">
                                                        <Trash className="w-5 h-5 text-red-500" />
                                                    </div>
                                                </div>
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={updating}
                                                className="hardware-btn group flex-1"
                                            >
                                                <div className="hardware-well h-14 w-full rounded-xl flex items-center justify-center bg-[#DADBD4] shadow-well active:translate-y-0.5">
                                                    <div className="hardware-cap absolute inset-1.5 bg-blue-500 rounded-lg flex items-center justify-center transition-all shadow-cap group-hover:bg-blue-600 disabled:grayscale">
                                                        <span className="label-mono text-[11px] font-black text-white uppercase tracking-widest">
                                                            {updating ? 'SAVING...' : 'SAVE CHANGES'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            {/* Custom Confirmation Modal */}
            <AnimatePresence>
                {confirmModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="w-full max-w-sm relative"
                        >
                            <div className="baustein-panel w-full bg-[#E6E2D1] rounded-[2rem] shadow-2xl relative overflow-hidden border-4 border-white/20 p-8">
                                <div className={clsx(
                                    "w-16 h-16 rounded-2xl flex items-center justify-center mb-6 mx-auto hardware-well shadow-well",
                                    confirmModal.type === 'error' ? 'bg-amber-100 text-amber-600' : 'bg-red-100 text-red-600'
                                )}>
                                    <AlertTriangle className="w-8 h-8" />
                                </div>
                                <h3 className="text-2xl font-black text-center text-slate-900 mb-2 uppercase tracking-tighter">
                                    {confirmModal.title}
                                </h3>
                                <p className="text-center text-slate-500 font-bold text-sm mb-8 leading-relaxed uppercase">
                                    {confirmModal.message}
                                </p>
                                <div className="flex gap-4">
                                    {confirmModal.type !== 'error' && (
                                        <button
                                            onClick={confirmModal.onConfirm}
                                            className="hardware-btn group flex-1"
                                        >
                                            <div className="hardware-well h-14 w-full rounded-xl flex items-center justify-center bg-[#DADBD4] shadow-well active:translate-y-0.5">
                                                <div className="hardware-cap absolute inset-1.5 bg-red-500 rounded-lg flex items-center justify-center transition-all shadow-cap group-hover:bg-red-600">
                                                    <span className="label-mono text-[11px] font-black text-white uppercase tracking-widest">{t('button.apply')}</span>
                                                </div>
                                            </div>
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setConfirmModal(null)}
                                        className="hardware-btn group flex-1"
                                    >
                                        <div className="hardware-well h-14 w-full rounded-xl flex items-center justify-center bg-[#DADBD4] shadow-well active:translate-y-0.5">
                                            <div className="hardware-cap absolute inset-1.5 bg-white rounded-lg flex items-center justify-center transition-all shadow-cap group-hover:bg-slate-50">
                                                <span className="label-mono text-[11px] font-black text-slate-500 uppercase tracking-widest">
                                                    {confirmModal.type === 'error' ? 'OK' : t('button.cancel')}
                                                </span>
                                            </div>
                                        </div>
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Lightbox */}
            <AnimatePresence>
                {lightboxIndex !== null && album.artworks[lightboxIndex] && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[150] bg-black/95 backdrop-blur-md flex flex-col"
                        onClick={() => setLightboxIndex(null)}
                    >
                        {/* Lightbox Header */}
                        <div className="flex items-center justify-between px-6 py-4 relative z-10 bg-gradient-to-b from-black/80 to-transparent">
                            <div className="flex flex-col">
                                <h3 className="text-white font-black text-sm md:text-base uppercase tracking-widest">{album.artworks[lightboxIndex].title}</h3>
                                <p className="text-gray-400 label-mono text-[10px] uppercase font-bold tracking-[0.2em]">{lightboxIndex + 1} / {album.artworks.length}</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        handleDownload(album.artworks[lightboxIndex].imageUrl, album.artworks[lightboxIndex].title)
                                    }}
                                    className="hardware-btn group"
                                    title="Download Original"
                                >
                                    <div className="hardware-well w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center bg-white/20 shadow-well border border-white/10 active:translate-y-0.5">
                                        <div className="hardware-cap absolute inset-1 bg-white/10 rounded-lg group-hover:bg-white/20 flex items-center justify-center shadow-cap">
                                            <Download className="w-5 h-5 text-white" />
                                        </div>
                                    </div>
                                </button>
                                <button
                                    onClick={() => setLightboxIndex(null)}
                                    className="hardware-btn group"
                                >
                                    <div className="hardware-well w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center bg-white/20 shadow-well border border-white/10 active:translate-y-0.5">
                                        <div className="hardware-cap absolute inset-1 bg-white/10 rounded-lg group-hover:bg-white/20 flex items-center justify-center shadow-cap">
                                            <XIcon className="w-5 h-5 text-white" />
                                        </div>
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* Main Image Area */}
                        <div className="flex-1 relative flex items-center justify-center p-4 md:p-10 shrink-0 min-h-0">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation()
                                    prevImage()
                                }}
                                className="absolute left-4 z-10 p-4 bg-white/5 hover:bg-white/10 rounded-full text-white backdrop-blur transition-all border border-white/5"
                            >
                                <ChevronLeft className="w-8 h-8" />
                            </button>

                            <motion.div
                                key={album.artworks[lightboxIndex].id}
                                initial={{ opacity: 0, scale: 0.9, x: 20 }}
                                animate={{ opacity: 1, scale: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.9, x: -20 }}
                                className="relative max-w-full max-h-full flex items-center justify-center shrink-0"
                                onClick={(_e) => e.stopPropagation()}
                            >
                                <Image
                                    src={album.artworks[lightboxIndex].imageUrl}
                                    alt={album.artworks[lightboxIndex].title}
                                    width={1600}
                                    height={1200}
                                    className="max-w-full max-h-full rounded-lg shadow-2xl object-contain border border-white/10"
                                />
                            </motion.div>

                            <button
                                onClick={(e) => {
                                    e.stopPropagation()
                                    nextImage()
                                }}
                                className="absolute right-4 z-10 p-4 bg-white/5 hover:bg-white/10 rounded-full text-white backdrop-blur transition-all border border-white/5"
                            >
                                <ChevronRight className="w-8 h-8" />
                            </button>
                        </div>

                        {/* Thumbnails Strip */}
                        <div className="h-24 px-6 py-2 bg-black/40 flex items-center gap-3 overflow-x-auto hide-scrollbar shrink-0 border-t border-white/5">
                            {album.artworks.map((art, idx) => (
                                <div
                                    key={`thumb-${art.id}`}
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        setLightboxIndex(idx)
                                    }}
                                    className={`relative w-16 h-16 rounded-lg overflow-hidden shrink-0 cursor-pointer transition-all border-2 ${idx === lightboxIndex ? 'border-amber-500 scale-105 shadow-lg' : 'border-transparent opacity-50 hover:opacity-100'}`}
                                >
                                    <Image
                                        src={art.thumbnailMedium || art.imageUrl}
                                        alt={art.title}
                                        fill
                                        className="object-cover transition-transform group-hover:scale-105"
                                    />
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Poster Generator Modal */}
            <AnimatePresence>
                {posterArtwork && (
                    <PosterGenerator
                        artwork={posterArtwork}
                        onClose={() => setPosterArtwork(null)}
                    />
                )}
            </AnimatePresence>

            {/* Upload Modal */}
            <UploadModal
                isOpen={showUploadModal}
                onClose={() => setShowUploadModal(false)}
                onSuccess={() => fetchAlbumDetail(params!.id as string)}
                albums={availableAlbums}
                defaultAlbumId={params!.id as string}
                selectedChildId={selectedChildId}
            />
        </div>
    )
}

