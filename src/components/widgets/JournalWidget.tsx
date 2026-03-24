'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'motion/react'
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
        <div
            className="w-full h-full flex flex-col p-6 pt-10 group overflow-hidden relative cursor-pointer"
            onClick={() => router.push('/admin/journal')}
        >
            <div className="flex-1 overflow-hidden relative">
                {entries.length > 0 && size !== 'ICON' ? (
                    <div className="flex flex-col gap-2 h-full overflow-hidden pb-2">
                        {entries.map((item, idx) => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className="bg-white border border-black/5 p-3 rounded-lg shadow-sm hover:bg-slate-50 transition-all group/item"
                            >
                                <div className="flex justify-between items-start gap-3">
                                    <p
                                        className="text-slate-800 font-black tracking-tight leading-snug line-clamp-2"
                                        style={{ fontSize: Math.max(9, cellSize * 0.11) }}
                                    >
                                        {item.text}
                                    </p>
                                    <span
                                        className="label-mono opacity-30 mt-0.5 whitespace-nowrap"
                                        style={{ fontSize: Math.max(7, cellSize * 0.07) }}
                                    >
                                        {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-300 opacity-60">
                         <span className="label-mono text-[9px] uppercase tracking-widest">{t('widget.journal.empty')}</span>
                    </div>
                )}
            </div>
        </div>
    )
}
