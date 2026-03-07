'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Star, ShieldAlert, Users, Settings, Loader2 } from 'lucide-react'
import { useI18n } from '@/contexts/I18nContext'
import { useRouter } from 'next/navigation'

import ChildManagement from '@/components/parent/ChildManagement'
import ShopManagement from '@/components/parent/ShopManagement'
import OrderManagement from '@/components/parent/OrderManagement'
import SettingsManagement from '@/components/parent/SettingsManagement'

export default function ParentDashboard() {
    const { t } = useI18n()
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [view, setView] = useState<'HOME' | 'FAMILY' | 'REWARDS' | 'PENALTIES' | 'SETTINGS' | 'ORDERS'>('HOME')
    const [user, setUser] = useState<any>(null)

    useEffect(() => {
        // Simple client-side role check (Middleware handles the heavy lifting)
        // But we check stats to confirm role
        fetch('/api/stats')
            .then(res => {
                if (!res.ok) {
                    router.push('/')
                    return
                }
                return res.json()
            })
            .then(data => {
                if (data && data.isParent) {
                    setLoading(false)
                    setUser(data.user)
                } else {
                    router.push('/')
                }
            })
            .catch(() => router.push('/'))
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
            case 'FAMILY': return <ChildManagement />
            case 'REWARDS': return <ShopManagement />
            case 'ORDERS': return <OrderManagement />
            case 'SETTINGS': return <SettingsManagement user={user} />
            default: return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                    <button
                        onClick={() => setView('REWARDS')}
                        className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-start gap-3 hover:shadow-lg hover:border-yellow-200 transition-all text-left"
                    >
                        <div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center mb-2">
                            <Star className="w-6 h-6 text-yellow-500" />
                        </div>
                        <h2 className="text-xl font-bold">{t('parent.rewards')}</h2>
                        <p className="text-slate-500 text-sm">{t('parent.rewardsDesc')}</p>
                        <div className="mt-auto pt-4 text-yellow-600 font-bold flex items-center gap-1 group">
                            Manage Rewards <ArrowLeft className="w-4 h-4 rotate-180 group-hover:translate-x-1 transition-transform" />
                        </div>
                    </button>

                    <button
                        onClick={() => setView('ORDERS')}
                        className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-start gap-3 hover:shadow-lg hover:border-orange-200 transition-all text-left"
                    >
                        <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center mb-2">
                            <ShoppingBag className="w-6 h-6 text-orange-500" />
                        </div>
                        <h2 className="text-xl font-bold">Orders</h2>
                        <p className="text-slate-500 text-sm">Manage shop orders & status.</p>
                        <div className="mt-auto pt-4 text-orange-600 font-bold flex items-center gap-1 group">
                            Check Orders <ArrowLeft className="w-4 h-4 rotate-180 group-hover:translate-x-1 transition-transform" />
                        </div>
                    </button>

                    <button
                        onClick={() => setView('FAMILY')}
                        className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-start gap-3 hover:shadow-lg hover:border-blue-200 transition-all text-left"
                    >
                        <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center mb-2">
                            <Users className="w-6 h-6 text-blue-500" />
                        </div>
                        <h2 className="text-xl font-bold">{t('parent.family')}</h2>
                        <p className="text-slate-500 text-sm">{t('parent.familyDesc')}</p>
                        <div className="mt-auto pt-4 text-blue-600 font-bold flex items-center gap-1 group">
                            Manage Family <ArrowLeft className="w-4 h-4 rotate-180 group-hover:translate-x-1 transition-transform" />
                        </div>
                    </button>

                    <button
                        onClick={() => setView('SETTINGS')}
                        className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-start gap-3 hover:shadow-lg hover:border-purple-200 transition-all text-left"
                    >
                        <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center mb-2">
                            <Settings className="w-6 h-6 text-purple-500" />
                        </div>
                        <h2 className="text-xl font-bold">{t('parent.settings')}</h2>
                        <p className="text-slate-500 text-sm">{t('parent.settingsDesc')}</p>
                        <div className="mt-auto pt-4 text-purple-600 font-bold flex items-center gap-1 group">
                            Security Settings <ArrowLeft className="w-4 h-4 rotate-180 group-hover:translate-x-1 transition-transform" />
                        </div>
                    </button>

                </div>
            )
        }
    }

    return (
        <div className="min-h-dvh flex flex-col relative overflow-hidden bg-slate-50 text-slate-800 pb-20">
            <header className="px-6 py-4 bg-white shadow-sm flex items-center gap-4 sticky top-0 z-40">
                {view === 'HOME' ? (
                    <Link href="/" className="p-2 rounded-full hover:bg-slate-100 transition-colors">
                        <ArrowLeft className="w-6 h-6 text-slate-500" />
                    </Link>
                ) : (
                    <button onClick={() => setView('HOME')} className="p-2 rounded-full hover:bg-slate-100 transition-colors">
                        <ArrowLeft className="w-6 h-6 text-slate-500" />
                    </button>
                )}
                <div>
                    <h1 className="text-xl font-bold">{view === 'HOME' ? t('parent.title') : view}</h1>
                    {view !== 'HOME' && <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Parent Console</p>}
                </div>
            </header>

            <main className="flex-1 p-6 md:p-12 max-w-6xl mx-auto w-full">
                {renderView()}
            </main>
        </div>
    )
}

import { ShoppingBag } from 'lucide-react'

