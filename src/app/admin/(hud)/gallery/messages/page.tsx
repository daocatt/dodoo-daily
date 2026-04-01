'use client'

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { MessageSquare, Eye, EyeOff, Trash2, ShieldCheck, Mail, RefreshCw, Loader2, ChevronLeft, User, Calendar, Shield } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { BausteinAdminNavbar } from '@/components/BausteinAdminNavbar'
import { useI18n } from '@/contexts/I18nContext'
import { clsx } from 'clsx'

export default function MessageModerationPage() {
    const { t } = useI18n()
    const router = useRouter()
    
    const [messages, setMessages] = useState<any[]>([]) // eslint-disable-line @typescript-eslint/no-explicit-any
    const [loading, setLoading] = useState(true)
    const [isRefreshing, setIsRefreshing] = useState(false)

    const fetchMessages = async (silent = false) => {
        if (!silent) setLoading(true)
        else setIsRefreshing(true)
        try {
            const res = await fetch('/api/auth/profile/messages')
            const data = await res.json()
            if (!data.error) setMessages(data)
        } catch (_err) {
            console.error(_err)
        } finally {
            setLoading(false)
            setIsRefreshing(false)
        }
    }

    useEffect(() => {
        fetchMessages()
    }, [])

    const toggleMessageVisibility = async (id: string, currentStatus: boolean) => {
        try {
            const res = await fetch('/api/auth/profile/messages', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, isPublic: !currentStatus }),
            })
            if (res.ok) fetchMessages(true)
        } catch (_err) {
            console.error(_err)
        }
    }

    const deleteMessage = async (id: string) => {
        if (!confirm(t('common.confirmDelete') || 'Are you sure?')) return
        try {
            const res = await fetch(`/api/auth/profile/messages?id=${id}`, {
                method: 'DELETE',
            })
            if (res.ok) fetchMessages(true)
        } catch (_err) {
            console.error(_err)
        }
    }

    return (
        <div className="min-h-screen bg-[#D1CDBC] relative flex flex-col font-sans selection:bg-indigo-100 selection:text-indigo-900 text-slate-900">
            <BausteinAdminNavbar 
                onBack={() => router.push('/admin/gallery')}
                actions={
                    <button 
                        onClick={() => fetchMessages(true)}
                        disabled={isRefreshing}
                        className="hardware-btn group"
                    >
                        <div className="hardware-well h-10 md:h-12 px-3 md:px-5 rounded-xl flex items-center gap-2 bg-[#DADBD4] shadow-well active:translate-y-0.5 overflow-hidden relative border-b-2 border-slate-400/20">
                            <div className="hardware-cap absolute inset-1 md:inset-1.5 bg-indigo-500 rounded-lg flex items-center justify-center transition-all shadow-cap group-hover:bg-indigo-600 active:translate-y-0.5" />
                            <RefreshCw className={clsx("w-4 h-4 md:w-5 md:h-5 text-white relative z-10", isRefreshing && "animate-spin")} />
                            <span className="hidden md:inline label-mono text-[11px] font-black text-white uppercase tracking-widest relative z-10 drop-shadow-sm">
                                {isRefreshing ? 'REFRESHING...' : 'REFRESH'}
                            </span>
                        </div>
                    </button>
                }
            />

            <main className="relative z-10 flex-1 overflow-y-auto p-6 md:p-8 pb-32 hide-scrollbar flex justify-center">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-64 grayscale opacity-20">
                        <Loader2 className="w-10 h-10 animate-spin text-slate-900" />
                        <p className="label-mono text-[10px] font-black uppercase tracking-widest mt-4">Scanning Frequencies...</p>
                    </div>
                ) : (
                    <div className="w-full max-w-4xl space-y-10">
                        {/* Stats Overview */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {[
                                { label: 'Total Logs', value: messages.length, icon: Mail, color: 'bg-slate-500' },
                                { label: 'Public Signals', value: messages.filter(m => m.isPublic).length, icon: ShieldCheck, color: 'bg-emerald-500' },
                                { label: 'Hidden Stream', value: messages.filter(m => !m.isPublic).length, icon: EyeOff, color: 'bg-indigo-400' }
                            ].map((stat, i) => (
                                <motion.div 
                                    key={i}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    className="hardware-well p-1 rounded-[1.5rem] bg-[#DADBD4]/60 shadow-well border border-black/5"
                                >
                                    <div className="hardware-well p-4 rounded-[1.25rem] bg-white/40 shadow-inner flex items-center gap-4">
                                        <div className="hardware-well w-10 h-10 rounded-xl bg-[#DADBD4] shadow-well relative overflow-hidden flex items-center justify-center shrink-0">
                                            <div className={clsx("hardware-cap absolute inset-1 rounded-lg flex items-center justify-center shadow-cap", stat.color)}>
                                                <stat.icon className="w-4 h-4 text-white" />
                                            </div>
                                        </div>
                                        <div className="min-w-0">
                                            <p className="label-mono text-[10px] font-black uppercase tracking-widest text-slate-500 leading-none mb-1 shadow-sm">{stat.label}</p>
                                            <p className="text-2xl font-black text-slate-900 leading-none tracking-tighter">{stat.value}</p>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* List Header */}
                        <div className="flex items-center gap-4 opacity-60 ml-2">
                             <MessageSquare className="w-4 h-4 text-slate-500" />
                             <h2 className="label-mono text-[11px] font-black uppercase tracking-[0.3em] text-slate-600">Secure Frequency Log / INBOUND</h2>
                        </div>

                        {/* Message List */}
                        <div className="space-y-6">
                            {messages.length === 0 ? (
                                <div className="py-24 text-center hardware-well rounded-[2.5rem] bg-slate-900/[0.03] border-4 border-dashed border-slate-900/10 flex flex-col items-center gap-4">
                                    <div className="hardware-well w-16 h-16 rounded-full bg-[#DADBD4] shadow-well flex items-center justify-center text-slate-300">
                                        <MessageSquare className="w-8 h-8" />
                                    </div>
                                    <div>
                                        <p className="font-black text-slate-400 uppercase tracking-[0.2em] text-sm">Frequency Silent</p>
                                        <p className="label-mono text-[9px] font-black text-slate-400/60 uppercase tracking-widest mt-1">Awaiting incoming signals...</p>
                                    </div>
                                </div>
                            ) : (
                                messages.map((m, idx) => (
                                    <motion.div 
                                        key={m.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className="group relative"
                                    >
                                        <div className="hardware-well p-1.5 rounded-[2rem] bg-[#DADBD4]/60 shadow-well border border-black/5">
                                            <div className="hardware-well p-6 rounded-[1.75rem] bg-white/50 shadow-inner flex flex-col md:flex-row items-start md:items-center gap-6">
                                                
                                                {/* Left Info Panel */}
                                                <div className="flex-1 min-w-0 flex flex-col gap-4">
                                                    <div className="flex items-center flex-wrap gap-3">
                                                        <div className="hardware-well w-10 h-10 rounded-xl bg-[#DADBD4] shadow-well relative overflow-hidden flex items-center justify-center shrink-0">
                                                            <div className="hardware-cap absolute inset-1 bg-white rounded-lg flex items-center justify-center shadow-cap">
                                                                <User className="w-4 h-4 text-slate-400" />
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-black text-sm text-slate-800 uppercase tracking-tight leading-none">
                                                                    {m.memberId ? (m.memberNickname || m.memberName) : (m.visitorName || 'VISITOR UNIT')}
                                                                </span>
                                                                { m.memberId && (
                                                                    <div className="px-1.5 py-0.5 bg-amber-500 text-white text-[8px] font-black rounded-md uppercase tracking-widest flex items-center gap-1 shadow-sm">
                                                                        <Shield className="w-2 h-2" />
                                                                        MEMBER
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-1.5 mt-1 opacity-50">
                                                                <Calendar className="w-3 h-3" />
                                                                <span className="label-mono text-[9px] font-bold text-slate-500 uppercase tracking-tighter mt-0.5">
                                                                    {new Date(m.createdAt).toLocaleString()}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Message Content Well */}
                                                    <div className="hardware-well p-4 rounded-xl bg-[#FAF9F6]/80 shadow-well-sm border border-black/[0.05] relative overflow-hidden">
                                                        <div className="absolute top-0 left-0 w-1 h-full bg-slate-200" />
                                                        <p className="text-slate-700 text-[13px] md:text-sm leading-relaxed font-bold uppercase tracking-tight">{m.text}</p>
                                                    </div>
                                                </div>

                                                {/* Actions Well */}
                                                <div className="flex md:flex-col gap-3 shrink-0 self-stretch md:self-auto justify-end md:justify-center border-t md:border-t-0 md:border-l border-black/5 pt-4 md:pt-0 md:pl-6">
                                                    <button
                                                        onClick={() => toggleMessageVisibility(m.id, m.isPublic)}
                                                        className="hardware-btn group/vis"
                                                    >
                                                        <div className="hardware-well h-12 w-12 rounded-xl flex items-center justify-center bg-[#DADBD4] shadow-well active:translate-y-0.5 relative">
                                                            <div className={clsx(
                                                                "hardware-cap absolute inset-1 rounded-lg flex items-center justify-center transition-all shadow-cap active:translate-y-0.5",
                                                                m.isPublic ? "bg-emerald-500 group-hover/vis:bg-emerald-600" : "bg-white group-hover/vis:bg-slate-50"
                                                            )}>
                                                                {m.isPublic ? <Eye className="w-5 h-5 text-white" /> : <EyeOff className="w-5 h-5 text-slate-400" />}
                                                            </div>
                                                        </div>
                                                    </button>
                                                    <button
                                                        onClick={() => deleteMessage(m.id)}
                                                        className="hardware-btn group/del"
                                                    >
                                                        <div className="hardware-well h-12 w-12 rounded-xl flex items-center justify-center bg-[#DADBD4] shadow-well active:translate-y-0.5 relative">
                                                            <div className="hardware-cap absolute inset-1 bg-white group-hover/del:bg-rose-50 rounded-lg flex items-center justify-center transition-all shadow-cap active:translate-y-0.5">
                                                                <Trash2 className="w-5 h-5 text-rose-400" />
                                                            </div>
                                                        </div>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                            
                            <div className="py-16 text-center flex flex-col items-center gap-4">
                                <div className="flex items-center gap-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-[pulse_0.8s_infinite]" />
                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500/60 animate-[pulse_1s_infinite]" />
                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500/30 animate-[pulse_1.2s_infinite]" />
                                </div>
                                <p className="label-mono text-[9px] font-black uppercase tracking-[0.4em] text-slate-400 opacity-60">
                                    SECURE SIGNAL HUB CONSOLE // END OF LINE
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    )
}
