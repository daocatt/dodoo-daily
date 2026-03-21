'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'motion/react'
import { Sparkles, Palette, Star, ArrowRight, Image as ImageIcon, Heart, Eye, Layout, Disc, Activity, ShieldCheck, User as UserIcon, Loader2, MessageSquare, Send } from 'lucide-react'
import Image from 'next/image'
import { useI18n } from '@/contexts/I18nContext'
import Link from 'next/link'
import ShareButton from '@/components/public/ShareButton'
import NatureBackground from '@/components/NatureBackground'
import PanelHeader from '@/components/PanelHeader'
import GuestAuth from '@/components/public/GuestAuth'
import VisitorCenter from '@/components/public/VisitorCenter'
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
}

export default function PublicProfileHome() {
    const params = useParams()
    const router = useRouter()
    const { t, locale } = useI18n()
    const [user, setUser] = useState<UserProfile | null>(null)
    const [artworks, setArtworks] = useState<PublicArtwork[]>([])
    const [loading, setLoading] = useState(true)
    const [messages, setMessages] = useState<{ id?: string; text: string; createdAt: number; guestId?: string | null; memberId?: string | null }[]>([])
    const [showMsgModal, setShowMsgModal] = useState(false)
    const [msgText, setMsgText] = useState('')
    const [sending, setSending] = useState(false)
    const [visitor, setVisitor] = useState<{ id: string; name: string; currency: number } | null>(null)
    const [member, setMember] = useState<{ id: string; name: string } | null>(null)
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

        const stored = localStorage.getItem('visitor_data')
        if (stored) {
            try { setVisitor(JSON.parse(stored)) } catch {}
        }

        fetch('/api/stats')
            .then(res => res.ok ? res.json() : null)
            .then(data => { if (data?.id) setMember(data) })

        fetchData()
    }, [slug])

    const fetchMessages = async () => {
        if (!user?.id) return
        const res = await fetch(`/api/public/message?userId=${user.id}`)
        if (res.ok) setMessages(await res.json())
    }

    useEffect(() => {
        fetchMessages()
    }, [user])

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
                    guestId: visitor?.id,
                    isPublic: true
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
    const featuredWorks = artworks.slice(0, 3)

    return (
        <main className="h-dvh overflow-hidden relative selection:bg-indigo-500/20">
            <NatureBackground />
            
            <div className="absolute inset-0 z-10 flex items-center justify-center p-4 md:p-8">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="baustein-panel w-full max-w-7xl max-h-[96dvh] flex flex-col shadow-[0_40px_120px_rgba(0,0,0,0.3)] bg-[var(--surface-warm)] relative overflow-hidden h-[90vh] md:h-auto md:min-h-[700px]"
                >
                    <PanelHeader id="Profile Terminal" systemName={`${displayName.toUpperCase()}®`} />
                    
                    <div className="flex-1 flex flex-col md:grid md:grid-cols-12 min-h-0 overflow-hidden">
                        
                        {/* Left Side: Curator Bio */}
                        <div className="md:col-span-4 lg:col-span-3 flex flex-col border-r-2 border-[var(--groove-dark)] bg-[var(--surface-warm)] overflow-hidden">
                            <div className="p-4 flex flex-col h-full">
                                <div className="space-y-6">
                                    <div className="hardware-well aspect-square rounded-[2rem] border-4 border-[#C8C4B0] overflow-hidden relative group p-1 shadow-well">
                                        <div className="absolute inset-0 bg-slate-950" />
                                        <Image
                                            src={user.avatarUrl || '/dog.svg'}
                                            alt={displayName}
                                            fill
                                            className="object-cover opacity-80 contrast-125 grayscale-[20%] group-hover:grayscale-0 transition-all duration-700 rounded-2xl"
                                        />
                                        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)] z-10" />
                                        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))] z-20 bg-[length:100%_2px,3px_100%] opacity-40 animate-scanline" />
                                    </div>

                                    <div className="px-2">
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="px-2 py-0.5 bg-indigo-100 text-indigo-600 rounded text-[9px] font-black uppercase tracking-widest shadow-sm">
                                                {user.role}
                                            </div>
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                            <span className="label-mono text-[9px] font-black opacity-30 italic">Online Presence</span>
                                        </div>
                                        <h2 className="text-3xl font-black tracking-tighter text-slate-900 leading-none mb-4 uppercase">{displayName}</h2>
                                        <p className="label-mono text-xs opacity-60 leading-relaxed font-bold border-l-2 border-slate-200 pl-4">
                                            {t('public.hero.subtitle')}
                                        </p>
                                    </div>

                                    <div className="hardware-well rounded-2xl p-4 bg-slate-200/40 border border-white/40 space-y-4 shadow-well">
                                        <div className="flex justify-between items-center px-1">
                                            <div className="flex items-center gap-2">
                                                <Star className="w-3 h-3 text-[var(--accent-moss)]" />
                                                <span className="label-mono text-[9px] font-black opacity-40 uppercase tracking-widest">{t('public.stats.pieces')}</span>
                                            </div>
                                            <span className="text-sm font-black text-slate-800">{artworks.length}</span>
                                        </div>
                                        <div className="h-0.5 bg-black/5 w-full" />
                                        <div className="flex justify-between items-center px-1">
                                            <div className="flex items-center gap-2">
                                                <Heart className="w-3 h-3 text-rose-400" />
                                                <span className="label-mono text-[9px] font-black opacity-40 uppercase tracking-widest">Appreciation</span>
                                            </div>
                                            <span className="text-sm font-black text-slate-800">{user.totalLikes || 0}</span>
                                        </div>
                                        <div className="h-0.5 bg-black/5 w-full" />
                                        <div className="flex justify-between items-center px-1">
                                            <div className="flex items-center gap-2">
                                                <Eye className="w-3 h-3 text-blue-400" />
                                                <span className="label-mono text-[9px] font-black opacity-40 uppercase tracking-widest">Visibility</span>
                                            </div>
                                            <span className="text-sm font-black text-slate-800">{user.totalViews || 0}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-auto pt-6 border-t-2 border-[var(--groove-dark)] flex flex-col gap-2">
                                     <div className="bg-slate-900 rounded-xl p-0.5 shadow-well">
                                        <ShareButton 
                                            title={`${displayName}'s Art Exhibition`} 
                                            displayName={displayName}
                                            avatarUrl={user.avatarUrl || undefined}
                                        />
                                    </div>
                                    <div className="flex justify-between items-center px-2 py-1">
                                         <div className="flex gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                                            <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                                         </div>
                                         <span className="label-mono text-[8px] opacity-30 font-bold uppercase tracking-widest italic">Hardware ID: {user.id.slice(0,8)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Middle & Right: Gallery View */}
                        <div className="md:col-span-8 lg:col-span-9 flex flex-col bg-[var(--well-bg)] overflow-hidden">
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-10">
                                
                                {/* Featured Header */}
                                <div className="flex justify-between items-end mb-10 border-b-2 border-black/5 pb-8">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <Activity className="w-4 h-4 text-indigo-500" />
                                            <span className="label-mono text-[10px] uppercase font-black tracking-[0.2em] text-indigo-600">{t('public.artworks')}</span>
                                        </div>
                                        <h3 className="text-4xl font-black tracking-tighter text-slate-900 leading-tight uppercase">Latest Submissions</h3>
                                    </div>
                                    <Link 
                                        href={`/u/${slug}/exhibition`}
                                        className="hardware-btn group mb-1"
                                    >
                                        <div className="hardware-cap bg-white px-6 py-3 rounded-xl flex items-center gap-3 border border-black/5">
                                            <span className="label-mono text-xs">Exhibition</span>
                                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                        </div>
                                    </Link>
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
                                                <div className="hardware-well aspect-[4/5] rounded-[2.5rem] border-4 border-[#C8C4B0] overflow-hidden group/slide mb-6 shadow-well transition-all group-hover:shadow-[0_20px_40px_rgba(0,0,0,0.15)] group-hover:-translate-y-1 relative">
                                                    <Image 
                                                        src={art.imageUrl} 
                                                        alt={art.title}
                                                        fill
                                                        className="object-cover transition-transform duration-700 group-hover/slide:scale-105"
                                                    />
                                                    
                                                    {/* Curator Overlay */}
                                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent opacity-0 group-hover/slide:opacity-100 transition-opacity flex flex-col justify-end p-8 gap-4 overflow-hidden">
                                                        <div className="space-y-2 translate-y-4 group-hover/slide:translate-y-0 transition-transform duration-500">
                                                            <div className="flex gap-4 text-white/60">
                                                                <div className="flex items-center gap-1.5">
                                                                    <Heart className="w-3.5 h-3.5" />
                                                                    <span className="label-mono text-[10px]">{art.likes}</span>
                                                                </div>
                                                                <div className="flex items-center gap-1.5">
                                                                    <Eye className="w-3.5 h-3.5" />
                                                                    <span className="label-mono text-[10px]">{art.views}</span>
                                                                </div>
                                                            </div>
                                                            <h4 className="text-xl font-bold text-white uppercase tracking-tight truncate leading-tight">{art.title}</h4>
                                                            {art.albumTitle && (
                                                                <span className="label-mono text-[8px] px-2 py-0.5 bg-indigo-500 text-white rounded uppercase">{art.albumTitle}</span>
                                                            )}
                                                        </div>
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
                                            <MessageSquare className="w-4 h-4 text-indigo-500" />
                                            <h3 className="text-2xl font-black uppercase tracking-tighter">Transmission Logs</h3>
                                        </div>
                                        <button 
                                            onClick={() => setShowMsgModal(true)}
                                            className="px-4 py-2 bg-slate-900 text-white rounded-xl label-mono text-[9px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all"
                                        >
                                            Leave Message
                                        </button>
                                    </div>
                                    
                                    <div className="space-y-4 max-h-96 overflow-y-auto pr-4 custom-scrollbar pb-10">
                                        {messages.length > 0 ? messages.map((m, i) => (
                                            <div key={i} className="hardware-well p-6 rounded-3xl bg-white/50 border border-white/50 shadow-well relative group">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-4 h-4 rounded-full bg-slate-200 flex items-center justify-center text-[7px] font-black text-slate-500">
                                                            {m.guestId ? 'G' : 'M'}
                                                        </div>
                                                        <span className="label-mono text-[9px] font-black uppercase tracking-widest text-indigo-600">Secure Signal</span>
                                                    </div>
                                                    <span className="label-mono text-[8px] opacity-30">{new Date(m.createdAt).toLocaleString()}</span>
                                                </div>
                                                <p className="text-slate-700 font-medium leading-relaxed">{m.text}</p>
                                            </div>
                                        )) : (
                                            <div className="text-center py-12 bg-slate-100/50 rounded-3xl border border-dashed border-slate-300">
                                                <p className="label-mono text-[10px] opacity-40 uppercase font-black">Waiting for incoming signal...</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                
                            </div>

                            {/* CTA / Quick Access */}
                            <div className="p-10 border-t-2 border-[var(--groove-dark)] bg-[var(--surface-warm)] shrink-0">
                                <div className="hardware-well rounded-3xl p-8 bg-slate-900 border-b-4 border-slate-950 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden group/cta shadow-well">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-3xl rounded-full" />
                                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/10 blur-3xl rounded-full" />
                                    
                                    <div className="relative z-10 text-center md:text-left space-y-2">
                                        <h4 className="text-3xl font-black text-white uppercase tracking-tighter leading-tight">Join the exhibition</h4>
                                        <p className="label-mono text-xs text-indigo-400 font-bold uppercase tracking-widest opacity-60 group-hover/cta:opacity-100 transition-opacity">Explore {displayName}&apos;s full artistic portfolio</p>
                                    </div>

                                    <button 
                                        onClick={() => router.push(`/u/${slug}/exhibition`)}
                                        className="hardware-btn group z-10"
                                    >
                                        <div className="hardware-cap bg-white px-10 py-5 rounded-[2rem] flex items-center gap-4 group-hover:bg-slate-50 transition-all border border-black/5">
                                            <span className="font-black text-slate-900 uppercase tracking-[0.25em] text-xs">Enter World</span>
                                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
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
                            className="w-full max-w-md bg-white rounded-[48px] p-10 shadow-2xl relative overflow-hidden"
                            onClick={e => e.stopPropagation()}
                        >
                            {!visitor && !member && !showVisitorPanel ? (
                                <GuestAuth 
                                    onSuccess={(data) => {
                                        setVisitor(data)
                                        localStorage.setItem('visitor_data', JSON.stringify(data))
                                        setShowVisitorPanel(true)
                                    }}
                                />
                            ) : showVisitorPanel && visitor ? (
                                <VisitorCenter guest={visitor} onLogout={() => { setVisitor(null); localStorage.removeItem('visitor_data'); setShowVisitorPanel(false) }} />
                            ) : (
                                <form onSubmit={handleSendMessage}>
                                    <h2 className="text-3xl font-black text-slate-900 mb-2 uppercase tracking-tighter">New Transmission</h2>
                                    <p className="label-mono text-[10px] font-black uppercase tracking-widest text-slate-400 mb-8 border-b border-slate-100 pb-4">
                                        Sending as {member?.name || visitor?.name}
                                    </p>
                                    
                                    <textarea 
                                        value={msgText}
                                        onChange={e => setMsgText(e.target.value)}
                                        placeholder="Type your message here..."
                                        className="w-full h-40 bg-slate-50 border-2 border-slate-100 rounded-3xl p-6 text-slate-800 font-medium focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all resize-none mb-8"
                                        required
                                    />
                                    
                                    <button 
                                        disabled={sending || !msgText.trim()}
                                        className="hardware-btn w-full group"
                                    >
                                        <div className="hardware-cap bg-indigo-600 py-5 rounded-[2rem] flex items-center justify-center gap-3 text-white group-hover:bg-indigo-700 transition-all disabled:grayscale">
                                            <Send className="w-4 h-4" />
                                            <span className="font-black uppercase tracking-widest text-xs">{sending ? 'Sending...' : 'Transmit Signal'}</span>
                                        </div>
                                    </button>
                                </form>
                            )}
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

