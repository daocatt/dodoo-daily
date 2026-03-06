'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Star, ShieldAlert, Users, Settings, Loader2 } from 'lucide-react'
import { useI18n } from '@/contexts/I18nContext'
import { useRouter } from 'next/navigation'

export default function ParentDashboard() {
    const { t } = useI18n()
    const router = useRouter()
    const [loading, setLoading] = useState(true)

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

    return (
        <div className="min-h-dvh flex flex-col relative overflow-hidden bg-slate-50 text-slate-800">
            <header className="px-6 py-4 bg-white shadow-sm flex items-center gap-4">
                <Link href="/" className="p-2 rounded-full hover:bg-slate-100 transition-colors">
                    <ArrowLeft className="w-6 h-6 text-slate-500" />
                </Link>
                <h1 className="text-xl font-bold">{t('parent.title')}</h1>
            </header>

            <main className="flex-1 p-6 md:p-12 max-w-5xl mx-auto w-full">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col gap-3">
                        <div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center mb-2">
                            <Star className="w-6 h-6 text-yellow-500" />
                        </div>
                        <h2 className="text-xl font-bold">{t('parent.rewards')}</h2>
                        <p className="text-slate-500 text-sm">{t('parent.rewardsDesc')}</p>
                        <button className="mt-auto px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl font-semibold transition-colors">
                            {t('button.manage')}
                        </button>
                    </div>

                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col gap-3">
                        <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center mb-2">
                            <ShieldAlert className="w-6 h-6 text-red-500" />
                        </div>
                        <h2 className="text-xl font-bold">{t('parent.penalties')}</h2>
                        <p className="text-slate-500 text-sm">{t('parent.penaltiesDesc')}</p>
                        <button className="mt-auto px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold transition-colors">
                            {t('button.record')}
                        </button>
                    </div>

                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col gap-3">
                        <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center mb-2">
                            <Users className="w-6 h-6 text-blue-500" />
                        </div>
                        <h2 className="text-xl font-bold">{t('parent.family')}</h2>
                        <p className="text-slate-500 text-sm">{t('parent.familyDesc')}</p>
                        <button className="mt-auto px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold transition-colors">
                            {t('button.manage')}
                        </button>
                    </div>

                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col gap-3">
                        <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center mb-2">
                            <Settings className="w-6 h-6 text-purple-500" />
                        </div>
                        <h2 className="text-xl font-bold">{t('parent.settings')}</h2>
                        <p className="text-slate-500 text-sm">{t('parent.settingsDesc')}</p>
                        <button className="mt-auto px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-xl font-semibold transition-colors">
                            {t('button.settings')}
                        </button>
                    </div>

                </div>
            </main>
        </div>
    )
}
