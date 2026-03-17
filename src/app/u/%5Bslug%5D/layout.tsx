import React from 'react'
import AnimatedSky from '@/components/AnimatedSky'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-dvh bg-slate-50 relative overflow-hidden flex flex-col font-sans">
            <AnimatedSky />
            <div className="relative z-10 flex-1 flex flex-col">
                {children}
            </div>
            <footer className="relative z-10 p-8 text-center text-slate-400 text-sm border-t border-slate-100 bg-white/50 backdrop-blur-md">
                <p>© {new Date().getFullYear()} DoDoo Daily. All art protected by family love.</p>
            </footer>
        </div>
    )
}
