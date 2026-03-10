'use client'

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { StickyNote, ChevronRight, Pin } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Note {
    id: string
    text: string
    authorId: string
    color: string
    isPinned: boolean
}

export default function NotesWidget({ size = 'ICON', cellSize = 100 }: { size?: string, cellSize?: number }) {
    const [notes, setNotes] = useState<Note[]>([])
    const [loading, setLoading] = useState(size !== 'ICON')
    const router = useRouter()

    const displayCount = size === 'ICON' ? 0 : size === 'SQUARE' ? 2 : 4

    useEffect(() => {
        if (size === 'ICON') return
        fetch('/api/family-notes')
            .then(res => res.json())
            .then(data => {
                setNotes(data.slice(0, displayCount))
                setLoading(false)
            })
            .catch(() => setLoading(false))
    }, [size, displayCount])

    if (loading) return (
        <div className="w-full h-full bg-slate-50/50 backdrop-blur-md rounded-3xl animate-pulse" />
    )

    return (
        <motion.div
            whileHover={{ scale: 1.01 }}
            onClick={() => router.push('/notes')}
            className="w-full h-full bg-amber-50/40 backdrop-blur-xl rounded-3xl p-4 md:p-5 border border-amber-100/50 shadow-xl shadow-amber-200/20 flex flex-col group overflow-hidden relative cursor-pointer"
        >
            <div className={`flex items-center justify-between ${size === 'ICON' ? '' : 'mb-2'}`}>
                <div className="flex items-center gap-2">
                    <div
                        className="rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 shadow-sm transition-transform group-hover:rotate-12 outline-none"
                        style={{ width: cellSize * 0.35, height: cellSize * 0.35 }}
                    >
                        <StickyNote style={{ width: cellSize * 0.18, height: cellSize * 0.18 }} />
                    </div>
                    {size !== 'ICON' && (
                        <span
                            className="font-black text-slate-800 tracking-tight uppercase opacity-60"
                            style={{ fontSize: Math.max(8, cellSize * 0.1) }}
                        >
                            Pined
                        </span>
                    )}
                </div>
                {size !== 'ICON' && (
                    <div
                        className="px-2 py-0.5 bg-amber-100/80 rounded-full font-black text-amber-700 uppercase tracking-widest leading-none"
                        style={{ fontSize: Math.max(7, cellSize * 0.07) }}
                    >
                        {notes.length}
                    </div>
                )}
            </div>

            <div className="flex-1 space-y-1.5 overflow-hidden relative">
                <AnimatePresence mode="popLayout">
                    {notes.length > 0 ? (
                        notes.map((note, idx) => (
                            <motion.div
                                key={note.id}
                                initial={{ x: 20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: idx * 0.05 }}
                                className="flex items-center justify-between p-2 bg-white/60 rounded-xl border border-white/80 group-hover:border-amber-200 transition-colors shadow-sm"
                            >
                                <div className="flex items-center gap-2 flex-1 overflow-hidden">
                                    <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: note.color || '#FEF3C7' }} />
                                    <p
                                        className={`font-bold text-slate-700 truncate ${size === 'SMALL' ? 'line-clamp-2' : ''}`}
                                        style={{ fontSize: Math.max(8, cellSize * 0.1) }}
                                    >
                                        {note.text}
                                    </p>
                                </div>
                                {note.isPinned && (
                                    <Pin
                                        className="text-amber-500 fill-amber-500 shrink-0 ml-1"
                                        style={{ width: cellSize * 0.1, height: cellSize * 0.1 }}
                                    />
                                )}
                            </motion.div>
                        ))
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-amber-300 opacity-40 italic text-[9px]">
                            <span>Waiting...</span>
                        </div>
                    )}
                </AnimatePresence>
            </div>

            {/* Bottom Sweep Highlight */}
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-200/50 to-transparent" />
        </motion.div>
    )
}
