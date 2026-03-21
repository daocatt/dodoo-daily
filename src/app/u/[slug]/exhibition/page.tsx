'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'motion/react'
import { Palette, ArrowLeft, Grid, LayoutList, Heart, Eye, Star, Disc, Loader2 } from 'lucide-react'
import Image from 'next/image'
import { useI18n } from '@/contexts/I18nContext'
import Link from 'next/link'
import NatureBackground from '@/components/NatureBackground'
import PanelHeader from '@/components/PanelHeader'


type PublicArtwork = {
    id: string
    title: string
    imageUrl: string
    priceRMB: number
    priceCoins: number
    isSold: boolean
    isFeatured: boolean
    createdAt: number
    albumId: string | null
    likes: number
    views: number
    thumbnailMedium?: string | null
    thumbnailLarge?: string | null
}

type PublicAlbum = {
    id: string
    title: string
    coverUrls: string | null
    isPublic: boolean
}

type UserProfile = {
    id: string
    name: string
    nickname: string | null
    avatarUrl: string | null
    exhibitionTitle: string | null
    exhibitionSubtitle: string | null
    exhibitionDescription: string | null
}

export default function ExhibitionPage() {
    const params = useParams()
    const router = useRouter()
    const { t } = useI18n()
    const [artworks, setArtworks] = useState<PublicArtwork[]>([])
    const [albums, setAlbums] = useState<PublicAlbum[]>([])
    const [user, setUser] = useState<UserProfile | null>(null)
    const [loading, setLoading] = useState(true)
    const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null)
    const [viewMode, setViewMode] = useState<'grid' | 'masonry'>('grid')

    const slug = params?.slug as string

    useEffect(() => {
        if (!slug) return
        
        const fetchData = async () => {
            try {
                const [artRes, albRes, userRes] = await Promise.all([
                    fetch(`/api/public/users/${slug}/artworks`),
                    fetch(`/api/public/users/${slug}/albums`),
                    fetch(`/api/public/users/${slug}`)
                ])

                if (artRes.ok && albRes.ok && userRes.ok) {
                    setArtworks(await artRes.json())
                    setAlbums(await albRes.json())
                    setUser(await userRes.json())
                }
            } catch (err) {
                console.error(err)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [slug])

    const filteredArtworks = selectedAlbumId 
        ? artworks.filter(art => art.albumId === selectedAlbumId)
        : artworks

    if (loading) {
        return (
            <div className="h-dvh flex items-center justify-center app-bg-pattern">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
                    <span className="label-mono uppercase tracking-widest text-xs opacity-40">Accessing Archives...</span>
                </div>
            </div>
        )
    }

    if (!user) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <div className="w-20 h-20 rounded-3xl bg-slate-100 flex items-center justify-center mb-6">
                    <Palette className="w-10 h-10 text-slate-300" />
                </div>
                <h2 className="text-2xl font-black text-slate-800 mb-2">Oops!</h2>
                <p className="text-slate-500 mb-8">This gallery is currently private.</p>
                <Link href="/" className="px-8 py-3 bg-slate-800 text-white rounded-2xl font-bold shadow-lg shadow-slate-200 uppercase tracking-widest text-xs">
                    Go Back Home
                </Link>
            </div>
        )
    }

    return (
        <main className="min-h-dvh relative selection:bg-indigo-500/20 pb-20">
            <NatureBackground />
            
            <div className="relative z-10 flex flex-col items-center py-12 px-4 md:px-8">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="baustein-panel w-full max-w-7xl flex flex-col shadow-[0_40px_120px_rgba(0,0,0,0.3)] bg-[var(--surface-warm)] relative rounded-[2rem] overflow-hidden"
                >
                    <PanelHeader id="Gallery Archives" systemName="EXHIBITION" />
                    
                    <div className="flex-1 overflow-y-auto hide-scrollbar pb-20 px-6 md:px-12 w-full pt-8 md:pt-14">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 border-b-2 border-black/5 pb-8">
                <div className="space-y-4">
                    <Link 
                        href={`/u/${slug}`} 
                        className="inline-flex items-center gap-2 label-mono text-[10px] uppercase font-black tracking-widest text-slate-400 hover:text-indigo-600 transition-colors group"
                    >
                        <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
                        {t('public.visitHome')}
                    </Link>
                    
                    <div>
                        <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase leading-none mb-3">
                            {user?.exhibitionTitle || 'Exhibition'}
                        </h1>
                        <p className="label-mono text-xs md:text-sm text-slate-500 font-bold opacity-60 border-l-2 border-slate-200 pl-4">
                            {user?.exhibitionSubtitle || `${user?.nickname || user?.name}'s curated selection.`}
                        </p>
                    </div>
                </div>

                {/* View Controls - Hardware Switch Style */}
                <div className="flex items-center gap-2 bg-[var(--well-bg)] p-1.5 rounded-2xl shadow-inner border border-black/5 self-start md:self-end">
                    <button 
                        onClick={() => setViewMode('grid')}
                        className={`px-4 py-2 rounded-[10px] transition-all flex items-center gap-2 ${
                            viewMode === 'grid' 
                            ? 'bg-white shadow-md text-indigo-600 scale-[0.98]' 
                            : 'text-slate-400 hover:text-slate-600'
                        }`}
                    >
                        <Grid className={`w-4 h-4 ${viewMode === 'grid' ? 'stroke-[3px]' : ''}`} />
                        <span className="label-mono text-[9px] font-black uppercase">Standard</span>
                    </button>
                    <button 
                        onClick={() => setViewMode('masonry')}
                        className={`px-4 py-2 rounded-[10px] transition-all flex items-center gap-2 ${
                            viewMode === 'masonry' 
                            ? 'bg-white shadow-md text-indigo-600 scale-[0.98]' 
                            : 'text-slate-400 hover:text-slate-600'
                        }`}
                    >
                        <LayoutList className={`w-4 h-4 ${viewMode === 'masonry' ? 'stroke-[3px]' : ''}`} />
                        <span className="label-mono text-[9px] font-black uppercase">Expanded</span>
                    </button>
                </div>
            </div>

            {/* Exhibition Bio */}
            {user?.exhibitionDescription && (
                <div className="mb-12 hardware-well rounded-[2rem] p-6 md:p-8 bg-slate-200/30 border border-white/40 shadow-well">
                    <div className="flex items-center gap-2 mb-4 opacity-40">
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                        <span className="label-mono text-[10px] font-black uppercase tracking-widest">Exhibition Statement</span>
                    </div>
                    <p className="text-slate-700 font-bold leading-relaxed text-sm md:text-base whitespace-pre-wrap">{user.exhibitionDescription}</p>
                </div>
            )}

            {/* Album Filters - Index_All Style */}
            {albums.length > 0 && (
                <div className="flex flex-wrap gap-2 md:gap-3 mb-12 pb-6 overflow-x-auto hide-scrollbar">
                    <button
                        onClick={() => setSelectedAlbumId(null)}
                        className={`px-5 py-2.5 rounded-xl label-mono text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border-2 ${
                            !selectedAlbumId 
                            ? 'bg-slate-900 text-white border-slate-900 shadow-xl' 
                            : 'bg-white border-black/5 text-slate-400 hover:border-slate-300'
                        }`}
                    >
                        Index_All
                    </button>
                    {albums.map(album => (
                        <button
                            key={album.id}
                            onClick={() => setSelectedAlbumId(album.id)}
                            className={`px-5 py-2.5 rounded-xl label-mono text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border-2 ${
                                selectedAlbumId === album.id 
                                ? 'bg-slate-900 text-white border-slate-900 shadow-xl' 
                                : 'bg-white border-black/5 text-slate-400 hover:border-slate-300'
                            }`}
                        >
                            {album.title}
                        </button>
                    ))}
                </div>
            )}

            {/* Art Gallery Grid */}
            <div className={`grid gap-x-8 gap-y-12 ${viewMode === 'grid' ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4' : 'grid-cols-1 md:grid-cols-2'}`}>
                <AnimatePresence mode='popLayout'>
                    {filteredArtworks.length > 0 ? (
                        filteredArtworks.map((art, idx) => (
                            <motion.div
                                key={art.id}
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ delay: idx * 0.1 }}
                                className="group cursor-pointer"
                                onClick={() => router.push(`/u/${slug}/exhibition/${art.id}`)}
                            >
                                {/* Reproduced Image Well from Homepage */}
                                <div className="hardware-well aspect-[4/5] rounded-[1.5rem] border-4 border-[#C8C4B0] overflow-hidden group/slide mb-6 shadow-well transition-all group-hover:shadow-[0_20px_40px_rgba(0,0,0,0.15)] relative">
                                    <Image 
                                        src={art.imageUrl || '/placeholder.png'} 
                                        alt={art.title}
                                        fill
                                        className="object-cover transition-transform duration-700 group-hover/slide:scale-105"
                                        priority={idx < 2}
                                    />
                                    
                                    {/* Minimalist Bottom Scrim */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent z-10 pointer-events-none" />

                                    {/* Floating Stats Overlay (Likes & Views) */}
                                    <div className="absolute bottom-6 left-7 z-20 flex gap-5 text-white drop-shadow-md pointer-events-none">
                                        <div className="flex items-center gap-1.5 opacity-90">
                                            <Heart className="w-3.5 h-3.5 fill-white" />
                                            <span className="label-mono text-[9px] font-black tracking-[0.2em]">{art.likes}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 opacity-80">
                                            <Eye className="w-3.5 h-3.5" />
                                            <span className="label-mono text-[9px] font-black tracking-[0.2em]">{art.views}</span>
                                        </div>
                                    </div>

                                    {/* Featured Tag (Restyled from Sold) */}
                                    {art.isFeatured && (
                                        <div className="absolute top-6 right-6 z-20">
                                            <div className="px-3 py-1 bg-amber-500 text-white label-mono text-[9px] font-black rounded-lg shadow-xl uppercase tracking-widest flex items-center gap-1.5">
                                                <Star className="w-3 h-3 fill-white" />
                                                {t('gallery.detail.featured')}
                                            </div>
                                        </div>
                                    )}

                                    {/* Hover Details Mask */}
                                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/slide:opacity-100 transition-opacity flex flex-col justify-end p-8 overflow-hidden pointer-events-none z-10" />
                                </div>

                                {/* Refined Footer - Perfectly Matched with Homepage */}
                                <div className="px-2 space-y-1">
                                    <div className="flex justify-between items-center text-[8px] font-black uppercase tracking-[0.2em] opacity-30">
                                        <span>Project Code: {art.id.slice(0, 6)}</span>
                                        <span>{new Date(art.createdAt).getFullYear()}</span>
                                    </div>
                                    <div className="flex justify-between items-center gap-4">
                                        <h4 className="text-sm md:text-lg font-black text-slate-800 truncate uppercase tracking-tight group-hover:text-indigo-600 transition-colors leading-tight">
                                            {art.title}
                                        </h4>
                                        <div className="shrink-0 flex items-center gap-1.5 px-2 py-0.5 bg-slate-200/50 border border-slate-300 rounded text-[9px] font-black text-slate-500 opacity-60">
                                            <Disc className="w-3 h-3 animate-spin-slow" />
                                            {art.priceCoins} C
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    ) : (
                        <div className="col-span-full py-20 text-center hardware-well rounded-[2rem] border border-dashed border-slate-300">
                            <Palette className="w-10 h-10 text-slate-200 mx-auto mb-4" />
                            <p className="label-mono text-xs text-slate-400 font-black uppercase tracking-widest">Database Empty: No Records Found</p>
                        </div>
                    )}
                </AnimatePresence>
                    </div>
                </div>
            </motion.div>
        </div>

            <style jsx global>{`
                .shadow-well {
                    box-shadow: inset 0 2px 4px rgba(0,0,0,0.1), 0 1px 2px rgba(255,255,255,0.5);
                }
                .app-bg-pattern {
                    background-image: radial-gradient(var(--groove-dark) 1px, transparent 1px);
                    background-size: 24px 24px;
                }
            `}</style>
        </main>
    )
}
