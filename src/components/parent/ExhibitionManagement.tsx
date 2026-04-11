'use client'

import React, { useEffect, useState } from 'react'
import { Palette, XCircle, Search, Loader2, Heart, Eye, CheckCircle, Edit, User } from 'lucide-react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'motion/react'
import { useI18n } from '@/contexts/I18nContext'
import clsx from 'clsx'

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
    isArchived: boolean
    exhibitionDescription: string | null
    createdAt: string
}

type TabStatus = 'ALL' | 'PENDING' | 'APPROVED' | 'REMOVED'

export default function ExhibitionManagement({ _onOrdersClick }: { _onOrdersClick?: () => void }) {
    const { t } = useI18n()
    const [artworks, setArtworks] = useState<ExhibitionArtwork[]>([])
    const [loading, setLoading] = useState(true)
    const [processingId, setProcessingId] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState<TabStatus>('ALL')
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
            // "Take Down" (下架) keeps isPublic: true but sets isArchived: true
            const res = await fetch(`/api/parent/artworks/${id}/archive`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isArchived: true })
            })
            if (res.ok) {
                setArtworks(prev => prev.map(art => 
                    art.id === id ? { ...art, isArchived: true, isApproved: false } : art
                ))
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
            // "Approve" (上架/待审核通过) sets isApproved: true and isArchived: false
            const res = await fetch(`/api/parent/artworks/${id}/approve`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isApproved: true, isArchived: false })
            })
            if (res.ok) {
                setArtworks(prev => prev.map(art => 
                    art.id === id ? { ...art, isApproved: true, isArchived: false } : art
                ))
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
            (statusFilter === 'PENDING' && !art.isApproved && !art.isArchived) ||
            (statusFilter === 'APPROVED' && art.isApproved && !art.isArchived) ||
            (statusFilter === 'REMOVED' && art.isArchived)
            
        return matchesSearch && matchesStatus
    })

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-40 hardware-well rounded-[40px] bg-[#DADBD4] shadow-well mt-12">
                <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mb-6" />
                <p className="text-slate-500 font-black uppercase tracking-[0.4em] text-[10px] label-mono animate-pulse">{t('parent.exhibition.loading')}</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* ── Baustein Header HUD (Relocated to right) ───────────────────── */}
            <div className="flex flex-col md:flex-row justify-end items-center gap-4 w-full">
                {/* Status Filter WELL */}
                <div className="flex items-center gap-1 bg-[#DADBD4] p-1 rounded-2xl shadow-well hardware-well shrink-0 w-full md:w-auto overflow-x-auto no-scrollbar">
                    {(['ALL', 'PENDING', 'APPROVED', 'REMOVED'] as const).map((filter) => (
                        <button
                            key={filter}
                            onClick={() => setStatusFilter(filter)}
                            className={clsx(
                                "relative px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex-1 md:flex-initial flex items-center justify-center gap-2 whitespace-nowrap",
                                statusFilter === filter 
                                    ? "bg-white text-slate-800 shadow-cap translate-y-[-1px] ring-1 ring-black/5" 
                                    : "text-slate-500 hover:text-slate-700 opacity-60"
                            )}
                        >
                            {filter === 'ALL' ? t('parent.exhibition.tabAll') : 
                             filter === 'PENDING' ? t('parent.exhibition.tabPending') : 
                             filter === 'APPROVED' ? t('parent.exhibition.tabApproved') :
                             t('parent.exhibition.tabRemoved')}
                        </button>
                    ))}
                </div>

                {/* Search FIELD (Industrial Update) */}
                <div className="relative w-full md:w-64 group">
                    <div className="absolute inset-0 bg-[#DADBD4] rounded-2xl shadow-inner-warm border border-black/5" />
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 z-10 opacity-60" />
                    <input 
                        type="text"
                        placeholder={t('parent.exhibition.searchPlaceholder')}
                        className="relative z-1 w-full pl-11 pr-4 py-3 bg-transparent text-[10px] font-black uppercase tracking-widest text-slate-800 outline-none placeholder:text-slate-400 transition-all font-mono"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* ── Artwork Grid ────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 md:gap-6">
                <AnimatePresence mode="popLayout">
                    {filteredArtworks.length > 0 ? (
                        filteredArtworks.map((art) => (
                            <motion.div
                                key={art.id}
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="group relative"
                            >
                                <div className="hardware-well p-1 rounded-xl bg-[#DADBD4] shadow-well transition-all group-hover:shadow-lg">
                                    <div className="hardware-cap bg-[#FEFBEA] rounded-[10px] overflow-hidden shadow-cap h-full flex flex-col transition-all group-hover:-translate-y-0.5 ring-1 ring-white/30">
                                        
                                        {/* Image Sector (Highly Compressed Height) */}
                                        <div className="relative aspect-[2/1] w-full bg-slate-200 overflow-hidden group/img">
                                            <Image 
                                                src={art.imageUrl} 
                                                alt={art.title}
                                                fill
                                                className="object-cover transition-transform duration-700 group-hover:scale-105"
                                            />
                                            
                                            {/* Top Metadata Badges (Subtle) */}
                                            {art.albumTitle && (
                                                <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 bg-white/70 backdrop-blur-md rounded-md text-[6px] font-black text-indigo-700 uppercase tracking-[0.2em] border border-white/50 z-10">
                                                    {art.albumTitle}
                                                </div>
                                            )}

                                            {/* Status Indicator Bubble (Always visible if pending) */}
                                            {(!art.isApproved && !art.isArchived) && (
                                                <div className="absolute top-2 right-2 z-10 md:group-hover:opacity-0 transition-opacity">
                                                    <div className="w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center shadow-lg border border-white">
                                                        <Eye className="w-2.5 h-2.5 text-white" />
                                                    </div>
                                                </div>
                                            )}
                                            {art.isArchived && (
                                                <div className="absolute top-2 right-2 z-10">
                                                    <div className="w-5 h-5 bg-rose-500 rounded-full flex items-center justify-center shadow-lg border border-white">
                                                        <XCircle className="w-2.5 h-2.5 text-white" />
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Content Sector (Compressed) */}
                                        <div className="p-3 flex flex-col gap-2">
                                            <h3 className="font-black text-slate-800 text-[9px] leading-tight uppercase tracking-tight line-clamp-1">{art.title}</h3>

                                            {/* Description HUD - Only if exists */}
                                            {art.exhibitionDescription && (
                                                <div className="bg-[#B8B9B0]/5 rounded-lg p-1.5 relative group/desc border border-black/5 flex flex-col">
                                                    {editingDescriptionId === art.id ? (
                                                        <div className="space-y-1">
                                                            <textarea 
                                                                className="w-full bg-white/80 border-none rounded-lg p-1.5 text-[8px] font-bold text-slate-700 outline-none resize-none min-h-[30px]"
                                                                value={tempDescription}
                                                                onChange={e => setTempDescription(e.target.value)}
                                                                autoFocus
                                                            />
                                                            <div className="flex justify-end gap-1">
                                                                <button onClick={() => setEditingDescriptionId(null)} className="px-1.5 py-0.5 bg-slate-100 text-slate-400 rounded text-[6px] font-black uppercase tracking-widest">{t('common.cancel')}</button>
                                                                <button onClick={() => handleSaveDescription(art.id)} className="px-1.5 py-0.5 bg-indigo-600 text-white rounded text-[6px] font-black uppercase tracking-widest">{t('common.save')}</button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-start justify-between gap-1.5">
                                                            <p className="text-[8px] text-slate-400 font-bold leading-relaxed italic opacity-80 line-clamp-1">
                                                                &quot;{art.exhibitionDescription}&quot;
                                                            </p>
                                                            <button 
                                                                onClick={() => {
                                                                    setEditingDescriptionId(art.id)
                                                                    setTempDescription(art.exhibitionDescription || '')
                                                                }}
                                                                className="text-slate-300 hover:text-indigo-500 transition-all 
                                                                    opacity-100 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover/desc:opacity-100"
                                                            >
                                                                <Edit className="w-2 h-2" />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Action HUD - Bottom Placement */}
                                            <div className="flex gap-1.5 pt-1">
                                                {!art.isApproved ? (
                                                    <button 
                                                        onClick={() => handleApprove(art.id)}
                                                        disabled={processingId === art.id}
                                                        className="flex-1 py-1.5 bg-emerald-500/90 hover:bg-emerald-500 text-white rounded-lg font-black text-[8px] uppercase tracking-widest shadow-sm active:scale-95 flex items-center justify-center gap-1 transition-all"
                                                    >
                                                        {processingId === art.id ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                                                        {t('parent.exhibition.approve')}
                                                    </button>
                                                ) : (
                                                    <button 
                                                        onClick={() => handleTakeDown(art.id)}
                                                        disabled={processingId === art.id}
                                                        className="flex-1 py-1.5 bg-rose-500/90 hover:bg-rose-500 text-white rounded-lg font-black text-[8px] uppercase tracking-widest shadow-sm active:scale-95 flex items-center justify-center gap-1 transition-all"
                                                    >
                                                        {processingId === art.id ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <XCircle className="w-3 h-3" />}
                                                        {t('parent.exhibition.takeDown')}
                                                    </button>
                                                )}
                                            </div>

                                            {/* Footer HUD (Stats + Owner Attribution) */}
                                            <div className="flex items-center justify-between pt-1 border-t border-black/5">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex items-center gap-0.5 text-rose-400/60">
                                                        <Heart className="w-2 h-2 fill-current" />
                                                        <span className="text-[8px] font-black">{art.likes}</span>
                                                    </div>
                                                    <div className="flex items-center gap-0.5 text-slate-300">
                                                        <Eye className="w-2 h-2" />
                                                        <span className="text-[8px] font-black">{art.views}</span>
                                                    </div>
                                                </div>
                                                
                                                {/* Owner attribution at bottom right - Signature style */}
                                                <div className="flex items-center gap-1">
                                                    <span className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest">{art.userNickname || art.userName}</span>
                                                    <div className="w-3.5 h-3.5 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                                                        <User className="w-2 h-2 text-slate-300" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    ) : (
                        <div className="col-span-full py-32 flex flex-col items-center justify-center text-center hardware-well rounded-[60px] bg-[#DADBD4] shadow-well">
                            <div className="w-16 h-16 bg-white/40 backdrop-blur rounded-3xl flex items-center justify-center mb-6">
                                <Palette className="w-8 h-8 text-slate-300" />
                            </div>
                            <h3 className="text-lg font-black text-slate-500 uppercase tracking-[0.2em] mb-2">{t('parent.exhibition.empty')}</h3>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest label-mono opacity-60">No artworks published yet...</p>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}
