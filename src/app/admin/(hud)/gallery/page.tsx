'use client'

import { BausteinAdminNavbar } from '@/components/BausteinAdminNavbar'
import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Plus, Camera, Image as ImageIcon, Archive, MessageSquare, X as XIcon, Edit3, Save, Fan } from 'lucide-react'
import { useRouter } from 'next/navigation'
import UploadModal from '@/components/gallery/UploadModal'
import { useI18n } from '@/contexts/I18nContext'
import Image from 'next/image'
import { clsx } from 'clsx'

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
    totalArtworks?: number
}

export default function GalleryPage() {
    const [albums, setAlbums] = useState<Album[]>([])
    const [loading, setLoading] = useState(true)
    const [showUploadModal, setShowUploadModal] = useState(false)
    const { t } = useI18n()

    const [newAlbumName, setNewAlbumName] = useState('')
    const [showNewAlbumModal, setShowNewAlbumModal] = useState(false)
    const [editingAlbumId, setEditingAlbumId] = useState<string | null>(null)
    const [, setIsAdmin] = useState(false)
    const [selectedChildId] = useState<string | null>(null)

    const router = useRouter()

    useEffect(() => {
        fetch('/api/stats')
            .then(res => res.json())
            .then(data => {
                setIsAdmin(data.isAdmin)
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
        } catch (_err) {
            console.error(_err)
        } finally {
            setLoading(false)
        }
    }

    const handleCreateOrUpdateAlbum = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newAlbumName) return

        try {
            const isEditing = !!editingAlbumId
            const url = isEditing ? `/api/albums/${editingAlbumId}` : '/api/albums'
            const method = isEditing ? 'PUT' : 'POST'
            
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: newAlbumName, targetUserId: selectedChildId }),
            })
            if (res.ok) {
                setShowNewAlbumModal(false)
                setNewAlbumName('')
                setEditingAlbumId(null)
                fetchAlbums(selectedChildId)
            }
        } catch (_err) {
            console.error(_err)
        }
    }

    const handleOpenEditModal = (e: React.MouseEvent, alb: Album) => {
        e.stopPropagation()
        setEditingAlbumId(alb.id)
        setNewAlbumName(alb.title)
        setShowNewAlbumModal(true)
    }

    const handleOpenCreateModal = () => {
        setEditingAlbumId(null)
        setNewAlbumName('')
        setShowNewAlbumModal(true)
    }

    return (
        <div className="min-h-screen bg-[#D1CDBC] relative flex flex-col font-sans selection:bg-amber-100 selection:text-amber-900 text-slate-900">
            <BausteinAdminNavbar 
                onBack={() => router.push('/admin')}
                actions={
                    <div className="flex items-center gap-2 md:gap-3">
                        <button
                            onClick={handleOpenCreateModal}
                            className="hardware-btn group"
                        >
                            <div className="hardware-well h-10 md:h-12 px-3 md:px-5 rounded-xl flex items-center gap-2 bg-[#DADBD4] shadow-well active:translate-y-0.5 overflow-hidden relative border-b-2 border-slate-400/20">
                                <div className="hardware-cap absolute inset-1 md:inset-1.5 bg-blue-500 rounded-lg flex items-center justify-center transition-all shadow-cap group-hover:bg-blue-600 active:translate-y-0.5" />
                                <Plus className="w-4 h-4 md:w-5 md:h-5 text-white relative z-10" />
                                <span className="hidden lg:inline label-mono text-[11px] font-black text-white uppercase tracking-widest relative z-10 drop-shadow-sm">
                                    {t('gallery.newAlbum')}
                                </span>
                            </div>
                        </button>
                        
                        <button
                            onClick={() => setShowUploadModal(true)}
                            className="hardware-btn group"
                        >
                            <div className="hardware-well h-10 md:h-12 px-3 md:px-5 rounded-xl flex items-center gap-2 bg-[#DADBD4] shadow-well active:translate-y-0.5 overflow-hidden relative border-b-2 border-slate-400/20">
                                <div className="hardware-cap absolute inset-1 md:inset-1.5 bg-indigo-500 rounded-lg flex items-center justify-center transition-all shadow-cap group-hover:bg-indigo-600 active:translate-y-0.5" />
                                <Camera className="w-4 h-4 md:w-5 md:h-5 text-white relative z-10" />
                                <span className="hidden lg:inline label-mono text-[11px] font-black text-white uppercase tracking-widest relative z-10 drop-shadow-sm">
                                    {t('gallery.upload')}
                                </span>
                            </div>
                        </button>

                        <div className="h-8 w-px bg-slate-900/10 mx-1 md:mx-2 hidden md:block" />

                        <button
                            onClick={() => router.push('/admin/gallery/exhibition')}
                            className="hardware-btn group"
                            title={t('gallery.exhibition')}
                        >
                            <div className="hardware-well h-10 md:h-12 px-3 md:px-5 rounded-xl flex items-center gap-2 bg-[#DADBD4] shadow-well active:translate-y-0.5 overflow-hidden relative border-b-2 border-slate-400/20">
                                <div className="hardware-cap absolute inset-1 md:inset-1.5 bg-amber-500 rounded-lg flex items-center justify-center transition-all shadow-cap group-hover:bg-amber-600 active:translate-y-0.5" />
                                <Fan className="w-4 h-4 md:w-5 md:h-5 text-white relative z-10" />
                                <span className="hidden lg:inline label-mono text-[11px] font-black text-white uppercase tracking-widest relative z-10 drop-shadow-sm">
                                    Exhibition
                                </span>
                            </div>
                        </button>

                        <button
                            onClick={() => router.push('/admin/gallery/messages')}
                            className="hardware-btn group"
                            title={t('gallery.messages')}
                        >
                            <div className="hardware-well h-10 md:h-12 px-3 md:px-5 rounded-xl flex items-center gap-2 bg-[#DADBD4] shadow-well active:translate-y-0.5 overflow-hidden relative border-b-2 border-slate-400/20">
                                <div className="hardware-cap absolute inset-1 md:inset-1.5 bg-emerald-500 rounded-lg flex items-center justify-center transition-all shadow-cap group-hover:bg-emerald-600 active:translate-y-0.5" />
                                <MessageSquare className="w-4 h-4 md:w-5 md:h-5 text-white relative z-10" />
                                <span className="hidden lg:inline label-mono text-[11px] font-black text-white uppercase tracking-widest relative z-10 drop-shadow-sm">
                                    Signals
                                </span>
                            </div>
                        </button>

                        <button
                            onClick={() => router.push('/admin/gallery/archive')}
                            className="hardware-btn group"
                            title={t('gallery.archives')}
                        >
                            <div className="hardware-well h-10 md:h-12 px-3 md:px-5 rounded-xl flex items-center gap-2 bg-[#DADBD4] shadow-well active:translate-y-0.5 overflow-hidden relative border-b-2 border-slate-400/20">
                                <div className="hardware-cap absolute inset-1 md:inset-1.5 bg-slate-200 rounded-lg flex items-center justify-center transition-all shadow-cap group-hover:bg-white active:translate-y-0.5" />
                                <Archive className="w-4 h-4 md:w-5 md:h-5 text-slate-500 relative z-10" />
                            </div>
                        </button>
                    </div>
                }
            />

            <main className="relative z-10 flex-1 overflow-y-auto p-6 md:p-8 pb-24 hide-scrollbar">
                {loading ? (
                    <div className="flex justify-center items-center h-48">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-slate-400"></div>
                    </div>
                ) : albums.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 text-slate-500">
                        <ImageIcon className="w-16 h-16 mb-4 opacity-50" />
                        <p className="text-xl font-bold">{t('gallery.noAlbums')}</p>
                        <p className="text-sm">{t('gallery.noAlbumsSub')}</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-12">
                        {albums.map((album, idx) => (
                            <motion.div
                                key={album.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ 
                                    opacity: 1, 
                                    y: 0,
                                    transition: { delay: idx * 0.05, duration: 0.4, ease: [0.16, 1, 0.3, 1] }
                                }}
                                onClick={() => router.push(`/admin/gallery/${album.id}`)}
                                className="group cursor-pointer flex flex-col"
                            >
                                <div className="hardware-well p-3 rounded-2xl bg-[#DADBD4]/60 shadow-well border border-black/5 relative group-hover:bg-[#DADBD4]/80 transition-colors">
                                    <div className="aspect-[3/2] rounded-xl bg-[#C8C4B0] overflow-hidden relative border border-black/5">
                                        {album.artworks.length === 0 ? (
                                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-200/50 backdrop-blur-sm px-4 text-center">
                                                <ImageIcon className="w-10 h-10 text-slate-400 mb-2 opacity-30" />
                                                <span className="text-slate-400 font-bold label-mono text-[10px] uppercase tracking-widest">{t('gallery.empty')}</span>
                                            </div>
                                        ) : (
                                            <div className="absolute inset-0 flex items-center justify-center perspective-1000">
                                                {album.artworks.slice(0, 3).map((art, artIdx) => (
                                                    <motion.div
                                                        key={art.id}
                                                        className="absolute w-[85%] h-[85%] rounded-lg border-2 border-white/80 shadow-xl overflow-hidden"
                                                        style={{
                                                            zIndex: 10 - artIdx,
                                                            transform: `rotate(${artIdx * 6 - 3}deg) translateY(${artIdx * 4}px)`,
                                                        }}
                                                        whileHover={{ scale: 1.05, rotate: 0, transition: { duration: 0.2 } }}
                                                    >
                                                        <Image 
                                                            src={art.thumbnailMedium || art.imageUrl} 
                                                            alt={art.title} 
                                                            fill
                                                            className="object-cover transition-transform group-hover:scale-110 duration-500" 
                                                        />
                                                    </motion.div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-4 flex justify-between items-end">
                                        <div className="flex flex-col gap-1 flex-1 min-w-0 pr-2">
                                            <h3 className="font-black text-slate-900 text-sm md:text-base tracking-tighter uppercase leading-tight truncate">
                                                {album.id === 'uncategorized' ? (t('gallery.uncategorized') || 'Uncategorized') : album.title}
                                            </h3>
                                            <div className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                <span className="label-mono text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-none">
                                                    {t('gallery.artworksCount', { count: String(album.totalArtworks || album.artworks.length) })}
                                                </span>
                                            </div>
                                        </div>
                                        
                                        {/* Actions Group */}
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={(e) => handleOpenEditModal(e, album)}
                                                className="hardware-btn group/edit"
                                                title={t('common.edit')}
                                            >
                                                <div className="hardware-well w-8 h-8 rounded-lg bg-[#DADBD4] shadow-well active:translate-y-0.5 transition-all flex items-center justify-center p-0.5 relative">
                                                    <div className="hardware-cap absolute inset-0.5 bg-amber-500 rounded-md flex items-center justify-center transition-all shadow-cap group-hover/edit:bg-amber-600">
                                                        <Edit3 className="w-3.5 h-3.5 text-white" />
                                                    </div>
                                                </div>
                                            </button>
                                            <div className="hardware-well w-8 h-8 rounded-lg flex items-center justify-center bg-white/60 shadow-well-sm border border-white/20">
                                                <div className="hardware-cap absolute inset-0.5 bg-white rounded-md shadow-cap" />
                                                <Plus className="w-3 h-3 text-slate-400 relative z-10" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </main>

            <UploadModal
                isOpen={showUploadModal}
                onClose={() => setShowUploadModal(false)}
                onSuccess={() => fetchAlbums(selectedChildId)}
                albums={albums}
                selectedChildId={selectedChildId}
            />

            <AnimatePresence>
                {showNewAlbumModal && (
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
                                <div className="absolute top-3 left-3 w-2 h-2 rounded-full bg-slate-900/10 shadow-inner" />
                                <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-slate-900/10 shadow-inner" />
                                <div className="absolute bottom-3 left-3 w-2 h-2 rounded-full bg-slate-900/10 shadow-inner" />
                                <div className="absolute bottom-3 right-3 w-2 h-2 rounded-full bg-slate-900/10 shadow-inner" />

                                <div className="p-6 md:p-8 flex flex-col">
                                    <div className="flex justify-between items-center mb-6 border-b-2 border-black/5 pb-4">
                                        <h3 className="text-xl font-black text-slate-900 tracking-tighter uppercase flex items-center gap-3">
                                            <div className="hardware-well w-8 h-8 rounded-lg bg-[#DADBD4] shadow-well relative overflow-hidden">
                                                <div className={clsx("hardware-cap absolute inset-1 rounded flex items-center justify-center", editingAlbumId ? "bg-amber-500" : "bg-blue-500")}>
                                                    {editingAlbumId ? <Edit3 className="w-4 h-4 text-white" /> : <Plus className="w-4 h-4 text-white" />}
                                                </div>
                                            </div>
                                            {editingAlbumId ? t('gallery.editAlbum') : t('gallery.newAlbum')}
                                        </h3>
                                        <button 
                                            onClick={() => setShowNewAlbumModal(false)}
                                            className="hardware-btn group z-50"
                                        >
                                            <div className="hardware-well w-10 h-10 rounded-full bg-[#DADBD4] shadow-well flex items-center justify-center relative overflow-hidden active:translate-y-0.5 transition-all">
                                                <div className="hardware-cap absolute inset-1 bg-white group-hover:bg-rose-50 rounded-full shadow-cap transition-all flex items-center justify-center border border-black/5">
                                                    <XIcon className="w-5 h-5 text-slate-400 group-hover:text-rose-500 transition-colors" />
                                                </div>
                                            </div>
                                        </button>
                                    </div>

                                    <form onSubmit={handleCreateOrUpdateAlbum} className="flex flex-col gap-6">
                                        <div>
                                            <label className="block label-mono text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                                                {t('gallery.albumTitleLabel')}
                                            </label>
                                            <div className="hardware-well rounded-2xl p-2 bg-[#D1CDBC] shadow-well">
                                                <input
                                                    type="text"
                                                    value={newAlbumName}
                                                    onChange={e => setNewAlbumName(e.target.value)}
                                                    className="w-full bg-white/90 px-5 py-4 rounded-xl border-2 border-transparent focus:border-amber-500 outline-none font-black text-slate-800 text-base shadow-inner transition-colors"
                                                    placeholder="ALBUM_TITLE_01"
                                                    autoFocus
                                                />
                                            </div>
                                        </div>

                                        <button
                                            type="submit"
                                            className="hardware-btn group w-full"
                                        >
                                            <div className="hardware-well h-14 w-full px-8 rounded-xl flex items-center justify-center bg-[#DADBD4] shadow-well active:translate-y-0.5 relative">
                                                <div className={clsx("hardware-cap absolute inset-1.5 rounded-lg flex items-center justify-center transition-all shadow-cap group-hover:opacity-90 active:translate-y-0.5", editingAlbumId ? "bg-amber-500" : "bg-blue-500")} />
                                                <span className="label-mono text-[11px] font-black text-white uppercase tracking-widest relative z-10 flex items-center gap-2">
                                                    {editingAlbumId ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                                                    {editingAlbumId ? t('gallery.updateIdentity') : t('common.confirm')}
                                                </span>
                                            </div>
                                        </button>
                                    </form>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
