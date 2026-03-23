'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import VisitorCenter from '@/components/public/VisitorCenter'
import AuthGate from '@/components/public/AuthGate'
import { useAuthSession } from '@/hooks/useAuthSession'
import { useI18n } from '@/contexts/I18nContext'
import { ArrowLeft } from 'lucide-react'

export default function VisitorPage() {
    const router = useRouter()
    const { t } = useI18n()
    const { visitor, logout, refresh } = useAuthSession()

    return (
        <main className="min-h-dvh relative flex flex-col items-center justify-center p-4 md:p-8 bg-[#C8C9C4] selection:bg-indigo-500/20 app-bg-pattern overflow-hidden">
            {/* Ambient Background Elements */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-black/5 to-transparent" />
                <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black/5 to-transparent" />
            </div>
            
            <div className="relative z-10 w-full max-w-2xl">
                <AuthGate mode="VISITOR" fallback={
                    <div className="baustein-panel w-full bg-[#E2DFD2] rounded-[3rem] p-12 shadow-[0_40px_100px_rgba(0,0,0,0.5)] border-4 border-[#C8C4B0] flex flex-col items-center text-center">
                         <div className="w-20 h-20 hardware-well rounded-full flex items-center justify-center mb-8 bg-[#D6D2C0] border-4 border-[#C8C4B0]">
                            <div className="w-3 h-3 rounded-full bg-rose-500 animate-pulse shadow-[0_0_15px_rgba(244,63,94,0.6)]" />
                        </div>
                        <h2 className="text-2xl font-black text-slate-800 mb-2 uppercase tracking-tighter">
                            {t('visitor.identityRequired')}
                        </h2>
                        <p className="label-mono text-[10px] text-slate-500 mb-10 max-w-xs leading-relaxed uppercase tracking-widest">
                            {t('visitor.accessRestricted')}
                        </p>
                        <button 
                            onClick={() => router.push('/visitor/login')} 
                            className="hardware-btn group w-full"
                        >
                            <div className="hardware-cap bg-white py-4 rounded-2xl font-black text-sm text-slate-800 border-2 border-[#C8C4B0] shadow-lg group-hover:bg-[#F4F4F2] transition-colors">
                                {t('visitor.retrieveCredentials')}
                            </div>
                        </button>
                    </div>
                }>
                    <div className="baustein-panel w-full bg-[#E2DFD2] rounded-[3rem] p-8 md:p-12 shadow-[0_40px_100px_rgba(0,0,0,0.5)] border-4 border-[#C8C4B0] relative overflow-hidden min-h-[70vh] flex flex-col">
                        {visitor && (
                            <VisitorCenter 
                                visitor={{
                                    id: visitor.id,
                                    name: visitor.name,
                                    currency: visitor.currency,
                                    email: visitor.email,
                                    phone: visitor.phone
                                }} 
                                onLogout={async () => {
                                    await logout()
                                    router.replace('/')
                                }} 
                                onUpdateCurrency={() => refresh()}
                            />
                        )}
                    </div>
                </AuthGate>
            </div>

            <style jsx global>{`
                .app-bg-pattern {
                    background-image: 
                        linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px);
                    background-size: 40px 40px;
                }
            `}</style>
        </main>
    )
}
