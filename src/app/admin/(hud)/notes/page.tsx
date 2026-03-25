'use client'

import React, { useState } from 'react'
import FamilyNoteBoard from '@/components/FamilyNoteBoard'
import { RefrigeratorBackground } from '@/components/RefrigeratorBackground'
import { Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useI18n } from '@/contexts/I18nContext'
import BausteinAdminNavbar from '@/components/BausteinAdminNavbar'

export default function NotesPage() {
    const { t } = useI18n()
    const router = useRouter()
    const [isAdding, setIsAdding] = useState(false)

    return (
        <div className="min-h-dvh flex flex-col relative overflow-hidden bg-[#E2DFD2]">
            <RefrigeratorBackground />

            <BausteinAdminNavbar 
                onBack={() => router.push('/admin')}
                actions={
                    <button
                        onClick={() => setIsAdding(true)}
                        className="hardware-btn group"
                        title={t('board.leaveNote')}
                    >
                        <div className="hardware-well h-12 px-5 rounded-xl flex items-center gap-2 bg-[#DADBD4] shadow-well active:translate-y-0.5 overflow-hidden relative">
                            <div className="hardware-cap absolute inset-1.5 bg-white rounded-lg flex items-center justify-center transition-all shadow-cap group-hover:bg-slate-50 active:translate-y-0.5" />
                            <Plus className="w-5 h-5 text-slate-500 relative z-10" />
                            <span className="hidden md:inline label-mono text-[11px] font-black text-slate-800 uppercase tracking-widest relative z-10">
                                {t('board.leaveNote')}
                            </span>
                        </div>
                    </button>
                }
            />

            <main className="relative z-10 flex-1 w-full max-w-7xl mx-auto p-4 md:p-12 overflow-y-auto custom-scrollbar">
                <FamilyNoteBoard isAdding={isAdding} setIsAdding={setIsAdding} />
            </main>
        </div>
    )
}
