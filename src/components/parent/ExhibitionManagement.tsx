'use client'

import React, { useEffect, useState } from 'react'
import { Palette, XCircle, Search, Loader2, Heart, Eye, CheckCircle, Edit, Save, ShoppingBag } from 'lucide-react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { useI18n } from '@/contexts/I18nContext'

interface ExhibitionArtwork {
    id: string
    title: string
    imageUrl: string
    albumTitle: string | null
    userId: string
    userName: string
    userNickname: string | null
    likes: number
    views: number
    isPublic: boolean
    isApproved: boolean
    exhibitionDescription: string | null
    createdAt: string
}

export default function ExhibitionManagement({ onOrdersClick }: { onOrdersClick?: () => void }) {
    const { t } = useI18n()
    const [artworks, setArtworks] = useState<ExhibitionArtwork[]>([])
    const [loading, setLoading] = useState(true)
    const [processingId, setProcessingId] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED'>('ALL')
    const [editingDescriptionId, setEditingDescriptionId] = useState<string | null>(null)
    const [tempDescription, setTempDescription] = useState('')

    const fetchExhibitionArtworks = async () => {
        try {
            const res = await fetch('/api/parent/exhibition')
            if (res.ok) {
                const data = await res.json()
                setArtworks(data)
            }
        } catch (e: unknown) {
            console.error('Failed to fetch exhibition artworks:', e)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchExhibitionArtworks()
    }, [])

    const handleTakeDown = async (id: string) => {
        if (processingId) return
        setProcessingId(id)
        try {
            const res = await fetch(`/api/parent/artworks/${id}/public`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isPublic: false })
            })
            if (res.ok) {
                setArtworks(prev => prev.filter(art => art.id !== id))
            }
        } catch (e: unknown) {
            console.error('Failed to take down artwork:', e)
        } finally {
            setProcessingId(null)
        }
    }

    const handleApprove = async (id: string) => {
        if (processingId) return
        setProcessingId(id)
        try {
            const res = await fetch(`/api/parent/artworks/${id}/approve`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isApproved: true })
            })
            if (res.ok) {
                setArtworks(prev => prev.map(art => art.id === id ? { ...art, isApproved: true } : art))
            }
        } catch (e: unknown) {
            console.error('Failed to approve artwork:', e)
        } finally {
            setProcessingId(null)
        }
    }

    const handleSaveDescription = async (id: string) => {
        if (processingId) return
        setProcessingId(id)
        try {
            const res = await fetch(`/api/parent/artworks/${id}/description`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ exhibitionDescription: tempDescription })
            })
            if (res.ok) {
                setArtworks(prev => prev.map(art => art.id === id ? { ...art, exhibitionDescription: tempDescription } : art))
                setEditingDescriptionId(null)
            }
        } catch (e: unknown) {
            console.error('Failed to save description:', e)
        } finally {
            setProcessingId(null)
        }
    }

    const filteredArtworks = artworks.filter(art => {
        const matchesSearch = art.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (art.albumTitle?.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (art.userName.toLowerCase().includes(searchTerm.toLowerCase()))
        
        const matchesStatus = statusFilter === 'ALL' || 
            (statusFilter === 'PENDING' && !art.isApproved) ||
            (statusFilter === 'APPROVED' && art.isApproved)
            
        return matchesSearch && matchesStatus
    })

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-4" />
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">{t('parent.exhibition.loading')}</p>
            </div>
        )
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h2 className="text-3xl font-black text-slate-800 tracking-tight">{t('parent.exhibition')}</h2>
                    <p className="text-sm text-slate-500 mt-1">{t('parent.exhibitionSub')}</p>
                </div>
                
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full md:w-auto">
                    <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm">
                        {(['ALL', 'PENDING', 'APPROVED'] as const).map((filter) => (
                            <button
                                key={filter}
                                onClick={() => setStatusFilter(filter)}
                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${statusFilter === filter ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                {filter === 'ALL' ? t('parent.exhibition.tabAll') : filter === 'PENDING' ? t('parent.exhibition.tabPending') : t('parent.exhibition.tabApproved')}
                            </button>
                        ))}
                    </div>
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                            type="text"
                            placeholder={t('parent.exhibition.searchPlaceholder')}
                            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-indigo-100 outline-none transition-all shadow-sm"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    {onOrdersClick && (
                        <button
                            onClick={onOrdersClick}
                            className="flex items-center gap-2 px-5 py-3 bg-indigo-50 text-indigo-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-100 transition-all border border-indigo-100 shadow-sm"
                        >
                            <ShoppingBag className="w-4 h-4" />
                            {t('parent.orders.gallery')}
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence mode="popLayout">
                    {filteredArtworks.length > 0 ? (
                        filteredArtworks.map((art) => (
                            <motion.div
                                key={art.id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden hover:shadow-xl transition-all group"
                            >
                                <div className="relative aspect-[4/3] bg-slate-50">
                                    <Image 
                                        src={art.imageUrl} 
                                        alt={art.title}
                                        fill
                                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                    <div className="absolute top-4 left-4 flex flex-col gap-2">
                                        {art.albumTitle && (
                                            <span className="px-3 py-1.5 bg-white/95 backdrop-blur shadow-sm rounded-xl text-[9px] font-black text-indigo-600 uppercase tracking-widest border border-indigo-50 leading-none">
                                                {art.albumTitle}
                                            </span>
                                        )}
                                        <span className="px-3 py-1.5 bg-slate-900/80 backdrop-blur rounded-xl text-[9px] font-black text-white uppercase tracking-widest flex items-center gap-1 leading-none">
                                            {art.userNickname || art.userName}
                                        </span>
                                    </div>
                                    
                                    {!art.isApproved && (
                                        <div className="absolute top-4 right-4 animate-pulse">
                                            <span className="px-3 py-1.5 bg-amber-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg leading-none">
                                                {t('parent.exhibition.tabPending')}
                                            </span>
                                        </div>
                                    )}

                                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3">
                                        {!art.isApproved ? (
                                            <button 
                                                onClick={() => handleApprove(art.id)}
                                                disabled={processingId === art.id}
                                                className="w-32 py-2.5 bg-emerald-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-emerald-600 transition-all flex items-center justify-center gap-2"
                                            >
                                                {processingId === art.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <div className="p-0.5 bg-white rounded-full"><CheckCircle className="w-2.5 h-2.5 text-emerald-500" /></div>}
                                                {t('parent.exhibition.approve')}
                                            </button>
                                        ) : null}
                                        <button 
                                            onClick={() => handleTakeDown(art.id)}
                                            disabled={processingId === art.id}
                                            className="w-32 py-2.5 bg-white text-rose-600 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-rose-600 hover:text-white transition-all flex items-center justify-center gap-2"
                                        >
                                            {processingId === art.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />}
                                            {t('parent.exhibition.takeDown')}
                                        </button>
                                    </div>
                                </div>
                                <div className="p-5 space-y-3">
                                    <div className="flex justify-between items-start">
                                        <h3 className="font-black text-slate-800 leading-tight uppercase tracking-tight">{art.title}</h3>
                                        <div className="text-[10px] text-slate-400 font-bold uppercase">{new Date(art.createdAt).toLocaleDateString()}</div>
                                    </div>

                                    {/* Exhibition Description */}
                                    <div className="bg-slate-50/50 rounded-2xl p-3 relative group/desc">
                                        {editingDescriptionId === art.id ? (
                                            <div className="space-y-2">
                                                <textarea 
                                                    className="w-full bg-white border border-indigo-100 rounded-xl p-2 text-xs font-medium focus:ring-2 focus:ring-indigo-100 outline-none resize-none h-20"
                                                    value={tempDescription}
                                                    onChange={e => setTempDescription(e.target.value)}
                                                    autoFocus
                                                />
                                                <div className="flex justify-end gap-2">
                                                    <button 
                                                        onClick={() => setEditingDescriptionId(null)}
                                                        className="px-3 py-1 bg-white text-slate-400 rounded-lg text-[9px] font-black uppercase tracking-widest border border-slate-100"
                                                    >
                                                        {t('common.cancel')}
                                                    </button>
                                                    <button 
                                                        onClick={() => handleSaveDescription(art.id)}
                                                        disabled={processingId === art.id}
                                                        className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest shadow-sm flex items-center gap-1"
                                                    >
                                                        {processingId === art.id ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Save className="w-2.5 h-2.5" />}
                                                        {t('common.save')}
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex items-start justify-between gap-3">
                                                <p className="text-[11px] text-slate-500 font-medium leading-relaxed italic">
                                                    {art.exhibitionDescription || t('parent.exhibition.noDescription')}
                                                </p>
                                                <button 
                                                    onClick={() => {
                                                        setEditingDescriptionId(art.id)
                                                        setTempDescription(art.exhibitionDescription || '')
                                                    }}
                                                    className="p-1.5 text-slate-300 hover:text-indigo-500 hover:bg-white rounded-lg transition-all opacity-0 group-hover/desc:opacity-100"
                                                >
                                                    <Edit className="w-3 h-3" />
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-4 border-t border-slate-50 pt-3">
                                        <div className="flex items-center gap-1.5 text-slate-400">
                                            <Heart className="w-3.5 h-3.5" />
                                            <span className="text-xs font-black">{art.likes}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-slate-400">
                                            <Eye className="w-3.5 h-3.5" />
                                            <span className="text-xs font-black">{art.views}</span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    ) : (
                        <div className="col-span-full py-20 flex flex-col items-center justify-center text-center bg-slate-50/50 rounded-[40px] border-2 border-dashed border-slate-100">
                            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">
                                <Palette className="w-8 h-8 text-slate-200" />
                            </div>
                            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">{t('parent.exhibition.empty')}</p>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}
