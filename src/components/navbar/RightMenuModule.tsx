'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'motion/react'
import { 
    Settings, 
    Blocks, 
    Power 
} from 'lucide-react'
import { clsx } from 'clsx'

interface RightMenuModuleProps {
    stats: {
        isAdmin: boolean
        avatar?: string
        name: string
        nickname?: string
        permissionRole: string
    }
    pathname: string
    locale: string
    setLocale: (l: string) => void
    isEditing?: boolean
    onToggleEdit?: () => void
    actions?: React.ReactNode
    isSubpage?: boolean
}

export function RightMenuModule({
    stats,
    pathname,
    locale,
    setLocale,
    isEditing,
    onToggleEdit,
    actions,
    isSubpage
}: RightMenuModuleProps) {
    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' })
            window.location.href = '/admin/login'
        } catch (_error) {
            window.location.href = '/admin/login'
        }
    }

    return (
        <div className="flex items-center gap-3">
            {/* Module Specific Actions (Custom Sub-menu) */}
            {actions && (
                <div className="flex items-center gap-2 mr-2">
                    {actions}
                </div>
            )}

            {/* 1. User Profile Trigger (Personal) - Always Shown */}
            <button 
                onClick={() => window.location.href = stats.isAdmin ? '/admin/console?view=PROFILE' : '/admin/profile'}
                className="hardware-btn group"
                title={locale === 'zh-CN' ? '个人设置' : 'Profile Settings'}
            >
                <div className="hardware-well h-12 rounded-xl flex items-center bg-[#DADBD4] shadow-well active:translate-y-0.5 overflow-hidden relative">
                    <div className="hardware-cap absolute inset-1.5 bg-white rounded-lg flex items-center transition-all shadow-cap group-hover:bg-slate-50 active:translate-y-0.5" />
                    <div className="relative z-10 flex items-center px-4 gap-3 pointer-events-none">
                        <div className="w-8 h-8 rounded-md overflow-hidden shrink-0 relative">
                            {stats.avatar ? (
                                <Image src={stats.avatar} alt="User" fill className="object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-[10px] font-black text-slate-400">
                                    {(stats.nickname || stats.name)[0].toUpperCase()}
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

            {/* 2. Widget Adjustment Toggle (Only on Dashboard) */}
            {!isSubpage && pathname === '/admin' && (
                <button 
                    onClick={onToggleEdit}
                    className="hardware-btn group"
                    title="Adjust Widgets"
                >
                    <div className="hardware-well w-12 h-12 rounded-xl flex items-center justify-center bg-[#DADBD4] shadow-well overflow-hidden relative">
                        <div className={clsx(
                            "hardware-cap absolute inset-1.5 bg-white rounded-lg flex items-center justify-center transition-all shadow-cap active:translate-y-0.5 group/blocks",
                            isEditing ? "bg-indigo-600 text-white" : "group-hover:bg-slate-50 text-slate-400"
                        )}>
                            <Blocks className="w-5 h-5 transition-transform duration-300 group-hover:rotate-12" />
                        </div>
                    </div>
                </button>
            )}

            {/* 3. Console Button (Restricted to SUPERADMIN, ADMIN, and HIDDEN in Subpage mode) */}
            {!isSubpage && (stats.permissionRole === 'SUPERADMIN' || stats.permissionRole === 'ADMIN') && (
                <Link 
                    href="/admin/console" 
                    className="hardware-btn group"
                    title={locale === 'zh-CN' ? '控制台' : 'CONSOLE'}
                >
                    <div className="hardware-well w-12 h-12 rounded-xl flex items-center justify-center bg-[#DADBD4] shadow-well active:translate-y-0.5 overflow-hidden relative">
                        <div className="hardware-cap absolute inset-1.5 bg-white rounded-lg flex items-center justify-center group-hover:bg-indigo-50 transition-all shadow-cap active:translate-y-0.5">
                            <Settings className="w-5 h-5 text-slate-600" />
                        </div>
                    </div>
                </Link>
            )}

            {/* 4. Language Switcher (HIDDEN in Subpage mode) */}
            {!isSubpage && (
                <div 
                    onClick={() => setLocale(locale === 'en' ? 'zh-CN' : 'en')}
                    className="hardware-btn cursor-pointer group"
                    title={locale === 'en' ? 'Switch to Chinese' : '切换为英文'}
                >
                    <div className="hardware-well w-[56px] h-10 rounded-xl bg-[#DADBD4] shadow-well relative flex items-center px-1 overflow-hidden">
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
            )}

            {/* 5. Power / Logout (HIDDEN in Subpage mode) */}
            {!isSubpage && (
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
            )}
        </div>
    )
}
