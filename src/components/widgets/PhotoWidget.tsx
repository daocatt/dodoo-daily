'use client'

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence, type PanInfo } from 'motion/react'
import { Images, Camera } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { clsx } from 'clsx'
import { useI18n } from '@/contexts/I18nContext'
import Image from 'next/image'

interface PhotoEntry {
    id: string
    url: string
    title: string
}

export default function PhotoWidget({ size = 'ICON', cellSize = 100 }: { size?: string, cellSize?: number }) {
    const [photos, setPhotos] = useState<PhotoEntry[]>([])
    const [loading, setLoading] = useState(size !== 'ICON')
    const [currentIndex, setCurrentIndex] = useState(0)
    const router = useRouter()
    const { t } = useI18n()

    useEffect(() => {
        if (size === 'ICON') return
        fetch(`/api/artworks?limit=10`)
            .then(res => res.json())
            .then(data => {
                setPhotos(Array.isArray(data) ? data : [])
                setLoading(false)
            })
            .catch(() => setLoading(false))
    }, [size])

    // Auto-play carousel
    useEffect(() => {
        if (photos.length <= 1) return
        const timer = setInterval(() => {
            setCurrentIndex(prev => (prev + 1) % photos.length)
        }, 6000)
        return () => clearInterval(timer)
    }, [photos.length])

    const handleDragEnd = (_: unknown, info: PanInfo) => {
        if (photos.length <= 1) return
        const swipeThreshold = 50;
        if (info.offset.x < -swipeThreshold) {
            setCurrentIndex(prev => (prev + 1) % photos.length)
        } else if (info.offset.x > swipeThreshold) {
            setCurrentIndex(prev => (prev - 1 + photos.length) % photos.length)
        }
    }

    if (loading) return (
        <div className="w-full h-full bg-slate-50/50 backdrop-blur-md rounded-3xl animate-pulse" />
    )

    if (size === 'ICON') return null

    const hasMultiplePhotos = photos.length > 1;

    return (
        <motion.div
            whileHover={{ scale: 1.01 }}
            className="w-full h-full bg-slate-900 flex flex-col group overflow-hidden relative cursor-pointer"
        >
            <AnimatePresence mode="popLayout" initial={false}>
                {photos.length > 0 ? (
                    <motion.div
                        key={photos[currentIndex].id}
                        initial={hasMultiplePhotos ? { opacity: 0, x: 100 } : { opacity: 0 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={hasMultiplePhotos ? { opacity: 0, x: -100 } : { opacity: 0 }}
                        transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 30
                        }}
                        drag={hasMultiplePhotos ? "x" : false}
                        dragConstraints={{ left: 0, right: 0 }}
                        onDragEnd={hasMultiplePhotos ? handleDragEnd : undefined}
                        className="absolute inset-0 z-0 touch-none"
                    >
                        <div className="absolute inset-0 bg-slate-50 flex items-center justify-center pointer-events-none group-hover:scale-105 transition-transform duration-700">
                            {photos[currentIndex].url && (
                                <Image
                                    src={photos[currentIndex].url}
                                    alt=""
                                    fill
                                    sizes="50vw"
                                    className="w-full h-full object-cover"
                                />
                            )}
                        </div>
                        {/* Elegant Vignette Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20 pointer-events-none" />

                        {/* Content Overlay */}
                        <div className="absolute left-4 bottom-4 right-4 flex justify-between items-end pointer-events-none">
                            <div className="flex flex-col">
                                <span
                                    className="font-black text-white/60 uppercase tracking-widest mb-1"
                                    style={{ fontSize: Math.max(7, cellSize * 0.08) }}
                                >
                                    {t('widget.photo.latest')}
                                </span>
                                <p
                                    className="font-bold text-white truncate max-w-[200px] drop-shadow-md"
                                    style={{ fontSize: Math.max(10, cellSize * 0.12) }}
                                >
                                    {photos[currentIndex].title}
                                </p>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <div className="absolute inset-0 bg-indigo-50/10 flex flex-col items-center justify-center text-indigo-300 gap-3">
                        <div className="hardware-well w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center shadow-well">
                            <Camera className="w-8 h-8 text-indigo-200" />
                        </div>
                        <span className="label-mono text-[10px] font-black uppercase tracking-widest opacity-40">{t('widget.photo.empty')}</span>
                    </div>
                )}
            </AnimatePresence>

            {/* Clickable Dots Navigation */}
            {hasMultiplePhotos && (
                <div className="absolute bottom-6 right-6 flex flex-row gap-1.5 z-20 px-2.5 py-2 rounded-full bg-black/30 backdrop-blur-md border border-white/10">
                    {photos.map((_, i) => (
                        <button
                            key={i}
                            onClick={(_e) => {
                                _e.stopPropagation();
                                setCurrentIndex(i);
                            }}
                            className={clsx(
                                "h-1.5 rounded-full transition-all duration-300",
                                i === currentIndex ? "w-5 bg-white shadow-[0_0_10px_rgba(255,255,255,0.4)]" : "w-1.5 bg-white/30 hover:bg-white/50"
                            )}
                        />
                    ))}
                </div>
            )}
        </motion.div>
    )
}
