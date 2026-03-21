'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'motion/react'
import { Sparkles, Palette, Star, ArrowRight, Image as ImageIcon, Heart, Eye, Disc, Activity, ShieldCheck, User as UserIcon, Loader2, MessageSquare, Send, ChevronRight } from 'lucide-react'
import Image from 'next/image'
import { useI18n } from '@/contexts/I18nContext'
import Link from 'next/link'
import ShareButton from '@/components/public/ShareButton'
import NatureBackground from '@/components/NatureBackground'
import PanelHeader from '@/components/PanelHeader'
import VisitorCenter from '@/components/public/VisitorCenter'
import AuthGate from '@/components/public/AuthGate'
import { useAuthSession } from '@/hooks/useAuthSession'
import { AnimatePresence } from 'motion/react'

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
    thumbnailMedium?: string | null
    thumbnailLarge?: string | null
}

export default function PublicProfileHome() {
    const params = useParams()
    const router = useRouter()
    const { t } = useI18n()
    const [user, setUser] = useState<UserProfile | null>(null)
    const [artworks, setArtworks] = useState<PublicArtwork[]>([])
    const [loading, setLoading] = useState(true)
    const [messages, setMessages] = useState<{ 
        id: string; 
        text: string; 
        createdAt: number; 
        guestId?: string | null; 
        memberId?: string | null;
        guestName?: string | null;
        memberName?: string | null;
        memberNickname?: string | null;
    }[]>([])
    const [showMsgModal, setShowMsgModal] = useState(false)
    const [msgText, setMsgText] = useState('')
    const [sending, setSending] = useState(false)
    const { user: member, visitor } = useAuthSession()
    const [showVisitorPanel, setShowVisitorPanel] = useState(false)

    const slug = params?.slug as string

    useEffect(() => {
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

    const fetchMessages = React.useCallback(async () => {
        if (!user?.id) return
        const res = await fetch(`/api/public/message?userId=${user.id}`)
        if (res.ok) setMessages(await res.json())
    }, [user?.id])

    useEffect(() => {
        fetchMessages()
    }, [fetchMessages])

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!msgText.trim()) return
        setSending(true)

        try {
            const res = await fetch('/api/public/message', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    targetUserId: user!.id,
                    text: msgText.trim(),
                    guestId: visitor?.id || null,
                    memberId: member?.id || null,
                    isPublic: false
                })
            })

            if (res.ok) {
                setMsgText('')
                setShowMsgModal(false)
                fetchMessages()
            }
        } catch (err) {
            console.error(err)
        } finally {
            setSending(false)
        }
    }

    if (loading) {
        return (
            <div className="h-dvh flex items-center justify-center app-bg-pattern">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
                    <span className="label-mono uppercase tracking-widest text-xs opacity-40">Decrypting Profile...</span>
                </div>
            </div>
        )
    }

    if (!user) {
        return (
            <div className="h-dvh flex flex-col items-center justify-center p-8 text-center app-bg-pattern">
                <div className="baustein-panel max-w-md w-full shadow-2xl overflow-hidden">
                    <PanelHeader id="SYSTEM ERR" accentColor="#F43F5E" />
                    <div className="p-12 flex flex-col items-center">
                        <div className="w-20 h-20 hardware-well rounded-full flex items-center justify-center mb-8 bg-rose-50 border-4 border-[#C8C4B0]">
                            <ShieldCheck className="w-10 h-10 text-rose-300" />
                        </div>
                        <h1 className="text-2xl font-black text-slate-800 mb-4 uppercase tracking-tighter">Access Forbidden</h1>
                        <p className="label-mono opacity-60 italic mb-10 leading-relaxed px-4 text-xs font-bold uppercase tracking-widest leading-loose">The requested artist world has been de-indexed or remains in a closed state.</p>
                        <button 
                            onClick={() => router.push('/')} 
                            className="hardware-btn w-full"
                        >
                            <div className="hardware-cap bg-white py-4 rounded-xl font-black uppercase tracking-widest text-[10px] border border-black/5">
                                Return to Origin
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    const displayName = user.nickname || user.name

    return (
        <main className="min-h-dvh relative selection:bg-indigo-500/20 pb-20">
            <NatureBackground />
            
            <div className="relative z-10 flex flex-col items-center py-12 px-4 md:px-8">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="baustein-panel w-full max-w-7xl flex flex-col shadow-[0_40px_120px_rgba(0,0,0,0.3)] bg-[var(--surface-warm)] relative rounded-[2rem] overflow-hidden"
                >
                    <PanelHeader id="Profile Terminal" systemName="EXHIBITION">
                        <div className="hidden sm:block">
                            <ShareButton 
                                title={`${displayName}'s Art Exhibition`} 
                                displayName={displayName}
                                avatarUrl={user.avatarUrl || undefined}
                                className="px-3 py-1 bg-[var(--well-bg)] rounded-md shadow-inner text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] border border-black/5 hover:bg-slate-200/50 transition-colors flex items-center gap-1.5"
                            />
                        </div>
                    </PanelHeader>
                    
                    <div className="flex-1 flex flex-col md:grid md:grid-cols-12">
                        
                        {/* Left Side: Curator Bio */}
                        <div className="md:col-span-4 lg:col-span-3 flex flex-col border-b-2 md:border-b-0 md:border-r-2 border-[var(--groove-dark)] bg-[var(--surface-warm)]">
                            <div className="p-8 md:p-4 flex flex-col h-full">
                                {/* Row 1: Avatar & Identity (Left-Right on mobile, Stacked on Desktop) */}
                                <div className="flex flex-row md:flex-col gap-5 md:gap-8 items-center md:items-start shrink-0">
                                    {/* Avatar (Left on mobile, Top on desktop) */}
                                    <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-full md:h-auto md:aspect-square shrink-0 hardware-well rounded-[1.5rem] md:rounded-[2rem] border-4 border-[#C8C4B0] overflow-hidden relative group p-1 shadow-well">
                                        <div className="absolute inset-0 bg-slate-950" />
                                        <Image
                                            src={user.avatarUrl || '/dog.svg'}
                                            alt={displayName}
                                            fill
                                            className="object-cover opacity-80 contrast-125 grayscale-[20%] group-hover:grayscale-0 transition-all duration-700 rounded-xl md:rounded-2xl"
                                        />
                                        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)] z-10" />
                                        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))] z-20 bg-[length:100%_2px,3px_100%] opacity-40 animate-scanline" />
                                    </div>

                                    {/* Identity Fragment (Right on mobile, Next in stack on desktop) */}
                                    <div className="flex-1 space-y-1 md:space-y-6 min-w-0">
                                        <div className="px-1 md:px-2">
                                            <div className="flex items-center gap-2 mb-1.5 md:mb-3">
                                                <div className="w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.4)]" />
                                                <span className="label-mono text-[8px] md:text-[9px] font-black opacity-30 italic leading-none uppercase">Signal Active</span>
                                            </div>
                                            <h2 className="text-xl md:text-3xl font-black tracking-tighter text-slate-900 leading-none mb-1.5 md:mb-4 uppercase truncate">{displayName}</h2>
                                            <p className="label-mono text-[9px] md:text-xs opacity-60 leading-tight md:leading-relaxed font-bold border-l-2 border-slate-200 pl-3 md:pl-4 limit-lines-2">
                                                {t('public.hero.subtitle')}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Row 2: Stats Container (Standalone row on mobile) */}
                                <div className="mt-6 md:mt-10 lg:mt-12 mb-12 md:mb-0">
                                    <div className="hardware-well rounded-xl md:rounded-2xl p-4 md:p-5 bg-slate-200/40 border border-white/40 space-y-3 md:space-y-4 shadow-well">
                                        <div className="flex justify-between items-center px-1">
                                            <div className="flex items-center gap-2 text-[var(--accent-moss)]">
                                                <Star className="w-3 h-3 fill-current" />
                                                <span className="label-mono text-[8px] md:text-[9px] font-black opacity-60 uppercase tracking-widest leading-none">{t('public.stats.pieces')}</span>
                                            </div>
                                            <span className="text-xs md:text-sm font-black text-slate-800">{artworks.length}</span>
                                        </div>
                                        <div className="h-0.5 bg-black/5 w-full" />
                                        <div className="flex justify-between items-center px-1">
                                            <div className="flex items-center gap-2 text-rose-400">
                                                <Heart className="w-3 h-3 fill-current" />
                                                <span className="label-mono text-[8px] md:text-[9px] font-black opacity-60 uppercase tracking-widest leading-none">Appreciation</span>
                                            </div>
                                            <span className="text-xs md:text-sm font-black text-slate-800">{user.totalLikes || 0}</span>
                                        </div>
                                        <div className="h-0.5 bg-black/5 w-full" />
                                        <div className="flex justify-between items-center px-1">
                                            <div className="flex items-center gap-2 text-blue-400">
                                                <Eye className="w-3 h-3 fill-current" />
                                                <span className="label-mono text-[8px] md:text-[9px] font-black opacity-60 uppercase tracking-widest leading-none">Visibility</span>
                                            </div>
                                            <span className="text-xs md:text-sm font-black text-slate-800">{user.totalViews || 0}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-auto pt-6 border-t-2 border-[var(--groove-dark)] flex flex-col gap-2">
                                    <div className="flex justify-between items-center px-2 py-1">
                                         <div className="flex gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                                            <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                                         </div>
                                         <span className="label-mono text-[8px] opacity-30 font-bold uppercase tracking-widest italic">Hardware ID: {slug}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Middle & Right: Gallery View */}
                        <div className="md:col-span-8 lg:col-span-9 flex flex-col bg-[var(--well-bg)]">
                            <div className="flex-1 p-6 md:p-12">
                                
                                {/* Featured Header - Fixed responsiveness */}
                                <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-6 mb-10 border-b-2 border-black/5 pb-8">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <Activity className="w-4 h-4 text-indigo-500" />
                                            <span className="label-mono text-[10px] uppercase font-black tracking-[0.2em] text-indigo-600">{t('public.artworks')}</span>
                                        </div>
                                        <h3 className="text-2xl md:text-4xl font-black tracking-tighter text-slate-900 leading-tight uppercase">Latest Submissions</h3>
                                    </div>
                                    <div className="flex justify-end md:block">
                                        <Link 
                                            href={`/u/${slug}/exhibition`}
                                            className="hardware-btn group mb-1 min-w-[160px]"
                                        >
                                            <div className="hardware-cap bg-white px-6 py-3 rounded-xl flex items-center justify-between gap-3 border border-black/5">
                                                <span className="label-mono text-xs uppercase font-black">Go Exhibition</span>
                                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                            </div>
                                        </Link>
                                    </div>
                                </div>

                                {/* Art Grid */}
                                {artworks.length > 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 pb-10">
                                        {artworks.map((art, idx) => (
                                            <motion.div
                                                key={art.id}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: idx * 0.1 }}
                                                className="group cursor-pointer"
                                                onClick={() => router.push(`/u/${slug}/exhibition/${art.id}`)}
                                            >
                                                <div className="hardware-well aspect-[4/5] rounded-[1.5rem] border-4 border-[#C8C4B0] overflow-hidden group/slide mb-6 shadow-well transition-all group-hover:shadow-[0_20px_40px_rgba(0,0,0,0.15)] relative">
                                                    <Image 
                                                        src={art.imageUrl} 
                                                        alt={art.title}
                                                        fill
                                                        className="object-cover transition-transform duration-700 group-hover/slide:scale-105"
                                                        priority={idx < 2}
                                                    />
                                                    
                                                    {/* Persistent Stats (Bottom Left) */}
                                                    {/* Bottom shadow base for readability */}
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent z-10 pointer-events-none" />

                                                    {/* Minimalist Floating Stats (Bottom Left) */}
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

                                                    {/* Curator Overlay (Hover darkening) */}
                                                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/slide:opacity-100 transition-opacity flex flex-col justify-end p-8 overflow-hidden pointer-events-none z-10">
                                                        {art.albumTitle && (
                                                            <div className="translate-y-4 group-hover/slide:translate-y-0 transition-transform duration-500">
                                                                <span className="label-mono text-[8px] px-2 py-0.5 bg-indigo-500/90 text-white rounded uppercase font-black tracking-widest shadow-lg">
                                                                    {art.albumTitle}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    
                                                    {art.isSold && (
                                                        <div className="absolute top-6 right-6">
                                                            <div className="px-3 py-1 bg-rose-500 text-white label-mono text-[9px] font-black rounded-lg shadow-xl uppercase tracking-widest flex items-center gap-1.5">
                                                                <Star className="w-3 h-3 fill-white" />
                                                                Collected
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="px-2 space-y-1">
                                                    <div className="flex justify-between items-center text-[8px] font-black uppercase tracking-[0.2em] opacity-30">
                                                        <span>Project Code: {art.id.slice(0, 6)}</span>
                                                        <span>{new Date(art.createdAt).getFullYear()}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center gap-4">
                                                        <h4 className="text-lg font-black text-slate-800 truncate uppercase tracking-tight group-hover:text-indigo-600 transition-colors leading-tight">{art.title}</h4>
                                                        <div className="shrink-0 flex items-center gap-1.5 px-2 py-0.5 bg-slate-200/50 border border-slate-300 rounded text-[9px] font-black text-slate-500 opacity-60">
                                                            <Disc className="w-3 h-3 animate-spin-slow" />
                                                            {art.priceCoins} C
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex-1 flex flex-col items-center justify-center p-20 text-center opacity-20">
                                        <ImageIcon className="w-20 h-20 mb-6" />
                                        <p className="label-mono text-sm uppercase tracking-widest font-black">Data Stream Empty</p>
                                    </div>
                                )}

                                {/* Message Board */}
                                <div className="mt-12 pt-12 border-t-2 border-black/5">
                                    <div className="flex items-center justify-between mb-8">
                                        <div className="flex items-center gap-2">
                                            <MessageSquare className="w-5 h-5 text-[var(--warm-amber)]" />
                                            <h3 className="text-2xl font-black uppercase tracking-tighter">Signal Board</h3>
                                        </div>
                                        <button 
                                            onClick={() => setShowMsgModal(true)}
                                            className="px-4 py-2 bg-slate-900 text-white rounded-xl label-mono text-[9px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all"
                                        >
                                            Leave Message
                                        </button>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
                                        {messages.length > 0 ? messages.map((m, i) => (
                                            <motion.div 
                                                key={m.id || i}
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ delay: i * 0.05 }}
                                                className="hardware-well p-6 rounded-[2rem] bg-[#E2DFD2] border-2 border-white/20 shadow-well relative group flex flex-col gap-4"
                                            >
                                                <div className="flex justify-between items-center bg-black/5 -mx-6 -mt-6 px-6 py-3 border-b border-black/5 rounded-t-[1.8rem]">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-2 h-2 rounded-full bg-[var(--accent-moss)] animate-pulse" />
                                                        <span className="label-mono text-[10px] font-black uppercase tracking-widest text-[#5C5A4D]">
                                                            {`${(m.memberNickname || m.memberName || m.guestName || 'Guest')[0]}*`}
                                                        </span>
                                                    </div>
                                                    <span className="label-mono text-[9px] opacity-40 font-bold">
                                                        {new Date(m.createdAt).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <div className="pt-2">
                                                    <p className="text-[#2C2A20] font-bold text-sm leading-relaxed tracking-tight italic">
                                                        &ldquo;{m.text}&rdquo;
                                                    </p>
                                                </div>
                                                <div className="mt-auto flex justify-end">
                                                    <span className="label-mono text-[8px] opacity-20 uppercase font-black">Secure Signal Path #{m.id?.slice(0, 4)}</span>
                                                </div>
                                            </motion.div>
                                        )) : (
                                            <div className="col-span-full text-center py-20 bg-black/5 rounded-[2.5rem] border-2 border-dashed border-black/10">
                                                <Disc className="w-10 h-10 text-black/10 mx-auto mb-4 animate-spin-slow" />
                                                <p className="label-mono text-[10px] opacity-30 uppercase font-black tracking-[0.3em]">Waiting for incoming signal...</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                
                            </div>

                            {/* CTA / Quick Access */}
                            <div className="p-10 border-t-2 border-[var(--groove-dark)] bg-[var(--surface-warm)] shrink-0">
                                <div className="hardware-well rounded-[2.5rem] p-10 bg-[#E2DFD2] border-2 border-white/40 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden group/cta shadow-well">
                                    <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 blur-[80px] rounded-full -translate-y-1/2 translate-x-1/2" />
                                    
                                    <div className="relative z-10 text-center md:text-left space-y-3">
                                        <div className="flex items-center gap-2 justify-center md:justify-start">
                                            <div className="w-2 h-2 rounded-full bg-indigo-500" />
                                            <span className="label-mono text-[10px] uppercase font-black tracking-[0.3em] text-indigo-600/60">Portfolio Access</span>
                                        </div>
                                        <h4 className="text-4xl font-black text-slate-900 uppercase tracking-tighter leading-tight">Join the exhibition</h4>
                                        <p className="label-mono text-[10px] text-slate-500 font-bold uppercase tracking-widest opacity-60">Explore {displayName}&apos;s full artistic portfolio across all curated albums</p>
                                    </div>

                                    <button 
                                        onClick={() => router.push(`/u/${slug}/exhibition`)}
                                        className="hardware-btn group z-10 w-full md:w-auto"
                                    >
                                        <div className="hardware-cap bg-slate-900 px-10 py-6 rounded-2xl flex items-center justify-center gap-4 group-hover:bg-black transition-all shadow-xl">
                                            <span className="font-black text-white uppercase tracking-[0.3em] text-xs">Enter World</span>
                                            <ArrowRight className="w-5 h-5 text-indigo-400 group-hover:translate-x-1 transition-transform" />
                                        </div>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Message Modal */}
            <AnimatePresence>
                {showMsgModal && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-xl"
                        onClick={() => setShowMsgModal(false)}
                    >
                        <motion.div 
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="w-full max-w-md relative"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="baustein-panel w-full bg-[#E2DFD2] rounded-[2rem] shadow-2xl relative overflow-hidden border-4 border-[#C8C4B0] flex flex-col">
                                <AuthGate mode="ANY">
                                    {() => (
                                        <>
                                            {showVisitorPanel && visitor ? (
                                                <div className="p-8">
                                                    <VisitorCenter guest={visitor} onLogout={() => { localStorage.removeItem('visitor_data'); document.cookie = 'dodoo_guest_id=; path=/; max-age=0'; window.dispatchEvent(new Event('storage')); setShowVisitorPanel(false) }} onUpdateCurrency={() => { window.dispatchEvent(new Event('storage')) }} />
                                                </div>
                                            ) : (
                                                <form onSubmit={handleSendMessage} className="flex flex-col h-full">
                                                    {/* Hardware Header clipped by parent overflow-hidden */}
                                                    <div className="flex items-center justify-between px-6 py-4 border-b-2 border-[#B8B4A0] bg-[#D6D2C0] shrink-0">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(79,70,229,0.5)] animate-pulse" />
                                                            <span className="font-black text-[10px] tracking-[0.2em] uppercase text-slate-700">New Transmission</span>
                                                        </div>
                                                        <div className="px-3 py-1 bg-black/5 rounded shadow-inner text-[8px] font-black uppercase tracking-widest text-slate-400">
                                                            {member?.nickname || member?.name || visitor?.name || 'Guest'}
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="p-8 flex flex-col">
                                                        {/* Identity block */}
                                                        <div className="mb-6 p-4 bg-amber-50/50 border-l-4 border-amber-400 flex items-center gap-3 hardware-well rounded-r-xl">
                                                            <UserIcon className="w-4 h-4 text-amber-500 shrink-0" />
                                                            <span className="label-mono text-amber-600 text-[10px] uppercase font-bold tracking-widest leading-relaxed">Identity: {member?.nickname || member?.name || visitor?.name}</span>
                                                        </div>
                                                        
                                                        {/* TextArea with sunken well - Setup specification */}
                                                        <div className="hardware-well rounded-xl p-1.5 bg-[#D1CDBC] mb-8">
                                                            <textarea 
                                                                value={msgText}
                                                                onChange={e => setMsgText(e.target.value)}
                                                                placeholder="Enter transmission data..."
                                                                className="w-full h-48 bg-white/90 px-6 py-5 rounded-lg border-2 border-transparent focus:border-indigo-500/30 outline-none font-black text-slate-800 placeholder:text-slate-400 text-sm shadow-inner transition-colors resize-none"
                                                                required
                                                            />
                                                        </div>
                                                        
                                                        {/* Sunken Action Button - Setup specification */}
                                                        <button 
                                                            disabled={sending || !msgText.trim()}
                                                            className={`hardware-btn group w-full block transition-opacity ${sending || !msgText.trim() ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
                                                        >
                                                            <div className="hardware-well h-16 w-full rounded-xl overflow-hidden relative bg-[#D1CDBC] p-1 shadow-well">
                                                                <div className="hardware-cap absolute inset-1.5 bg-[#F4F4F2] rounded-lg flex items-center px-5 justify-between group-hover:bg-white transition-all shadow-sm">
                                                                    <div className="flex items-center gap-3 min-w-0">
                                                                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 shrink-0 shadow-inner group-hover:bg-indigo-50 transition-colors">
                                                                            {sending ? <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" /> : <Send className="w-4 h-4 text-indigo-500" />}
                                                                        </div>
                                                                        <span className="font-black text-slate-800 tracking-[0.2em] uppercase text-sm leading-none">{sending ? 'TRANSMITTING...' : 'SEND SIGNAL'}</span>
                                                                    </div>
                                                                    <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-500 transition-colors shrink-0" />
                                                                </div>
                                                            </div>
                                                        </button>
                                                        
                                                        {/* Secondary Action */}
                                                        <div className="mt-6 text-center">
                                                            <button 
                                                                type="button" 
                                                                onClick={() => setShowMsgModal(false)}
                                                                className="label-mono text-[9px] font-black uppercase tracking-[0.4em] text-slate-400 hover:text-slate-600 transition-colors"
                                                            >
                                                                Ab-Abort Transmission
                                                            </button>
                                                        </div>
                                                    </div>
                                                </form>
                                            )}
                                        </>
                                    )}
                                </AuthGate>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

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
