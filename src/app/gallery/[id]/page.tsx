'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'motion/react'
import { ChevronLeft, Image as ImageIcon } from 'lucide-react'
import Link from 'next/link'
import AnimatedSky from '@/components/AnimatedSky'
import PosterGenerator from '@/components/PosterGenerator'

type Artwork = {
    id: string
    title: string
    imageUrl: string
    priceRMB: number
    priceCoins: number
    isSold: boolean
}

type AlbumDetail = {
    id: string
    title: string
    artworks: Artwork[]
}

export default function AlbumDetailPage() {
    const params = useParams()
    const router = useRouter()
    const [album, setAlbum] = useState<AlbumDetail | null>(null)
    const [loading, setLoading] = useState(true)
    const [posterArtwork, setPosterArtwork] = useState<Artwork | null>(null)

    useEffect(() => {
        if (!params?.id) return
        fetchAlbumDetail(params.id as string)
    }, [params])

    const fetchAlbumDetail = async (id: string) => {
        try {
            const res = await fetch(`/api/albums/${id}`)
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
                <p className="text-xl font-bold mb-4">Album Not Found (未找到该画册)</p>
                <button
                    onClick={() => router.push('/gallery')}
                    className="px-6 py-2 bg-white/50 backdrop-blur rounded-full font-bold shadow-sm"
                >
                    Back to Gallery (返回画廊)
                </button>
            </div>
        )
    }

    return (
        <div className="min-h-dvh flex flex-col relative overflow-hidden bg-[#e0f2fe] text-[#2c2416]">
            <AnimatedSky />

            <header className="relative z-10 flex justify-between items-center p-6 backdrop-blur-sm bg-white/20 border-b border-white/30">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.push('/gallery')} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/40 hover:bg-white/60 transition-colors shadow-sm text-white border border-white/50">
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <span className="font-extrabold text-2xl tracking-tight text-white drop-shadow-md flex items-center gap-2">
                        <ImageIcon className="w-6 h-6" />
                        {album.title}
                    </span>
                </div>
            </header>

            <main className="relative z-10 flex-1 overflow-y-auto p-6 md:p-12 pb-24 hide-scrollbar">
                {album.artworks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-white/80">
                        <ImageIcon className="w-16 h-16 mb-4 opacity-50" />
                        <p className="text-xl font-bold">Empty Album (画册为空)</p>
                        <p className="text-sm">Upload some art to this album! (快去上传些作品吧)</p>
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
                                <div className={`absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent ${art.isSold ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity duration-300 flex flex-col justify-end p-4`}>
                                    <h4 className="text-white font-bold text-lg">{art.title}</h4>

                                    {art.isSold ? (
                                        <div className="mt-4 flex items-center justify-between">
                                            <span className="text-gray-300 text-sm font-bold line-through">¥ {art.priceRMB ?? 0}</span>
                                            <span className="text-green-400 font-bold uppercase tracking-widest bg-green-500/20 px-3 py-1 rounded-full text-sm">Collected (已收藏)</span>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex justify-between items-center mt-2">
                                                <span className="text-purple-300 text-sm font-bold">¥ {art.priceRMB ?? 0}</span>
                                                <span className="text-amber-400 text-sm font-bold">{art.priceCoins ?? 0} Coins</span>
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    setPosterArtwork(art)
                                                }}
                                                className="mt-4 w-full py-2 bg-white/20 hover:bg-white/40 text-white rounded-lg backdrop-blur font-semibold transition-colors"
                                            >
                                                Generate Poster (生成海报)
                                            </button>
                                        </>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </main>

            {/* Poster Generator Modal */}
            {posterArtwork && (
                <PosterGenerator
                    artwork={posterArtwork}
                    onClose={() => setPosterArtwork(null)}
                />
            )}
        </div>
    )
}
