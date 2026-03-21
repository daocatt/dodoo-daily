import React from 'react'
import AnimatedSky from '@/components/AnimatedSky'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-dvh bg-slate-50 relative overflow-x-hidden flex flex-col font-sans">
            <AnimatedSky />
            <div className="relative z-10 flex-1 flex flex-col">
                {children}
            </div>
        </div>
    )
}
