'use client'

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, Clock, Hash, Smartphone, Globe, Loader2, User, ChevronRight } from 'lucide-react'
import { format } from 'date-fns'
import { useI18n } from '@/contexts/I18nContext'

interface LoginLogEntry {
    id: string
    userId: string
    userName: string
    userNickname: string | null
    userAvatar: string | null
    ip: string | null
    userAgent: string | null
    status: string
    createdAt: number
}

export default function LoginLog({ userId }: { userId?: string }) {
    const { t } = useI18n()
    const [logs, setLogs] = useState<LoginLogEntry[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const url = userId ? `/api/admin/login-logs?userId=${userId}` : '/api/admin/login-logs'
        fetch(url)
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setLogs(data)
                setLoading(false)
            })
            .catch(err => {
                console.error(err)
                setLoading(false)
            })
    }, [userId])

    if (loading) return (
        <div className="flex items-center justify-center p-12">
            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
        </div>
    )

    if (logs.length === 0) return (
        <div className="bg-white rounded-3xl border border-slate-100 p-12 flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300">
                <Clock className="w-8 h-8" />
            </div>
            <p className="font-bold text-slate-400">No login history found yet.</p>
        </div>
    )

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between px-2 mb-2">
                <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-indigo-500" />
                    Security Logs
                </h3>
                <span className="text-[10px] uppercase font-black tracking-widest text-slate-400 bg-slate-50 px-3 py-1 rounded-full">Recent 100 Entries</span>
            </div>

            <div className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] border border-white/80 shadow-xl overflow-hidden divide-y divide-slate-100">
                {logs.map((log, i) => (
                    <motion.div 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.03 }}
                        key={log.id}
                        className="p-4 md:p-6 group hover:bg-slate-50/50 transition-colors flex items-center gap-4 md:gap-6"
                    >
                        {/* Avatar Cell */}
                        <div className="relative shrink-0">
                            <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl overflow-hidden border-2 border-white shadow-sm ring-1 ring-slate-100">
                                <img src={log.userAvatar || '/dog.svg'} alt={log.userName} className="w-full h-full object-cover" />
                            </div>
                            <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${log.status === 'SUCCESS' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        </div>

                        {/* Content Cell */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="font-black text-slate-800 truncate">{log.userNickname || log.userName}</span>
                                <span className="text-[10px] text-slate-400 font-bold px-1.5 py-0.5 bg-slate-100 rounded-md">ID: {log.userId.slice(0, 8)}</span>
                            </div>
                            
                            <div className="flex flex-wrap items-center gap-y-1 gap-x-4">
                                <span className="flex items-center gap-1.5 text-xs text-slate-500 font-bold whitespace-nowrap">
                                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                                    {format(new Date(log.createdAt), 'yyyy-MM-dd HH:mm:ss')}
                                </span>
                                <span className="flex items-center gap-1.5 text-xs text-slate-500 font-bold whitespace-nowrap">
                                    <Globe className="w-3.5 h-3.5 text-slate-400" />
                                    {log.ip || 'Unknown IP'}
                                </span>
                            </div>

                            {/* Device String - Simplified */}
                            <div className="mt-2 text-[10px] text-slate-400 font-medium truncate max-w-md hidden md:flex items-center gap-1.5 bg-slate-50/50 p-1 rounded-lg border border-slate-100/50">
                                <Smartphone className="w-3 h-3 text-slate-350" />
                                {log.userAgent || 'Unknown Device'}
                            </div>
                        </div>

                        {/* Status Icon */}
                        <div className="md:px-4 hidden sm:block">
                            <div className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-slate-100 text-slate-400 group-hover:bg-[#43aa8b]/10 group-hover:text-[#43aa8b] transition-colors">
                                {log.status}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    )
}
