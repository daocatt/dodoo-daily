'use client'

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Image as ImageIcon, Camera, Heart } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { clsx } from 'clsx'

interface Media {
    id: string
    url: string
    type: string
}

export default function PhotoWidget({ size = 'ICON' }: { size?: string }) {
    const [photos, setPhotos] = useState<Media[]>([])
    const [loading, setLoading] = useState(size !== 'ICON')
    const router = useRouter()

    const displayCount = size === 'ICON' ? 0 : size === 'SQUARE' ? 4 : 8;

    useEffect(() => {
        if (size === 'ICON') return
        fetch('/api/media')
            .then(res => res.json())
            .then(data => {
                setPhotos(data.slice(0, displayCount))
                setLoading(false)
            })
            .catch(() => setLoading(false))
    }, [size, displayCount])

    if (loading) return (
        <div className="w-full h-full bg-slate-50/50 backdrop-blur-md rounded-[2.5rem] animate-pulse" />
    )

    return (
        <motion.div
            whileHover={{ y: -5, scale: 1.01 }}
            onClick={() => router.push('/gallery')}
            className="w-full h-full bg-purple-50/40 backdrop-blur-xl rounded-[2rem] p-4 md:p-5 border border-purple-100/50 shadow-xl shadow-purple-200/20 flex flex-col group overflow-hidden relative cursor-pointer"
        >
            <div className={`flex items-center justify-between ${size === 'ICON' ? '' : 'mb-3'}`}>
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600 shadow-sm transition-transform group-hover:rotate-12 outline-none">
                        <ImageIcon className="w-4 h-4" />
                    </div>
                    {size !== 'ICON' && (
                        <span className="text-[11px] font-black text-slate-800 tracking-tight uppercase opacity-60">Photos</span>
                    )}
                </div>
            </div>

            {size !== 'ICON' && (
                <div
                    className={clsx(
                        "flex-1 grid gap-1.5 overflow-hidden rounded-xl",
                        size === 'SQUARE' ? 'grid-cols-2' : 'grid-cols-4'
                    )}
                >
                    {photos.length > 0 ? (
                        photos.map((photo, idx) => (
                            <motion.div
                                key={photo.id}
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: idx * 0.1 }}
                                className="relative aspect-square rounded-xl overflow-hidden shadow-inner bg-slate-100 group/img"
                            >
                                <img src={photo.url} className="w-full h-full object-cover transition-transform group-hover/img:scale-110 duration-500" />
                                <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/20 transition-all" />
                            </motion.div>
                        ))
                    ) : (
                        <div className="col-span-2 h-full flex flex-col items-center justify-center text-purple-300 opacity-50 italic text-[10px] space-y-2">
                            <span>No photos yet</span>
                        </div>
                    )}
                </div>
            )}
        </motion.div>
    )
}
