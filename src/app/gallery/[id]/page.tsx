'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'motion/react'
import { ChevronLeft, Image as ImageIcon, Settings, Trash, Archive, Edit3, AlertTriangle, Star, Sparkles, Camera } from 'lucide-react'
import Link from 'next/link'
import AnimatedSky from '@/components/AnimatedSky'
import PosterGenerator from '@/components/PosterGenerator'
import UploadModal from '@/components/gallery/UploadModal'
import { useI18n } from '@/contexts/I18nContext'

type Artwork = {
    id: string
    title: string
    imageUrl: string
    priceRMB: number
    priceCoins: number
    isSold: boolean
    albumId?: string | null
    isArchived?: boolean
    isPublic?: boolean
    creatorNickname?: string | null
    creatorName?: string | null
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
    const [isParent, setIsParent] = useState(false)
    const [showUploadModal, setShowUploadModal] = useState(false)
    const [selectedChildId, setSelectedChildId] = useState<string | null>(null)

    // Edit State
    const [editingArtwork, setEditingArtwork] = useState<Artwork | null>(null)
    const [editTitle, setEditTitle] = useState('')
    const [editPriceRMB, setEditPriceRMB] = useState('')
    const [editPriceCoins, setEditPriceCoins] = useState('')
    const [editAlbumId, setEditAlbumId] = useState('')
    const [editIsPublic, setEditIsPublic] = useState(false)
    const [availableAlbums, setAvailableAlbums] = useState<AvailableAlbum[]>([])
    const [editingAlbumTitle, setEditingAlbumTitle] = useState(false)
    const [editAlbumName, setEditAlbumName] = useState('')
    const [updating, setUpdating] = useState(false)
    const [confirmModal, setConfirmModal] = useState<{
        type: 'delete_artwork' | 'delete_album' | 'error',
        title: string,
        message: string,
        onConfirm?: () => void
    } | null>(null)

    const { t } = useI18n()

    useEffect(() => {
        if (!params?.id) return
        fetchAlbumDetail(params.id as string)

        fetch('/api/stats')
            .then(res => res.json())
            .then(data => {
                const searchParams = new URLSearchParams(window.location.search)
                const targetId = searchParams.get('userId')
                
                if (data.isParent) {
                    setIsParent(true)
                    if (targetId) setSelectedChildId(targetId)
                }

                const albumsUrl = targetId && data.isParent ? `/api/albums?userId=${targetId}` : '/api/albums'
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
        } catch (err) {
            console.error(err)
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
                    isPublic: editIsPublic
                })
            })
            if (res.ok) {
                setEditingArtwork(null)
                fetchAlbumDetail(params.id as string)
            }
        } catch (err) {
            console.error(err)
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
        } catch (err) {
            console.error(err)
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
        } catch (err) {
            console.error(err)
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
        } catch (err) {
            console.error(err)
        } finally {
            setUpdating(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-dvh flex items-center justify-center bg-[#e0f2fe]">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#2c2416]"></div>
            </div>
        )
    }

    if (!album) {
        return (
            <div className="min-h-dvh flex flex-col items-center justify-center bg-[#e0f2fe]">
                <p className="text-xl font-bold mb-4">{t('gallery.detail.notFound')}</p>
                <button
                    onClick={() => router.push('/gallery')}
                    className="px-6 py-2 bg-white/50 backdrop-blur rounded-full font-bold shadow-sm"
                >
                    {t('gallery.detail.back')}
                </button>
            </div>
        )
    }

    return (
        <div className="min-h-dvh flex flex-col relative overflow-hidden bg-[#e0f2fe] text-[#2c2416]">
            <AnimatedSky />

            <header className="relative z-10 flex justify-between items-center px-6 py-4 md:px-10 md:py-6 backdrop-blur-sm bg-white/40 border-b border-white/50 shadow-sm">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.push('/gallery')} className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-2xl bg-white/40 hover:bg-white/60 transition-colors shadow-sm text-slate-800 border border-slate-200">
                        <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
                    </button>
                    <span className="font-extrabold text-xl md:text-2xl tracking-tight text-slate-800 flex items-center gap-2">
                        <ImageIcon className="w-6 h-6 text-indigo-500" />
                        {album.title}
                        {album.id !== 'archive' && (
                            <button
                                onClick={() => {
                                    setEditAlbumName(album.title)
                                    setEditingAlbumTitle(true)
                                }}
                                className="ml-2 p-1.5 rounded-full hover:bg-black/5 text-slate-400 hover:text-slate-700 transition-colors"
                                title="Edit Album Name"
                            >
                                <Edit3 className="w-4 h-4 md:w-5 md:h-5" />
                            </button>
                        )}
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
                </div>
            </header>

            <main className="relative z-10 flex-1 overflow-y-auto p-6 md:p-12 pb-24 hide-scrollbar">
                {album.artworks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-white/80">
                        <ImageIcon className="w-16 h-16 mb-4 opacity-50" />
                        <p className="text-xl font-bold">{t('gallery.detail.empty')}</p>
                        <p className="text-sm">{t('gallery.detail.emptySub')}</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {album.artworks.map((art, idx) => (
                            <motion.div
                                key={art.id}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: idx * 0.05, type: 'spring' }}
                                className="group relative rounded-2xl overflow-hidden shadow-lg bg-white/60 backdrop-blur-md border border-white/50 aspect-square cursor-pointer"
                            >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={art.imageUrl} alt={art.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />

                                {art.isPublic && (
                                    <div className="absolute top-2 left-2 px-2 py-1 bg-indigo-500/90 text-white text-[10px] font-black rounded-lg shadow-lg backdrop-blur-md z-10 flex items-center gap-1 border border-white/20">
                                        <Sparkles className="w-3 h-3 text-amber-300 fill-amber-300" />
                                        {t('gallery.detail.exhibitionBadge')}
                                    </div>
                                )}

                                <div className={`absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent ${art.isSold ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity duration-300 flex flex-col justify-end p-4`}>
                                    <h4 className="text-white font-bold text-lg">{art.title}</h4>

                                    {art.isSold ? (
                                        <div className="mt-4 flex items-center justify-between">
                                            <span className="text-gray-300 text-sm font-bold"></span>
                                            <span className="text-green-400 font-bold uppercase tracking-widest bg-green-500/20 px-3 py-1 rounded-full text-sm">{t('gallery.detail.collected')}</span>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex justify-between items-center mt-2">
                                                <span className="text-amber-400 text-sm font-bold">{art.priceCoins ?? 0} {t('hud.coins')}</span>
                                            </div>
                                            {art.isPublic && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        setPosterArtwork(art)
                                                    }}
                                                    className="mt-4 w-full py-2 bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-700 rounded-lg backdrop-blur font-bold transition-colors border border-indigo-200/50"
                                                >
                                                    {t('gallery.detail.genPoster')}
                                                </button>
                                            )}
                                        </>
                                    )}

                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            setEditTitle(art.title)
                                            setEditPriceRMB(art.priceRMB.toString())
                                            setEditPriceCoins(art.priceCoins.toString())
                                            setEditAlbumId(art.albumId || 'archive')
                                            setEditIsPublic(art.isPublic || false)
                                            setEditingArtwork(art)
                                        }}
                                        className="absolute top-2 right-2 p-2 bg-white/40 hover:bg-white/60 backdrop-blur rounded-full text-slate-800 transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                        <Settings className="w-5 h-5" />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </main>

            {/* Edit Modal */}
            {editingArtwork && (
                <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
                    >
                        <div className="p-5 border-b border-[#f5f0e8] flex justify-between items-center bg-[#faf7f0]">
                            <h3 className="text-xl font-bold flex items-center gap-2"><Settings className="w-5 h-5 text-indigo-500" /> Edit Artwork</h3>
                            <button onClick={() => setEditingArtwork(null)} className="text-[#a89880] hover:text-[#2c2416] font-bold text-xl">&times;</button>
                        </div>
                        <div className="overflow-y-auto hide-scrollbar">
                            <form onSubmit={handleUpdateArtwork} className="p-5 flex flex-col gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-[#6b5c45] mb-1">Title</label>
                                    <input
                                        type="text"
                                        value={editTitle}
                                        onChange={e => setEditTitle(e.target.value)}
                                        className="w-full bg-[#f5f0e8] border-none rounded-xl p-3 focus:ring-2 focus:ring-indigo-400 outline-none"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-[#6b5c45] mb-1">Album</label>
                                    <select
                                        value={editAlbumId}
                                        onChange={e => setEditAlbumId(e.target.value)}
                                        className="w-full bg-[#f5f0e8] border-none rounded-xl p-3 focus:ring-2 focus:ring-indigo-400 outline-none"
                                        required
                                    >
                                        <option value="archive">Archives (Hidden from public)</option>
                                        {availableAlbums.map(a => (
                                            <option key={a.id} value={a.id}>{a.title}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="flex items-center justify-between p-4 bg-purple-50 rounded-2xl border border-purple-100">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-xl ${editIsPublic ? 'bg-purple-500 text-white' : 'bg-slate-200 text-slate-400'} transition-colors`}>
                                            <Sparkles className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700">{t('gallery.form.isPublicLabel')}</label>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Show on exhibition</p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setEditIsPublic(!editIsPublic)}
                                        className={`w-12 h-6 rounded-full transition-all relative ${editIsPublic ? 'bg-purple-500 shadow-md ring-4 ring-purple-100' : 'bg-slate-200'}`}
                                    >
                                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${editIsPublic ? 'left-7' : 'left-1'}`} />
                                    </button>
                                </div>

                                {editIsPublic && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        className="overflow-hidden"
                                    >
                                        <label className="block text-sm font-bold text-[#6b5c45] mb-1">{t('gallery.form.priceCoinsLabel')}</label>
                                        <input
                                            type="number"
                                            value={editPriceCoins}
                                            onChange={e => setEditPriceCoins(e.target.value)}
                                            className="w-full bg-[#f5f0e8] border-none rounded-xl p-3 focus:ring-2 focus:ring-purple-400 outline-none"
                                            placeholder="0"
                                        />
                                    </motion.div>
                                )}
                                <div className="flex gap-3 mt-2">
                                    <button
                                        type="button"
                                        onClick={handleArchiveArtwork}
                                        disabled={updating}
                                        className="flex items-center justify-center gap-2 p-3 rounded-xl bg-red-100 text-red-600 hover:bg-red-200 font-bold transition-colors w-14 shrink-0"
                                        title={editingArtwork.isSold ? 'Archive' : 'Delete'}
                                    >
                                        {editingArtwork.isSold ? <Archive className="w-5 h-5" /> : <Trash className="w-5 h-5" />}
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={updating}
                                        className="flex-1 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-blue-500 text-white font-bold tracking-wide shadow-lg opacity-90 hover:opacity-100 transition-opacity disabled:grayscale"
                                    >
                                        {updating ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                </div>
            )}
            {/* Edit Album Modal */}
            {editingAlbumTitle && (
                <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
                    >
                        <div className="p-5 border-b border-[#f5f0e8] flex justify-between items-center bg-[#faf7f0]">
                            <h3 className="text-xl font-bold flex items-center gap-2"><Edit3 className="w-5 h-5 text-indigo-500" /> Edit Album Name</h3>
                            <button onClick={() => setEditingAlbumTitle(false)} className="text-[#a89880] hover:text-[#2c2416] font-bold text-xl">&times;</button>
                        </div>
                        <form onSubmit={handleUpdateAlbum} className="p-5 flex flex-col gap-4">
                            <div>
                                <label className="block text-sm font-bold text-[#6b5c45] mb-1">New Name</label>
                                <input
                                    type="text"
                                    value={editAlbumName}
                                    onChange={e => setEditAlbumName(e.target.value)}
                                    className="w-full bg-[#f5f0e8] border-none rounded-xl p-3 focus:ring-2 focus:ring-indigo-400 outline-none"
                                    required
                                />
                            </div>
                            <div className="flex gap-3 mt-2">
                                <button
                                    type="button"
                                    onClick={handleDeleteAlbum}
                                    disabled={updating}
                                    className="px-4 py-3 rounded-xl bg-red-100 text-red-600 hover:bg-red-200 font-bold transition-colors"
                                >
                                    <Trash className="w-5 h-5" />
                                </button>
                                <button
                                    type="submit"
                                    disabled={updating}
                                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-blue-500 text-white font-bold tracking-wide shadow-lg opacity-90 hover:opacity-100 transition-opacity disabled:grayscale"
                                >
                                    {updating ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
            {/* Custom Confirmation Modal */}
            <AnimatePresence>
                {confirmModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-8 border border-slate-100"
                        >
                            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 mx-auto ${confirmModal.type === 'error' ? 'bg-amber-100 text-amber-600' : 'bg-rose-100 text-rose-600'}`}>
                                <AlertTriangle className="w-8 h-8" />
                            </div>
                            <h3 className="text-2xl font-black text-center text-slate-800 mb-2">
                                {confirmModal.title}
                            </h3>
                            <p className="text-center text-slate-500 font-medium mb-8">
                                {confirmModal.message}
                            </p>
                            <div className="flex gap-3">
                                {confirmModal.type !== 'error' && (
                                    <button
                                        onClick={confirmModal.onConfirm}
                                        className="flex-1 py-4 bg-rose-500 text-white rounded-2xl font-black hover:bg-rose-600 transition-all shadow-lg shadow-rose-200 active:scale-95"
                                    >
                                        {t('button.apply')}
                                    </button>
                                )}
                                <button
                                    onClick={() => setConfirmModal(null)}
                                    className={`flex-1 py-4 rounded-2xl font-bold transition-all ${confirmModal.type === 'error' ? 'bg-slate-800 text-white hover:bg-black' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                                >
                                    {confirmModal.type === 'error' ? 'Understood' : t('button.cancel')}
                                </button>
                            </div>
                        </motion.div>
                    </div>
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
