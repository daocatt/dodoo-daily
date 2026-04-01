'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { ChevronLeft, Sparkles, Heart, Clock, Fan, CheckCircle2, AlertCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { BausteinAdminNavbar } from '@/components/BausteinAdminNavbar'
import { useI18n } from '@/contexts/I18nContext'
import { format } from 'date-fns'
import Image from 'next/image'
import { clsx } from 'clsx'

import { useAuthSession } from '@/hooks/useAuthSession'

type Wish = {
    id: string
    name: string
    description: string | null
    imageUrl: string | null
    status: 'PENDING' | 'CONFIRMED' | 'REJECTED'
    addedToShopAt: number | null
    createdAt: string
}

export default function WishesPage() {
    const [wishes, setWishes] = useState<Wish[]>([])
    const [loading, setLoading] = useState(true)
    const { t } = useI18n()
    const router = useRouter()
    const { isAdmin, loading: _sessionLoading } = useAuthSession()

    useEffect(() => {
        if (!_sessionLoading && !isAdmin) {
            router.push('/admin/shop')
            return
        }
        if (isAdmin) fetchWishes()
    }, [isAdmin, _sessionLoading, router])

    const fetchWishes = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/shop/wishes')
            if (res.ok) setWishes(await res.json())
        } catch (_e) {
            console.error(_e)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-[#D1CDBC] relative flex flex-col font-sans selection:bg-purple-100 selection:text-purple-900 text-slate-900 overflow-hidden">
            {/* Background Texture Overlay */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('/grid.png')] bg-repeat z-0" />
            
            <BausteinAdminNavbar 
                onBack={() => router.push('/admin/shop')}
                actions={null}
            />

            <main className="relative z-10 flex-1 overflow-y-auto p-4 md:p-12 pb-32 max-w-5xl mx-auto w-full hide-scrollbar">
                {(loading || _sessionLoading) ? (
                    <div className="flex flex-col items-center justify-center h-80 gap-6">
                        <div className="hardware-well w-14 h-14 rounded-xl flex items-center justify-center bg-[#DADBD4] shadow-well animate-pulse">
                            <Fan className="w-6 h-6 text-purple-400 animate-spin" />
                        </div>
                        <p className="label-mono text-[9px] font-black text-slate-400 uppercase tracking-widest animate-pulse">{t('common.loading')}</p>
                    </div>
                ) : wishes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 md:py-48 text-center hardware-well bg-[#DADBD4]/20 rounded-[4rem] border border-black/5 shadow-inner relative overflow-hidden">
                        {/* Decorative HUD Markers */}
                        <div className="absolute top-8 left-8 w-12 h-12 border-l-2 border-t-2 border-slate-300 opacity-20" />
                        <div className="absolute bottom-8 right-8 w-12 h-12 border-r-2 border-b-2 border-slate-300 opacity-20" />

                        {/* Empty State HUD */}
                        <div className="hardware-well w-32 h-32 rounded-[2.5rem] bg-[#DADBD4] flex items-center justify-center mb-10 shadow-well relative group overflow-hidden">
                            <div className="hardware-cap absolute inset-2 bg-white rounded-[2rem] shadow-cap flex items-center justify-center border border-black/5">
                                <Sparkles className="w-12 h-12 text-slate-200 stroke-[3px] group-hover:text-purple-500/20 transition-all duration-1000" />
                            </div>
                            {/* Decorative Telemetry */}
                            <div className="absolute top-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                                <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                                <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                            </div>
                        </div>

                        <div className="flex flex-col gap-3">
                            <h2 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tighter uppercase italic drop-shadow-sm flex items-center justify-center gap-4">
                                <Heart className="w-8 h-8 text-slate-300 opacity-30" />
                                {t('shop.wishes.noWishes')}
                                <Heart className="w-8 h-8 text-slate-300 opacity-30 rotate-180" />
                            </h2>
                            <div className="flex items-center justify-center gap-4">
                                <span className="label-mono text-[10px] font-black text-purple-600/40 uppercase tracking-[0.5em]">WISH_REGISTRY_NULL</span>
                                <div className="w-2 h-2 rounded-full bg-purple-500/20 animate-ping" />
                                <span className="label-mono text-[10px] font-black text-purple-600/40 uppercase tracking-[0.5em]">Fulfillment_Log_Empty</span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col gap-10">
                        {/* Summary HUD Header */}
                        <div className="flex items-center justify-between px-6 mb-2">
                            <div className="flex items-center gap-4">
                                <div className="w-1.5 h-6 bg-purple-500 rounded-full" />
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] leading-none mb-1">FULFILLMENT_MANIFEST</span>
                                    <span className="text-xl font-black text-slate-800 tracking-tighter uppercase italic">{wishes.length} PENDING_WISHES</span>
                                </div>
                            </div>
                            <div className="hidden md:flex gap-4">
                                <div className="flex flex-col items-end">
                                    <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">REGISTRY_VER</span>
                                    <span className="text-[10px] font-black text-slate-500 label-mono">WIS_LOG_v1.2</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-12">
                            {wishes.map((wish, idx) => (
                                <motion.div
                                    key={wish.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ 
                                        opacity: 1, 
                                        x: 0,
                                        transition: { delay: idx * 0.05, duration: 0.5 }
                                    }}
                                    className="group relative"
                                >
                                    <div className="flex flex-col md:flex-row items-stretch gap-8 hardware-well p-6 lg:p-8 rounded-[2.5rem] bg-[#DADBD4]/80 shadow-well border border-black/5 hover:bg-[#DADBD4] transition-all duration-500 relative overflow-hidden">
                                        {/* Card Decoration */}
                                        <div className="absolute top-0 left-0 w-32 h-px bg-gradient-to-r from-white/20 to-transparent" />
                                        <div className="absolute top-0 left-0 w-px h-32 bg-gradient-to-b from-white/20 to-transparent" />

                                        {/* Left Side - Tactile Icon Panel */}
                                        <div className="md:w-64 w-full shrink-0 hardware-well p-4 rounded-[2rem] bg-[#DADBD4]/60 shadow-well border border-black/10 flex flex-col gap-4 group-hover:bg-[#DADBD4] transition-colors">
                                            <div className="aspect-square rounded-[1.5rem] bg-[#C8C4B0] overflow-hidden relative border border-black/10 flex items-center justify-center text-7xl shadow-inner group-hover:scale-[1.02] transition-transform duration-700">
                                                <div className="absolute inset-0 bg-gradient-to-br from-black/10 to-transparent z-10 pointer-events-none" />
                                                <div className="w-full h-full bg-white/40 rounded-xl flex items-center justify-center relative overflow-hidden">
                                                    {wish.imageUrl?.startsWith('http') || wish.imageUrl?.startsWith('/') ? (
                                                        <Image src={wish.imageUrl} alt={wish.name} fill className="object-cover transition-transform group-hover:scale-110 duration-700" />
                                                    ) : (
                                                        <span className="drop-shadow-2xl relative z-10 select-none grayscale-[0.2] group-hover:grayscale-0 transition-all">{wish.imageUrl || '✨'}</span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Status LED HUD */}
                                            <div className={clsx(
                                                "hardware-well w-full h-12 px-5 rounded-xl flex items-center justify-center gap-3 border-b-4 transition-all",
                                                wish.status === 'CONFIRMED' ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 shadow-[inset_0_2px_10px_rgba(16,185,129,0.1)]" :
                                                wish.status === 'REJECTED' ? "bg-rose-500/10 border-rose-500/30 text-rose-600 shadow-[inset_0_2px_10px_rgba(244,63,94,0.1)]" :
                                                "bg-amber-500/10 border-amber-500/30 text-amber-600 shadow-[inset_0_2px_10px_rgba(245,158,11,0.1)]"
                                            )}>
                                                <div className={clsx(
                                                    "w-2 h-2 rounded-full animate-pulse",
                                                    wish.status === 'CONFIRMED' ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" : 
                                                    wish.status === 'REJECTED' ? "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]" : "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]"
                                                )} />
                                                <span className="label-mono text-[10px] font-black uppercase tracking-[0.2em] whitespace-nowrap">
                                                    {wish.status === 'PENDING' ? 'PENDING_APPROVAL' :
                                                     wish.status === 'CONFIRMED' ? 'REGISTRY_CONFIRMED' :
                                                     wish.status === 'REJECTED' ? 'ENTRY_REJECTED' : wish.status}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Right Side - Manifest Details */}
                                        <div className="flex-1 min-w-0 flex flex-col gap-6 pt-2">
                                            <div className="flex flex-col gap-2">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-bounce" />
                                                    <span className="text-[9px] font-black text-purple-700 uppercase tracking-[0.3em] label-mono">WISH_REGISTRY_ENTRY: #{wish.id.slice(0, 8)}</span>
                                                </div>
                                                <h4 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tighter uppercase italic leading-none truncate">{wish.name}</h4>
                                            </div>

                                            <div className="hardware-well p-5 rounded-2xl bg-white/40 border border-black/5 shadow-inner relative group/desc hover:bg-white/60 transition-colors">
                                                <div className="absolute top-3 right-3 opacity-10 group-hover/desc:opacity-30 transition-opacity">
                                                    <AlertCircle className="w-4 h-4 text-purple-600" />
                                                </div>
                                                <p className="text-slate-600 text-sm leading-relaxed font-medium line-clamp-3">
                                                    {wish.description || 'No supplementary data provided for this request manifest.'}
                                                </p>
                                            </div>

                                            {/* Footer Telemetry */}
                                            <div className="mt-auto flex flex-wrap items-center gap-x-8 gap-y-4 pt-6 border-t border-black/5 opacity-50 group-hover:opacity-100 transition-opacity">
                                                <div className="flex flex-col">
                                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">REGistry_record_path</span>
                                                    <span className="label-mono text-[9px] font-black text-slate-500 uppercase italic">/VAR/MOD_SHOP/LOCAL_FULFILLMENT_REQUEST</span>
                                                </div>

                                                <div className="flex flex-col">
                                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">INITIAL_LOG_TIME</span>
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                                                        <span className="label-mono text-[10px] font-black text-slate-600 uppercase tracking-widest leading-none">
                                                            {format(new Date(wish.createdAt), 'yyyy.MM.dd HH:mm:ss')}
                                                        </span>
                                                    </div>
                                                </div>

                                                {wish.addedToShopAt && (
                                                    <div className="flex flex-col animate-in fade-in slide-in-from-left-2 duration-700">
                                                        <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest leading-none mb-1.5">INVENTORY_SYNC_LOG</span>
                                                        <div className="flex items-center gap-2">
                                                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                                            <span className="label-mono text-[10px] font-black text-emerald-600 uppercase tracking-widest leading-none">
                                                                {format(new Date(wish.addedToShopAt), 'yyyy.MM.dd')}
                                                            </span>
                                                        </div>
                                                    </div>
                                                )}
                                                
                                                <div className="flex-1" />
                                                
                                                <div className="flex items-center gap-3 group/inspect cursor-pointer hover:translate-x-1 transition-transform">
                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest group-hover/inspect:text-purple-600 transition-colors">AUDIT_LOG</span>
                                                    <div className="w-8 h-8 rounded-lg hardware-well bg-[#DADBD4] flex items-center justify-center group-hover/inspect:bg-[#C8C4B0] transition-colors">
                                                        <ChevronLeft className="w-4 h-4 text-slate-400 group-hover/inspect:text-purple-600 transition-colors rotate-180" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                )}
            </main>
        </div>
    )
}
