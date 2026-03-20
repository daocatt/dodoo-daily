'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'motion/react'
import { Sparkles, Palette, Star, ArrowRight, Image as ImageIcon, Heart, Eye } from 'lucide-react'
import Image from 'next/image'
import { useI18n } from '@/contexts/I18nContext'
import Link from 'next/link'
import ShareButton from '@/components/public/ShareButton'

type UserProfile = {
    id: string
    name: string
    nickname: string | null
    slug: string
    avatarUrl: string | null
    gender: string
    role: string
    stats: {
        purpleStars: number
        currency: number
    } | null
    totalLikes: number
    totalViews: number
}

type PublicArtwork = {
    id: string
    title: string
    imageUrl: string
    priceRMB: number
    priceCoins: number
    isSold: boolean
    createdAt: number
    likes: number
    views: number
    albumId: string | null
    albumTitle?: string | null
}

export default function PublicProfileHome() {
    const params = useParams()
    const router = useRouter()
    const { t, locale } = useI18n()
    const [user, setUser] = useState<UserProfile | null>(null)
    const [artworks, setArtworks] = useState<PublicArtwork[]>([])
    const [loading, setLoading] = useState(true)

    const slug = params?.slug as string

    useEffect(() => {
        // --- NEW: VISITOR AUTH CHECK ---
        const guestId = typeof document !== 'undefined' ? document.cookie.split('; ').find(row => row.startsWith('dodoo_guest_id='))?.split('=')[1] : null
        if (!guestId && !localStorage.getItem('dodoo_guest')) {
            router.push(`/guest/login?returnUrl=${encodeURIComponent(window.location.pathname)}&slug=${slug}`)
            return
        }

        if (!slug) return
        
        const fetchData = async () => {
            try {
                const [userRes, artRes] = await Promise.all([
                    fetch(`/api/public/users/${slug}`),
                    fetch(`/api/public/users/${slug}/artworks`)
                ])

                if (userRes.ok && artRes.ok) {
                    const userData = await userRes.json()
                    const artData = await artRes.json()
                    setUser(userData)
                    setArtworks(artData)
                } else {
                    console.error('Failed to fetch public profile data')
                }
            } catch (err) {
                console.error(err)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [slug])

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
                    <ImageIcon className="w-10 h-10 text-slate-300" />
                </div>
                <h1 className="text-2xl font-black text-slate-800 mb-2">Oops!</h1>
                <p className="text-slate-500 mb-8">This artist hasn&apos;t opened their world yet.</p>
                <Link href="/" className="px-8 py-3 bg-slate-800 text-white rounded-2xl font-bold shadow-lg shadow-slate-200">
                    Go Back Home
                </Link>
            </div>
        )
    }

    const displayName = user.nickname || user.name
    const featuredWorks = artworks.slice(0, 3)

    return (
        <div className="flex-1 overflow-y-auto hide-scrollbar pb-20">
            {/* Header / Hero */}
            <div className="px-6 py-12 md:px-20 md:py-24 max-w-7xl mx-auto w-full">
                <div className="flex flex-col md:flex-row gap-12 items-center">
                    {/* User Info */}
                    <motion.div 
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex-1 text-center md:text-left"
                    >
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 font-black text-[10px] uppercase tracking-widest mb-6">
                            <Sparkles className="w-3 h-3" />
                            {user.role === 'CHILD' ? 'Little Artist' : 'Creator'}
                        </div>

                        {user.avatarUrl && (
                            <motion.div
                                initial={{ scale: 0, rotate: -20 }}
                                animate={{ scale: 1, rotate: 0 }}
                                className="w-24 h-24 md:w-32 md:h-32 rounded-[2.5rem] bg-white p-1.5 shadow-2xl shadow-indigo-100/50 border-4 border-white mb-10 mx-auto md:mx-0 overflow-hidden ring-1 ring-slate-100"
                            >
                                <Image 
                                    src={user.avatarUrl} 
                                    width={128} 
                                    height={128} 
                                    className="w-full h-full object-cover rounded-[2rem]" 
                                    alt="Avatar" 
                                />
                            </motion.div>
                        )}

                        <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tight leading-none mb-6">
                            {t('public.title', { name: displayName })}
                        </h1>
                        <p className="text-lg md:text-xl text-slate-500 font-medium mb-10 max-w-lg mx-auto md:mx-0">
                            {t('public.hero.subtitle')}
                        </p>
                        
                        <div className="flex flex-wrap justify-center md:justify-start gap-4 mb-12">
                            <div className="px-6 py-4 bg-white rounded-3xl shadow-sm border border-slate-100 flex items-center gap-3">
                                <div className="p-2 bg-purple-100 rounded-xl text-purple-600">
                                    <Palette className="w-5 h-5" />
                                </div>
                                 <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('public.stats.pieces')}</p>
                                    <p className="text-xl font-black text-slate-800 leading-tight">{artworks.length}</p>
                                </div>
                            </div>
                            <div className="px-6 py-4 bg-white rounded-3xl shadow-sm border border-slate-100 flex items-center gap-3">
                                <div className="p-2 bg-rose-100 rounded-xl text-rose-600">
                                    <Heart className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">LIKES</p>
                                    <p className="text-xl font-black text-slate-800 leading-tight">
                                        {user.totalLikes || 0}
                                    </p>
                                </div>
                            </div>
                            <div className="px-6 py-4 bg-white rounded-3xl shadow-sm border border-slate-100 flex items-center gap-3">
                                <div className="p-2 bg-blue-100 rounded-xl text-blue-600">
                                    <Eye className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">VIEWS</p>
                                    <p className="text-xl font-black text-slate-800 leading-tight">
                                        {user.totalViews || 0}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-wrap justify-center md:justify-start gap-4 mb-12 items-center">
                            <Link 
                                href={`/u/${slug}/exhibition`}
                                className="inline-flex items-center gap-3 px-8 py-5 bg-indigo-600 text-white rounded-3xl font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all hover:scale-105 active:scale-95 uppercase tracking-widest text-xs"
                            >
                                {t('public.viewExhibition')}
                                <ArrowRight className="w-5 h-5" />
                            </Link>
                            <div className="bg-slate-900 rounded-3xl p-1 shadow-lg shadow-slate-200">
                                <ShareButton 
                                    title={`${displayName}'s Art Exhibition`} 
                                    displayName={displayName}
                                    avatarUrl={user.avatarUrl || undefined}
                                />
                            </div>
                        </div>
                    </motion.div>

                    {/* Featured Frame */}
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9, rotate: 5 }}
                        animate={{ opacity: 1, scale: 1, rotate: 0 }}
                        className="relative w-full max-w-sm md:max-w-md aspect-[4/5]"
                    >
                        {/* Shadow decoration */}
                        <div className="absolute inset-0 bg-indigo-500/20 blur-3xl rounded-full -z-10" />
                        
                        {/* Main Cover Frame */}
                        <div className="w-full h-full p-6 bg-white rounded-[40px] shadow-2xl border-8 border-white group overflow-hidden relative">
                            {artworks.length > 0 ? (
                                <>
                                    <Image 
                                        src={artworks[0].imageUrl} 
                                        alt={artworks[0].title}
                                        fill
                                        className="object-cover rounded-[24px]"
                                    />
                                    <div className="absolute bottom-10 left-10 right-10 p-6 bg-white/40 backdrop-blur-xl border border-white/40 rounded-3xl">
                                        <p className="text-xs font-black text-indigo-900 border-b border-indigo-900/10 pb-2 mb-2 uppercase tracking-widest">Featured Work</p>
                                        <h3 className="text-2xl font-black text-indigo-950 truncate">{artworks[0].title}</h3>
                                    </div>
                                </>
                            ) : (
                                <div className="w-full h-full bg-slate-50 flex flex-col items-center justify-center text-slate-300 gap-4">
                                    <ImageIcon className="w-16 h-16" />
                                    <span className="font-black uppercase tracking-widest text-[10px]">No Feature Yet</span>
                                </div>
                            )}
                        </div>
                        
                    </motion.div>
                </div>
            </div>

            {/* Featured Section */}
            {artworks.length > 0 && (
                <div className="px-6 py-12 md:px-20 max-w-7xl mx-auto w-full">
                    <div className="flex justify-between items-end mb-10">
                        <div>
                            <h2 className="text-3xl font-black text-slate-900 mb-2">{t('public.artworks')}</h2>
                            <p className="text-slate-500 font-medium tracking-tight">Handpicked selection of my latest works</p>
                        </div>
                        <Link href={`/u/${slug}/exhibition`} className="flex items-center gap-2 text-indigo-600 font-black text-sm group">
                            VIEW ALL 
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {featuredWorks.map((art, idx) => (
                            <motion.div
                                key={art.id}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className="group cursor-pointer"
                                onClick={() => router.push(`/u/${slug}/exhibition/${art.id}`)}
                            >
                                <div className="relative aspect-[4/5] rounded-[32px] overflow-hidden bg-white shadow-lg border-4 border-white mb-6">
                                    <Image 
                                        src={art.imageUrl} 
                                        alt={art.title}
                                        fill
                                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-8">
                                        <div className="flex items-center gap-4 text-white">
                                            <div className="flex items-center gap-1">
                                                <Heart className="w-4 h-4 text-rose-400 fill-rose-400" />
                                                <span className="text-xs font-black">{art.likes}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Eye className="w-4 h-4 text-blue-400" />
                                                <span className="text-xs font-black">{art.views}</span>
                                            </div>
                                            <span className="ml-auto text-[10px] font-black bg-indigo-500 px-3 py-1 rounded-full uppercase">
                                                {art.priceCoins} Coins
                                            </span>
                                        </div>
                                    </div>
                                    {art.isSold && (
                                        <div className="absolute top-4 right-4 px-3 py-1 bg-rose-500 text-white text-[10px] font-black rounded-lg shadow-lg uppercase tracking-widest flex items-center gap-1">
                                            <Heart className="w-3 h-3 fill-white" />
                                            Collected
                                        </div>
                                    )}
                                </div>
                                <h3 className="text-xl font-black text-slate-800 group-hover:text-indigo-600 transition-colors uppercase tracking-tight leading-tight">{art.title}</h3>
                                {art.albumTitle && (
                                    <div className="inline-block px-2 py-0.5 bg-indigo-50 text-indigo-500 text-[9px] font-black rounded-full uppercase tracking-widest mt-1 mb-1">
                                        {art.albumTitle}
                                    </div>
                                )}
                                <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">
                                    {new Date(art.createdAt).toLocaleDateString(locale === 'zh-CN' ? 'zh-CN' : 'en-US', { year: 'numeric', month: 'long' })}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}

            {/* CTA */}
            <div className="px-6 py-20">
                <div className="max-w-4xl mx-auto bg-slate-900 rounded-[48px] p-12 md:p-20 text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 blur-3xl rounded-full" />
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/20 blur-3xl rounded-full" />
                    
                    <h2 className="text-4xl md:text-5xl font-black text-white mb-8 relative z-10 leading-tight">
                        See anything you love? <br/><span className="text-indigo-400">Join my journey.</span>
                    </h2>
                    <Link 
                        href={`/u/${slug}/exhibition`}
                        className="inline-flex items-center gap-3 px-10 py-5 bg-white text-slate-950 rounded-3xl font-black hover:bg-slate-50 transition-all hover:scale-105 active:scale-95 shadow-2xl relative z-10 uppercase tracking-widest text-sm"
                    >
                        Browse all works
                    </Link>
                </div>
            </div>
        </div>
    )
}
