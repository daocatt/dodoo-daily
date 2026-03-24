'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import MemberCenter from '@/components/member/MemberCenter'
import AuthGate from '@/components/public/AuthGate'
import { useAuthSession } from '@/hooks/useAuthSession'
import { useI18n } from '@/contexts/I18nContext'

export default function MemberPage() {
    const router = useRouter()
    const { t } = useI18n()
    const { user, logout, refresh } = useAuthSession()

    return (
        <main className="min-h-dvh relative flex flex-col items-center justify-center p-6 bg-[#E2DFD2] app-bg-pattern overflow-hidden">
            <div className="absolute inset-0 pointer-events-none opacity-40" />

            <div className="relative z-10 w-full max-w-2xl flex flex-col pt-8 pb-20">
                <AuthGate mode="FAMILY" fallback={
                    <div className="flex flex-col items-center justify-center h-full">
                        <p className="text-slate-500 mb-4">{t('login.restrictedMember') || 'Member Zone Only'}</p>
                        <button onClick={() => router.push('/admin/login')} className="hardware-cap bg-white px-6 py-3 rounded-xl shadow-sm border border-slate-200 text-sm font-black text-slate-700">Go to Login</button>
                    </div>
                }>
                    {user && (
                        <div className="baustein-panel shadow-2xl overflow-hidden flex-1 flex flex-col bg-[#D6D2C0] rounded-[2.5rem] border-8 border-[#C8C4B0] p-8 md:p-12 relative">
                             {/* Industrial Shell Decorative Screws */}
                            <div className="absolute top-4 left-4 w-2 h-2 rounded-full bg-black/10 border border-white/20 shadow-inner" />
                            <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-black/10 border border-white/20 shadow-inner" />
                            <div className="absolute bottom-4 left-4 w-2 h-2 rounded-full bg-black/10 border border-white/20 shadow-inner" />
                            <div className="absolute bottom-4 right-4 w-2 h-2 rounded-full bg-black/10 border border-white/20 shadow-inner" />

                            <MemberCenter 
                                member={{
                                    id: user.id,
                                    name: user.name,
                                    nickname: user.nickname,
                                    avatar: user.avatarUrl,
                                    currency: user.currency ?? 0,
                                    email: user.email,
                                    phone: user.phone,
                                    address: user.address
                                }} 
                                onLogout={() => {
                                    logout()
                                    router.push('/')
                                }} 
                                onUpdateCurrency={(_newVal) => refresh()}
                            />
                        </div>
                    )}
                </AuthGate>
            </div>

            <style jsx global>{`
                .app-bg-pattern {
                    background-image: radial-gradient(rgba(0,0,0,0.15) 1.5px, transparent 1.5px);
                    background-size: 32px 32px;
                }
                .baustein-panel {
                    box-shadow: 
                        0 20px 50px -10px rgba(0,0,0,0.3),
                        inset 0 2px 4px rgba(255,255,255,0.4),
                        inset 0 -2px 4px rgba(0,0,0,0.2);
                }
            `}</style>
        </main>
    )
}
