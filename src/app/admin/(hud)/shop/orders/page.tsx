'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { Package, Coins, History, Fan, RefreshCw, Clock, AlertCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { BausteinAdminNavbar } from '@/components/BausteinAdminNavbar'
import { useI18n } from '@/contexts/I18nContext'
import { format } from 'date-fns'
import Image from 'next/image'
import { clsx } from 'clsx'

import { useAuthSession } from '@/hooks/useAuthSession'

type Order = {
    id: string
    itemName: string
    itemIcon: string | null
    costCoins: number
    status: string
    createdAt: string
}

export default function OrdersPage() {
    const [orders, setOrders] = useState<Order[]>([])
    const [loading, setLoading] = useState(true)
    const { t } = useI18n()
    const router = useRouter()
    const { isAdmin, loading: _sessionLoading } = useAuthSession()

    useEffect(() => {
        if (!_sessionLoading && !isAdmin) {
            router.push('/admin/shop')
            return
        }
        if (isAdmin) fetchOrders()
    }, [isAdmin, _sessionLoading, router])

    const fetchOrders = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/shop/orders')
            if (res.ok) setOrders(await res.json())
        } catch (_e) {
            console.error(_e)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-[#D1CDBC] relative flex flex-col font-sans selection:bg-amber-100 selection:text-amber-900 text-slate-900">
            {/* Background Texture Overlay */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('/grid.png')] bg-repeat z-0" />
            
            <BausteinAdminNavbar 
                onBack={() => router.push('/admin/shop')}
                actions={
                    <div className="flex items-center gap-2 md:gap-3">
                        <button 
                            onClick={fetchOrders} 
                            disabled={loading}
                            className="hardware-btn group"
                            title="REFRESH_MANIFEST"
                        >
                            <div className="hardware-well w-9 h-9 md:w-11 md:h-11 rounded-lg bg-[#DADBD4] shadow-well flex items-center justify-center relative active:translate-y-0.5 overflow-hidden transition-all group-hover:bg-[#C8C4B0]">
                                <div className="hardware-cap absolute inset-1 bg-white group-hover:bg-amber-50 rounded-lg shadow-cap flex items-center justify-center border border-black/5">
                                    <RefreshCw className={clsx("w-3.5 h-3.5 md:w-4 md:h-4 text-slate-400 group-hover:text-amber-500 transition-all duration-1000", loading && "animate-spin text-amber-500")} />
                                </div>
                            </div>
                        </button>
                    </div>
                }
            />

            <main className="relative z-10 flex-1 overflow-y-auto p-4 md:p-12 pb-32 max-w-5xl mx-auto w-full hide-scrollbar">
                {(loading || _sessionLoading) ? (
                    <div className="flex flex-col items-center justify-center h-80 gap-6">
                        <div className="hardware-well w-14 h-14 rounded-xl flex items-center justify-center bg-[#DADBD4] shadow-well animate-pulse">
                            <Fan className="w-6 h-6 text-purple-400 animate-spin" />
                        </div>
                        <p className="label-mono text-[9px] font-black text-slate-400 uppercase tracking-widest animate-pulse">{t('common.loading')}</p>
                    </div>
                ) : orders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 md:py-48 text-center hardware-well bg-[#DADBD4]/20 rounded-[4rem] border border-black/5 shadow-inner relative overflow-hidden">
                        {/* Decorative HUD Markers */}
                        <div className="absolute top-8 left-8 w-12 h-12 border-l-2 border-t-2 border-slate-300 opacity-20" />
                        <div className="absolute bottom-8 right-8 w-12 h-12 border-r-2 border-b-2 border-slate-300 opacity-20" />

                        {/* Empty State HUD */}
                        <div className="hardware-well w-32 h-32 rounded-[2.5rem] bg-[#DADBD4] flex items-center justify-center mb-10 shadow-well relative group overflow-hidden">
                            <div className="hardware-cap absolute inset-2 bg-white rounded-[2rem] shadow-cap flex items-center justify-center border border-black/5">
                                <History className="w-12 h-12 text-slate-200 stroke-[3px] group-hover:text-amber-500/20 transition-all duration-1000" />
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
                                <Package className="w-8 h-8 text-slate-300 opacity-30" />
                                {t('parent.noOrders')}
                                <Package className="w-8 h-8 text-slate-300 opacity-30 rotate-180" />
                            </h2>
                            <div className="flex items-center justify-center gap-4">
                                <span className="label-mono text-[10px] font-black text-amber-600/40 uppercase tracking-[0.5em]">SYSTEM_MANIFEST_VOID</span>
                                <div className="w-2 h-2 rounded-full bg-amber-500/20 animate-ping" />
                                <span className="label-mono text-[10px] font-black text-amber-600/40 uppercase tracking-[0.5em]">NULL_REGISTRY_LOG</span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col gap-6">
                        {/* Summary HUD Header */}
                        <div className="flex items-center justify-between px-6 mb-2">
                            <div className="flex items-center gap-4">
                                <div className="w-1.5 h-6 bg-amber-500 rounded-full" />
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] leading-none mb-1">ARCHIVE_MANIFEST</span>
                                    <span className="text-xl font-black text-slate-800 tracking-tighter uppercase italic">{orders.length} ACTIVE_RECORDS</span>
                                </div>
                            </div>
                            <div className="hidden md:flex gap-4">
                                <div className="flex flex-col items-end">
                                    <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">SYSTEM_VERSION</span>
                                    <span className="text-[10px] font-black text-slate-500 label-mono">v4.0.12-HUD</span>
                                </div>
                            </div>
                        </div>

                        <div className="grid gap-8">
                            {orders.map((order, idx) => (
                                <motion.div
                                    key={order.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ 
                                        opacity: 1, 
                                        x: 0,
                                        transition: { delay: idx * 0.05, duration: 0.5 }
                                    }}
                                    className="group relative"
                                >
                                    <div className="hardware-well flex-1 p-5 lg:p-6 flex flex-col md:flex-row items-center gap-8 rounded-[2.5rem] bg-[#DADBD4]/80 shadow-well border border-black/5 hover:bg-[#DADBD4] transition-all duration-500 relative overflow-hidden">
                                        <div className="absolute top-0 left-0 w-32 h-px bg-gradient-to-r from-white/20 to-transparent" />
                                        <div className="absolute top-0 left-0 w-px h-32 bg-gradient-to-b from-white/20 to-transparent" />

                                        <div className="w-28 h-28 shrink-0 hardware-well p-2 rounded-[1.5rem] bg-[#C8C4B0] shadow-well border border-black/10 flex items-center justify-center text-5xl relative group-hover:scale-105 transition-all duration-500">
                                            <div className="absolute inset-0.5 bg-gradient-to-br from-black/5 to-transparent rounded-xl z-20 pointer-events-none" />
                                            <div className="w-full h-full bg-white/40 rounded-xl flex items-center justify-center overflow-hidden relative">
                                                {order.itemIcon?.startsWith('http') || order.itemIcon?.startsWith('/') ? (
                                                    <Image 
                                                        src={order.itemIcon} 
                                                        alt={order.itemName} 
                                                        fill
                                                        className="object-cover transition-transform group-hover:scale-110 duration-700" 
                                                    />
                                                ) : (
                                                    <span className="drop-shadow-2xl relative z-10">{order.itemIcon || '🎁'}</span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex-1 min-w-0 flex flex-col gap-5">
                                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                                                <div className="flex flex-col gap-1.5">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                                        <span className="text-[9px] font-black text-amber-700 uppercase tracking-[0.3em] label-mono">LOGISTICS_RECORD_ID: {order.id.slice(0, 8)}</span>
                                                    </div>
                                                    <h4 className="font-black text-2xl md:text-3xl text-slate-800 tracking-tighter uppercase italic leading-none truncate">{order.itemName}</h4>
                                                </div>

                                                <div className="flex items-center gap-4">
                                                    <div className="h-10 px-5 flex items-center gap-3 border-b-2 border-black/10 relative label-mono">
                                                        <Coins className="w-4 h-4 text-amber-500" />
                                                        <span className="text-xl font-black text-slate-800 tracking-tighter">{order.costCoins}</span>
                                                    </div>

                                                    <div className={clsx(
                                                        "h-10 px-5 hardware-well rounded-full flex items-center gap-2.5 border transition-all",
                                                        order.status === 'COMPLETED' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-700" :
                                                        order.status === 'REFUNDED' ? "bg-rose-500/10 border-rose-500/20 text-rose-700" :
                                                        "bg-amber-500/10 border-amber-500/20 text-amber-700"
                                                    )}>
                                                        <div className={clsx(
                                                            "w-1.5 h-1.5 rounded-full animate-pulse",
                                                            order.status === 'COMPLETED' ? "bg-emerald-500" : 
                                                            order.status === 'REFUNDED' ? "bg-rose-500" : "bg-amber-500"
                                                        )} />
                                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] label-mono leading-none">
                                                            {order.status === 'PENDING' ? t('order.status.pending') :
                                                             order.status === 'COMPLETED' ? t('order.status.completed') :
                                                             order.status === 'REFUNDED' ? t('order.status.refunded') : order.status}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap items-center gap-x-8 gap-y-4 pt-4 border-t border-black/5">
                                                <div className="flex flex-col">
                                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">DEPLOYMENT_TIMESTAMP</span>
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                                                        <span className="label-mono text-[10px] font-black text-slate-600 uppercase tracking-widest leading-none">
                                                            {format(new Date(order.createdAt), 'yyyy.MM.dd HH:mm:ss')}
                                                        </span>
                                                    </div>
                                                </div>
                                                
                                                <div className="flex flex-col">
                                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">REGistry_record_path</span>
                                                    <span className="label-mono text-[10px] font-black text-slate-500 uppercase italic">/VAR/MOD_SHOP/LOCAL_AUDIT_LOG_ENTRY</span>
                                                </div>
                                                
                                                <div className="flex-1" />
                                                
                                                <div className="flex items-center gap-3 group-hover:translate-x-1 transition-transform cursor-pointer opacity-30 group-hover:opacity-100 group/inspect">
                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest group-hover/inspect:text-amber-600 transition-colors">INSPECT_MANIFEST</span>
                                                    <div className="w-7 h-7 rounded-lg hardware-well bg-[#DADBD4] flex items-center justify-center group-hover/inspect:bg-[#C8C4B0] transition-colors">
                                                        <AlertCircle className="w-3.5 h-3.5 text-slate-400 group-hover/inspect:text-amber-600 transition-colors" />
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
