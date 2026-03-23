'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import VisitorCenter from '@/components/public/VisitorCenter'
import AuthGate from '@/components/public/AuthGate'
import { useAuthSession } from '@/hooks/useAuthSession'
import { ArrowLeft } from 'lucide-react'
import { useI18n } from '@/contexts/I18nContext'

export default function MemberPage() {
    const router = useRouter()
    const { t } = useI18n()
    const { user, logout, refresh } = useAuthSession()

    return (
        <main className="min-h-dvh relative flex flex-col items-center justify-center p-6 bg-[#E2DFD2] app-bg-pattern overflow-hidden">
            <div className="absolute inset-0 pointer-events-none opacity-40" />
            
            <div className="absolute top-10 left-10 z-50">
                <button 
                    onClick={() => router.push('/')}
                    className="hardware-btn group"
                >
                    <div className="hardware-cap bg-white px-6 py-3 rounded-lg flex items-center gap-3 border border-black/5 shadow-sm active:translate-y-0.5 transition-all">
                        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform text-slate-400 group-hover:text-slate-900" />
                        <span className="label-mono text-[11px] font-black uppercase tracking-widest text-slate-600 group-hover:text-slate-900">{t?.('common.back') || 'Home'}</span>
                    </div>
                </button>
            </div>

            <div className="relative z-10 w-full max-w-2xl h-[85vh] flex flex-col pt-16">
                <AuthGate mode="FAMILY" fallback={
                    <div className="flex flex-col items-center justify-center h-full">
                        <p className="text-slate-500 mb-4">{t('login.restrictedMember') || 'Member Zone Only'}</p>
                        <button onClick={() => router.push('/admin/login')} className="hardware-cap bg-white px-6 py-3 rounded-xl shadow-sm border border-slate-200 text-sm font-black text-slate-700">Go to Login</button>
                    </div>
                }>
                    {user && (
                        <VisitorCenter 
                            visitor={{
                                id: user.id,
                                name: user.nickname || user.name,
                                currency: 0,
                            }} 
                            onLogout={() => {
                                logout()
                                router.push('/')
                            }} 
                            onUpdateCurrency={(newVal) => refresh()}
                        />
                    )}
                </AuthGate>
            </div>

            <style jsx global>{`
                .app-bg-pattern {
                    background-image: radial-gradient(rgba(0,0,0,0.15) 1.5px, transparent 1.5px);
                    background-size: 32px 32px;
                }
            `}</style>
        </main>
    )
}
