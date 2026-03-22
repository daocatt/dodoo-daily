'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'motion/react'
import GuestAuth from '@/components/public/GuestAuth'
import NatureBackground from '@/components/NatureBackground'
import { ArrowLeft } from 'lucide-react'
import { useI18n } from '@/contexts/I18nContext'

export default function GuestLoginPage() {
    const router = useRouter()
    const { t } = useI18n()

    return (
        <main className="min-h-dvh relative flex flex-col items-center justify-center p-6 bg-[#E2DFD2] app-bg-pattern overflow-hidden">
            {/* Standard Background Dots - Synced with Home */}
            <div className="absolute inset-0 pointer-events-none opacity-40" />
            
            {/* Hardware Back Button - Synced with Admin Terminal */}
            <div className="absolute top-10 left-10 z-50">
                <button 
                    onClick={() => router.back()}
                    className="hardware-btn group"
                >
                    <div className="hardware-cap bg-white px-6 py-3 rounded-2xl flex items-center gap-3 border border-black/5 shadow-sm active:translate-y-0.5 transition-all">
                        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform text-slate-400 group-hover:text-indigo-500" />
                        <span className="label-mono text-[11px] font-black uppercase tracking-widest text-slate-600 group-hover:text-slate-900">{t?.('common.back') || 'Back'}</span>
                    </div>
                </button>
            </div>

            {/* The ONLY Source of Truth for Visitor Auth */}
            <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="relative z-10 w-full max-w-md"
            >
                <GuestAuth 
                    onSuccess={(data) => {
                        localStorage.setItem('visitor_data', JSON.stringify(data))
                        window.dispatchEvent(new Event('storage'))
                        router.back()
                    }} 
                />
            </motion.div>

            {/* Industrial Identity Footer */}
            <div className="absolute bottom-10 left-0 right-0 z-10 flex justify-center opacity-10 pointer-events-none">
                <div className="label-mono text-[10px] uppercase font-black tracking-[0.8em]">Identity_Identification_Portal_V2</div>
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
