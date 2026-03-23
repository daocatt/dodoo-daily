'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image' // Added import for Next.js Image component
import { ArrowLeft, Star, Users, Loader2, ShoppingBag as BagIcon, UserCircle, Power, Image as ImageIcon, Coins, Palette, Shield, ChevronDown } from 'lucide-react' // Removed ClipboardList
import { useI18n } from '@/contexts/I18nContext'
import { useRouter } from 'next/navigation'

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
            default: return (
                <div className="space-y-12 pb-20">
                    {/* Group 1: Family & Core Resources */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 px-2">
                            <span className="w-1 h-4 bg-blue-500 rounded-full"></span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('parent.group.core')}</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Family Members */}
                            <button
                                onClick={() => setView('FAMILY')}
                                className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-start gap-4 hover:shadow-xl hover:border-blue-200 transition-all text-left group"
                            >
                                <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                                    <Users className="w-7 h-7 text-blue-500" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-slate-800">{t('parent.family')}</h2>
                                    <p className="text-slate-500 text-sm mt-1">{t('parent.familyDesc')}</p>
                                </div>
                                <div className="mt-auto pt-4 text-blue-600 font-bold flex items-center gap-1">
                                    {t('button.manage')} <ArrowLeft className="w-4 h-4 rotate-180" />
                                </div>
                            </button>

                            {/* Media Management */}
                            <button
                                onClick={() => setView('MEDIA')}
                                className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-start gap-4 hover:shadow-xl hover:border-sky-200 transition-all text-left group"
                            >
                                <div className="w-14 h-14 rounded-2xl bg-sky-50 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                                    <ImageIcon className="w-7 h-7 text-sky-500" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-slate-800">{t('parent.media')}</h2>
                                    <p className="text-slate-500 text-sm mt-1">{t('parent.mediaDesc')}</p>
                                </div>
                                <div className="mt-auto pt-4 text-sky-600 font-bold flex items-center gap-1">
                                    {t('button.manage')} <ArrowLeft className="w-4 h-4 rotate-180" />
                                </div>
                            </button>

                            {/* Reward Store */}
                            <button
                                onClick={() => setView('REWARDS')}
                                className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-start gap-4 hover:shadow-xl hover:border-yellow-200 transition-all text-left group"
                            >
                                <div className="w-14 h-14 rounded-2xl bg-yellow-50 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                                    <Star className="w-7 h-7 text-yellow-500" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-slate-800">{t('parent.rewards')}</h2>
                                    <p className="text-slate-500 text-sm mt-1">{t('parent.rewardsDesc')}</p>
                                </div>
                                <div className="mt-auto pt-4 text-yellow-600 font-bold flex items-center gap-1">
                                    {t('button.manage')} <ArrowLeft className="w-4 h-4 rotate-180" />
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Group 2: Exhibition & Visitors */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 px-2">
                            <span className="w-1 h-4 bg-emerald-500 rounded-full"></span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('parent.group.public')}</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {/* Exhibition Management */}
                            <button
                                onClick={() => setView('EXHIBITION')}
                                className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-start gap-4 hover:shadow-xl hover:border-indigo-200 transition-all text-left group"
                            >
                                <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                                    <Palette className="w-7 h-7 text-indigo-500" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-slate-800">{t('parent.exhibition')}</h2>
                                    <p className="text-slate-500 text-sm mt-1">{t('parent.exhibitionSub')}</p>
                                </div>
                                <div className="mt-auto pt-4 text-indigo-600 font-bold flex items-center gap-1">
                                    {t('button.manage')} <ArrowLeft className="w-4 h-4 rotate-180" />
                                </div>
                            </button>

                            {/* Visitor Management */}
                            <button
                                onClick={() => setView('VISITORS')}
                                className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-start gap-4 hover:shadow-xl hover:border-emerald-200 transition-all text-left group"
                            >
                                <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                                    <Users className="w-7 h-7 text-emerald-500" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-slate-800">{t('parent.visitors')}</h2>
                                    <p className="text-slate-500 text-sm mt-1">{t('parent.visitorsDesc')}</p>
                                </div>
                                <div className="mt-auto pt-4 text-emerald-600 font-bold flex items-center gap-1">
                                    {t('button.manage')} <ArrowLeft className="w-4 h-4 rotate-180" />
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Group 3: Security & Control */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 px-2">
                            <span className="w-1 h-4 bg-rose-500 rounded-full"></span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('parent.group.system')}</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {/* Audit Logs */}
                            <button
                                onClick={() => setView('LOGS')}
                                className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-start gap-4 hover:shadow-xl hover:border-indigo-200 transition-all text-left group"
                            >
                                <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                                    <Shield className="w-7 h-7 text-indigo-500" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-slate-800">{t('parent.securityLogs')}</h2>
                                    <p className="text-slate-500 text-sm mt-1">{t('parent.securityLogsDesc')}</p>
                                </div>
                                <div className="mt-auto pt-4 text-indigo-600 font-bold flex items-center gap-1">
                                    {t('button.manage')} <ArrowLeft className="w-4 h-4 rotate-180" />
                                </div>
                            </button>

                            {/* System Control */}
                            <button
                                onClick={() => setView('SYSTEM')}
                                className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-start gap-4 hover:shadow-xl hover:border-rose-200 transition-all text-left group"
                            >
                                <div className="w-14 h-14 rounded-2xl bg-rose-50 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                                    <Power className="w-7 h-7 text-rose-500" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-slate-800">{t('parent.systemControl')}</h2>
                                    <p className="text-slate-500 text-sm mt-1">{t('parent.systemControlDesc')}</p>
                                </div>
                                <div className="mt-auto pt-4 text-rose-600 font-bold flex items-center gap-1">
                                    {t('button.settings')} <ArrowLeft className="w-4 h-4 rotate-180" />
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Group 4: Personal Profile */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 px-2">
                            <span className="w-1 h-4 bg-purple-500 rounded-full"></span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('parent.group.personal')}</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {/* Account Settings */}
                            <button
                                onClick={() => setView('PROFILE')}
                                className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-start gap-4 hover:shadow-xl hover:border-purple-200 transition-all text-left group"
                            >
                                <div className="w-14 h-14 rounded-2xl bg-purple-50 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                                    <UserCircle className="w-7 h-7 text-purple-500" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-slate-800">{t('parent.profile')}</h2>
                                    <p className="text-slate-500 text-sm mt-1">{t('parent.profileDesc')}</p>
                                </div>
                                <div className="mt-auto pt-4 text-purple-600 font-bold flex items-center gap-1">
                                    {t('button.manage')} <ArrowLeft className="w-4 h-4 rotate-180" />
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            )
        }
    }

    return (
        <div className="min-h-dvh flex flex-col relative overflow-hidden bg-slate-50 text-slate-800 pb-20 font-sans">
            <header className="px-6 py-5 bg-white shadow-sm flex items-center justify-between sticky top-0 z-40 border-b border-slate-100">
                <div className="flex items-center gap-4">
                    {view === 'HOME' ? (
                        <Link href="/admin" className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center hover:bg-slate-100 transition-colors border border-slate-100">
                            <ArrowLeft className="w-5 h-5 text-slate-500" />
                        </Link>
                    ) : (
                        <button 
                            onClick={() => {
                                if (view === 'SHOP_ORDERS') setView('REWARDS')
                                else if (view === 'GALLERY_ORDERS') setView('EXHIBITION')
                                else setView('HOME')
                            }} 
                            className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center hover:bg-slate-100 transition-colors border border-slate-100"
                        >
                            <ArrowLeft className="w-5 h-5 text-slate-500" />
                        </button>
                    )}
                    <div>
                        <h1 className="text-xl font-black text-slate-900 leading-tight">
                            {view === 'HOME' ? t('parent.adminConsole') :
                                view === 'PROFILE' ? t('parent.profile') :
                                    view === 'FAMILY' ? t('parent.family') :
                                        view === 'SYSTEM' ? t('parent.settings') :
                                            view === 'MEDIA' ? t('parent.media') :
                                                view === 'EXHIBITION' ? t('parent.exhibition') :
                                view === 'VISITORS' ? t('parent.visitors') :
                                view === 'LOGS' ? t('parent.securityLogs') :
                                view === 'SHOP_ORDERS' ? t('parent.orders.shop') :
                                view === 'GALLERY_ORDERS' ? t('parent.orders.gallery') :
                                view}
                        </h1>
                        <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest leading-tight">{t('parent.controlPanel')}</p>
                    </div>
                </div>

                {user && (
                    <div className="flex items-center gap-3 md:gap-6">
                        {/* Orders Dropdown/Button */}
                        {(view === 'HOME' || view === 'REWARDS' || view === 'EXHIBITION' || view === 'SHOP_ORDERS' || view === 'GALLERY_ORDERS') && (
                            <div className="relative group">
                                {view === 'HOME' ? (
                                    <>
                                        <button className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-100 transition-all">
                                            <BagIcon className="w-4 h-4 text-orange-500" />
                                            <span className="hidden sm:inline">{t('parent.orders')}</span>
                                            <ChevronDown className="w-3 h-3 text-slate-300" />
                                        </button>
                                        <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-[100] overflow-hidden">
                                            <button 
                                                onClick={() => setView('SHOP_ORDERS')}
                                                className="w-full px-5 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-3 border-b border-slate-50 transition-colors"
                                            >
                                                <BagIcon className="w-4 h-4 text-orange-500" />
                                                {t('parent.orders.shop')}
                                            </button>
                                            <button 
                                                onClick={() => setView('GALLERY_ORDERS')}
                                                className="w-full px-5 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-3 transition-colors"
                                            >
                                                <Palette className="w-4 h-4 text-indigo-500" />
                                                {t('parent.orders.gallery')}
                                            </button>
                                        </div>
                                    </>
                                ) : (view === 'REWARDS' || view === 'SHOP_ORDERS') ? (
                                    <button 
                                        onClick={() => setView('SHOP_ORDERS')}
                                        className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-100 transition-all"
                                    >
                                        <BagIcon className="w-4 h-4 text-orange-500" />
                                        <span className="hidden sm:inline">{t('parent.orders')}</span>
                                    </button>
                                ) : (view === 'EXHIBITION' || view === 'GALLERY_ORDERS') ? (
                                    <button 
                                        onClick={() => setView('GALLERY_ORDERS')}
                                        className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-100 transition-all"
                                    >
                                        <Palette className="w-4 h-4 text-indigo-500" />
                                        <span className="hidden sm:inline">{t('parent.orders')}</span>
                                    </button>
                                ) : null}
                            </div>
                        )}

                        <div className="hidden lg:flex items-center gap-4 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100 shadow-sm">
                            <div className="flex items-center gap-2">
                                <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                                <span className="font-black text-slate-800">{user.stars}</span>
                            </div>
                            <div className="w-[1px] h-4 bg-slate-200" />
                            <div className="flex items-center gap-2">
                                <Coins className="w-5 h-5 text-amber-500 fill-amber-500" />
                                <span className="font-black text-slate-800">{user.balance}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="text-right hidden sm:block">
                                <div className="text-xs font-black text-slate-800">{user.name}</div>
                                <div className="text-[8px] font-black text-indigo-500 uppercase tracking-tighter">{t('parent.adminMode')}</div>
                            </div>
                            <div className="w-10 h-10 rounded-xl overflow-hidden border-2 border-white shadow-sm">
                                <Image 
                                    src={user.avatarUrl || '/dog.svg'} 
                                    alt="Avatar" 
                                    width={40} 
                                    height={40} 
                                    className="w-full h-full object-cover filter contrast-125 grayscale-[20%]" 
                                />
                            </div>
                        </div>
                    </div>
                )}
            </header>

            <main className="flex-1 p-6 md:p-12 pb-32 md:pb-12 max-w-7xl mx-auto w-full">
                {renderView()}
            </main>
        </div>
    )
}
