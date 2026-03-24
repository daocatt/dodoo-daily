'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { Heart, Sparkles } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useI18n } from '@/contexts/I18nContext'

interface Journal {
    id: string
    title: string
    text: string
    createdAt: number
}

export default function JournalWidget({ size = 'ICON', cellSize = 100 }: { size?: string, cellSize?: number }) {
    const [entries, setEntries] = useState<Journal[]>([])
    const [loading, setLoading] = useState(size !== 'ICON')
    const router = useRouter()
    const { t } = useI18n()

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
            className="w-full h-full bg-orange-50/60 backdrop-blur-xl rounded-3xl p-4 md:p-5 border border-[#f54900]/10 shadow-xl shadow-[#f54900]/5 flex flex-col group overflow-hidden relative cursor-pointer"
        >
            <div className={`flex items-center justify-between ${size === 'ICON' ? '' : 'mb-2'}`}>
                <div className="flex items-center gap-2">
                    <div
                        className="rounded-xl bg-[#f54900]/10 flex items-center justify-center text-[#f54900] shadow-sm transition-transform group-hover:rotate-12 outline-none"
                        style={{ width: cellSize * 0.35, height: cellSize * 0.35 }}
                    >
                        <Heart style={{ width: cellSize * 0.18, height: cellSize * 0.18 }} />
                    </div>
                    {size !== 'ICON' && (
                        <span
                            className="font-black text-[#f54900] tracking-tight uppercase opacity-80"
                            style={{ fontSize: Math.max(8, cellSize * 0.1) }}
                        >
                            {t('widget.journal.title')}
                        </span>
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
                                className="bg-white/60 backdrop-blur-sm p-3 rounded-2xl border border-white/60 shadow-sm hover:bg-white/80 hover:shadow-md transition-all group/item"
                            >
                                <div className="flex justify-between items-start gap-2">
                                    <p
                                        className="text-[11px] leading-relaxed text-stone-800 font-bold line-clamp-2"
                                        style={{ fontSize: Math.max(9, cellSize * 0.1) }}
                                    >
                                        {item.text}
                                    </p>
                                    <span
                                        className="font-black text-[#f54900] opacity-60 mt-0.5 whitespace-nowrap"
                                        style={{ fontSize: Math.max(7, cellSize * 0.07) }}
                                    >
                                        {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-[#f54900] opacity-50 italic text-[10px] space-y-2">
                        <Sparkles className="w-6 h-6 opacity-20" />
                        <span>{t('widget.journal.empty')}</span>
                    </div>
                )}
            </div>

        </motion.div>
    )
}
