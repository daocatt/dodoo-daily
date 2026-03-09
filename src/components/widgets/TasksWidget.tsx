'use client'

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { CheckSquare, Circle, CheckCircle2, Star, Coins } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Task {
    id: string
    title: string
    status: 'PENDING' | 'COMPLETED' | 'CONFIRMED'
    goldStarReward: number
    currencyReward: number
}

export default function TasksWidget({ size = 'ICON' }: { size?: string }) {
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
        <div className="w-full h-full bg-slate-50/50 backdrop-blur-md rounded-[2.5rem] animate-pulse" />
    )

    const completedCount = tasks.filter(t => t.status !== 'PENDING').length

    return (
        <motion.div
            whileHover={{ y: -5, scale: 1.01 }}
            onClick={() => router.push('/tasks')}
            className="w-full h-full bg-emerald-50/40 backdrop-blur-xl rounded-[2rem] p-4 md:p-5 border border-emerald-100/50 shadow-xl shadow-emerald-200/20 flex flex-col group overflow-hidden relative cursor-pointer"
        >
            <div className={`flex items-center justify-between ${size === 'ICON' ? '' : 'mb-3'}`}>
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm transition-transform group-hover:rotate-12 outline-none">
                        <CheckSquare className="w-4 h-4" />
                    </div>
                    {size !== 'ICON' && (
                        <span className="text-[11px] font-black text-slate-800 tracking-tight uppercase opacity-60">Tasks</span>
                    )}
                </div>
                {size !== 'ICON' && (
                    <div className="px-2 py-0.5 bg-emerald-100/80 rounded-full text-[8px] font-black text-emerald-700 uppercase tracking-widest leading-none">
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
                                        <Circle className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                                    ) : (
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                    )}
                                    <span className={`text-[10px] font-bold text-slate-700 truncate ${task.status !== 'PENDING' ? 'line-through opacity-40' : ''}`}>
                                        {task.title}
                                    </span>
                                </div>
                                {(size !== 'SMALL' && (task.goldStarReward > 0 || task.currencyReward > 0)) && (
                                    <div className="flex items-center gap-1 shrink-0 ml-1">
                                        {task.goldStarReward > 0 && (
                                            <div className="flex items-center gap-0.4 px-1 py-0.4 bg-amber-50 rounded-full">
                                                <Star className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />
                                                <span className="text-[7px] font-black text-amber-700">{task.goldStarReward}</span>
                                            </div>
                                        )}
                                        {task.currencyReward > 0 && (
                                            <div className="flex items-center gap-0.4 px-1 py-0.4 bg-blue-50 rounded-full">
                                                <Coins className="w-2.5 h-2.5 text-blue-500" />
                                                <span className="text-[7px] font-black text-blue-700">{task.currencyReward}</span>
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
