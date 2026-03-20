'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Star, Users, Loader2, ShoppingBag as BagIcon, UserCircle, Power, Image as ImageIcon, Coins, Palette, Shield } from 'lucide-react'
import { useI18n } from '@/contexts/I18nContext'
import { useRouter } from 'next/navigation'

import ChildManagement from '@/components/parent/ChildManagement'
import ShopManagement from '@/components/parent/ShopManagement'
import OrderManagement from '@/components/parent/OrderManagement'
import ProfileManagement from '@/components/parent/SettingsManagement'
import SystemSettings from '@/components/parent/SystemSettings'
import MediaManagement from '@/components/parent/MediaManagement'
import ExhibitionManagement from '@/components/parent/ExhibitionManagement'
import GuestManagement from '@/components/parent/GuestManagement'
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
}

export default function ParentDashboard() {
    const { t } = useI18n()
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [view, setView] = useState<'HOME' | 'FAMILY' | 'REWARDS' | 'PENALTIES' | 'PROFILE' | 'ORDERS' | 'SYSTEM' | 'MEDIA' | 'EXHIBITION' | 'GUESTS' | 'LOGS'>('HOME')
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
                if (data && data.isParent) {
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
                        role: 'PARENT'
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
            case 'FAMILY': return <ChildManagement onAssignTask={(id) => {
                router.push(`/admin/tasks?assignTo=${id}`)
            }} />
            case 'REWARDS': return <ShopManagement />
            case 'ORDERS': return <OrderManagement />
            case 'PROFILE': return user ? <ProfileManagement user={user} /> : null
            case 'SYSTEM': return <SystemSettings />
            case 'MEDIA': return <MediaManagement />
            case 'EXHIBITION': return <ExhibitionManagement />
            case 'GUESTS': return <GuestManagement />
            case 'LOGS': return <LoginLog />
            default: return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-12">

                    {/* Family Members */}
                    <button
                        onClick={() => setView('FAMILY')}
                        className="bg-white p-6 rounded-lg shadow-sm border border-slate-100 flex flex-col items-start gap-4 hover:shadow-xl hover:border-blue-200 transition-all text-left group"
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

                    {/* Audit Logs */}
                    <button
                        onClick={() => setView('LOGS')}
                        className="bg-white p-6 rounded-lg shadow-sm border border-slate-100 flex flex-col items-start gap-4 hover:shadow-xl hover:border-indigo-200 transition-all text-left group"
                    >
                        <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                            <Shield className="w-7 h-7 text-indigo-500" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-800">Security Logs</h2>
                            <p className="text-slate-500 text-sm mt-1">Audit trail of all system login activities.</p>
                        </div>
                        <div className="mt-auto pt-4 text-indigo-600 font-bold flex items-center gap-1">
                            {t('button.manage')} <ArrowLeft className="w-4 h-4 rotate-180" />
                        </div>
                    </button>

                    {/* Shop Orders */}
                    <button
                        onClick={() => setView('ORDERS')}
                        className="bg-white p-6 rounded-lg shadow-sm border border-slate-100 flex flex-col items-start gap-4 hover:shadow-xl hover:border-orange-200 transition-all text-left group"
                    >
                        <div className="w-14 h-14 rounded-2xl bg-orange-50 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                            <BagIcon className="w-7 h-7 text-orange-500" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-800">{t('parent.orders')}</h2>
                            <p className="text-slate-500 text-sm mt-1">{t('parent.ordersDesc')}</p>
                        </div>
                        <div className="mt-auto pt-4 text-orange-600 font-bold flex items-center gap-1">
                            {t('button.manage')} <ArrowLeft className="w-4 h-4 rotate-180" />
                        </div>
                    </button>

                    {/* Manual Rewards */}
                    <button
                        onClick={() => setView('REWARDS')}
                        className="bg-white p-6 rounded-lg shadow-sm border border-slate-100 flex flex-col items-start gap-4 hover:shadow-xl hover:border-yellow-200 transition-all text-left group"
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


                    {/* Media Management */}
                    <button
                        onClick={() => setView('MEDIA')}
                        className="bg-white p-6 rounded-lg shadow-sm border border-slate-100 flex flex-col items-start gap-4 hover:shadow-xl hover:border-sky-200 transition-all text-left group"
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

                    {/* Account Settings (Merged Profile & PIN) */}
                    <button
                        onClick={() => setView('PROFILE')}
                        className="bg-white p-6 rounded-lg shadow-sm border border-slate-100 flex flex-col items-start gap-4 hover:shadow-xl hover:border-purple-200 transition-all text-left group"
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

                    {/* Exhibition Management */}
                    <button
                        onClick={() => setView('EXHIBITION')}
                        className="bg-white p-6 rounded-lg shadow-sm border border-slate-100 flex flex-col items-start gap-4 hover:shadow-xl hover:border-indigo-200 transition-all text-left group"
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

                    {/* Guest Management */}
                    <button
                        onClick={() => setView('GUESTS')}
                        className="bg-white p-6 rounded-lg shadow-sm border border-slate-100 flex flex-col items-start gap-4 hover:shadow-xl hover:border-emerald-200 transition-all text-left group"
                    >
                        <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                            <Users className="w-7 h-7 text-emerald-500" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-800">{t('parent.guests')}</h2>
                            <p className="text-slate-500 text-sm mt-1">{t('parent.guestsDesc')}</p>
                        </div>
                        <div className="mt-auto pt-4 text-emerald-600 font-bold flex items-center gap-1">
                            {t('button.manage')} <ArrowLeft className="w-4 h-4 rotate-180" />
                        </div>
                    </button>

                    {/* System Control */}
                    <button
                        onClick={() => setView('SYSTEM')}
                        className="bg-white p-6 rounded-lg shadow-sm border border-slate-100 flex flex-col items-start gap-4 hover:shadow-xl hover:border-rose-200 transition-all text-left group"
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
                        <button onClick={() => setView('HOME')} className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center hover:bg-slate-100 transition-colors border border-slate-100">
                            <ArrowLeft className="w-5 h-5 text-slate-500" />
                        </button>
                    )}
                    <div>
                        <h1 className="text-xl font-black text-slate-900 leading-tight">
                            {view === 'HOME' ? 'Admin Console' :
                                view === 'PROFILE' ? t('parent.profile') :
                                    view === 'FAMILY' ? t('parent.family') :
                                        view === 'SYSTEM' ? t('parent.settings') :
                                            view === 'MEDIA' ? t('parent.media') :
                                                view === 'EXHIBITION' ? t('parent.exhibition') :
                                                    view === 'GUESTS' ? t('parent.guests') :
                                                        view === 'LOGS' ? 'Security Logs' :
                                                            view}
                        </h1>
                        <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest leading-tight">{t('parent.controlPanel')}</p>
                    </div>
                </div>

                {view === 'HOME' && user && (
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-4 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100 shadow-sm">
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
                                <div className="text-[8px] font-black text-indigo-500 uppercase tracking-tighter">Admin Mode</div>
                            </div>
                            <div className="w-10 h-10 rounded-xl overflow-hidden border-2 border-white shadow-sm">
                                <img src={user.avatarUrl || "/dog.svg"} alt={user.name} className="w-full h-full object-cover" />
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
