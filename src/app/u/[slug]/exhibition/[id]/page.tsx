'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'motion/react'
import { ArrowLeft, Loader2, Heart, Eye, Share2, Coins, Disc, User, ShieldAlert, CheckCircle, ChevronRight, X, User as UserIcon, Maximize2, History } from 'lucide-react'
import Image from 'next/image'
import { useI18n } from '@/contexts/I18nContext'
import NatureBackground from '@/components/NatureBackground'
import PanelHeader from '@/components/PanelHeader'
import Link from 'next/link'
import ShareButton from '@/components/public/ShareButton'
import GuestAuth from '@/components/public/GuestAuth'
import VisitorCenter from '@/components/public/VisitorCenter'
import AuthGate from '@/components/public/AuthGate'
import { useAuthSession } from '@/hooks/useAuthSession'

type ArtworkDetail = {
    id: string
    title: string
    imageUrl: string
    priceRMB: number
    priceCoins: number
    isSold: boolean
    isFeatured: boolean
    createdAt: number
    albumId: string | null
    albumTitle: string | null
    isPublic: boolean
    user: {
        name: string
        nickname: string | null
        slug: string
        avatarUrl: string | null
    }
    likes: number
    views: number
    exhibitionDescription: string | null
    thumbnailMedium?: string | null
    thumbnailLarge?: string | null
    buyerId?: string | null
    buyerMemberId?: string | null
}

export default function ArtworkDetailPage() {
    const params = useParams()
    const { t, locale } = useI18n()
    const [artwork, setArtwork] = useState<ArtworkDetail | null>(null)
    const [loading, setLoading] = useState(true)
    const [showCollectModal, setShowCollectModal] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [success, setSuccess] = useState(false)
    const [isLiking, setIsLiking] = useState(false)
    const [hasLiked, setHasLiked] = useState(false)
    const [visitor, setVisitor] = useState<{ id: string; name: string; currency: number; phone?: string; email?: string; address?: string } | null>(null)
    const [member, setMember] = useState<{ id: string; name: string; nickname?: string; currency: number } | null>(null)
    const [showVisitorPanel, setShowVisitorPanel] = useState(false)
    const [isLightboxOpen, setIsLightboxOpen] = useState(false)

    // Contact info
    const [contactName, setContactName] = useState('')
    const [contactPhone, setContactPhone] = useState('')
    const [contactEmail, setContactEmail] = useState('')
    const [shippingAddress, setShippingAddress] = useState('')
    const [useSavedAddress, setUseSavedAddress] = useState(true)

    const [systemStatus, setSystemStatus] = useState({ disableVisitorLogin: false, disableVisitorRegistration: false })

    const id = params?.id as string
    const slug = params?.slug as string

    useEffect(() => {
        const stored = localStorage.getItem('visitor_data')
        if (stored) {
            try { 
                const v = JSON.parse(stored)
                setVisitor(v) 
                if (v) {
                    setContactName(v.name || '')
                    setContactPhone(v.phone || '')
                    setContactEmail(v.email || '')
                    setShippingAddress(v.address || '')
                }
            } catch { }
        }

        fetch('/api/system/settings')
            .then(res => res.json())
            .then(data => setSystemStatus({
                disableVisitorLogin: data.disableVisitorLogin ?? false,
                disableVisitorRegistration: data.disableVisitorRegistration ?? false
            }))

        // Fetch Member Session
        fetch('/api/stats')
            .then(res => res.ok ? res.json() : null)
            .then(data => {
                if (data && (data.userId || data.id)) {
                    setMember({
                        id: data.userId || data.id,
                        name: data.name,
                        nickname: data.nickname,
                        currency: data.coins || data.currency || 0
                    })
                }
            })
            .catch(() => {})
    }, [])

    useEffect(() => {
        if (!id) return
        const fetchData = async () => {
            try {
                const res = await fetch(`/api/public/artworks/${id}`)
                if (res.ok) {
                    setArtwork(await res.json())
                    // Check if already liked in this browser
                    if (localStorage.getItem(`artwork_liked_${id}`)) {
                        setHasLiked(true)
                    }
                }
            } catch (err) {
                console.error(err)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [id])

    const handleLike = async () => {
        if (isLiking || hasLiked) return
        setIsLiking(true)

        try {
            const res = await fetch(`/api/public/artworks/${id}/like`, { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    guestId: visitor?.id,
                    memberId: member?.id
                })
            })
            if (res.ok) {
                const data = await res.json()
                setArtwork(prev => prev ? { ...prev, likes: data.likes } : null)
                setHasLiked(true)
                // Persist like status in local storage for instant feedback
                localStorage.setItem(`artwork_liked_${id}`, 'true')
            }
        } catch (err) {
            console.error(err)
        } finally {
            setIsLiking(false)
        }
    }

    const handleCollect = async (e: React.FormEvent) => {
        e.preventDefault()
        if (visitor && visitor.currency < artwork!.priceCoins) return
        
        setSubmitting(true)

        try {
            const res = await fetch('/api/public/collect', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    artworkId: id,
                    guestId: visitor?.id,
                    memberId: member?.id,
                    guestName: member?.name || visitor?.name || contactName.trim(),
                    guestPhone: visitor?.phone || contactPhone.trim(),
                    paymentType: (visitor || member) ? 'COINS' : 'RMB',
                    contactName: contactName.trim() || member?.name || visitor?.name,
                    contactPhone: contactPhone.trim(),
                    contactEmail: contactEmail.trim(),
                    shippingAddress: member ? 'INTERNAL_FAMILY_MEMBER' : ((useSavedAddress ? visitor?.address : shippingAddress.trim()) || shippingAddress.trim())
                })
            })

            if (res.ok) {
                const data = await res.json()
                if (visitor && data.newBalance !== undefined) {
                    const updated = { ...visitor, currency: data.newBalance }
                    setVisitor(updated)
                    localStorage.setItem('visitor_data', JSON.stringify(updated))
                }
                setSuccess(true)
                setArtwork(prev => prev ? { ...prev, isSold: true } : null)
            } else {
                const errData = await res.json()
                alert(errData.error || 'Collection failed')
            }
        } catch (err) {
            console.error(err)
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) {
        return (
            <div className="h-dvh flex items-center justify-center app-bg-pattern">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
                    <span className="label-mono uppercase tracking-widest text-xs opacity-40">Connecting to Artifact...</span>
                </div>
            </div>
        )
    }

    if (!artwork) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500">
                <User className="w-12 h-12 mb-4 opacity-20" />
                <p>Artwork not found.</p>
            </div>
        )
    }

    const artistDisplayName = artwork.user.nickname || artwork.user.name

    return (
        <main className="min-h-dvh relative selection:bg-indigo-500/20 pb-20">
            <NatureBackground />
            
            <div className="relative z-10 flex flex-col items-center py-12 px-4 md:px-8">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="baustein-panel w-full max-w-7xl flex flex-col shadow-[0_40px_120px_rgba(0,0,0,0.3)] bg-[var(--surface-warm)] relative rounded-[2rem] overflow-hidden"
                >
                    <PanelHeader id={`ART#${id?.slice(0, 8)}`} systemName="ARCHIVE DETAIL" />
                    
                    <div className="flex-1 flex flex-col lg:grid lg:grid-cols-12 min-h-0">
                        {/* Left Side: Artwork Media */}
                        <div className="lg:col-span-12 xl:col-span-6 p-6 md:p-14 bg-[var(--well-bg)] flex flex-col items-center justify-center relative overflow-hidden min-h-[500px] border-r-2 border-[var(--groove-dark)]">
                            <div className="absolute inset-0 pointer-events-none opacity-[0.03] app-bg-pattern z-0" />
                            <Link 
                                href={`/u/${slug}/exhibition`}
                                className="inline-flex items-center gap-2 text-slate-400 hover:text-indigo-600 font-bold mb-8 group transition-colors absolute top-8 left-8 z-20"
                            >
                                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                                Back to Exhibition
                            </Link>
                            
                            <motion.div 
                                onClick={() => setIsLightboxOpen(true)}
                                whileHover={{ scale: 1.01 }}
                                className="relative w-full max-w-xl aspect-[4/5] md:aspect-[3/4] rounded-none overflow-hidden border-4 border-slate-600 bg-slate-900 group max-h-[75vh] mx-auto z-10 cursor-zoom-in group shadow-[12px_12px_0px_#94a3b8]"
                            >
                                <Image 
                                    src={artwork.thumbnailLarge || artwork.imageUrl || '/placeholder.png'} 
                                    alt={artwork.title}
                                    fill
                                    className="object-cover group-hover:scale-110 transition-transform duration-[2000ms]"
                                    priority
                                />
                                {artwork.isFeatured && (
                                    <div className="absolute top-6 left-6 z-20">
                                        <div className="px-5 py-2 bg-amber-500 text-white label-mono text-xs font-black rounded-xl shadow-2xl uppercase tracking-[0.2em] flex items-center gap-2 border-2 border-white/50 backdrop-blur-md">
                                            <User className="w-4 h-4 fill-white" />
                                            {t('gallery.detail.featured')}
                                        </div>
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-30">
                                    <Maximize2 className="w-8 h-8 text-white opacity-60" />
                                </div>
                                
                                <div className="absolute bottom-6 right-6 flex gap-2 z-40">
                                    <ShareButton 
                                        title={artwork.title} 
                                        displayName={artistDisplayName}
                                        avatarUrl={artwork.user.avatarUrl || undefined}
                                    />
                                </div>
                            </motion.div>
                        </div>

                        {/* Right Side: Information */}
                        <motion.div 
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="lg:col-span-12 xl:col-span-6 p-8 md:p-14 md:pt-16 flex flex-col bg-[var(--surface-warm)]"
                        >
                            <div className="inline-flex items-center gap-2 mb-4">
                                <div className="w-10 h-10 rounded-xl overflow-hidden border-2 border-[var(--groove-dark)] p-0.5 relative bg-white">
                                    {artwork.user.avatarUrl ? (
                                        <Image src={artwork.user.avatarUrl} alt="Avatar" width={40} height={40} className="w-full h-full object-cover rounded-lg" />
                                    ) : (
                                        <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                                            <UserIcon className="w-4 h-4 text-slate-300" />
                                        </div>
                                    )}
                                </div>
                                <span className="font-black text-slate-500 text-xs uppercase tracking-widest">{artistDisplayName}</span>
                            </div>

                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 leading-none mb-4 lowercase tracking-tighter">
                                {artwork.title}
                            </h1>

                            {artwork.albumTitle && (
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest mb-6">
                                    <User className="w-3 h-3" />
                                    {artwork.albumTitle}
                                </div>
                            )}

                            <div className="flex items-center gap-6 mb-12 border-b-2 border-slate-200/50 pb-8">
                                <div className="flex items-center gap-2 group cursor-pointer" onClick={handleLike}>
                                    <Heart className={`w-4 h-4 transition-all ${hasLiked ? 'text-red-600 fill-red-600 scale-125' : 'text-slate-300 group-hover:text-red-400'}`} />
                                    <span className={`text-[10px] font-black uppercase tracking-widest ${hasLiked ? 'text-red-600' : 'text-slate-400'}`}>
                                        {artwork.likes} {t('public.stats.likes') || 'Likes'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Eye className="w-4 h-4 text-blue-500" />
                                    <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">
                                        {artwork.views} {t('public.stats.views') || 'Views'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 ml-auto">
                                    <History className="w-4 h-4 text-slate-300" />
                                    <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">
                                        {new Date(artwork.createdAt).toLocaleDateString(locale === 'zh-CN' ? 'zh-CN' : 'en-US', { year: 'numeric', month: 'short' })}
                                    </span>
                                </div>
                            </div>

                            {artwork.exhibitionDescription && (
                                <div className="mb-12 relative">
                                    <User className="absolute -top-4 -left-4 w-12 h-12 text-indigo-50/50 -z-10" />
                                    <div className="bg-indigo-50/30 p-8 rounded-[32px] border border-indigo-50/50">
                                        <p className="text-xl md:text-2xl font-medium text-slate-700 leading-relaxed italic font-serif">
                                            &ldquo;{artwork.exhibitionDescription}&rdquo;
                                        </p>
                                    </div>
                                </div>
                            )}

                            <div className="mb-12 hardware-well bg-slate-100/30 p-6 rounded-2xl border border-slate-200/50 shadow-well">
                                <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-2">Acquisition Price</p>
                                <div className="flex items-center gap-3">
                                    <Coins className="w-8 h-8 text-[#ef4444]" />
                                    <span className="text-4xl font-black text-[#ef4444] tracking-tight">{artwork.priceCoins} </span>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex flex-col gap-4">
                                {/* Purchase Logic - NEW HARD-WELL DESIGN */}
                                {!artwork.isSold ? (
                                    <button 
                                        onClick={() => {
                                            if (visitor || member) {
                                                setShowCollectModal(true)
                                            } else {
                                                setShowVisitorPanel(false)
                                                setShowCollectModal(true)
                                            }
                                        }}
                                        className="hardware-btn group w-full mb-6"
                                    >
                                        <div className="hard-well-well rounded-[32px] p-1.5 bg-slate-950 shadow-inner">
                                            <div className="hard-well-cap bg-gradient-to-b from-slate-800 to-slate-900 text-white py-5 rounded-[28px] font-black tracking-[0.2em] uppercase text-sm flex items-center justify-center gap-4 border-t border-white/10 group-hover:from-indigo-900 group-hover:to-slate-900 transition-all shadow-lg active:translate-y-1">
                                                <Disc className="w-5 h-5 animate-spin-slow text-indigo-400" />
                                                {t('public.collect')} — {artwork.priceCoins}
                                            </div>
                                        </div>
                                    </button>
                                ) : (member?.id === artwork.buyerMemberId || (visitor && visitor.id === artwork.buyerId)) ? (
                                    <div className="text-center py-6 px-8 bg-emerald-50/50 rounded-2xl border-2 border-emerald-100 flex flex-col items-center justify-center gap-2 mb-8 shadow-inner">
                                        <div className="w-12 h-12 bg-emerald-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200">
                                            <CheckCircle className="w-6 h-6" />
                                        </div>
                                        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.3em] mt-2">
                                            Ownership: Confirmed
                                        </span>
                                    </div>
                                ) : (
                                    <div className="hardware-well bg-slate-950 p-8 rounded-3xl flex flex-col items-center justify-center gap-3 border-4 border-[#C8C4B0] shadow-well mb-10 text-center relative overflow-hidden group">
                                        <div className="absolute inset-0 opacity-5 pointer-events-none app-bg-pattern" />
                                        <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center border border-white/5 relative mb-2">
                                            <ShieldAlert className="w-6 h-6 text-amber-500 animate-pulse" />
                                            <div className="absolute inset-0 bg-amber-500/10 blur-xl animate-pulse rounded-full" />
                                        </div>
                                        <div className="flex flex-col gap-1.5">
                                            <span className="label-mono text-[8px] font-black text-slate-500 uppercase tracking-[0.3em]">Protocol: ARCHIVED_SECURE</span>
                                            <p className="text-white font-black text-sm uppercase tracking-[0.15em] leading-tight">
                                                Stored in a Private Collection
                                            </p>
                                        </div>
                                        <div className="mt-4 flex items-center gap-1.5 opacity-20">
                                            <div className="w-1 h-1 rounded-full bg-slate-400" />
                                            <div className="w-8 h-0.5 bg-slate-800" />
                                            <div className="w-1 h-1 rounded-full bg-slate-400" />
                                        </div>
                                    </div>
                                )}
                                
                                {!artwork.isSold && (
                                    <p className="text-center text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-8">
                                        Physical collection available upon request
                                    </p>
                                )}

                                {/* Visitor Login Box - ONLY for unlogged users */}
                                {!visitor && !member && (
                                    <div className="mt-auto pt-8 border-t border-slate-100 text-center">
                                        {systemStatus.disableVisitorLogin ? (
                                            <div className="text-center p-6 bg-slate-50 rounded-2xl border border-slate-100">
                                                <ShieldAlert className="w-6 h-6 text-rose-400 mx-auto mb-2" />
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                                    {t('public.loginClosed') || 'Visitor terminal offline'}
                                                </p>
                                            </div>
                                        ) : (
                                            <>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-4">
                                                    {systemStatus.disableVisitorRegistration 
                                                        ? t('public.loginPromptLimited') 
                                                        : t('public.loginPrompt')}
                                                </p>
                                                <button 
                                                    onClick={() => {
                                                        setShowVisitorPanel(false)
                                                        setShowCollectModal(true)
                                                    }}
                                                    className="hardware-btn group w-full block"
                                                >
                                                    <div className="hardware-well h-24 w-full rounded-2xl overflow-hidden relative">
                                                        <div className="hardware-cap absolute inset-2 bg-[#E8E8E4] rounded-xl flex items-center px-8 justify-between group-hover:bg-white transition-all shadow-sm active:translate-y-0.5">
                                                            <div className="flex items-center gap-4 min-w-0">
                                                                <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center border border-amber-100 shrink-0 shadow-inner">
                                                                    <UserIcon className="w-6 h-6 text-amber-500" />
                                                                </div>
                                                                <span className="font-black text-slate-800 tracking-tight uppercase whitespace-nowrap">
                                                                    {systemStatus.disableVisitorRegistration 
                                                                        ? t('public.loginActionLimited') 
                                                                        : t('public.loginAction')}
                                                                </span>
                                                            </div>
                                                            <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-amber-500 transition-colors shrink-0" />
                                                        </div>
                                                    </div>
                                                </button>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                </motion.div>
            </div>

            {/* Lightbox Overlay */}
            <AnimatePresence>
                {isLightboxOpen && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 md:p-12 cursor-zoom-out"
                        onClick={() => setIsLightboxOpen(false)}
                    >
                        <motion.button 
                            className="absolute top-8 right-8 text-white/50 hover:text-white transition-colors"
                            onClick={() => setIsLightboxOpen(false)}
                        >
                            <X className="w-8 h-8" />
                        </motion.button>
                        
                        <motion.div 
                            layoutId="artwork-image"
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="relative w-full h-full max-w-6xl max-h-[90vh] rounded-2xl overflow-hidden shadow-2xl"
                            onClick={e => e.stopPropagation()}
                        >
                            <Image 
                                src={artwork.imageUrl || '/placeholder.png'} 
                                alt={artwork.title}
                                fill
                                className="object-contain"
                            />
                        </motion.div>
                        
                        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 px-6 py-2 bg-white/10 backdrop-blur-md border border-white/10 rounded-full text-white/80 label-mono text-xs uppercase tracking-widest font-black">
                            {artwork.title}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Collect Modal */}
            <AnimatePresence>
                {showCollectModal && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-xl"
                        onClick={() => !success && setShowCollectModal(false)}
                    >
                        <motion.div 
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="w-full max-w-md bg-white rounded-[48px] p-10 md:p-12 shadow-2xl relative overflow-hidden"
                            onClick={e => e.stopPropagation()}
                        >
                            <AnimatePresence mode="wait">
                                {!success ? (
                                    <>
                                        {showVisitorPanel && visitor ? (
                                            <VisitorCenter 
                                                guest={visitor} 
                                                onLogout={() => {
                                                    setVisitor(null)
                                                    localStorage.removeItem('visitor_data')
                                                    setShowVisitorPanel(false)
                                                }}
                                                onUpdateCurrency={(val) => {
                                                    const updated = { ...visitor, currency: val }
                                                    setVisitor(updated)
                                                    localStorage.setItem('visitor_data', JSON.stringify(updated))
                                                }}
                                            />
                                        ) : !visitor && !member ? (
                                            <GuestAuth 
                                                disableRegistration={systemStatus.disableVisitorRegistration}
                                                onSuccess={(data) => {
                                                    setVisitor(data)
                                                    localStorage.setItem('visitor_data', JSON.stringify(data))
                                                    setContactName(data.name || '')
                                                    setContactPhone(data.phone || '')
                                                    setContactEmail(data.email || '')
                                                    setShippingAddress(data.address || '')
                                                    setShowVisitorPanel(true)
                                                }}
                                            />
                                        ) : (
                                            <form 
                                                key="form"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                onSubmit={handleCollect}
                                            >
                                                <h2 className="text-3xl font-black text-slate-900 mb-2">Nearly Yours</h2>
                                                <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] border-b border-slate-100 pb-6 mb-8">
                                                    {member ? 'Direct collection for family members' : 'Confirm your collection of this masterpiece'}
                                                </p>
                                                
                                                <div className="space-y-6 mb-10">
                                                    <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                                                        <div className="flex justify-between items-center mb-4">
                                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Account Balance</span>
                                                            <div className="flex items-center gap-1">
                                                                <Coins className="w-3.5 h-3.5 text-amber-500" />
                                                                <span className="font-black text-slate-900">{(member || visitor)!.currency}</span>
                                                            </div>
                                                        </div>
                                                        <div className="flex justify-between items-center border-t border-slate-200 pt-4">
                                                            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Required Coins</span>
                                                            <div className="flex items-center gap-1">
                                                                <Coins className="w-3.5 h-3.5 text-indigo-600" />
                                                                <span className="font-black text-slate-900">{artwork.priceCoins}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {!member ? (
                                                    <div className="space-y-4 mb-8">
                                                        <div>
                                                            <label className="block text-xs font-bold text-slate-500 mb-1">Contact Name *</label>
                                                            <input 
                                                                type="text" 
                                                                value={contactName} 
                                                                onChange={e => setContactName(e.target.value)} 
                                                                className="w-full bg-slate-50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 border border-slate-100"
                                                                required
                                                            />
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div>
                                                                <label className="block text-xs font-bold text-slate-500 mb-1">Phone</label>
                                                                <input 
                                                                    type="tel" 
                                                                    value={contactPhone} 
                                                                    onChange={e => setContactPhone(e.target.value)} 
                                                                    className="w-full bg-slate-50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 border border-slate-100"
                                                                    required={!contactEmail}
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="block text-xs font-bold text-slate-500 mb-1">Email</label>
                                                                <input 
                                                                    type="email" 
                                                                    value={contactEmail} 
                                                                    onChange={e => setContactEmail(e.target.value)} 
                                                                    className="w-full bg-slate-50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 border border-slate-100"
                                                                    required={!contactPhone}
                                                                />
                                                            </div>
                                                        </div>
                                                        <p className="text-[10px] text-slate-400">At least one contact method (Phone or Email) must be provided.</p>
                                                        
                                                        <div>
                                                            <div className="flex items-center justify-between mb-1">
                                                                <label className="block text-xs font-bold text-slate-500">Shipping Address (Optional)</label>
                                                                {visitor?.address && (
                                                                    <label className="flex items-center gap-2 cursor-pointer">
                                                                        <input 
                                                                            type="checkbox" 
                                                                            checked={useSavedAddress} 
                                                                            onChange={e => setUseSavedAddress(e.target.checked)} 
                                                                            className="rounded text-indigo-600 focus:ring-indigo-500"
                                                                        />
                                                                        <span className="text-xs text-slate-500 font-bold">Use default</span>
                                                                    </label>
                                                                )}
                                                            </div>
                                                            {!useSavedAddress || !visitor?.address ? (
                                                                <textarea 
                                                                    value={shippingAddress} 
                                                                    onChange={e => setShippingAddress(e.target.value)} 
                                                                    className="w-full bg-slate-50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 border border-slate-100 h-20 resize-none"
                                                                    placeholder="Enter detailed shipping info..."
                                                                ></textarea>
                                                            ) : (
                                                                <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl text-sm text-slate-600">
                                                                    {visitor.address}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="mb-8 p-6 bg-green-50 rounded-3xl border border-green-100 flex items-center gap-3">
                                                       <CheckCircle className="w-5 h-5 text-green-600" />
                                                       <p className="text-xs text-green-700 font-bold">Family member discount applied: No shipping info required.</p>
                                                    </div>
                                                )}

                                                <button 
                                                    disabled={submitting || (member || visitor)!.currency < artwork.priceCoins || (!member && (!contactEmail && !contactPhone || !contactName))}
                                                    className="w-full py-5 bg-indigo-600 text-white rounded-3xl font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 uppercase tracking-widest disabled:grayscale"
                                                >
                                                    {submitting ? 'Processing...' : (member || visitor)!.currency < artwork.priceCoins ? 'Insufficient Coins' : 'Confirm & Collect'}
                                                </button>
                                                
                                                {!member && (
                                                    <div className="text-center mt-6">
                                                        <button 
                                                            type="button" 
                                                            onClick={() => setShowVisitorPanel(true)}
                                                            className="text-slate-400 font-bold text-[10px] uppercase tracking-widest hover:text-indigo-600"
                                                        >
                                                            Manage Coins & View Profile
                                                        </button>
                                                    </div>
                                                )}
                                            </form>
                                        )}
                                    </>
                                ) : (
                                    <motion.div 
                                        key="success"
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="text-center py-8"
                                    >
                                        <div className="w-24 h-24 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                                            <CheckCircle className="w-12 h-12" />
                                        </div>
                                        <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Collection Requested!</h2>
                                        <p className="text-slate-500 font-medium mb-10">We&apos;ve received your inquiry. The artist&apos;s family will contact you soon about the physical poster collection.</p>
                                        <button 
                                            onClick={() => {
                                                setShowCollectModal(false)
                                                setSuccess(false)
                                            }}
                                            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest"
                                        >
                                            Done
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            <style jsx global>{`
            .shadow-well {
                box-shadow: inset 0 2px 4px rgba(0,0,0,0.15), 0 1px 1px rgba(255,255,255,0.05);
            }
            .app-bg-pattern {
                background-image: radial-gradient(var(--groove-dark) 1px, transparent 1px);
                background-size: 24px 24px;
            }
            .hard-well-well {
                box-shadow: inset 0 3px 6px rgba(0,0,0,0.3), 0 1px 1px rgba(255,255,255,0.1);
            }
            .hard-well-cap {
                text-shadow: 0 2px 4px rgba(0,0,0,0.3);
            }
            .hardware-btn:active .hard-well-cap {
                transform: translateY(2px);
                box-shadow: inset 0 2px 4px rgba(0,0,0,0.5);
            }
        `}</style>
    </main>
    )
}
