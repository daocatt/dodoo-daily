'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'motion/react'
import {
    Power,
    LayoutGrid,
    Settings,
    Cpu
} from 'lucide-react'
import Image from 'next/image'
import { useI18n } from '@/contexts/I18nContext'
import { clsx } from 'clsx'
import { usePathname } from 'next/navigation'
import versionData from '../../version.json'

interface Stats {
    userId: string
    name: string
    nickname?: string
    avatar?: string
    isParent: boolean
    coins: number
    goldStars: number
    role: string
    permissionRole: string
    systemName: string
}

export default function BausteinAdminNavbar() {
    const { locale, setLocale } = useI18n()
    const [stats, setStats] = useState<Stats | null>(null)
    const [status, setStatus] = useState('NOMINAL')

    const pathname = usePathname()

    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' })
            window.location.href = '/admin/login'
        } catch (_error) {
            window.location.href = '/admin/login'
        }
    }

    const fetchData = useCallback(async () => {
        try {
            const res = await fetch('/api/stats')
            if (res.ok) {
                const data = await res.json()
                setStats(data)
            } else if (res.status === 401) {
                handleLogout()
            }
        } catch (_err) {
            setStatus('DEGRADED')
        }
    }, [])

    useEffect(() => {
        const load = async () => {
            await fetchData()
        }
        load()
        const interval = setInterval(fetchData, 60000)
        return () => clearInterval(interval)
    }, [fetchData])

    if (!stats) return null

    return (
        <header className="sticky top-0 z-[100] w-full bg-transparent p-6 md:p-10 flex items-center justify-between font-sans select-none h-[100px] pointer-events-none">
            {/* Elements inside will need pointer-events-auto */}
            
            {/* Left Section: System Brand & Status */}
            <div className="flex items-center gap-6 relative z-10 pointer-events-auto">
                <div className="flex items-center gap-4">
                    <div className="hardware-btn group">
                        <Link href="/admin" className="hardware-well w-12 h-12 rounded-xl flex items-center justify-center bg-[#DADBD4] overflow-hidden p-1 shadow-well relative">
                            <div className="hardware-cap absolute inset-1.5 bg-white rounded-lg flex items-center justify-center group-hover:bg-indigo-50 transition-all shadow-cap active:translate-y-0.5">
                                <Image src="/dog.svg" alt="DoDoo" width={28} height={28} className="contrast-125" />
                            </div>
                        </Link>
                    </div>
                    <div className="hidden sm:flex flex-col justify-center">
                        <span className="text-[11px] font-black tracking-tighter text-slate-900 leading-none">
                            {stats.systemName.toUpperCase()}
                        </span>
                        <div className="flex items-center gap-3 mt-1.5">
                            <div className="flex items-center gap-1.5 bg-black/5 px-2 py-0.5 rounded border border-black/5 shadow-inner">
                                <div className={clsx(
                                    "w-1.5 h-1.5 rounded-full animate-pulse",
                                    status === 'NOMINAL' ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" : "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]"
                                )} />
                                <span className="label-mono text-[7px] font-black text-slate-600">DoDoo</span>
                            </div>
                            <div className="w-[1px] h-3 bg-black/10" />
                            <div className="flex items-center gap-1.5">
                                <Cpu className="w-3 h-3 text-slate-400" />
                                <span className="label-mono text-[7px] text-slate-400">Ver. {versionData.version}</span>
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            {/* Right Section: Instrument Panel (HUD) */}
            <div className="flex items-center gap-2 md:gap-5 relative z-10 pointer-events-auto">

                {/* Mode Toggle Shortcut (DASHBOARD <-> CONSOLE) */}
                {stats?.isParent && (
                    <Link 
                        href={pathname === '/admin' ? '/admin/console' : '/admin'} 
                        className="hardware-btn group"
                        title={pathname === '/admin' ? (locale === 'zh-CN' ? '控制台' : 'CONSOLE') : (locale === 'zh-CN' ? '后台首页' : 'MAIN_HUD')}
                    >
                        <div className="hardware-well w-12 h-12 rounded-xl flex items-center justify-center bg-[#DADBD4] shadow-well active:translate-y-0.5 overflow-hidden relative">
                            <div className="hardware-cap absolute inset-1.5 bg-white rounded-lg flex items-center justify-center group-hover:bg-indigo-50 transition-all shadow-cap active:translate-y-0.5">
                                {pathname === '/admin' ? (
                                    <Settings className="w-5 h-5 text-slate-600" />
                                ) : (
                                    <LayoutGrid className="w-5 h-5 text-emerald-600" />
                                )}
                            </div>
                        </div>
                    </Link>
                )}

                <div className="flex items-center gap-3">
                    {/* User Profile Trigger */}
                    <button 
                        onClick={() => window.location.href = stats.isParent ? '/admin/console?view=PROFILE' : '/admin/profile'}
                        className="hardware-btn group"
                        title={locale === 'zh-CN' ? '个人设置' : 'Profile Settings'}
                    >
                        <div className="hardware-well h-12 rounded-xl flex items-center bg-[#DADBD4] shadow-well active:translate-y-0.5 overflow-hidden relative">
                            {/* Mechanical Cap Layer */}
                            <div className="hardware-cap absolute inset-1.5 bg-white rounded-lg flex items-center transition-all shadow-cap group-hover:bg-slate-50 active:translate-y-0.5" />
                            
                            {/* Label Content Layer */}
                            <div className="relative z-10 flex items-center px-4 gap-3 pointer-events-none">
                                <div className="w-8 h-8 rounded-md overflow-hidden shrink-0 relative">
                                    {stats.avatar ? (
                                        <Image src={stats.avatar} alt="User" fill className="object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-[10px] font-black text-slate-400">
                                            {stats.name[0].toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                <div className="hidden md:flex flex-col items-start min-w-0">
                                    <span className="text-[10px] font-black text-slate-900 leading-none truncate max-w-[80px] uppercase tracking-tight">{stats.nickname || stats.name}</span>
                                    <div className="flex items-center gap-1 mt-1">
                                        <div className="w-1 h-1 rounded-full bg-indigo-500 shadow-[0_0_4px_rgba(99,102,241,0.5)]" />
                                        <span className="label-mono text-[6px] font-black text-slate-500 uppercase tracking-widest leading-none">{stats.permissionRole}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </button>

                    {/* Language Switcher - Mechanical Slide Switch */}
                    <div 
                        onClick={() => setLocale(locale === 'en' ? 'zh-CN' : 'en')}
                        className="hardware-btn cursor-pointer group"
                        title={locale === 'en' ? 'Switch to Chinese' : '切换为英文'}
                    >
                        <div className="hardware-well w-[56px] h-10 rounded-xl bg-[#DADBD4] shadow-well relative flex items-center px-1 overflow-hidden">
                            {/* Static Labels */}
                            <div className="absolute inset-x-2.5 inset-y-0 flex items-center justify-between pointer-events-none">
                                <span className={clsx(
                                    "text-[8px] font-black transition-colors duration-300", 
                                    locale === 'zh-CN' ? "text-slate-900" : "text-slate-400/50"
                                )}>CN</span>
                                <span className={clsx(
                                    "text-[8px] font-black transition-colors duration-300", 
                                    locale === 'en' ? "text-slate-900" : "text-slate-400/50"
                                )}>EN</span>
                            </div>
                            {/* Sliding Selector Cap */}
                            <motion.div 
                                className="hardware-cap w-6 h-7 bg-white rounded-lg shadow-cap z-10 flex items-center justify-center p-0.5"
                                animate={{ x: locale === 'en' ? 21 : 0 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                            >
                                <div className="w-full h-full flex items-center justify-center rounded-md bg-slate-50 border border-slate-100/50">
                                    <span className="text-[7px] font-black text-slate-900 leading-none antialiased">
                                        {locale === 'en' ? 'EN' : 'CN'}
                                    </span>
                                </div>
                            </motion.div>
                        </div>
                    </div>

                    {/* Power / Logout */}
                    <button 
                        onClick={handleLogout}
                        className="hardware-btn group"
                    >
                        <div className="hardware-well w-12 h-12 rounded-xl flex items-center justify-center bg-[#DADBD4] shadow-well overflow-hidden relative">
                            <div className="hardware-cap absolute inset-1.5 bg-white rounded-lg flex items-center justify-center group-hover:bg-rose-500 transition-all shadow-cap active:translate-y-0.5 group/power">
                                <Power className="w-5 h-5 text-slate-400 group-hover/power:text-white transition-colors" />
                            </div>
                        </div>
                    </button>
                </div>
            </div>
        </header>
    )
}
