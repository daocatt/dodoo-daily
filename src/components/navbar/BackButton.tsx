'use client'

import React from 'react'
import { ChevronLeft } from 'lucide-react'

interface BackButtonProps {
    onBack?: () => void
}

export function BackButton({ onBack }: BackButtonProps) {
    if (!onBack) return null

    return (
        <button 
            onClick={onBack}
            className="hardware-btn group shrink-0 ml-1"
        >
            <div className="hardware-well w-8 h-8 rounded-lg bg-[#DADBD4] shadow-well active:translate-y-0.5 overflow-hidden relative border border-black/5">
                <div className="hardware-cap absolute inset-1 bg-white rounded-md flex items-center justify-center group-hover:bg-slate-50 transition-all shadow-cap active:translate-y-0.5">
                    <ChevronLeft className="w-4 h-4 text-slate-600" />
                </div>
            </div>
        </button>
    )
}
