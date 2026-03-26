'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
    ArrowLeft, 
    Star, 
    Users, 
    Loader2, 
    UserCircle, 
    Power, 
    Image as ImageIcon, 
    Palette, 
    Shield,
    Fan
} from 'lucide-react'
import { useI18n } from '@/contexts/I18nContext'
import { BausteinAdminNavbar } from '@/components/BausteinAdminNavbar'

import ChildManagement from '@/components/parent/ChildManagement'
import ShopManagement from '@/components/parent/ShopManagement'
import OrderManagement from '@/components/parent/OrderManagement'
import ProfileManagement from '@/components/parent/SettingsManagement'
import SystemSettings from '@/components/parent/SystemSettings'
import MediaManagement from '@/components/parent/MediaManagement'
import ExhibitionManagement from '@/components/parent/ExhibitionManagement'
import VisitorManagement from '@/components/parent/VisitorManagement'
import LoginLog from '@/components/parent/LoginLog'

interface ParentUser {
    id: string
    name: string
    nickname: string | null
    slug: string | null
    exhibitionEnabled: boolean
    avatarUrl: string | null
    stars: number
    balance: number
    role: 'PARENT' | 'CHILD' | 'GRANDPARENT' | 'OTHER'
    permissionRole: 'SUPERADMIN' | 'ADMIN' | 'USER'
    isLocked: boolean
}

export default function ParentDashboard() {
    const { t } = useI18n()
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [view, setView] = useState<'HOME' | 'FAMILY' | 'REWARDS' | 'PENALTIES' | 'PROFILE' | 'SYSTEM' | 'MEDIA' | 'EXHIBITION' | 'VISITORS' | 'LOGS' | 'SHOP_ORDERS' | 'GALLERY_ORDERS'>(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search)
            const qView = params.get('view') || ''
            const views = ['HOME', 'FAMILY', 'REWARDS', 'PENALTIES', 'PROFILE', 'SYSTEM', 'MEDIA', 'EXHIBITION', 'VISITORS', 'LOGS', 'SHOP_ORDERS', 'GALLERY_ORDERS']
            if (views.includes(qView)) return qView as 'HOME' | 'FAMILY' | 'REWARDS' | 'PENALTIES' | 'PROFILE' | 'SYSTEM' | 'MEDIA' | 'EXHIBITION' | 'VISITORS' | 'LOGS' | 'SHOP_ORDERS' | 'GALLERY_ORDERS'
        }
        return 'HOME'
    })
    const [user, setUser] = useState<ParentUser | null>(null)

    useEffect(() => {
        fetch('/api/stats')
            .then(res => {
                if (!res.ok) {
                    router.push('/admin')
                    return
                }
                return res.json()
            })
            .then(data => {
                if (data && data.isAdmin) {
                    setLoading(false)
                    setUser({
                        id: data.userId || '',
                        name: data.name || 'Parent',
                        nickname: data.nickname || '',
                        slug: data.slug || '',
                        exhibitionEnabled: data.exhibitionEnabled !== false,
                        avatarUrl: data.avatarUrl,
                        stars: data.purpleStars || 0,
                        balance: data.currency || 0,
                        role: data.role as 'PARENT' | 'CHILD' | 'GRANDPARENT' | 'OTHER',
                        permissionRole: data.permissionRole,
                        isLocked: data.isLocked || false
                    })
                }
                else {
                    router.push('/admin')
                }
            })
            .catch(() => router.push('/admin'))
    }, [router])

    if (loading) {
        return (
            <div className="min-h-dvh flex items-center justify-center bg-slate-50">
                <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
            </div>
        )
    }

    const renderView = () => {
        switch (view) {
            case 'FAMILY': return user ? <ChildManagement currentUser={user} onAssignTask={(id) => {
                router.push(`/admin/tasks?assignTo=${id}`)
            }} /> : null
            case 'SHOP_ORDERS': return <OrderManagement defaultTab="SHOP" hideTabs={true} />
            case 'GALLERY_ORDERS': return <OrderManagement defaultTab="GALLERY" hideTabs={true} />
            case 'REWARDS': return <ShopManagement onOrdersClick={() => setView('SHOP_ORDERS')} />
            case 'PROFILE': return user ? <ProfileManagement user={user} /> : null
            case 'SYSTEM': return <SystemSettings />
            case 'MEDIA': return <MediaManagement />
            case 'EXHIBITION': return <ExhibitionManagement onOrdersClick={() => setView('GALLERY_ORDERS')} />
            case 'VISITORS': return <VisitorManagement />
            case 'LOGS': return <LoginLog />
            default: return null
        }
    }

    return (
        <div className="min-h-dvh flex flex-col relative overflow-hidden app-bg-pattern font-sans pb-10">
            {/* ─── Integrated Navbar ─── */}
            <BausteinAdminNavbar 
                onBack={view !== 'HOME' ? () => {
                    if (view === 'SHOP_ORDERS') setView('REWARDS')
                    else if (view === 'GALLERY_ORDERS') setView('EXHIBITION')
                    else setView('HOME')
                } : undefined}
            />

            <main className="flex-1 p-6 md:px-12 md:py-6 max-w-7xl mx-auto w-full relative z-10">
                {view === 'HOME' ? (
                    <div className="space-y-12 pb-10">
                        {/* Group 1: Family & Core Resources */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 px-2">
                                <div className="w-1.5 h-4 bg-indigo-500 rounded-full shadow-[0_0_8px_rgba(79,70,229,0.4)]" />
                                <span className="label-mono opacity-40">{t('parent.group.core')}</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                {/* Family Members */}
                                <button
                                    onClick={() => setView('FAMILY')}
                                    className="hardware-btn group text-left"
                                >
                                    <div className="hardware-well h-48 rounded-2xl bg-[#DADBD4] shadow-well active:translate-y-0.5 overflow-hidden relative">
                                        <div className="hardware-cap absolute inset-2 bg-white rounded-xl p-6 flex flex-col items-start gap-4 group-hover:bg-slate-50 transition-all shadow-cap">
                                            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center border border-blue-100 shrink-0 shadow-inner">
                                                <Users className="w-6 h-6 text-blue-500" />
                                            </div>
                                            <div>
                                                <h2 className="text-xl font-black text-slate-900 tracking-tighter uppercase">{t('parent.family')}</h2>
                                                <p className="text-[10px] font-bold text-slate-400 mt-1 leading-tight">{t('parent.familyDesc')}</p>
                                            </div>
                                            <div className="mt-auto flex items-center gap-2 group-hover:translate-x-1 transition-transform">
                                                <span className="label-mono text-blue-600">{t('button.manage')}</span>
                                                <ArrowLeft className="w-3 h-3 rotate-180 text-blue-400" />
                                            </div>
                                        </div>
                                    </div>
                                </button>

                                {/* Media Management */}
                                <button
                                    onClick={() => setView('MEDIA')}
                                    className="hardware-btn group text-left"
                                >
                                    <div className="hardware-well h-48 rounded-2xl bg-[#DADBD4] shadow-well active:translate-y-0.5 overflow-hidden relative">
                                        <div className="hardware-cap absolute inset-2 bg-white rounded-xl p-6 flex flex-col items-start gap-4 group-hover:bg-slate-50 transition-all shadow-cap">
                                            <div className="w-12 h-12 rounded-xl bg-sky-50 flex items-center justify-center border border-sky-100 shrink-0 shadow-inner">
                                                <ImageIcon className="w-6 h-6 text-sky-500" />
                                            </div>
                                            <div>
                                                <h2 className="text-xl font-black text-slate-900 tracking-tighter uppercase">{t('parent.media')}</h2>
                                                <p className="text-[10px] font-bold text-slate-400 mt-1 leading-tight">{t('parent.mediaDesc')}</p>
                                            </div>
                                            <div className="mt-auto flex items-center gap-2 group-hover:translate-x-1 transition-transform">
                                                <span className="label-mono text-sky-600">{t('button.manage')}</span>
                                                <ArrowLeft className="w-3 h-3 rotate-180 text-sky-400" />
                                            </div>
                                        </div>
                                    </div>
                                </button>

                                {/* Reward Store */}
                                <button
                                    onClick={() => setView('REWARDS')}
                                    className="hardware-btn group text-left"
                                >
                                    <div className="hardware-well h-48 rounded-2xl bg-[#DADBD4] shadow-well active:translate-y-0.5 overflow-hidden relative">
                                        <div className="hardware-cap absolute inset-2 bg-white rounded-xl p-6 flex flex-col items-start gap-4 group-hover:bg-slate-50 transition-all shadow-cap">
                                            <div className="w-12 h-12 rounded-xl bg-yellow-50 flex items-center justify-center border border-yellow-100 shrink-0 shadow-inner">
                                                <Star className="w-6 h-6 text-yellow-500" />
                                            </div>
                                            <div>
                                                <h2 className="text-xl font-black text-slate-900 tracking-tighter uppercase">{t('parent.rewards')}</h2>
                                                <p className="text-[10px] font-bold text-slate-400 mt-1 leading-tight">{t('parent.rewardsDesc')}</p>
                                            </div>
                                            <div className="mt-auto flex items-center gap-2 group-hover:translate-x-1 transition-transform">
                                                <span className="label-mono text-yellow-600">{t('button.manage')}</span>
                                                <ArrowLeft className="w-3 h-3 rotate-180 text-yellow-400" />
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* Group 2: Exhibition & Visitors */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 px-2">
                                <div className="w-1.5 h-4 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                                <span className="label-mono opacity-40">{t('parent.group.public')}</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {/* Exhibition Management */}
                                <button
                                    onClick={() => setView('EXHIBITION')}
                                    className="hardware-btn group text-left"
                                >
                                    <div className="hardware-well h-48 rounded-2xl bg-[#DADBD4] shadow-well active:translate-y-0.5 overflow-hidden relative">
                                        <div className="hardware-cap absolute inset-2 bg-white rounded-xl p-6 flex flex-col items-start gap-4 group-hover:bg-slate-50 transition-all shadow-cap">
                                            <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center border border-indigo-100 shrink-0 shadow-inner">
                                                <Fan className="w-6 h-6 text-indigo-500 animate-spin-slow" />
                                            </div>
                                            <div>
                                                <h2 className="text-xl font-black text-slate-900 tracking-tighter uppercase">{t('parent.exhibition')}</h2>
                                                <p className="text-[10px] font-bold text-slate-400 mt-1 leading-tight">{t('parent.exhibitionSub')}</p>
                                            </div>
                                            <div className="mt-auto flex items-center gap-2 group-hover:translate-x-1 transition-transform">
                                                <span className="label-mono text-indigo-600">{t('button.manage')}</span>
                                                <ArrowLeft className="w-3 h-3 rotate-180 text-indigo-400" />
                                            </div>
                                        </div>
                                    </div>
                                </button>

                                {/* Visitor Management */}
                                <button
                                    onClick={() => setView('VISITORS')}
                                    className="hardware-btn group text-left"
                                >
                                    <div className="hardware-well h-48 rounded-2xl bg-[#DADBD4] shadow-well active:translate-y-0.5 overflow-hidden relative">
                                        <div className="hardware-cap absolute inset-2 bg-white rounded-xl p-6 flex flex-col items-start gap-4 group-hover:bg-slate-50 transition-all shadow-cap">
                                            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center border border-emerald-100 shrink-0 shadow-inner">
                                                <Users className="w-6 h-6 text-emerald-500" />
                                            </div>
                                            <div>
                                                <h2 className="text-xl font-black text-slate-900 tracking-tighter uppercase">{t('parent.visitors')}</h2>
                                                <p className="text-[10px] font-bold text-slate-400 mt-1 leading-tight">{t('parent.visitorsDesc')}</p>
                                            </div>
                                            <div className="mt-auto flex items-center gap-2 group-hover:translate-x-1 transition-transform">
                                                <span className="label-mono text-emerald-600">{t('button.manage')}</span>
                                                <ArrowLeft className="w-3 h-3 rotate-180 text-emerald-400" />
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* Group 3: Security & Control */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 px-2">
                                <div className="w-1.5 h-4 bg-rose-500 rounded-full shadow-[0_0_8px_rgba(244,63,94,0.4)]" />
                                <span className="label-mono opacity-40">{t('parent.group.system')}</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {/* Audit Logs */}
                                <button
                                    onClick={() => setView('LOGS')}
                                    className="hardware-btn group text-left"
                                >
                                    <div className="hardware-well h-48 rounded-2xl bg-[#DADBD4] shadow-well active:translate-y-0.5 overflow-hidden relative">
                                        <div className="hardware-cap absolute inset-2 bg-white rounded-xl p-6 flex flex-col items-start gap-4 group-hover:bg-slate-50 transition-all shadow-cap">
                                            <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center border border-indigo-100 shrink-0 shadow-inner">
                                                <Shield className="w-6 h-6 text-indigo-500" />
                                            </div>
                                            <div>
                                                <h2 className="text-xl font-black text-slate-900 tracking-tighter uppercase">{t('parent.securityLogs')}</h2>
                                                <p className="text-[10px] font-bold text-slate-400 mt-1 leading-tight">{t('parent.securityLogsDesc')}</p>
                                            </div>
                                            <div className="mt-auto flex items-center gap-2 group-hover:translate-x-1 transition-transform">
                                                <span className="label-mono text-indigo-600">{t('button.manage')}</span>
                                                <ArrowLeft className="w-3 h-3 rotate-180 text-indigo-400" />
                                            </div>
                                        </div>
                                    </div>
                                </button>

                                {/* System Control */}
                                <button
                                    onClick={() => setView('SYSTEM')}
                                    className="hardware-btn group text-left"
                                >
                                    <div className="hardware-well h-48 rounded-2xl bg-[#DADBD4] shadow-well active:translate-y-0.5 overflow-hidden relative">
                                        <div className="hardware-cap absolute inset-2 bg-white rounded-xl p-6 flex flex-col items-start gap-4 group-hover:bg-slate-50 transition-all shadow-cap">
                                            <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center border border-rose-100 shrink-0 shadow-inner">
                                                <Power className="w-6 h-6 text-rose-500" />
                                            </div>
                                            <div>
                                                <h2 className="text-xl font-black text-slate-900 tracking-tighter uppercase">{t('parent.systemControl')}</h2>
                                                <p className="text-[10px] font-bold text-slate-400 mt-1 leading-tight">{t('parent.systemControlDesc')}</p>
                                            </div>
                                            <div className="mt-auto flex items-center gap-2 group-hover:translate-x-1 transition-transform">
                                                <span className="label-mono text-rose-600">{t('button.settings')}</span>
                                                <ArrowLeft className="w-3 h-3 rotate-180 text-rose-400" />
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* Group 4: Account Settings */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 px-2">
                                <div className="w-1.5 h-4 bg-purple-500 rounded-full shadow-[0_0_8px_rgba(168,85,247,0.4)]" />
                                <span className="label-mono opacity-40">{t('parent.group.personal')}</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                <button
                                    onClick={() => setView('PROFILE')}
                                    className="hardware-btn group text-left"
                                >
                                    <div className="hardware-well h-48 rounded-2xl bg-[#DADBD4] shadow-well active:translate-y-0.5 overflow-hidden relative">
                                        <div className="hardware-cap absolute inset-2 bg-white rounded-xl p-6 flex flex-col items-start gap-4 group-hover:bg-slate-50 transition-all shadow-cap">
                                            <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center border border-purple-100 shrink-0 shadow-inner">
                                                <UserCircle className="w-6 h-6 text-purple-500" />
                                            </div>
                                            <div>
                                                <h2 className="text-xl font-black text-slate-900 tracking-tighter uppercase">{t('parent.profile')}</h2>
                                                <p className="text-[10px] font-bold text-slate-400 mt-1 leading-tight">{t('parent.profileDesc')}</p>
                                            </div>
                                            <div className="mt-auto flex items-center gap-2 group-hover:translate-x-1 transition-transform">
                                                <span className="label-mono text-purple-600">{t('button.manage')}</span>
                                                <ArrowLeft className="w-3 h-3 rotate-180 text-purple-400" />
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="w-full">
                        {renderView()}
                    </div>
                )}
            </main>
        </div>
    )
}
