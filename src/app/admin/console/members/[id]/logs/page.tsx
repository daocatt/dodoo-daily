'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { 
    History, Clock, Coins, Star, 
    Calendar, User
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import clsx from 'clsx'
import { BackButton } from '@/components/navbar/BackButton'

interface BalanceLog {
    id: string
    amount: number
    type: string
    reason: string
    balance: number
    createdAt: string
}

interface MemberInfo {
    id: string;
    name: string;
    nickname?: string;
    avatarUrl: string | null;
    role: string;
    stats?: {
        currency: number;
        goldStars: number;
    }
}

export default function MemberLogsPage() {
    const params = useParams()
    const router = useRouter()
    const userId = params.id as string
    
    const [logs, setLogs] = useState<BalanceLog[]>([])
    const [member, setMember] = useState<MemberInfo | null>(null)
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<'COINS' | 'STARS'>('COINS')

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [logsRes, membersRes] = await Promise.all([
                    fetch(`/api/parent/logs?userId=${userId}`),
                    fetch('/api/parent/children')
                ])
                
                if (logsRes.ok) {
                    const logsData = await logsRes.json()
                    setLogs(Array.isArray(logsData) ? logsData : [])
                }
                
                if (membersRes.ok) {
                    const membersData = await membersRes.json()
                    const found = membersData.find((m: MemberInfo) => m.id === userId)
                    if (found) setMember(found)
                }
            } catch (error) {
                console.error('Audit sync failure:', error)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [userId])

    if (loading) {
        return (
            <div className="min-h-[100dvh] bg-[#E2DFD2] flex flex-col items-center justify-center p-12">
                <div className="label-mono text-slate-500 font-black animate-pulse uppercase tracking-widest text-[11px]">Syncing Audit Feed...</div>
            </div>
        )
    }

    const filteredLogs = logs.filter(l => 
        activeTab === 'COINS' ? l.type === 'CURRENCY' : l.type === 'GOLD_STAR'
    )

    return (
        <div className="min-h-screen bg-[#E2DFD2] text-slate-900 selection:bg-indigo-100 pb-32">
            {/* Nav Chassis */}
            <div className="sticky top-0 z-[100] bg-[#E2DFD2]/90 backdrop-blur-xl border-b-2 border-[#D1CDBC] px-6 py-6 transition-all">
                <div className="max-w-4xl mx-auto flex items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <BackButton onBack={() => router.back()} />
                        
                        <div className="hidden sm:flex items-center gap-3 hardware-well px-4 h-11 rounded-xl bg-white/40 shadow-inner border border-[#D1CDBC]/30">
                            <User className="w-3.5 h-3.5 text-indigo-500" />
                            <div className="flex items-baseline gap-1.5">
                                <span className="label-mono text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Audit</span>
                                <span className="label-mono text-[11px] font-black text-slate-900 uppercase tracking-widest leading-none">
                                    {member?.nickname || member?.name}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex gap-2.5">
                            <div className="flex items-center gap-3 px-4 h-11 hardware-well rounded-xl bg-[#DADBD4] shadow-well border-b-2 border-amber-400/20">
                                <div className="text-right">
                                    <span className="label-mono text-[7px] text-slate-500 font-black tracking-widest uppercase block leading-none mb-1">COINS</span>
                                    <span className="text-lg font-black tabular-nums tracking-tighter leading-none">{member?.stats?.currency || 0}</span>
                                </div>
                                <Coins className="w-4 h-4 text-amber-500" />
                            </div>
                            <div className="flex items-center gap-3 px-4 h-11 hardware-well rounded-xl bg-[#DADBD4] shadow-well border-b-2 border-sky-400/20">
                                <div className="text-right">
                                    <span className="label-mono text-[7px] text-slate-500 font-black tracking-widest uppercase block leading-none mb-1">STARS</span>
                                    <span className="text-lg font-black tabular-nums tracking-tighter leading-none">{member?.stats?.goldStars || 0}</span>
                                </div>
                                <Star className="w-4 h-4 text-sky-500" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <main className="max-w-4xl mx-auto px-6 pt-10 space-y-12">
                {/* REFINED SLIDING SWITCHER - Internal LayoutId Architecture for Zero-Bug Radius */}
                <div className="flex flex-col items-center">
                    <div className="hardware-well p-1 bg-[#DADBD4] rounded-2xl shadow-well flex gap-1 w-full max-w-xs h-14 relative">
                        {/* Decorative internal grid */}
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,#000_1px,transparent_0)] bg-[size:20px_20px] opacity-[0.03] rounded-2xl overflow-hidden" />
                        
                        {[
                            { id: 'COINS', label: 'Coins Feed', icon: Coins, activeColor: 'text-amber-500' },
                            { id: 'STARS', label: 'Stars Feed', icon: Star, activeColor: 'text-sky-500' }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as 'COINS' | 'STARS')}
                                className={clsx(
                                    "relative flex-1 h-full flex items-center justify-center gap-3 transition-colors duration-300",
                                    "font-black text-[10px] uppercase tracking-[0.1em] label-mono focus:outline-none",
                                    activeTab === tab.id ? "text-slate-900" : "text-slate-400 hover:text-slate-500"
                                )}
                            >
                                {/* ACTIVE SLIDER PILL - Anchored to button geometry to fix rounding errors */}
                                <AnimatePresence>
                                    {activeTab === tab.id && (
                                        <motion.div 
                                            layoutId="audit-tab-active-pill"
                                            className="absolute inset-0 bg-white rounded-xl shadow-cap ring-1 ring-black/5 z-0"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ type: 'spring', bounce: 0.1, duration: 0.5 }}
                                        />
                                    )}
                                </AnimatePresence>

                                <tab.icon className={clsx(
                                    "w-4 h-4 transition-all duration-300 relative z-10",
                                    activeTab === tab.id ? tab.activeColor : "text-slate-300"
                                )} />
                                <span className="relative z-10">{tab.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Main Transaction Feed */}
                <div className="space-y-4 relative">
                    <AnimatePresence mode="popLayout">
                        {filteredLogs.length === 0 ? (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="hardware-well bg-[#DADBD4]/20 rounded-[2.5rem] p-24 flex flex-col items-center justify-center text-center space-y-4 border border-[#D1CDBC]/30"
                            >
                                <History className="w-10 h-10 text-slate-300 opacity-50 mb-2" />
                                <p className="label-mono text-slate-400 font-black uppercase tracking-widest text-[10px]">Registry Telemetry: NULL</p>
                            </motion.div>
                        ) : (
                            filteredLogs.map((log, index) => (
                                <motion.div
                                    key={log.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.03, type: 'spring', stiffness: 220, damping: 28 }}
                                    className="group"
                                >
                                    <div className="hardware-well p-1 rounded-[1.8rem] bg-[#DADBD4] shadow-well group-hover:bg-[#D1CDBC] transition-all">
                                        <div className="bg-white/95 rounded-[1.5rem] p-3.5 pr-6 flex items-center justify-between border-2 border-transparent group-hover:border-indigo-100 transition-all shadow-inner">
                                            <div className="flex items-center gap-6 md:gap-8">
                                                <div className={`w-14 h-14 hardware-well rounded-[1.2rem] flex items-center justify-center shadow-inner ${log.amount > 0 ? 'bg-emerald-50' : 'bg-rose-50'}`}>
                                                    <span className={`text-lg font-black leading-none tabular-nums tracking-tighter ${log.amount > 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                                                        {log.amount > 0 ? '+' : ''}{log.amount}
                                                    </span>
                                                </div>

                                                <div className="space-y-1.5 overflow-hidden">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className={`px-1.5 py-0.5 rounded-[4px] label-mono text-[7px] font-bold tracking-[0.1em] leading-none text-white ${log.amount > 0 ? 'bg-emerald-600' : 'bg-rose-600'}`}>
                                                            {log.amount > 0 ? 'ADD' : 'SUB'}
                                                        </div>
                                                        <h3 className="font-black text-slate-800 text-lg leading-none tracking-tighter uppercase whitespace-break-spaces truncate max-w-[180px] md:max-w-none">
                                                            {log.reason || 'S-LEVEL ADJ'}
                                                        </h3>
                                                    </div>
                                                    <div className="flex items-center gap-3.5 text-slate-400">
                                                        <div className="flex items-center gap-1.5 label-mono text-[9px] font-bold uppercase tracking-tight">
                                                            <Calendar className="w-3 h-3 opacity-60" />
                                                            {new Date(log.createdAt).toLocaleDateString(undefined, { month: 'short', day: '2-digit', year: 'numeric' })}
                                                        </div>
                                                        <div className="w-1 h-1 rounded-full bg-slate-200" />
                                                        <div className="flex items-center gap-1.5 label-mono text-[9px] font-bold uppercase tracking-tight">
                                                            <Clock className="w-3 h-3 opacity-60" />
                                                            {new Date(log.createdAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false })}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="text-right flex flex-col gap-1">
                                                <div className="flex items-center justify-end gap-2.5">
                                                    <span className="text-2xl font-black text-slate-900 tabular-nums tracking-tighter leading-none">{log.balance}</span>
                                                    <div className="w-7 h-7 hardware-well rounded-lg flex items-center justify-center bg-[#DADBD4] shadow-well translate-y-0.5 opacity-80">
                                                        {log.type === 'CURRENCY' ? <Coins className="w-3.5 h-3.5 text-amber-500" /> : <Star className="w-3.5 h-3.5 text-sky-500" />}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </AnimatePresence>
                    
                    <div className="pt-10 pb-6 flex flex-col items-center gap-3">
                        <div className="w-12 h-0.5 hardware-well bg-[#D1CDBC] rounded-full overflow-hidden">
                            <div className="w-1/3 h-full bg-indigo-600 animate-slide-infinite opacity-30" />
                        </div>
                        <span className="label-mono text-[7px] text-slate-400 font-black uppercase tracking-[0.4em] opacity-30 italic">End of Audit Log</span>
                    </div>
                </div>
            </main>

            <style jsx global>{`
                .label-mono { font-family: var(--font-geist-mono, monospace); }
                .shadow-cap { box-shadow: inset 0 2px 4px rgba(255,255,255,0.8), 0 2px 8px rgba(0,0,0,0.05); }
                @keyframes slide { from { transform: translateX(-100%); } to { transform: translateX(300%); } }
                .animate-slide-infinite { animation: slide 2s infinite linear; }
            `}</style>
        </div>
    )
}
