'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'motion/react'
import { Palette, ArrowLeft, Grid, LayoutList, CheckCircle, Heart, Eye, Coins } from 'lucide-react'
import Image from 'next/image'
import { useI18n } from '@/contexts/I18nContext'
import Link from 'next/link'
import ShareButton from '@/components/public/ShareButton'

type PublicArtwork = {
    id: string
    title: string
    imageUrl: string
    priceRMB: number
    priceCoins: number
    isSold: boolean
    createdAt: number
    albumId: string | null
    likes: number
    views: number
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
            <div className="flex-1 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
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
        <div className="flex-1 overflow-y-auto hide-scrollbar pb-20 px-6 md:px-20 max-w-7xl mx-auto w-full pt-12 md:pt-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
                <div>
                    <Link href={`/u/${slug}`} className="inline-flex items-center gap-2 text-slate-400 hover:text-indigo-600 font-bold mb-4 group transition-colors">
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        {t('public.visitHome')}
                    </Link>
                    <div className="flex items-center gap-6">
                        {user?.avatarUrl && (
                            <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-white p-1 shadow-lg border-2 border-white overflow-hidden shrink-0">
                                <Image 
                                    src={user.avatarUrl} 
                                    width={80} 
                                    height={80} 
                                    className="w-full h-full object-cover rounded-xl" 
                                    alt="Avatar" 
                                />
                            </div>
                        )}
                        <div>
                            <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">{t('public.artworks')}</h1>
                            <p className="text-slate-500 font-medium mt-1">
                                {user?.nickname || user?.name}&apos;s world of colors and shapes.
                            </p>
                        </div>
                    </div>
                </div>

                {/* View Controls & Filters */}
                <div className="flex flex-wrap gap-4 items-center">
                    <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100 items-center gap-1">
                        <button 
                            onClick={() => setViewMode('grid')}
                            className={`p-2 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <Grid className="w-5 h-5" />
                        </button>
                        <button 
                            onClick={() => setViewMode('masonry')}
                            className={`p-2 rounded-xl transition-all ${viewMode === 'masonry' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <LayoutList className="w-5 h-5" />
                        </button>
                    </div>
                    
                    <div className="bg-slate-900 rounded-2xl p-0.5 shadow-lg shadow-slate-200">
                        <ShareButton 
                            title={`${user?.nickname || user?.name}'s Art Exhibition`} 
                            displayName={user?.nickname || user?.name}
                            avatarUrl={user?.avatarUrl || undefined}
                        />
                    </div>
                </div>
            </div>

            {/* Album Tabs */}
            {albums.length > 0 && (
                <div className="flex flex-wrap gap-3 mb-10 pb-4 overflow-x-auto hide-scrollbar border-b border-slate-100">
                    <button
                        onClick={() => setSelectedAlbumId(null)}
                        className={`px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all whitespace-nowrap ${!selectedAlbumId ? 'bg-slate-900 text-white shadow-xl shadow-slate-200' : 'bg-white border border-slate-100 text-slate-400 hover:bg-slate-50'}`}
                    >
                        ALL PIECES
                    </button>
                    {albums.map(album => (
                        <button
                            key={album.id}
                            onClick={() => setSelectedAlbumId(album.id)}
                            className={`px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all whitespace-nowrap ${selectedAlbumId === album.id ? 'bg-slate-900 text-white shadow-xl shadow-slate-200' : 'bg-white border border-slate-100 text-slate-400 hover:bg-slate-50'}`}
                        >
                            {album.title}
                        </button>
                    ))}
                </div>
            )}

            {/* Art Grid */}
            <div className={`grid gap-x-8 gap-y-12 ${viewMode === 'grid' ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4' : 'grid-cols-1 md:grid-cols-2'}`}>
                <AnimatePresence mode='popLayout'>
                    {filteredArtworks.length > 0 ? (
                        filteredArtworks.map((art, idx) => (
                            <motion.div
                                key={art.id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ delay: idx * 0.05 }}
                                className="group cursor-pointer"
                                onClick={() => router.push(`/u/${slug}/exhibition/${art.id}`)}
                            >
                                <div className="relative aspect-square md:aspect-[4/5] rounded-[32px] overflow-hidden bg-white shadow-md border-4 border-white mb-4 group-hover:shadow-2xl transition-all duration-500">
                                    <Image 
                                        src={art.imageUrl} 
                                        alt={art.title}
                                        fill
                                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                                    />
                                    
                                    {!art.isSold && (
                                        <div className="absolute bottom-4 left-4 flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-xl shadow-lg font-black text-[10px] uppercase tracking-widest z-10 transition-transform group-hover:scale-110 origin-left">
                                            <Coins className="w-3 h-3" />
                                            {art.priceCoins} Coins
                                        </div>
                                    )}

                                    {art.isSold && (
                                        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center transition-opacity flex-col gap-2">
                                            <div className="px-5 py-2 bg-rose-500 text-white rounded-full font-black text-xs uppercase tracking-widest shadow-xl flex items-center gap-2">
                                                <Heart className="w-4 h-4 fill-white" />
                                                COLLECTED
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <h3 className="text-lg font-black text-slate-800 tracking-tight truncate px-2">{art.title}</h3>
                                <div className="flex items-center justify-between px-2 mt-1">
                                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
                                        {new Date(art.createdAt).toLocaleDateString()}
                                    </span>
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-1 text-slate-400">
                                            <Heart className="w-3.5 h-3.5" />
                                            <span className="text-[10px] font-bold">{art.likes}</span>
                                        </div>
                                        <div className="flex items-center gap-1 text-slate-400">
                                            <Eye className="w-3.5 h-3.5" />
                                            <span className="text-[10px] font-bold">{art.views}</span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    ) : (
                        <div className="col-span-full py-20 text-center">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Palette className="w-10 h-10 text-slate-200" />
                            </div>
                            <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">No artworks found in this collection.</p>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}
