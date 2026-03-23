'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react'
import Image from 'next/image'

interface LightboxProps {
    images: string[]
    initialIndex: number
    onClose: () => void
}

export default function Lightbox({ images, initialIndex, onClose }: LightboxProps) {
    const [index, setIndex] = useState(initialIndex)

    const next = (e?: React.MouseEvent) => {
        e?.stopPropagation()
        setIndex((index + 1) % images.length)
    }

    const prev = (e?: React.MouseEvent) => {
        e?.stopPropagation()
        setIndex((index - 1 + images.length) % images.length)
    }

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 md:p-10 select-none"
            >
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 p-4 text-white/50 hover:text-white transition-colors z-50 bg-white/10 rounded-2xl"
                >
                    <X className="w-8 h-8" />
                </button>

                {images.length > 1 && (
                    <>
                        <button
                            onClick={prev}
                            className="absolute left-6 top-1/2 -translate-y-1/2 p-4 text-white/50 hover:text-white transition-colors z-50 bg-white/10 rounded-2xl"
                        >
                            <ChevronLeft className="w-8 h-8" />
                        </button>
                        <button
                            onClick={next}
                            className="absolute right-6 top-1/2 -translate-y-1/2 p-4 text-white/50 hover:text-white transition-colors z-50 bg-white/10 rounded-2xl"
                        >
                            <ChevronRight className="w-8 h-8" />
                        </button>
                    </>
                )}

                <div className="relative w-full h-full flex items-center justify-center pointer-events-none">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.1 }}
                            className="relative w-full h-full pointer-events-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <Image
                                src={images[index]}
                                alt=""
                                fill
                                className="object-contain"
                                priority
                            />
                        </motion.div>
                    </AnimatePresence>
                </div>

                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-2 overflow-x-auto max-w-[80vw] p-2 hide-scrollbar">
                    {images.map((img, i) => (
                        <button
                            key={i}
                            onClick={(e) => { e.stopPropagation(); setIndex(i); }}
                            className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-all shrink-0 relative ${i === index ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-50 hover:opacity-100'}`}
                        >
                            <Image src={img} alt="" fill className="object-cover" />
                        </button>
                    ))}
                </div>
            </motion.div>
        </AnimatePresence>
    )
}
