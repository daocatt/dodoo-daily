'use client'

import React, { useState, useEffect } from 'react'
import {
    Upload, File, Image as ImageIcon, Music, Video,
    FileText, Trash2, Edit3, Search, Filter,
    Loader2, X, Check, ExternalLink, HardDrive, Cloud
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useI18n } from '@/contexts/I18nContext'

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
    { label: 'All', value: 'ALL' },
    { label: 'Images', value: 'IMAGE' },
    { label: 'Voices', value: 'VOICE' },
    { label: 'Videos', value: 'VIDEO' },
    { label: 'Documents', value: 'DOC' },
    { label: 'Gallery', value: 'GALLERY' },
]

export default function MediaManagement() {
    const { t } = useI18n()
    const [media, setMedia] = useState<MediaRecord[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('ALL')
    const [search, setSearch] = useState('')

    // Upload State
    const [uploading, setUploading] = useState(false)
    const [uploadType, setUploadType] = useState<'IMAGE' | 'VOICE' | 'VIDEO' | 'DOC' | 'GALLERY'>('IMAGE')

    // Edit State
    const [editing, setEditing] = useState<string | null>(null)
    const [editName, setEditName] = useState('')

    const fetchMedia = async () => {
        setLoading(true)
        try {
            const res = await fetch(`/api/media?type=${filter}&search=${search}`)
            if (res.ok) {
                const data = await res.json()
                setMedia(data)
            }
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchMedia()
    }, [filter])

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        fetchMedia()
    }

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0]) return
        const file = e.target.files[0]
        setUploading(true)

        const formData = new FormData()
        formData.append('file', file)
        formData.append('type', uploadType)

        try {
            const res = await fetch('/api/media/upload', {
                method: 'POST',
                body: formData
            })
            if (res.ok) {
                fetchMedia()
            }
        } catch (err) {
            console.error(err)
        } finally {
            setUploading(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this file? This is a permanent physical deletion.')) return

        try {
            const res = await fetch(`/api/media/${id}`, { method: 'DELETE' })
            if (res.ok) {
                setMedia(media.filter(m => m.id !== id))
            }
        } catch (err) {
            console.error(err)
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
        } catch (err) {
            console.error(err)
        }
    }

    const getIcon = (type: string) => {
        switch (type) {
            case 'IMAGE': return <ImageIcon className="w-5 h-5" />
            case 'VOICE': return <Music className="w-5 h-5" />
            case 'VIDEO': return <Video className="w-5 h-5" />
            case 'GALLERY': return <ImageIcon className="w-5 h-5 text-orange-500" />
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
        <div className="space-y-8 pb-12">
            {/* Header & Upload */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-xl border border-slate-100 shadow-sm">
                <div className="flex-1">
                    <h2 className="text-2xl font-black text-slate-800">{t('parent.media')}</h2>
                    <p className="text-slate-500 mt-1">{t('parent.mediaDesc')}</p>
                </div>

                <div className="flex items-center gap-3">
                    <select
                        value={uploadType}
                        onChange={(e) => setUploadType(e.target.value as any)}
                        className="px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-600 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                    >
                        {TYPE_FILTERS.filter(f => f.value !== 'ALL').map(f => (
                            <option key={f.value} value={f.value}>{f.label}</option>
                        ))}
                    </select>

                    <label className="flex items-center gap-2 px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl shadow-lg shadow-orange-200 transition-all cursor-pointer active:scale-95">
                        {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                        <span className="text-xs font-black uppercase tracking-widest">{uploading ? 'Uploading...' : 'Upload File'}</span>
                        <input type="file" className="hidden" onChange={handleUpload} disabled={uploading} />
                    </label>
                </div>
            </div>

            {/* toolbar */}
            <div className="flex flex-col md:flex-row gap-4">
                <form onSubmit={handleSearch} className="flex-1 flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search files..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all"
                        />
                    </div>
                    <button type="submit" className="px-6 py-3 bg-slate-800 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-900 transition-colors">
                        Search
                    </button>
                </form>

                <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
                    {TYPE_FILTERS.map(f => (
                        <button
                            key={f.value}
                            onClick={() => setFilter(f.value)}
                            className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${filter === f.value
                                    ? 'bg-orange-500 text-white shadow-lg shadow-orange-200'
                                    : 'bg-white text-slate-500 border border-slate-100 hover:bg-slate-50'
                                }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Media List */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-slate-100 border-dashed">
                    <Loader2 className="w-10 h-10 animate-spin text-orange-200 mb-4" />
                    <p className="text-slate-400 font-medium">Scanning folders...</p>
                </div>
            ) : media.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-slate-100 border-dashed text-slate-400 uppercase tracking-widest font-black text-xs">
                    No files found
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    <AnimatePresence mode="popLayout">
                        {media.map((item) => (
                            <motion.div
                                key={item.id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="bg-white rounded-xl border border-slate-100 overflow-hidden group hover:shadow-xl transition-all flex flex-col"
                            >
                                {/* Preview / Thumbnail Area */}
                                <div className="aspect-video bg-slate-50 relative flex items-center justify-center group-hover:bg-slate-100/50 transition-colors">
                                    {item.fileType === 'IMAGE' || item.fileType === 'GALLERY' ? (
                                        <img src={item.path} alt={item.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                    ) : (
                                        <div className="p-8 rounded-full bg-white shadow-sm text-slate-400">
                                            {getIcon(item.fileType)}
                                        </div>
                                    )}

                                    <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <a href={item.path} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-xl bg-white/90 backdrop-blur-md flex items-center justify-center text-slate-600 hover:text-orange-500 shadow-sm transition-colors">
                                            <ExternalLink className="w-4 h-4" />
                                        </a>
                                        <button
                                            onClick={() => handleDelete(item.id)}
                                            className="w-8 h-8 rounded-xl bg-white/90 backdrop-blur-md flex items-center justify-center text-slate-600 hover:text-rose-500 shadow-sm transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <div className="absolute bottom-3 left-3 bg-black/40 backdrop-blur-md rounded-lg px-2 py-1 flex items-center gap-1.5 border border-white/10">
                                        {item.storageProvider === 'R2' ? <Cloud className="w-3 h-3 text-sky-300" /> : <HardDrive className="w-3 h-3 text-emerald-300" />}
                                        <span className="text-[8px] font-black text-white uppercase tracking-tighter">{item.storageProvider}</span>
                                    </div>
                                </div>

                                {/* Info Area */}
                                <div className="p-5 flex-1 flex flex-col gap-3">
                                    <div className="flex-1 min-w-0">
                                        {editing === item.id ? (
                                            <div className="flex gap-2">
                                                <input
                                                    autoFocus
                                                    value={editName}
                                                    onChange={e => setEditName(e.target.value)}
                                                    className="flex-1 bg-slate-50 border-orange-200 border rounded-lg px-2 py-1 text-sm focus:outline-none"
                                                />
                                                <button onClick={() => handleRename(item.id)} className="text-emerald-500"><Check className="w-4 h-4" /></button>
                                                <button onClick={() => setEditing(null)} className="text-slate-400"><X className="w-4 h-4" /></button>
                                            </div>
                                        ) : (
                                            <div className="flex items-start justify-between gap-2">
                                                <h3 className="text-sm font-black text-slate-800 line-clamp-1 break-all flex-1">{item.name}</h3>
                                                <button
                                                    onClick={() => {
                                                        setEditing(item.id)
                                                        setEditName(item.name)
                                                    }}
                                                    className="text-slate-300 hover:text-orange-500 transition-colors"
                                                >
                                                    <Edit3 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-3 mt-2">
                                            <span className="text-[10px] font-bold text-slate-400">{formatSize(item.size)}</span>
                                            <span className="w-1 h-1 rounded-full bg-slate-200" />
                                            <span className="text-[10px] font-bold text-slate-400 lowercase">{item.mimeType.split('/').pop()}</span>
                                        </div>
                                    </div>
                                    <div className="pt-3 border-t border-slate-50 flex items-center justify-between">
                                        <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">
                                            {new Date(item.createdAt).toLocaleDateString()}
                                        </span>
                                        <div className={`w-2 h-2 rounded-full ${item.fileType === 'IMAGE' ? 'bg-orange-400' : item.fileType === 'VOICE' ? 'bg-sky-400' : 'bg-indigo-400'}`} />
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
