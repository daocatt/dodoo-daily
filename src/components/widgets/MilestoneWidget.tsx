'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { Trophy, ChevronRight, Calendar } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { clsx, type ClassValue } from 'clsx'

interface Milestone {
    id: string
    text: string
    milestoneDate: string | number
}

export default function MilestoneWidget({ size = 'ICON', cellSize = 100 }: { size?: string, cellSize?: number }) {
    const [milestones, setMilestones] = useState<Milestone[]>([])
    const [loading, setLoading] = useState(size !== 'ICON')
    const router = useRouter()

    useEffect(() => {
        if (size === 'ICON') return
        // Fetch journal entries that are marked as milestones
        fetch('/api/journal?isMilestone=true')
            .then(res => res.json())
            .then(data => {
                // API returns { entries: [...] }
                const items = data.entries || []
                // Sort ascending: oldest first (left), newest last (right)
                const sorted = items
                    .sort((a: Milestone, b: Milestone) => new Date(a.milestoneDate).getTime() - new Date(b.milestoneDate).getTime())
                    .slice(- (size === 'SQUARE' ? 2 : 5)) // Take the latest N milestones but show in order
                setMilestones(sorted)
                setLoading(false)
            })
            .catch(() => setLoading(false))
    }, [size])

    if (loading) return (
        <div className="w-full h-full bg-slate-50/50 backdrop-blur-md rounded-3xl animate-pulse" />
    )

    if (size === 'ICON') return null

    return (
        <motion.div
            whileHover={{ scale: 1.01 }}
            onClick={() => router.push('/journal?filter=milestone')}
            className="w-full h-full bg-orange-50/40 backdrop-blur-xl rounded-3xl p-4 md:p-5 border-2 border-orange-100 hover:border-orange-400 shadow-xl shadow-orange-200/10 flex flex-col group overflow-hidden relative cursor-pointer transition-all duration-300"
        >
            <div className={`flex items-center justify-between ${size === 'ICON' ? '' : 'mb-2'}`}>
                <div className="flex items-center gap-2">
                    <div
                        className="rounded-xl bg-orange-100/80 flex items-center justify-center text-orange-600 shadow-sm transition-transform group-hover:rotate-12"
                        style={{ width: cellSize * 0.35, height: cellSize * 0.35 }}
                    >
                        <Trophy style={{ width: cellSize * 0.18, height: cellSize * 0.18 }} />
                    </div>
                    <span
                        className="font-black text-orange-900/40 tracking-tight uppercase"
                        style={{ fontSize: Math.max(8, cellSize * 0.1) }}
                    >
                        Milestones
                    </span>
                </div>
                <ChevronRight style={{ width: cellSize * 0.15, height: cellSize * 0.15 }} className="text-orange-300 group-hover:translate-x-1 transition-transform" />
            </div>

            <div className="flex-1 flex flex-col justify-center relative min-h-[140px]">
                {milestones.length > 0 ? (
                    <div className="relative w-full h-full flex items-center">
                        {/* Central Spine */}
                        <div className="absolute top-1/2 left-4 right-4 h-[2px] bg-orange-200/60 -translate-y-1/2 z-0 rounded-full" />

                        <div className="flex justify-between items-center w-full z-10 px-2 gap-2">
                            {milestones.map((m, idx) => {
                                const d = m.milestoneDate ? new Date(m.milestoneDate) : new Date();
                                const isTop = idx % 2 === 0;

                                return (
                                    <motion.div
                                        key={m.id}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: idx * 0.1 }}
                                        className={clsx(
                                            "flex flex-col items-center flex-1 min-w-0 relative h-32 justify-center",
                                            isTop ? "flex-col-reverse" : "flex-col"
                                        )}
                                    >
                                        {/* Content Block */}
                                        <div className={clsx(
                                            "flex flex-col items-center text-center w-full",
                                            isTop ? "mb-auto pb-2" : "mt-auto pt-2"
                                        )}>
                                            <span
                                                className="font-black text-orange-500 uppercase tracking-tight mb-0.5 bg-orange-50 px-1.5 py-0.5 rounded-md"
                                                style={{ fontSize: Math.max(6, cellSize * 0.05) }}
                                            >
                                                {d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                            </span>
                                            <p
                                                className="font-bold text-slate-700 line-clamp-2 leading-tight"
                                                style={{ fontSize: Math.max(8, cellSize * 0.08) }}
                                            >
                                                {m.text}
                                            </p>
                                        </div>

                                        {/* Vertical Bone Connector */}
                                        <div className={clsx(
                                            "w-[1.5px] bg-orange-200/80",
                                            isTop ? "h-6 mb-1" : "h-6 mt-1"
                                        )} />

                                        {/* Dot on the Spine */}
                                        <div className="w-3.5 h-3.5 rounded-full bg-white border-2 border-orange-500 shadow-sm shrink-0 z-10 flex items-center justify-center">
                                            <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                                        </div>

                                        {/* Invisible spacer to maintain layout */}
                                        <div className={clsx("h-12 w-full", isTop ? "mt-auto" : "mb-auto")} />
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center text-indigo-300 opacity-50 italic text-[10px] space-y-2">
                        <Calendar className="w-6 h-6 mb-1 opacity-20" />
                        <span>No milestones yet</span>
                    </div>
                )}
            </div>
        </motion.div>
    )
}
