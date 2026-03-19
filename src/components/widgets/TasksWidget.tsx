'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { CheckCircle2, Circle, Star, Coins, Calendar } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useI18n } from '@/contexts/I18nContext'

interface Task {
    id: string
    title: string
    completed: boolean
    rewardStars: number
    rewardCoins: number
    confirmationStatus?: 'PENDING' | 'APPROVED' | 'REJECTED'
    isAssigned?: boolean
    plannedTime?: string | number | null
    createdAt?: string | number | null
}

export default function TasksWidget({ size = 'ICON', cellSize = 100 }: { size?: string, cellSize?: number }) {
    const [tasks, setTasks] = useState<Task[]>([])
    const [loading, setLoading] = useState(size !== 'ICON')
    const router = useRouter()
    const { t } = useI18n()


    const formatTaskDate = (dateStr: string | number | null) => {
        if (!dateStr) return ''
        const d = new Date(dateStr)
        const today = new Date()
        if (d.toDateString() === today.toDateString()) return t('widget.tasks.today')
        return d.toLocaleDateString([], { month: '2-digit', day: '2-digit' })
    }

    const displayCount = size === 'ICON' ? 0 : size === 'SQUARE' ? 4 : 8;

    useEffect(() => {
        if (size === 'ICON') return
        const fetchAllTasks = async () => {
            try {
                const [pRes, aRes] = await Promise.all([
                    fetch('/api/tasks'),
                    fetch('/api/assigned-tasks')
                ])
                const [pData, aData] = await Promise.all([pRes.json(), aRes.json()])

                const personal = (Array.isArray(pData) ? pData : []).map((t: Task) => ({ ...t, isAssigned: false }));
                const assigned = (Array.isArray(aData) ? aData : []).map((t: Task) => ({ ...t, isAssigned: true }));

                // Combine and prioritize pending/incomplete
                const combined = [...personal, ...assigned]
                    .sort((a, b) => {
                        if (a.completed !== b.completed) return a.completed ? 1 : -1
                        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
                    })

                setTasks(combined.slice(0, displayCount))
                setLoading(false)
            } catch (err) {
                console.error(err)
                setLoading(false)
            }
        }
        fetchAllTasks()
    }, [size, displayCount])

    if (loading) return (
        <div className="w-full h-full bg-slate-50/50 backdrop-blur-md rounded-3xl animate-pulse" />
    )

    const totalCount = tasks.length
    const completedCount = tasks.filter(t => t.completed).length

    return (
        <motion.div
            whileHover={{ scale: 1.01 }}
            onClick={() => router.push('/tasks')}
            className="w-full h-full bg-blue-50/40 backdrop-blur-xl rounded-3xl p-4 md:p-5 border border-blue-100/50 shadow-xl shadow-blue-200/20 flex flex-col group overflow-hidden relative cursor-pointer"
        >
            <div className={`flex items-center justify-between ${size === 'ICON' ? '' : 'mb-2'}`}>
                <div className="flex items-center gap-2">
                    <div
                        className="rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 shadow-sm transition-transform group-hover:rotate-12 outline-none"
                        style={{ width: cellSize * 0.35, height: cellSize * 0.35 }}
                    >
                        <CheckCircle2 style={{ width: cellSize * 0.18, height: cellSize * 0.18 }} />
                    </div>
                    {size !== 'ICON' && (
                        <span
                            className="font-black text-slate-800 tracking-tight uppercase opacity-60"
                            style={{ fontSize: Math.max(8, cellSize * 0.1) }}
                        >
                            {t('widget.tasks.title')}
                        </span>
                    )}
                </div>
                {size !== 'ICON' && tasks.length > 0 && (
                    <div
                        className="px-2 py-0.5 bg-blue-100/80 rounded-full font-black text-blue-700 uppercase tracking-widest leading-none"
                        style={{ fontSize: Math.max(7, cellSize * 0.07) }}
                    >
                        {completedCount}/{totalCount}
                    </div>
                )}
            </div>

            <div className="flex-1 space-y-2.5 overflow-hidden">
                    {tasks.length > 0 ? (
                        tasks.map((task) => (
                            <div
                                key={task.id}
                                className="flex items-center justify-between p-2 bg-white/60 rounded-xl border border-white/80 group-hover:border-blue-200 transition-colors shadow-sm min-w-0"
                            >
                                <div className="flex items-center gap-2 overflow-hidden min-w-0">
                                    {task.completed ? (
                                        <div className="relative flex items-center justify-center shrink-0">
                                            <CheckCircle2
                                                className={task.isAssigned && task.confirmationStatus === 'PENDING' ? "text-amber-500" : "text-blue-500"}
                                                style={{ width: cellSize * 0.15, height: cellSize * 0.15 }}
                                            />
                                        </div>
                                    ) : (
                                        <Circle
                                            className="text-blue-300 shrink-0"
                                            style={{ width: cellSize * 0.15, height: cellSize * 0.15 }}
                                        />
                                    )}
                                    <span
                                        className={`font-bold text-slate-700 truncate ${task.completed ? 'line-through opacity-40' : ''}`}
                                        style={{ fontSize: Math.max(8, cellSize * 0.1) }}
                                    >
                                        {task.title}
                                    </span>
                                </div>
                                
                                <div className="flex items-center gap-1.5 shrink-0 ml-auto pl-2">
                                    {task.plannedTime && (
                                        <div className="flex items-center gap-0.5 px-1.5 py-0.5 bg-slate-100/80 rounded-lg text-slate-500 shrink-0">
                                            <Calendar style={{ width: cellSize * 0.08, height: cellSize * 0.08 }} className="opacity-70" />
                                            <span className="font-bold tabular-nums" style={{ fontSize: Math.max(7, cellSize * 0.07) }}>
                                                {formatTaskDate(task.plannedTime)}
                                            </span>
                                        </div>
                                    )}
                                    
                                    {(size !== 'SQUARE' && size !== 'SMALL') && (task.rewardStars > 0 || task.rewardCoins > 0) && (
                                        <div className="flex items-center gap-1 shrink-0">
                                            {task.rewardStars > 0 && (
                                                <div className="flex items-center gap-0.5 px-1 py-0.5 bg-amber-50/80 rounded-full">
                                                    <Star style={{ width: cellSize * 0.09, height: cellSize * 0.09 }} className="text-amber-500 fill-amber-500 font-bold" />
                                                    <span style={{ fontSize: Math.max(7, cellSize * 0.07) }} className="font-black text-amber-700">{task.rewardStars}</span>
                                                </div>
                                            )}
                                            {task.rewardCoins > 0 && (
                                                <div className="flex items-center gap-0.5 px-1 py-0.5 bg-blue-50/80 rounded-full">
                                                    <Coins style={{ width: cellSize * 0.09, height: cellSize * 0.09 }} className="text-blue-500" />
                                                    <span style={{ fontSize: Math.max(7, cellSize * 0.07) }} className="font-black text-blue-700">{task.rewardCoins}</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        size !== 'ICON' && (
                            <div className="h-full flex flex-col items-center justify-center text-blue-300 opacity-40 italic text-[9px]">
                                <span>{t('widget.tasks.clear')}</span>
                            </div>
                        )
                    )}
            </div>
        </motion.div>
    )
}
