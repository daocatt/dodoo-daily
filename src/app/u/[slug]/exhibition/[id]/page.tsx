'use client'

import React, { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'motion/react'
import { Palette, ArrowLeft, Heart, Calendar, Coins, User, CheckCircle, Download, Eye, Quote, ChevronRight, ShieldAlert } from 'lucide-react'
import Image from 'next/image'
import { useI18n } from '@/contexts/I18nContext'
import Link from 'next/link'
import ShareButton from '@/components/public/ShareButton'
import GuestAuth from '@/components/public/GuestAuth'
import VisitorCenter from '@/components/public/VisitorCenter'

type ArtworkDetail = {
    id: string
    title: string
    imageUrl: string
    priceRMB: number
    priceCoins: number
    isSold: boolean
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
    const [showVisitorPanel, setShowVisitorPanel] = useState(false)

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
    }, [])

    useEffect(() => {
        if (!id) return
        
        const fetchData = async () => {
            try {
                const res = await fetch(`/api/public/artworks/${id}`)
                if (res.ok) {
                    setArtwork(await res.json())
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
            const res = await fetch(`/api/public/artworks/${id}/like`, { method: 'POST' })
            if (res.ok) {
                const data = await res.json()
                setArtwork(prev => prev ? { ...prev, likes: data.likes } : null)
                setHasLiked(true)
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
                    guestName: visitor?.name || guestName.trim(),
                    guestPhone: visitor?.phone || guestPhone.trim(),
                    paymentType: visitor ? 'COINS' : 'RMB',
                    contactName: contactName.trim() || visitor?.name,
                    contactPhone: contactPhone.trim(),
                    contactEmail: contactEmail.trim(),
                    shippingAddress: (useSavedAddress ? visitor?.address : shippingAddress.trim()) || shippingAddress.trim()
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
            <div className="flex-1 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
        )
    }

    if (!artwork) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500">
                <Palette className="w-12 h-12 mb-4 opacity-20" />
                <p>Artwork not found.</p>
            </div>
        )
    }

    const artistDisplayName = artwork.user.nickname || artwork.user.name

    return (
        <div className="flex-1 overflow-y-auto hide-scrollbar pb-20 pt-12">
            <div className="max-w-7xl mx-auto px-6 md:px-20 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-start">
                
                {/* Left Side: Artwork Visuals */}
                <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="relative"
                >
                    <Link 
                        href={`/u/${slug}/exhibition`}
                        className="inline-flex items-center gap-2 text-slate-400 hover:text-indigo-600 font-bold mb-8 group transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        Back to Exhibition
                    </Link>

                    <div className="relative aspect-[4/5] md:aspect-[3/4] rounded-[48px] overflow-hidden shadow-2xl border-8 border-white bg-white group">
                        <Image 
                            src={artwork.thumbnailLarge || artwork.imageUrl || '/placeholder.png'} 
                            alt={artwork.title}
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-[2000ms]"
                        />
                        {artwork.isSold && (
                            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center">
                                <span className="bg-rose-500 text-white px-8 py-3 rounded-2xl font-black shadow-2xl skew-x-[-10deg] tracking-widest text-lg">COLLECTED</span>
                            </div>
                        )}
                        <div className="absolute bottom-6 right-6 flex gap-2">
                             <ShareButton 
                                title={artwork.title} 
                                displayName={artistDisplayName}
                                avatarUrl={artwork.user.avatarUrl || undefined}
                             />
                             {artwork.imageUrl && (
                                <a 
                                    href={artwork.imageUrl} 
                                    download={artwork.title}
                                    className="p-3 bg-indigo-600 rounded-2xl text-white hover:bg-indigo-700 transition-colors shadow-xl"
                                >
                                    <Download className="w-6 h-6" />
                                </a>
                             )}
                        </div>
                    </div>
                </motion.div>

                {/* Right Side: Information */}
                <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="pt-12"
                >
                    <div className="inline-flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-indigo-100 p-0.5 relative">
                            {artwork.user.avatarUrl ? (
                                <Image src={artwork.user.avatarUrl} alt="Avatar" width={32} height={32} className="w-full h-full object-cover rounded-full" />
                            ) : (
                                <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                                    <User className="w-3 h-3 text-slate-300" />
                                </div>
                            )}
                        </div>
                        <span className="font-black text-slate-400 text-xs uppercase tracking-widest">{artistDisplayName}</span>
                    </div>

                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 leading-none mb-4 lowercase tracking-tighter">
                        {artwork.title}
                    </h1>

                    {artwork.albumTitle && (
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest mb-6">
                            <Palette className="w-3 h-3" />
                            {artwork.albumTitle}
                        </div>
                    )}

                        <div className="flex items-center gap-6 mb-12 border-b border-slate-100 pb-8">
                            <div className="flex items-center gap-2 group cursor-pointer" onClick={handleLike}>
                                <Heart className={`w-4 h-4 transition-all ${hasLiked ? 'text-rose-500 fill-rose-500 scale-125' : 'text-slate-300 group-hover:text-rose-400'}`} />
                                <span className={`text-sm font-black uppercase tracking-widest ${hasLiked ? 'text-rose-600' : 'text-slate-500'}`}>
                                    {artwork.likes} Likes
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Eye className="w-4 h-4 text-blue-300" />
                                <span className="text-slate-500 text-sm font-bold uppercase tracking-widest">
                                    {artwork.views} Views
                                </span>
                            </div>
                            <div className="flex items-center gap-2 ml-auto">
                                <Calendar className="w-4 h-4 text-slate-300" />
                                <span className="text-slate-500 text-sm font-bold uppercase tracking-widest">
                                    {new Date(artwork.createdAt).toLocaleDateString(locale === 'zh-CN' ? 'zh-CN' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                                </span>
                            </div>
                        </div>

                    {artwork.exhibitionDescription && (
                        <div className="mb-12 relative">
                            <Quote className="absolute -top-4 -left-4 w-12 h-12 text-indigo-50/50 -z-10" />
                            <div className="bg-indigo-50/30 p-8 rounded-[32px] border border-indigo-50/50">
                                <p className="text-xl md:text-2xl font-medium text-slate-700 leading-relaxed italic font-serif">
                                    &ldquo;{artwork.exhibitionDescription}&rdquo;
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="mb-12">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Acquisition Price</p>
                        <div className="flex items-center gap-3">
                            <Coins className="w-8 h-8 text-indigo-600" />
                            <span className="text-4xl font-black text-slate-900 tracking-tight">{artwork.priceCoins} </span>
                            <span className="text-indigo-600 font-black text-xl">Coins</span>
                        </div>
                    </div>

                    {/* Actions */}
                    {!artwork.isSold ? (
                        <div className="flex flex-col gap-4">
                            <button 
                                onClick={() => setShowCollectModal(true)}
                                className="w-full py-5 bg-slate-900 text-white rounded-[32px] font-black text-lg shadow-xl shadow-slate-200 hover:scale-[1.02] active:scale-[0.98] transition-all uppercase tracking-widest"
                            >
                                {t('public.collect')}
                            </button>
                            <p className="text-center text-slate-400 text-xs font-medium">Acquiring this piece will result in a physical poster for collection.</p>
                        </div>
                    ) : (
                        <div className="p-8 bg-indigo-50 border border-indigo-100 rounded-[32px] flex flex-col items-center text-center gap-3">
                            <div className="p-4 bg-indigo-600 rounded-full text-white">
                                <CheckCircle className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-black text-slate-900">This work is now collected</h3>
                            <p className="text-slate-500 font-medium">It has found its way to a private collection. You can still admire it here.</p>
                        </div>
                    )}

                    {/* Visitor Portal Trigger */}
                    <div className="mt-8 pt-8 border-t border-slate-50">
                        {systemStatus.disableVisitorLogin ? (
                            <div className="text-center p-6 bg-slate-50 rounded-2xl border border-slate-100">
                                <ShieldAlert className="w-6 h-6 text-rose-400 mx-auto mb-2" />
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">访客系统暂时不对外开放</p>
                            </div>
                        ) : visitor ? (
                            <button 
                                onClick={() => {
                                    setShowVisitorPanel(true)
                                    setShowCollectModal(true)
                                }}
                                className="flex items-center gap-3 w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:bg-white hover:shadow-xl hover:border-indigo-100 transition-all"
                            >
                                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center font-black text-white text-sm">
                                    {visitor.name[0].toUpperCase()}
                                </div>
                                <div className="text-left">
                                    <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Logged in Visitor</p>
                                    <h4 className="font-black text-slate-800 uppercase tracking-tight">{visitor.name}</h4>
                                </div>
                                <div className="ml-auto flex items-center gap-2">
                                    <Coins className="w-4 h-4 text-amber-500" />
                                    <span className="font-black text-indigo-600 text-sm">{visitor.currency}</span>
                                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </button>
                        ) : (
                            <div className="text-center">
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-4">
                                    {systemStatus.disableVisitorRegistration ? '仅限老访客登录' : '想要收藏作品或充值点数？'}
                                </p>
                                <button 
                                    onClick={() => {
                                        setShowVisitorPanel(false)
                                        setShowCollectModal(true)
                                    }}
                                    className="px-8 py-3 bg-white border-2 border-slate-900 text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all shadow-sm"
                                >
                                    访客登录 {systemStatus.disableVisitorRegistration ? '' : '/ 注册'}
                                </button>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>

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
                                        ) : !visitor ? (
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
                                                    Confirm your collection of this masterpiece
                                                </p>

                                                <div className="space-y-6 mb-10">
                                                    <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                                                        <div className="flex justify-between items-center mb-4">
                                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Account Balance</span>
                                                            <div className="flex items-center gap-1">
                                                                <Coins className="w-3.5 h-3.5 text-amber-500" />
                                                                <span className="font-black text-slate-900">{visitor.currency}</span>
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
                                                            {visitor.address && (
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
                                                        {!useSavedAddress || !visitor.address ? (
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

                                                <button 
                                                    disabled={submitting || visitor.currency < artwork.priceCoins || (!contactEmail && !contactPhone) || !contactName}
                                                    className="w-full py-5 bg-indigo-600 text-white rounded-3xl font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 uppercase tracking-widest disabled:grayscale"
                                                >
                                                    {submitting ? 'Processing...' : visitor.currency < artwork.priceCoins ? 'Insufficient Coins' : 'Confirm & Collect'}
                                                </button>
                                                
                                                <div className="text-center mt-6">
                                                    <button 
                                                        type="button" 
                                                        onClick={() => setShowVisitorPanel(true)}
                                                        className="text-slate-400 font-bold text-[10px] uppercase tracking-widest hover:text-indigo-600"
                                                    >
                                                        Manage Coins & View Profile
                                                    </button>
                                                </div>
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
        </div>
    )
}
