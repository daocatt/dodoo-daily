'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { Book, Feather } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Journal {
    id: string
    title: string
    content: string
    createdAt: string
}

export default function JournalWidget({ size = 'ICON' }: { size?: string }) {
    const [entry, setEntry] = useState<Journal | null>(null)
    const [loading, setLoading] = useState(size !== 'ICON')
    const router = useRouter()

    useEffect(() => {
        if (size === 'ICON') return
        fetch('/api/journal')
            .then(res => res.json())
            .then(data => {
                setEntry(data[0] || null) // Just the latest one
                setLoading(false)
            })
            .catch(() => setLoading(false))
    }, [size])

    if (loading) return (
        <div className="w-full h-full bg-slate-50/50 backdrop-blur-md rounded-[2.5rem] animate-pulse" />
    )

    return (
        <motion.div
            whileHover={{ y: -5, scale: 1.01 }}
            onClick={() => router.push('/journal')}
            className="w-full h-full bg-blue-50/40 backdrop-blur-xl rounded-[2rem] p-4 md:p-5 border border-blue-100/50 shadow-xl shadow-blue-200/20 flex flex-col group overflow-hidden relative cursor-pointer"
        >
            <div className={`flex items-center justify-between ${size === 'ICON' ? '' : 'mb-3'}`}>
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 shadow-sm transition-transform group-hover:rotate-12 outline-none">
                        <Book className="w-4 h-4" />
                    </div>
                    {size !== 'ICON' && (
                        <span className="text-[11px] font-black text-slate-800 tracking-tight uppercase opacity-60">Diary</span>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-hidden relative">
                {entry && size !== 'ICON' ? (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-2 h-full"
                    >
                        <h4 className={`font-black text-slate-700 tracking-tight line-clamp-1 ${size === 'ICON' ? 'text-[10px]' : 'text-xs'}`}>
                            {entry.title || "Latest Entry"}
                        </h4>

                        {size !== 'ICON' && (
                            <p className="text-[10px] leading-relaxed text-slate-500 font-medium line-clamp-2 italic bg-white/40 p-2 rounded-xl border border-white/60">
                                &quot;{entry.content}&quot;
                            </p>
                        )}

                        <div className="flex items-center gap-1.5 mt-auto">
                            <span className="text-[9px] font-black text-blue-400/60 uppercase tracking-widest leading-none">
                                {new Date(entry.createdAt).toLocaleDateString()}
                            </span>
                        </div>
                    </motion.div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-blue-300 opacity-50 italic text-[10px] space-y-2">
                        <span>Nothing wrote today</span>
                    </div>
                )}
            </div>

            {/* Decorative Background Icon */}
            <div className="absolute -bottom-4 -right-4 p-8 opacity-[0.03] transition-opacity group-hover:opacity-10 pointer-events-none">
                <Book className="w-32 h-32 -rotate-12" />
            </div>
        </motion.div>
    )
}
