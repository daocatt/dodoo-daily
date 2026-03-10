'use client'

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { CheckCircle2, Circle, Star, Coins } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Task {
    id: string
    title: string
    status: 'PENDING' | 'COMPLETED' | 'CONFIRMED'
    goldStarReward: number
    currencyReward: number
}

export default function TasksWidget({ size = 'ICON', cellSize = 100 }: { size?: string, cellSize?: number }) {
    const [tasks, setTasks] = useState<Task[]>([])
    const [loading, setLoading] = useState(size !== 'ICON')
    const router = useRouter()

    const displayCount = size === 'ICON' ? 0 : size === 'SQUARE' ? 4 : 8;

    useEffect(() => {
        if (size === 'ICON') return
        fetch('/api/tasks')
            .then(res => res.json())
            .then(data => {
                setTasks(data.slice(0, displayCount))
                setLoading(false)
            })
            .catch(() => setLoading(false))
    }, [size, displayCount])

    if (loading) return (
        <div className="w-full h-full bg-slate-50/50 backdrop-blur-md rounded-3xl animate-pulse" />
    )

    const completedCount = tasks.filter(t => t.status !== 'PENDING').length

    return (
        <motion.div
            whileHover={{ scale: 1.01 }}
            onClick={() => router.push('/tasks')}
            className="w-full h-full bg-emerald-50/40 backdrop-blur-xl rounded-3xl p-4 md:p-5 border border-emerald-100/50 shadow-xl shadow-emerald-200/20 flex flex-col group overflow-hidden relative cursor-pointer"
        >
            <div className={`flex items-center justify-between ${size === 'ICON' ? '' : 'mb-2'}`}>
                <div className="flex items-center gap-2">
                    <div
                        className="rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm transition-transform group-hover:rotate-12 outline-none"
                        style={{ width: cellSize * 0.35, height: cellSize * 0.35 }}
                    >
                        <CheckCircle2 style={{ width: cellSize * 0.18, height: cellSize * 0.18 }} />
                    </div>
                    {size !== 'ICON' && (
                        <span
                            className="font-black text-slate-800 tracking-tight uppercase opacity-60"
                            style={{ fontSize: Math.max(8, cellSize * 0.1) }}
                        >
                            Tasks
                        </span>
                    )}
                </div>
                {size !== 'ICON' && (
                    <div
                        className="px-2 py-0.5 bg-emerald-100/80 rounded-full font-black text-emerald-700 uppercase tracking-widest leading-none"
                        style={{ fontSize: Math.max(7, cellSize * 0.07) }}
                    >
                        {completedCount}/{tasks.length}
                    </div>
                )}
            </div>

            <div className="flex-1 space-y-1.5 overflow-hidden">
                <AnimatePresence mode="popLayout">
                    {tasks.length > 0 ? (
                        tasks.map((task, idx) => (
                            <motion.div
                                key={task.id}
                                initial={{ x: 20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: idx * 0.05 }}
                                className="flex items-center justify-between p-2 bg-white/60 rounded-xl border border-white/80 group-hover:border-emerald-200 transition-colors shadow-sm"
                            >
                                <div className="flex items-center gap-2 overflow-hidden">
                                    {task.status === 'PENDING' ? (
                                        <Circle
                                            className="text-emerald-300 shrink-0"
                                            style={{ width: cellSize * 0.15, height: cellSize * 0.15 }}
                                        />
                                    ) : (
                                        <CheckCircle2
                                            className="text-emerald-500 shrink-0"
                                            style={{ width: cellSize * 0.15, height: cellSize * 0.15 }}
                                        />
                                    )}
                                    <span
                                        className={`font-bold text-slate-700 truncate ${task.status !== 'PENDING' ? 'line-through opacity-40' : ''}`}
                                        style={{ fontSize: Math.max(8, cellSize * 0.1) }}
                                    >
                                        {task.title}
                                    </span>
                                </div>
                                {(size !== 'SMALL' && (task.goldStarReward > 0 || task.currencyReward > 0)) && (
                                    <div className="flex items-center gap-1 shrink-0 ml-1">
                                        {task.goldStarReward > 0 && (
                                            <div className="flex items-center gap-0.4 px-1 py-0.4 bg-amber-50 rounded-full">
                                                <Star style={{ width: cellSize * 0.1, height: cellSize * 0.1 }} className="text-amber-500 fill-amber-500" />
                                                <span style={{ fontSize: cellSize * 0.06 }} className="font-black text-amber-700">{task.goldStarReward}</span>
                                            </div>
                                        )}
                                        {task.currencyReward > 0 && (
                                            <div className="flex items-center gap-0.4 px-1 py-0.4 bg-blue-50 rounded-full">
                                                <Coins style={{ width: cellSize * 0.1, height: cellSize * 0.1 }} className="text-blue-500" />
                                                <span style={{ fontSize: cellSize * 0.06 }} className="font-black text-blue-700">{task.currencyReward}</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </motion.div>
                        ))
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-emerald-300 opacity-40 italic text-[9px]">
                            <span>Clear!</span>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    )
}
