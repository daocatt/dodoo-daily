'use client'

import React from 'react'
import FamilyNoteBoard from '@/components/FamilyNoteBoard'
import NatureBackground from '@/components/NatureBackground'
import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useI18n } from '@/contexts/I18nContext'

export default function NotesPage() {
    const { t } = useI18n()
    const router = useRouter()

    return (
        <div className="min-h-dvh flex flex-col relative">
            <NatureBackground />

            <header className="relative z-10 flex items-center p-6 px-12 backdrop-blur-md bg-white/40 border-b border-[#4a3728]/10 h-[80px]">
                <button
                    onClick={() => router.back()}
                    className="w-12 h-12 bg-white/60 rounded-2xl flex items-center justify-center hover:bg-white shadow-sm transition-all active:scale-95"
                >
                    <ArrowLeft className="w-6 h-6 text-[#4a3728]" />
                </button>
                <div className="ml-6">
                    <h1 className="text-2xl font-black text-[#2c2416] leading-none">{t('board.title')}</h1>
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#4a3728]/40 mt-1">{t('board.chatAndNotes')}</p>
                </div>
            </header>

            <main className="relative z-10 flex-1 w-full max-w-7xl mx-auto p-4 md:p-12 overflow-y-auto custom-scrollbar">
                <FamilyNoteBoard />
            </main>
        </div>
    )
}
