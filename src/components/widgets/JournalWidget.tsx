'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { Heart, Sparkles, ChevronRight, PenLine, Book } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Journal {
    id: string
    title: string
    text: string
    createdAt: number
}

export default function JournalWidget({ size = 'ICON' }: { size?: string }) {
    const [entries, setEntries] = useState<Journal[]>([])
    const [loading, setLoading] = useState(size !== 'ICON')
    const router = useRouter()

    useEffect(() => {
        if (size === 'ICON') return
        fetch('/api/journal?limit=2&excludeMilestones=true')
            .then(res => res.json())
            .then(data => {
                setEntries(data.entries || [])
                setLoading(false)
            })
            .catch(() => setLoading(false))
    }, [size])

    if (loading) return (
        <div className="w-full h-full bg-slate-50/50 backdrop-blur-md rounded-3xl animate-pulse" />
    )

    return (
        <motion.div
            whileHover={{ scale: 1.01 }}
            onClick={() => router.push('/journal')}
            className="w-full h-full bg-blue-50/40 backdrop-blur-xl rounded-3xl p-4 md:p-5 border border-blue-100/50 shadow-xl shadow-blue-200/20 flex flex-col group overflow-hidden relative cursor-pointer"
        >
            <div className={`flex items-center justify-between ${size === 'ICON' ? '' : 'mb-3'}`}>
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm transition-transform group-hover:rotate-12 outline-none">
                        <Heart className="w-4 h-4" />
                    </div>
                    {size !== 'ICON' && (
                        <span className="text-[11px] font-black text-indigo-800 tracking-tight uppercase opacity-60">Journal</span>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-hidden relative">
                {entries.length > 0 && size !== 'ICON' ? (
                    <div className="flex flex-col gap-2.5 h-full overflow-hidden pb-2">
                        {entries.map((item, idx) => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className="bg-white/50 backdrop-blur-sm p-3 rounded-2xl border border-white/60 shadow-sm hover:shadow-md transition-all group/item"
                            >
                                <div className="flex justify-between items-start gap-2">
                                    <p className="text-[11px] leading-relaxed text-slate-700 font-bold line-clamp-2">
                                        {item.text}
                                    </p>
                                    <span className="text-[8px] font-black text-indigo-400 opacity-60 mt-0.5 whitespace-nowrap">
                                        {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-blue-300 opacity-50 italic text-[10px] space-y-2">
                        <Sparkles className="w-6 h-6 opacity-20" />
                        <span>No entries today</span>
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
