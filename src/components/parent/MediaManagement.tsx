'use client'

import React, { useState, useEffect } from 'react'
import {
    ImageIcon, Music, Video,
    FileText, Trash2, Edit3, Search,
    Loader2, X, Check, ExternalLink, HardDrive, Cloud
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useI18n } from '@/contexts/I18nContext'
import Image from 'next/image'
import { clsx } from 'clsx'

type MediaRecord = {
    id: string
    name: string
    fileName: string
    fileType: 'IMAGE' | 'VOICE' | 'VIDEO' | 'DOC' | 'GALLERY'
    mimeType: string
    size: number
    storageProvider: 'LOCAL' | 'R2'
    path: string
    createdAt: string
}

const TYPE_FILTERS = [
    { label: 'parent.media.filter.all', value: 'ALL' },
    { label: 'parent.media.filter.images', value: 'IMAGE' },
    { label: 'parent.media.filter.voices', value: 'VOICE' },
    { label: 'parent.media.filter.videos', value: 'VIDEO' },
    { label: 'parent.media.filter.docs', value: 'DOC' },
    { label: 'parent.media.filter.gallery', value: 'GALLERY' },
]

export default function MediaManagement() {
    const { t } = useI18n()
    const [media, setMedia] = useState<MediaRecord[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('ALL')
    const [search, setSearch] = useState('')

    // Edit State
    const [editing, setEditing] = useState<string | null>(null)
    const [editName, setEditName] = useState('')

    const fetchMedia = React.useCallback(async () => {
        setLoading(true)
        try {
            const res = await fetch(`/api/media?type=${filter}&search=${search}`)
            if (res.ok) {
                const data = await res.json()
                setMedia(data)
            }
        } catch (_err) {
            console.error('Failed to fetch media:', _err)
        } finally {
            setLoading(false)
        }
    }, [filter, search])

    useEffect(() => {
        fetchMedia()
    }, [fetchMedia])

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        fetchMedia()
    }

    const handleDelete = async (id: string) => {
        if (!confirm(t('parent.media.deleteConfirm'))) return

        try {
            const res = await fetch(`/api/media/${id}`, { method: 'DELETE' })
            if (res.ok) {
                setMedia(media.filter(m => m.id !== id))
            }
        } catch (_err) {
            console.error(_err)
        }
    }

    const handleRename = async (id: string) => {
        try {
            const res = await fetch(`/api/media/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: editName })
            })
            if (res.ok) {
                setEditing(null)
                fetchMedia()
            }
        } catch (_err) {
            console.error(_err)
        }
    }

    const getIcon = (type: string) => {
        switch (type) {
            case 'IMAGE': return <ImageIcon className="w-5 h-5" />
            case 'VOICE': return <Music className="w-5 h-5" />
            case 'VIDEO': return <Video className="w-5 h-5" />
            case 'GALLERY': return <ImageIcon className="w-5 h-5 text-amber-500" />
            default: return <FileText className="w-5 h-5" />
        }
    }

    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 B'
        const k = 1024
        const sizes = ['B', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    return (
        <div className="space-y-6 pb-10">
            {/* HUD container - Main body gap */}
            <div className="flex flex-col gap-6">

                {/* Toolbar Module - Taxonomy & Retrieval Matrix */}
                <div className="flex flex-col lg:flex-row gap-6">
                    <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar lg:flex-1">
                        {TYPE_FILTERS.map(f => (
                            <button
                                key={f.value}
                                onClick={() => setFilter(f.value)}
                                className={clsx(
                                    "px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border-2 flex-shrink-0 label-mono",
                                    filter === f.value
                                        ? "bg-slate-900 text-white border-slate-800 shadow-lg"
                                        : "bg-white text-slate-400 border-white/40 hover:bg-white transition-colors"
                                )}
                            >
                                {t(f.label)}
                            </button>
                        ))}
                    </div>

                    <form onSubmit={handleSearch} className="lg:w-[300px] group">
                        <div className="hardware-well rounded-xl p-0.5 bg-[#D1CDBC] shadow-well transition-all group-focus-within:bg-[#C8C4B0]">
                            <div className="relative flex items-center bg-white/95 rounded-lg border border-black/5 overflow-hidden shadow-inner">
                                <input
                                    type="text"
                                    placeholder={t('parent.media.search')}
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full pl-4 pr-3 py-1.5 bg-transparent outline-none font-black text-slate-800 text-[10px] placeholder:text-slate-200 transition-all uppercase tracking-tight label-mono"
                                />
                                <button type="submit" className="w-8 h-8 flex items-center justify-center bg-slate-900 text-white m-0.5 rounded-md hover:bg-slate-800 transition-colors label-mono flex-shrink-0">
                                    <Search className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>

            {/* Media Matrix - Item Grid */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-32 baustein-panel bg-[#DADBD4]/30 rounded-[2.5rem] border-4 border-dashed border-[#C8C4B0]">
                    <div className="hardware-well w-16 h-16 rounded-full flex items-center justify-center bg-[#D1CDBC] mb-4 animate-pulse">
                        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] label-mono italic">{t('parent.media.scanning')}</p>
                </div>
            ) : media.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 bg-[#E2DFD2] rounded-[2.5rem] border border-black/5 shadow-well text-slate-300 gap-4">
                    <HardDrive className="w-12 h-12 opacity-10" />
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] label-mono opacity-40">{t('parent.media.noFiles')}</span>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 md:gap-10">
                    <AnimatePresence mode="popLayout">
                        {media.map((item, idx) => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ delay: idx * 0.03, duration: 0.4 }}
                                className="group flex flex-col gap-4"
                            >
                                {/* Media Housing */}
                                <div className="hardware-well p-2 rounded-2xl bg-[#DADBD4] shadow-well relative">
                                    <div className="aspect-square bg-slate-100 rounded-2xl overflow-hidden relative border-2 border-white/40 shadow-sm transition-all group-hover:scale-[0.98]">
                                        {item.fileType === 'IMAGE' || item.fileType === 'GALLERY' ? (
                                            <Image src={item.path} alt={item.name} fill className="object-cover transition-transform duration-1000 group-hover:scale-110" />
                                        ) : (
                                            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/5 group-hover:bg-slate-900/10 transition-colors">
                                                <div className="hardware-well w-16 h-16 rounded-full flex items-center justify-center bg-[#DADBD4] shadow-well">
                                                    {getIcon(item.fileType)}
                                                </div>
                                            </div>
                                        )}


                                        {/* Provider Telemetry */}
                                        <div className="absolute bottom-2 left-2 flex items-center gap-1.5 bg-black/40 backdrop-blur-md rounded-md px-2 py-1 border border-white/10 shadow-lg">
                                            {item.storageProvider === 'R2' ? <Cloud className="w-3 h-3 text-sky-300" /> : <HardDrive className="w-3 h-3 text-emerald-300" />}
                                            <span className="text-[7px] font-black text-white uppercase tracking-[0.2em] label-mono">{item.storageProvider}</span>
                                        </div>
                                    </div>
                                    
                                    {/* Physical Stand Decoration */}
                                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-[80%] h-3 bg-gradient-to-b from-[#C8C4B0] to-[#A09D8B] rounded-full z-[-1] shadow-lg opacity-60" />
                                </div>

                                {/* Information Matrix */}
                                <div className="flex flex-col gap-1 px-1">
                                    {editing === item.id ? (
                                        <div className="flex gap-1.5 items-center">
                                            <div className="hardware-well flex-1 rounded-lg p-0.5 bg-[#D1CDBC] shadow-well">
                                                <input
                                                    autoFocus
                                                    value={editName}
                                                    onChange={e => setEditName(e.target.value)}
                                                    className="w-full bg-white px-2 py-1.5 rounded-md border border-black/5 outline-none font-black text-slate-800 text-[10px] uppercase shadow-inner italic"
                                                />
                                            </div>
                                            <button onClick={() => handleRename(item.id)} className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white shadow-sm active:scale-95"><Check className="w-3.5 h-3.5" /></button>
                                            <button onClick={() => setEditing(null)} className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white shadow-sm active:scale-95"><X className="w-3.5 h-3.5" /></button>
                                        </div>
                                    ) : (
                                        <div className="flex items-start justify-between gap-1 group-item">
                                            <h3 className="text-[11px] font-black text-slate-800 uppercase italic tracking-tight line-clamp-1 break-all flex-1 label-mono py-0.5">{item.name}</h3>
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between mt-1 pb-1 border-t border-black/[0.03] pt-1.5">
                                        <div className="flex items-center gap-1.5 min-w-0">
                                            <span className="text-[9px] font-black text-slate-800 label-mono uppercase tracking-tighter">{formatSize(item.size)}</span>
                                            <span className="text-[9px] font-black text-slate-400 label-mono italic opacity-40 truncate">/ {item.mimeType.split('/').pop()}</span>
                                        </div>
                                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest label-mono font-number whitespace-nowrap">
                                            {new Date(item.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>

                                    {/* Action Module - Consolidated High Density Triggers */}
                                    <div className="flex gap-1.5">
                                        <a href={item.path} target="_blank" rel="noreferrer" className="hardware-btn group flex-1">
                                            <div className="hardware-well h-9 rounded-xl bg-[#DADBD4] shadow-well flex items-center justify-center active:translate-y-0.5 transition-all relative overflow-hidden">
                                                <div className="hardware-cap absolute inset-0.5 bg-white lg:group-hover:bg-slate-900 rounded-lg shadow-cap transition-colors flex items-center justify-center gap-1.5">
                                                    <ExternalLink className="w-3.5 h-3.5 text-slate-600 lg:group-hover:text-white transition-colors" />
                                                    <span className="text-[8px] font-black uppercase tracking-tighter text-slate-400 lg:group-hover:text-white label-mono transition-colors">{t('button.view')}</span>
                                                </div>
                                            </div>
                                        </a>
                                        <button 
                                            onClick={() => {
                                                setEditing(item.id)
                                                setEditName(item.name)
                                            }}
                                            className="hardware-btn group flex-1"
                                        >
                                            <div className="hardware-well h-9 rounded-xl bg-[#DADBD4] shadow-well flex items-center justify-center active:translate-y-0.5 transition-all relative overflow-hidden">
                                                <div className="hardware-cap absolute inset-0.5 bg-white lg:group-hover:bg-amber-500 rounded-lg shadow-cap transition-colors flex items-center justify-center gap-1.5">
                                                    <Edit3 className="w-3.5 h-3.5 text-slate-600 lg:group-hover:text-white transition-colors" />
                                                    <span className="text-[8px] font-black uppercase tracking-tighter text-slate-400 lg:group-hover:text-white label-mono transition-colors">{t('parent.media.rename')}</span>
                                                </div>
                                            </div>
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(item.id)} 
                                            className="hardware-btn group flex-1"
                                        >
                                            <div className="hardware-well h-9 rounded-xl bg-[#DADBD4] shadow-well flex items-center justify-center active:translate-y-0.5 transition-all relative overflow-hidden">
                                                <div className="hardware-cap absolute inset-0.5 bg-white lg:group-hover:bg-rose-500 rounded-lg shadow-cap transition-colors flex items-center justify-center gap-1.5">
                                                    <Trash2 className="w-3.5 h-3.5 text-slate-600 lg:group-hover:text-white transition-colors" />
                                                    <span className="text-[8px] font-black uppercase tracking-tighter text-slate-400 lg:group-hover:text-white label-mono transition-colors">{t('button.delete' )}</span>
                                                </div>
                                            </div>
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    )
}

