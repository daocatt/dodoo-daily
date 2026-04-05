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
    Shield,
    Plus,
    Archive,
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

export default function ParentDashboard({ forceView }: { forceView?: string }) {
    const { t } = useI18n()
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    type DashboardView = 'HOME' | 'FAMILY' | 'REWARDS' | 'PENALTIES' | 'PROFILE' | 'SYSTEM' | 'MEDIA' | 'EXHIBITION' | 'VISITORS' | 'LOGS' | 'SHOP_ORDERS' | 'GALLERY_ORDERS'
    const VIEW_ROUTES: Record<DashboardView, string> = {
        HOME: '/admin/console',
        FAMILY: '/admin/console/members',
        MEDIA: '/admin/console/media',
        REWARDS: '/admin/console/rewards',
        EXHIBITION: '/admin/console/exhibition',
        VISITORS: '/admin/console/visitors',
        LOGS: '/admin/console/logs',
        SYSTEM: '/admin/console/system',
        PROFILE: '/admin/console/profile',
        SHOP_ORDERS: '/admin/console/shop-orders',
        GALLERY_ORDERS: '/admin/console/gallery-orders',
        PENALTIES: '/admin/console/penalties',
    }

    const [view] = useState<DashboardView>(() => {
        if (forceView) return forceView as DashboardView
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search)
            const qView = params.get('view') || ''
            if (Object.keys(VIEW_ROUTES).includes(qView)) return qView as DashboardView
        }
        return 'HOME'
    })

    const navigateToView = (newView: DashboardView) => {
        router.push(VIEW_ROUTES[newView])
    }

    const [user, setUser] = useState<ParentUser | null>(null)
    const [showAddChild, setShowAddChild] = useState(false)
    const [showArchived, setShowArchived] = useState(false)

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
                // Strict check for SUPERADMIN or ADMIN
                if (data && data.isAdmin && (data.permissionRole === 'SUPERADMIN' || data.permissionRole === 'ADMIN')) {
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
            case 'FAMILY': return user ? <ChildManagement 
                currentUser={user} 
                onAssignTask={(id) => {
                    router.push(`/admin/tasks?assignTo=${id}`)
                }} 
                forceShowAdd={showAddChild}
                onSetShowAdd={setShowAddChild}
                forceShowArchived={showArchived}
            /> : null
            case 'SHOP_ORDERS': return <OrderManagement defaultTab="SHOP" hideTabs={true} />
            case 'GALLERY_ORDERS': return <OrderManagement defaultTab="GALLERY" hideTabs={true} />
            case 'REWARDS': return <ShopManagement onOrdersClick={() => navigateToView('SHOP_ORDERS')} />
            case 'PROFILE': return user ? <ProfileManagement user={user} /> : null
            case 'SYSTEM': return <SystemSettings />
            case 'MEDIA': return <MediaManagement />
            case 'EXHIBITION': return <ExhibitionManagement onOrdersClick={() => navigateToView('GALLERY_ORDERS')} />
            case 'VISITORS': return <VisitorManagement />
            case 'LOGS': return <LoginLog />
            default: return null
        }
    }

    return (
        <div className="min-h-screen flex flex-col relative overflow-hidden bg-[#D1CDBC] font-sans pb-10">
            {/* ─── Integrated Navbar ─── */}
            <BausteinAdminNavbar 
                onBack={view !== 'HOME' ? () => {
                    if (view === 'SHOP_ORDERS') navigateToView('REWARDS')
                    else if (view === 'GALLERY_ORDERS') navigateToView('EXHIBITION')
                    else router.push('/admin/console')
                } : undefined}
                title={view !== 'HOME' ? (
                    <div className="flex items-center gap-2 ml-1">
                        <div className="w-1.5 h-3 bg-amber-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                        <h2 className="text-[13px] font-black text-slate-800 uppercase italic tracking-tighter leading-none">{t(`parent.${view.toLowerCase() === 'shop_orders' ? 'rewards' : view.toLowerCase()}`)}</h2>
                    </div>
                ) : undefined}
                actions={
                    view === 'FAMILY' ? (
                        <div className="flex gap-3 items-center">
                            {user && (user.permissionRole === 'SUPERADMIN' || user.permissionRole === 'ADMIN') && (
                                <button 
                                    onClick={() => setShowAddChild(true)}
                                    className="hardware-btn group"
                                >
                                    <div className="hardware-well h-12 rounded-xl flex items-center bg-[#DADBD4] shadow-well active:translate-y-0.5 overflow-hidden relative">
                                        <div className="hardware-cap absolute inset-1.5 bg-white rounded-lg flex items-center transition-all shadow-cap group-hover:bg-slate-50 active:translate-y-0.5" />
                                        <div className="relative z-10 flex items-center px-4 gap-2 pointer-events-none">
                                            <Plus className="w-4 h-4 text-blue-600" />
                                            <span className="text-[10px] font-black text-slate-900 uppercase tracking-tighter">{t('parent.addMember')}</span>
                                        </div>
                                    </div>
                                </button>
                            )}
                            <button 
                                onClick={() => setShowArchived(!showArchived)}
                                className="hardware-btn group"
                                title="ARCHIVE TOGGLE"
                            >
                                <div className="hardware-well w-12 h-12 rounded-xl flex items-center justify-center bg-[#DADBD4] shadow-well active:translate-y-0.5 overflow-hidden relative">
                                    <div className={`hardware-cap absolute inset-1.5 rounded-lg flex items-center justify-center transition-all shadow-cap active:translate-y-0.5 ${showArchived ? 'bg-slate-800' : 'bg-white group-hover:bg-slate-50'}`}>
                                        <Archive className={`w-4 h-4 ${showArchived ? 'text-white' : 'text-slate-400'}`} />
                                    </div>
                                </div>
                            </button>
                        </div>
                    ) : undefined
                }
            />

            <main className="flex-1 p-6 md:px-12 md:py-6 max-w-7xl mx-auto w-full relative">
                {view === 'HOME' ? (
                    <div className="space-y-12 pb-10">
                        {/* Group 1: Family & Core Resources */}
                        <div className="space-y-6">
                            <div className="hardware-well inline-flex items-center h-8 px-4 rounded-full bg-[#C8C4B0]/40 shadow-well border border-black/5 gap-3 ml-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_6px_rgba(79,70,229,0.4)]" />
                                <span className="label-mono text-[9px] font-black text-slate-600/60 uppercase tracking-widest leading-none">{t('parent.group.core')}</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                {/* Family Members */}
                                <button
                                    onClick={() => navigateToView('FAMILY')}
                                    className="hardware-btn group text-left rounded-[24px] overflow-hidden"
                                >
                                    <div className="hardware-well h-48 rounded-[24px] bg-[#DADBD4] shadow-well active:translate-y-0.5 relative">
                                        <div className="hardware-cap absolute inset-2 bg-white rounded-[16px] p-6 flex flex-col items-start gap-4 transition-all shadow-cap">
                                            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center border border-blue-100 shrink-0 shadow-inner">
                                                <Users className="w-6 h-6 text-blue-500" />
                                            </div>
                                            <div>
                                                <h2 className="text-xl font-black text-slate-900 tracking-tighter uppercase">{t('parent.family')}</h2>
                                                <p className="text-[10px] font-bold text-slate-400 mt-1 leading-tight">{t('parent.familyDesc')}</p>
                                            </div>
                                            <div className="mt-auto flex items-center gap-2 transition-transform">
                                                <span className="label-mono text-blue-600">{t('button.manage')}</span>
                                                <ArrowLeft className="w-3 h-3 rotate-180 text-blue-400" />
                                            </div>
                                        </div>
                                    </div>
                                </button>

                                {/* Media Management */}
                                <button
                                    onClick={() => navigateToView('MEDIA')}
                                    className="hardware-btn group text-left rounded-[24px] overflow-hidden"
                                >
                                    <div className="hardware-well h-48 rounded-[24px] bg-[#DADBD4] shadow-well active:translate-y-0.5 relative">
                                        <div className="hardware-cap absolute inset-2 bg-white rounded-[16px] p-6 flex flex-col items-start gap-4 transition-all shadow-cap">
                                            <div className="w-12 h-12 rounded-xl bg-sky-50 flex items-center justify-center border border-sky-100 shrink-0 shadow-inner">
                                                <ImageIcon className="w-6 h-6 text-sky-500" />
                                            </div>
                                            <div>
                                                <h2 className="text-xl font-black text-slate-900 tracking-tighter uppercase">{t('parent.media')}</h2>
                                                <p className="text-[10px] font-bold text-slate-400 mt-1 leading-tight">{t('parent.mediaDesc')}</p>
                                            </div>
                                            <div className="mt-auto flex items-center gap-2 transition-transform">
                                                <span className="label-mono text-sky-600">{t('button.manage')}</span>
                                                <ArrowLeft className="w-3 h-3 rotate-180 text-sky-400" />
                                            </div>
                                        </div>
                                    </div>
                                </button>

                                {/* Reward Store */}
                                <button
                                    onClick={() => navigateToView('REWARDS')}
                                    className="hardware-btn group text-left rounded-[24px] overflow-hidden"
                                >
                                    <div className="hardware-well h-48 rounded-[24px] bg-[#DADBD4] shadow-well active:translate-y-0.5 relative">
                                        <div className="hardware-cap absolute inset-2 bg-white rounded-[16px] p-6 flex flex-col items-start gap-4 transition-all shadow-cap">
                                            <div className="w-12 h-12 rounded-xl bg-yellow-50 flex items-center justify-center border border-yellow-100 shrink-0 shadow-inner">
                                                <Star className="w-6 h-6 text-yellow-500" />
                                            </div>
                                            <div>
                                                <h2 className="text-xl font-black text-slate-900 tracking-tighter uppercase">{t('parent.rewards')}</h2>
                                                <p className="text-[10px] font-bold text-slate-400 mt-1 leading-tight">{t('parent.rewardsDesc')}</p>
                                            </div>
                                            <div className="mt-auto flex items-center gap-2 transition-transform">
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
                            <div className="hardware-well inline-flex items-center h-8 px-4 rounded-full bg-[#C8C4B0]/40 shadow-well border border-black/5 gap-3 ml-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.4)]" />
                                <span className="label-mono text-[9px] font-black text-slate-600/60 uppercase tracking-widest leading-none">{t('parent.group.public')}</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {/* Exhibition Management */}
                                <button
                                    onClick={() => navigateToView('EXHIBITION')}
                                    className="hardware-btn group text-left rounded-[24px] overflow-hidden"
                                >
                                    <div className="hardware-well h-48 rounded-[24px] bg-[#DADBD4] shadow-well active:translate-y-0.5 relative">
                                        <div className="hardware-cap absolute inset-2 bg-white rounded-[16px] p-6 flex flex-col items-start gap-4 transition-all shadow-cap">
                                            <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center border border-indigo-100 shrink-0 shadow-inner">
                                                <Fan className="w-6 h-6 text-indigo-500" />
                                            </div>
                                            <div>
                                                <h2 className="text-xl font-black text-slate-900 tracking-tighter uppercase">{t('parent.exhibition')}</h2>
                                                <p className="text-[10px] font-bold text-slate-400 mt-1 leading-tight">{t('parent.exhibitionSub')}</p>
                                            </div>
                                            <div className="mt-auto flex items-center gap-2 transition-transform">
                                                <span className="label-mono text-indigo-600">{t('button.manage')}</span>
                                                <ArrowLeft className="w-3 h-3 rotate-180 text-indigo-400" />
                                            </div>
                                        </div>
                                    </div>
                                </button>

                                {/* Visitor Management */}
                                <button
                                    onClick={() => navigateToView('VISITORS')}
                                    className="hardware-btn group text-left rounded-[24px] overflow-hidden"
                                >
                                    <div className="hardware-well h-48 rounded-[24px] bg-[#DADBD4] shadow-well active:translate-y-0.5 relative">
                                        <div className="hardware-cap absolute inset-2 bg-white rounded-[16px] p-6 flex flex-col items-start gap-4 transition-all shadow-cap">
                                            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center border border-emerald-100 shrink-0 shadow-inner">
                                                <Users className="w-6 h-6 text-emerald-500" />
                                            </div>
                                            <div>
                                                <h2 className="text-xl font-black text-slate-900 tracking-tighter uppercase">{t('parent.visitors')}</h2>
                                                <p className="text-[10px] font-bold text-slate-400 mt-1 leading-tight">{t('parent.visitorsDesc')}</p>
                                            </div>
                                            <div className="mt-auto flex items-center gap-2 transition-transform">
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
                            <div className="hardware-well inline-flex items-center h-8 px-4 rounded-full bg-[#C8C4B0]/40 shadow-well border border-black/5 gap-3 ml-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.4)]" />
                                <span className="label-mono text-[9px] font-black text-slate-600/60 uppercase tracking-widest leading-none">{t('parent.group.system')}</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {/* Audit Logs */}
                                <button
                                    onClick={() => navigateToView('LOGS')}
                                    className="hardware-btn group text-left rounded-[24px] overflow-hidden bg-transparent border-none p-0 outline-none block w-full"
                                >
                                    <div className="hardware-well h-48 rounded-[24px] bg-[#DADBD4] shadow-well active:translate-y-0.5 relative overflow-hidden">
                                        <div className="hardware-cap absolute inset-2 bg-white rounded-[20px] p-6 flex flex-col items-start gap-4 transition-all shadow-cap overflow-hidden">
                                            <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center border border-indigo-100 shrink-0 shadow-inner">
                                                <Shield className="w-6 h-6 text-indigo-500" />
                                            </div>
                                            <div>
                                                <h2 className="text-xl font-black text-slate-900 tracking-tighter uppercase leading-none">{t('parent.securityLogs')}</h2>
                                                <p className="text-[10px] font-bold text-slate-400 mt-2 leading-tight">{t('parent.securityLogsDesc')}</p>
                                            </div>
                                            <div className="mt-auto flex items-center gap-2 transition-transform">
                                                <span className="label-mono text-indigo-600">{t('button.manage')}</span>
                                                <ArrowLeft className="w-3 h-3 rotate-180 text-indigo-400" />
                                            </div>
                                        </div>
                                    </div>
                                </button>

                                {/* System Control */}
                                <button
                                    onClick={() => navigateToView('SYSTEM')}
                                    className="hardware-btn group text-left rounded-[24px] overflow-hidden bg-transparent border-none p-0 outline-none block w-full"
                                >
                                    <div className="hardware-well h-48 rounded-[24px] bg-[#DADBD4] shadow-well active:translate-y-0.5 relative overflow-hidden">
                                        <div className="hardware-cap absolute inset-2 bg-white rounded-[20px] p-6 flex flex-col items-start gap-4 transition-all shadow-cap overflow-hidden">
                                            <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center border border-rose-100 shrink-0 shadow-inner">
                                                <Power className="w-6 h-6 text-rose-500" />
                                            </div>
                                            <div>
                                                <h2 className="text-xl font-black text-slate-900 tracking-tighter uppercase leading-none">{t('parent.systemControl')}</h2>
                                                <p className="text-[10px] font-bold text-slate-400 mt-2 leading-tight">{t('parent.systemControlDesc')}</p>
                                            </div>
                                            <div className="mt-auto flex items-center gap-2 transition-transform">
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
                            <div className="hardware-well inline-flex items-center h-8 px-4 rounded-full bg-[#C8C4B0]/40 shadow-well border border-black/5 gap-3 ml-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-purple-500 shadow-[0_0_6px_rgba(168,85,247,0.4)]" />
                                <span className="label-mono text-[9px] font-black text-slate-600/60 uppercase tracking-widest leading-none">{t('parent.group.personal')}</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                <button
                                    onClick={() => navigateToView('PROFILE')}
                                    className="hardware-btn group text-left rounded-[24px] overflow-hidden bg-transparent border-none p-0 outline-none block w-full"
                                >
                                    <div className="hardware-well h-48 rounded-[24px] bg-[#DADBD4] shadow-well active:translate-y-0.5 relative overflow-hidden">
                                        <div className="hardware-cap absolute inset-2 bg-white rounded-[20px] p-6 flex flex-col items-start gap-4 transition-all shadow-cap overflow-hidden">
                                            <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center border border-purple-100 shrink-0 shadow-inner">
                                                <UserCircle className="w-6 h-6 text-purple-500" />
                                            </div>
                                            <div>
                                                <h2 className="text-xl font-black text-slate-900 tracking-tighter uppercase leading-none">{t('parent.profile')}</h2>
                                                <p className="text-[10px] font-bold text-slate-400 mt-2 leading-tight">{t('parent.profileDesc')}</p>
                                            </div>
                                            <div className="mt-auto flex items-center gap-2 transition-transform">
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
