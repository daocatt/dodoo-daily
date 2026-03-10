'use client'

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence, type PanInfo } from 'motion/react'
import { Images, Camera } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { clsx } from 'clsx'

interface PhotoEntry {
    id: string
    imageUrl: string
    title: string
}

export default function PhotoWidget({ size = 'ICON', cellSize = 100 }: { size?: string, cellSize?: number }) {
    const [photos, setPhotos] = useState<PhotoEntry[]>([])
    const [loading, setLoading] = useState(size !== 'ICON')
    const [currentIndex, setCurrentIndex] = useState(0)
    const router = useRouter()

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

    return (
        <motion.div
            whileHover={{ scale: 1.01 }}
            className="w-full h-full bg-slate-900 rounded-3xl shadow-2xl flex flex-col group overflow-hidden relative cursor-pointer"
        >
            <AnimatePresence mode="popLayout" initial={false}>
                {photos.length > 0 ? (
                    <motion.div
                        key={photos[currentIndex].id}
                        initial={{ opacity: 0, x: 100 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -100 }}
                        transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 30
                        }}
                        drag="x"
                        dragConstraints={{ left: 0, right: 0 }}
                        onDragEnd={handleDragEnd}
                        className="absolute inset-0 z-0 touch-none"
                    >
                        <img
                            src={photos[currentIndex].imageUrl}
                            className="w-full h-full object-cover select-none"
                            alt={photos[currentIndex].title}
                            draggable={false}
                        />
                        {/* Elegant Vignette Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20 pointer-events-none" />

                        {/* Content Overlay */}
                        <div className="absolute left-4 bottom-4 right-4 flex justify-between items-end pointer-events-none">
                            <div className="flex flex-col">
                                <span
                                    className="font-black text-white/60 uppercase tracking-widest mb-1"
                                    style={{ fontSize: Math.max(7, cellSize * 0.08) }}
                                >
                                    Latest Artwork
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
                    <div className="absolute inset-0 bg-purple-50 flex flex-col items-center justify-center text-purple-300 gap-3">
                        <Camera className="w-10 h-10 opacity-20" />
                        <span className="text-xs font-bold italic opacity-40">Your gallery is empty</span>
                    </div>
                )}
            </AnimatePresence>

            {/* Clickable Dots Navigation */}
            {/* Clickable Dots Navigation - Explicitly Bottom Right */}
            {photos.length > 1 && (
                <div className="absolute bottom-6 right-6 flex flex-row gap-1.5 z-20 px-2.5 py-2 rounded-full bg-black/30 backdrop-blur-md border border-white/10">
                    {photos.map((_, i) => (
                        <button
                            key={i}
                            onClick={(e) => {
                                e.stopPropagation();
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

            {/* Top Navigation Overlay */}
            <div className="absolute inset-0 z-10 pointer-events-none" onClick={() => router.push('/gallery')}>
                {/* Brand Tag */}
                <div className="absolute top-4 left-4 flex items-center gap-2 pointer-events-auto">
                    <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/30 shadow-lg">
                        <Images className="w-4 h-4" />
                    </div>
                </div>
            </div>
        </motion.div>
    )
}
