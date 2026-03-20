'use client'

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, Sparkles, Layout, ShieldCheck, Heart, User, ChevronRight, ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { useI18n } from '@/contexts/I18nContext'
import NatureBackground from '@/components/NatureBackground'

export default function WelcomePage() {
    const { t } = useI18n()
    const [settings, setSettings] = useState<Record<string, unknown> | null>(null)
    const [images, setImages] = useState<string[]>(['/welcome_nature.png'])
    const [currentIndex, setCurrentIndex] = useState(0)
    const [systemName, setSystemName] = useState('DoDoo Daily')
    const [subtitle, setSubtitle] = useState('')

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
                if (data.systemName) setSystemName(data.systemName)
                if (data.systemSubtitle) setSubtitle(data.systemSubtitle)
            })
            .catch(console.error)
    }, [])

    const nextSlide = () => setCurrentIndex((prev) => (prev + 1) % (images.length || 1))
    const prevSlide = () => setCurrentIndex((prev) => (prev - 1 + (images.length || 1)) % (images.length || 1))

    // Auto carousel
    useEffect(() => {
        if (images.length === 0) return
        const timer = setInterval(nextSlide, 5000)
        return () => clearInterval(timer)
    }, [images])

    return (
        <div className="min-h-dvh relative overflow-hidden flex flex-col items-center justify-center bg-slate-900 selection:bg-indigo-500/30">
            {/* Background Base */}
            <div className="absolute inset-0 z-0">
               <NatureBackground />
               <div className="absolute inset-0 bg-black/20" />
            </div>

            {/* Content Container */}
            <div className="relative z-10 w-full max-w-6xl px-6 py-12 flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
                
                {/* Left Side: Visuals (Carousel/Mockup) */}
                <motion.div 
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex-1 w-full relative"
                >
                    <div className="relative aspect-[16/10] bg-white/10 backdrop-blur-3xl rounded-[2.5rem] p-4 shadow-2xl border border-white/20 overflow-hidden ring-1 ring-white/10">
                        {/* Internal Screen Area */}
                        <div className="relative w-full h-full rounded-[1.8rem] overflow-hidden bg-slate-800">
                           <AnimatePresence mode="wait">
                                {images.length > 0 ? (
                                    <motion.img
                                        key={currentIndex}
                                        src={images[currentIndex]}
                                        initial={{ opacity: 0, scale: 1.1 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ duration: 1.2, ease: "circOut" }}
                                        className="w-full h-full object-cover"
                                        alt="Feature"
                                    />
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-indigo-500/20 to-purple-500/20">
                                        <Sparkles className="w-12 h-12 text-white/50 animate-pulse" />
                                        <p className="text-white/40 font-bold uppercase tracking-widest text-sm">Visualizing Memories</p>
                                    </div>
                                )}
                           </AnimatePresence>
                           
                           {/* Decorative Overlays */}
                           <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                           
                           {/* Slide indicators */}
                           {images.length > 1 && (
                                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                                    {images.map((_, i) => (
                                        <div 
                                            key={i} 
                                            className={`h-1 rounded-full transition-all duration-500 ${i === currentIndex ? 'w-8 bg-white' : 'w-2 bg-white/30'}`} 
                                        />
                                    ))}
                                </div>
                           )}

                           {/* Navigation Arrows */}
                           {images.length > 1 && (
                               <>
                                    <button onClick={prevSlide} className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors">
                                        <ChevronLeft className="w-6 h-6" />
                                    </button>
                                    <button onClick={nextSlide} className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors">
                                        <ChevronRight className="w-6 h-6" />
                                    </button>
                               </>
                           )}
                        </div>
                    </div>

                    {/* Floating Floating Elements */}
                    <motion.div 
                        animate={{ y: [0, -10, 0] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 backdrop-blur-2xl rounded-3xl border border-white/20 shadow-2xl flex items-center justify-center p-4 z-20"
                    >
                        <Heart className="w-full h-full text-rose-500/80 fill-rose-500/20" />
                    </motion.div>

                    <motion.div 
                        animate={{ y: [0, 10, 0] }}
                        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                        className="absolute -bottom-8 -left-8 w-20 h-20 bg-white/10 backdrop-blur-2xl rounded-3xl border border-white/20 shadow-2xl flex items-center justify-center p-4 z-20"
                    >
                        <ShieldCheck className="w-full h-full text-amber-500/80 fill-amber-500/20" />
                    </motion.div>
                </motion.div>

                {/* Right Side: Text & Actions */}
                <motion.div 
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex-1 text-center lg:text-left space-y-8"
                >
                    <div className="space-y-4">
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-black uppercase tracking-widest mb-2"
                        >
                            <Sparkles className="w-3.5 h-3.5" />
                            Next Gen Family Tool
                        </motion.div>
                        <h1 className="text-5xl md:text-7xl font-black text-white leading-none tracking-tight">
                            {systemName}
                        </h1>
                        <p className="text-lg md:text-xl text-slate-300/80 font-medium leading-relaxed max-w-lg">
                            {subtitle || "The modern way to manage daily tasks, family achievements, and childhood growth."}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md pt-4">
                        {!settings?.hideFamilyLogin && (
                            <Link 
                                href="/admin/login"
                                className="group relative px-8 py-5 bg-white text-slate-900 rounded-[1.5rem] font-black text-xl flex items-center justify-center gap-3 shadow-xl hover:shadow-2xl hover:bg-slate-50 transition-all hover:-translate-y-1 active:scale-95 overflow-hidden"
                            >
                                <User className="w-6 h-6 text-indigo-500" />
                                <span>Family Login</span>
                                <div className="absolute inset-0 bg-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </Link>
                        )}

                        {!settings?.disableVisitorLogin && (
                            <button 
                                onClick={() => window.location.href = '/guest/login'}
                                className="px-8 py-5 bg-white/10 backdrop-blur-xl border border-white/20 text-white rounded-[1.5rem] font-black text-xl flex items-center justify-center gap-3 hover:bg-white/20 transition-all hover:-translate-y-1 active:scale-95"
                            >
                                <Layout className="w-6 h-6 text-amber-400" />
                                <span>{t('welcome.visitorEntrance')}</span>
                            </button>
                        )}
                    </div>
                </motion.div>
            </div>

            {/* Bottom Footer Credits */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 opacity-30 text-white text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-4">
               <span>Secure</span>
               <div className="w-1 h-1 rounded-full bg-white/30" />
               <span>Private</span>
               <div className="w-1 h-1 rounded-full bg-white/30" />
               <span>Reliable</span>
            </div>
            
            <style jsx global>{`
                body { background: #0f172a; }
            `}</style>
        </div>
    )
}
