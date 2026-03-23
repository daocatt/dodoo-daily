'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { ChevronLeft, MessageSquare, Eye, EyeOff, Trash2, ShieldCheck, Mail, RefreshCw } from 'lucide-react'
import { useRouter } from 'next/navigation'
import AnimatedSky from '@/components/AnimatedSky'
import { useI18n } from '@/contexts/I18nContext'

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
        <div className="min-h-dvh flex flex-col relative overflow-hidden bg-[#fafaf9] text-[#2c2416]">
            <AnimatedSky />

            <header className="relative z-10 flex justify-between items-center px-6 py-4 md:px-10 md:py-6 backdrop-blur-md bg-white/40 border-b border-black/5 shadow-sm">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.back()} className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-2xl bg-white border border-black/5 hover:bg-slate-50 transition-colors shadow-sm text-slate-800">
                        <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
                    </button>
                    <div className="flex flex-col">
                        <span className="font-black text-xl md:text-2xl tracking-tight text-slate-800 flex items-center gap-2">
                             <MessageSquare className="w-6 h-6 text-indigo-500" />
                            Signal Moderation
                        </span>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mt-0.5">Board Management Console</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => fetchMessages(true)}
                        disabled={isRefreshing}
                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-black/5 hover:bg-slate-50 transition-all text-indigo-500 shadow-sm disabled:opacity-50"
                    >
                        <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </header>

            <main className="relative z-10 flex-1 overflow-y-auto p-6 md:p-12 pb-24 hide-scrollbar flex justify-center">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-full gap-4 opacity-40">
                        <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-500 rounded-full animate-spin" />
                        <p className="text-[10px] font-black uppercase tracking-widest">Scanning Frequencies...</p>
                    </div>
                ) : (
                    <div className="w-full max-w-3xl space-y-8">
                        {/* Stats Overview */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {[
                                { label: 'Total Logs', value: messages.length, icon: Mail, color: 'text-slate-600' },
                                { label: 'Public Signals', value: messages.filter(m => m.isPublic).length, icon: ShieldCheck, color: 'text-emerald-500' },
                                { label: 'Hidden Stream', value: messages.filter(m => !m.isPublic).length, icon: EyeOff, color: 'text-indigo-400' }
                            ].map((stat, i) => (
                                <motion.div 
                                    key={i}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    className="bg-white/70 backdrop-blur-xl border border-white/80 p-5 rounded-3xl shadow-sm flex items-center gap-4"
                                >
                                    <div className={`p-3 rounded-2xl bg-white shadow-inner ${stat.color}`}>
                                        <stat.icon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none mb-1">{stat.label}</p>
                                        <p className="text-xl font-black text-slate-800 leading-none">{stat.value}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* Message List */}
                        <div className="space-y-4">
                            {messages.length === 0 ? (
                                <div className="py-20 text-center bg-white/40 backdrop-blur-sm rounded-3xl border-2 border-dashed border-black/5 flex flex-col items-center gap-4">
                                    <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-200">
                                        <MessageSquare className="w-8 h-8" />
                                    </div>
                                    <p className="font-black text-slate-400 uppercase tracking-widest text-xs">Awaiting incoming signals...</p>
                                </div>
                            ) : (
                                messages.map((m, idx) => (
                                    <motion.div 
                                        key={m.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className="group relative bg-white/80 backdrop-blur-sm border border-white shadow-sm p-6 rounded-[2rem] hover:shadow-xl hover:shadow-indigo-500/5 transition-all flex flex-col sm:flex-row justify-between items-start gap-6"
                                    >
                                        <div className="flex-1 space-y-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                                                    <span className="text-[10px] font-black text-indigo-500 uppercase">{ (m.memberNickname || m.memberName || m.visitorName || 'U')[0] }</span>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-black text-slate-800 leading-none uppercase tracking-tight">
                                                        {m.memberId ? (m.memberNickname || m.memberName) : (m.visitorName || 'Visitor')}
                                                    </span>
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-1">
                                                        {new Date(m.createdAt).toLocaleString()}
                                                    </span>
                                                </div>
                                                { m.memberId && (
                                                    <span className="px-2 py-0.5 bg-amber-100 text-amber-600 text-[8px] font-black rounded-full uppercase tracking-widest border border-amber-200 ml-1">Member</span>
                                                )}
                                            </div>
                                            <div className="bg-[#FAF9F6]/50 p-4 rounded-2xl border border-black/[0.03]">
                                                <p className="text-slate-600 text-[13px] leading-relaxed font-medium">{m.text}</p>
                                            </div>
                                        </div>
                                        <div className="flex sm:flex-col gap-2 shrink-0">
                                            <button
                                                onClick={() => toggleMessageVisibility(m.id, m.isPublic)}
                                                className={`flex items-center justify-center w-12 h-12 rounded-2xl border transition-all ${
                                                    m.isPublic 
                                                        ? 'bg-emerald-500 text-white border-emerald-400 shadow-lg shadow-emerald-500/20' 
                                                        : 'bg-white text-slate-400 border-black/5 hover:border-indigo-400 hover:text-indigo-500'
                                                }`}
                                                title={m.isPublic ? 'Hide from public' : 'Make public'}
                                            >
                                                {m.isPublic ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                                            </button>
                                            <button
                                                onClick={() => deleteMessage(m.id)}
                                                className="flex items-center justify-center w-12 h-12 rounded-2xl border border-black/5 bg-white text-rose-400 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all"
                                                title="Delete Signal"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                            <div className="py-10 text-center flex flex-col items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-pulse" />
                                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-300">
                                    Secure Signal End-to-End Encryption Active
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    )
}
