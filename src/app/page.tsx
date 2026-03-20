'use client'

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Layout, User, ChevronRight, ChevronLeft, Disc, X } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useI18n } from '@/contexts/I18nContext'
import versionData from '../../version.json'

const techData: Record<string, string> = {
    'SECURITY': 'RECOMMEND LOCAL OR NAS DEPLOYMENT FOR HOME INTRANET SECURITY.',
    'PRIVATE': 'ENHANCED PERMISSIONS SYSTEM FOR FAMILY MEMBERS AND VISITORS.',
    'OPEN': 'OPEN DATA COLLABORATION MECHANISM FOR SEAMLESS SHARING.'
}

export default function WelcomePage() {
    const { t } = useI18n()
    const [settings, setSettings] = useState<Record<string, unknown> | null>(null)
    const [images, setImages] = useState<string[]>(['/cyber_settlement.png'])
    const [currentIndex, setCurrentIndex] = useState(0)
    const [systemName, setSystemName] = useState('DODOO DAILY')
    const [subtitle] = useState('DAILY MODULE')

    useEffect(() => {
        fetch('/api/system/settings')
            .then(res => res.json())
            .then(data => {
                setSettings(data)
                if (data.homepageImages) {
                    try {
                        const parsed = JSON.parse(data.homepageImages)
                        if (Array.isArray(parsed) && parsed.length > 0) {
                            setImages(parsed)
                        }
                    } catch (e) {
                        console.error('Failed to parse carousel images', e)
                    }
                }
                if (data.systemName) setSystemName(data.systemName.toUpperCase())
                // No need to override subtitle if it's set to "DAILY MODULE"
            })
            .catch(console.error)
    }, [])

    const nextSlide = () => setCurrentIndex((prev) => (prev + 1) % (images.length || 1))
    const prevSlide = () => setCurrentIndex((prev) => (prev - 1 + (images.length || 1)) % (images.length || 1))

    // Typewriter effect state for bottom right Technical Manual
    const [activeTechInfo, setActiveTechInfo] = useState<string | null>(null)
    const [typedText, setTypedText] = useState('')

    useEffect(() => {
        if (!activeTechInfo) return
        setTypedText('')
        let i = 0
        const text = techData[activeTechInfo]
        if (!text) return
        const interval = setInterval(() => {
            setTypedText(text.slice(0, i + 1))
            i++
            if (i >= text.length) clearInterval(interval)
        }, 30)
        return () => clearInterval(interval)
    }, [activeTechInfo])

    return (
        <main className="min-h-dvh w-full bg-[#C8C9C4] flex items-center justify-center p-4 md:p-8 selection:bg-indigo-500/20 app-bg-pattern">
            
            {/* Main Device Panel */}
            <div className="baustein-panel w-full max-w-5xl max-h-[96dvh] md:max-h-none flex flex-col shadow-2xl relative overflow-auto md:overflow-hidden">
                
                {/* Hardware Header */}
                <header className="flex justify-between items-center px-8 md:px-12 pt-6 pb-4">
                    <div className="flex flex-col">
                        <span className="text-xl font-black tracking-tighter text-slate-900 leading-none">{systemName}</span>
                        <span className="label-mono mt-1 opacity-60">Vol. {versionData.version} / {currentIndex + 1}</span>
                    </div>
                    <div className="label-mono bg-slate-200/50 px-3 py-1 rounded border border-white/40">
                        {currentIndex === 0 ? 'STATUS: COLD_START_OK' : 'STATUS: DATA_STREAM_NOMINAL'}
                    </div>
                </header>

                <div className="flex flex-col lg:flex-row flex-1 px-8 md:px-12 pb-8 gap-8">
                    
                    {/* Visual Section */}
                    <div className="flex-1 min-h-[320px] relative rounded-2xl overflow-hidden group border-4 border-[#DADBD4] shadow-well bg-slate-950">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentIndex}
                                initial={{ opacity: 0, scale: 1.1 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.8, ease: 'circOut' }}
                                className="absolute inset-0"
                            >
                                <Image
                                    src={images[currentIndex]} 
                                    alt="System Visual"
                                    fill
                                    className="object-cover opacity-80 contrast-125"
                                    priority={currentIndex === 0}
                                />
                            </motion.div>
                        </AnimatePresence>

                        {/* CRT Effect Overlays */}
                        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.5)_100%)] z-10" />
                        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))] z-20 bg-[length:100%_2px,3px_100%] opacity-40" />

                        {/* Status Overlay */}
                        <div className="absolute top-4 left-4 flex gap-2 z-30">
                             <div className="px-2 py-1 bg-black/60 backdrop-blur-md border border-white/10 rounded overflow-hidden">
                                <span className="label-mono text-[10px] text-emerald-400">ENCRYPTION_LAYER_v2</span>
                             </div>
                        </div>

                        {/* Nav Overlays */}
                        {images.length > 1 && (
                            <div className="absolute inset-0 flex items-center justify-between px-4 opacity-0 group-hover:opacity-100 transition-opacity z-40">
                                <button onClick={prevSlide} className="w-10 h-10 hardware-well rounded-full flex items-center justify-center text-slate-200 hover:text-white transition-all border border-white/20 bg-black/20">
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <button onClick={nextSlide} className="w-10 h-10 hardware-well rounded-full flex items-center justify-center text-slate-200 hover:text-white transition-all border border-white/20 bg-black/20">
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Controls Section */}
                    <div className="w-full lg:w-96 flex flex-col gap-6 py-2">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <h1 className="text-3xl font-black text-slate-900 tracking-tighter">{subtitle}</h1>
                                <p className="text-xs font-medium text-slate-500 leading-tight">
                                    A precise modular system for family growth tracking and everyday task management. 
                                </p>
                            </div>

                            <div className="hardware-groove" />

                            <div className="flex flex-col gap-4">
                                {!settings?.hideFamilyLogin && (
                                    <div className="flex flex-col gap-2 w-full">
                                        <div className="flex justify-between items-center px-1">
                                            <span className="label-mono text-[10px]">Entry F-1</span>
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]" />
                                        </div>
                                        <Link 
                                            href="/admin/login"
                                            className="hardware-btn group w-full block"
                                        >
                                            <div className="hardware-well h-20 w-full rounded-xl overflow-hidden relative">
                                                <div className="hardware-cap absolute inset-2 bg-[#F4F4F2] rounded-lg flex items-center px-8 justify-between group-hover:bg-white transition-all shadow-sm">
                                                    <div className="flex items-center gap-4 min-w-0">
                                                        <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center border border-indigo-100 shrink-0 shadow-inner">
                                                            <User className="w-5 h-5 text-indigo-600" />
                                                        </div>
                                                        <span className="font-black text-slate-800 tracking-tight whitespace-nowrap">FAMILY LOGIN</span>
                                                    </div>
                                                    <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-500 transition-colors shrink-0" />
                                                </div>
                                            </div>
                                        </Link>
                                    </div>
                                )}

                                {!settings?.disableVisitorLogin && (
                                    <div className="flex flex-col gap-2 w-full">
                                        <div className="flex justify-between items-center px-1">
                                            <span className="label-mono text-[10px]">Entry G-1</span>
                                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_5px_rgba(245,158,11,0.5)]" />
                                        </div>
                                        <button 
                                            onClick={() => window.location.href = '/guest/login'}
                                            className="hardware-btn group w-full block"
                                        >
                                            <div className="hardware-well h-20 w-full rounded-xl overflow-hidden relative">
                                                <div className="hardware-cap absolute inset-2 bg-[#E8E8E4] rounded-lg flex items-center px-8 justify-between group-hover:bg-white transition-all shadow-sm">
                                                    <div className="flex items-center gap-4 min-w-0">
                                                        <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center border border-amber-100 shrink-0 shadow-inner">
                                                            <Layout className="w-5 h-5 text-amber-500" />
                                                        </div>
                                                        <span className="font-black text-slate-800 tracking-tight uppercase whitespace-nowrap">{t('welcome.visitorEntrance')}</span>
                                                    </div>
                                                    <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-amber-500 transition-colors shrink-0" />
                                                </div>
                                            </div>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Secondary Controls / Technical hints */}
                        <div className="mt-2 pt-4 border-t border-black/5 flex justify-between items-end relative">
                             <div className="flex gap-4">
                                <div className="w-10 h-10 hardware-well rounded-full flex items-center justify-center"><Disc className="w-4 h-4 text-slate-400 animate-spin-slow" /></div>
                                <div className="space-y-1">
                                    <div className="label-mono text-[9px]">Status: Active</div>
                                    <div className="label-mono text-[9px]">Radio: 2019.FM</div>
                                </div>
                             </div>
                             
                             <div className="text-right">
                                 <div className="label-mono text-[9px] opacity-40 uppercase tracking-widest">Technical Manual</div>
                                 <div className="label-mono text-[10px] font-bold text-slate-400">DODOO-19-DAILY</div>
                             </div>
                        </div>
                    </div>
                </div>

                {/* Footer Hardware Branding */}
                <footer className="px-12 py-5 bg-black/5 flex justify-between items-center sm:rounded-b-2xl relative">
                    <div className="label-mono opacity-50">DODOO_DAILY_SYSTEM // 2026</div>
                    <div className="flex gap-4">
                        {(['Security', 'Private', 'Open'] as const).map(label => (
                            <button 
                                key={label}
                                onClick={() => setActiveTechInfo(activeTechInfo === label.toUpperCase() ? null : label.toUpperCase())}
                                className={`label-mono transition-colors hover:text-indigo-600 ${activeTechInfo === label.toUpperCase() ? 'text-indigo-600 font-bold' : 'opacity-50 text-slate-600'}`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>

                    {/* Typewriter Popover */}
                    <AnimatePresence>
                        {activeTechInfo && (
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                className="absolute bottom-full right-12 mb-4 w-64 p-3 bg-slate-900 shadow-2xl rounded-lg border border-slate-700 z-50 overflow-hidden"
                            >
                                <div className="flex justify-between items-center mb-1 border-b border-white/10 pb-1">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                                        <span className="label-mono text-[9px] text-indigo-400">{activeTechInfo} PROTOCOL</span>
                                    </div>
                                    <button 
                                        onClick={() => setActiveTechInfo(null)}
                                        className="text-slate-500 hover:text-white transition-colors"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                                <div className="label-mono text-[10px] text-slate-200 leading-relaxed min-h-[40px]">
                                    {typedText}
                                    <span className="inline-block w-1 h-3 bg-indigo-400 animate-pulse ml-1 align-middle" />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </footer >
            </div>

            <style jsx global>{`
                @keyframes spin-slow {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .animate-spin-slow {
                    animation: spin-slow 8s linear infinite;
                }
                body { overflow-y: auto !important; }
            `}</style>
        </main>
    )
}
