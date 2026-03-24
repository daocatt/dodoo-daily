'use client'

import React, { useEffect, useState } from 'react'
import { CheckCircle2, Circle, Star } from 'lucide-react'
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
            } catch (_err) {
                console.error(_err)
                setLoading(false)
            }
        }
        fetchAllTasks()
    }, [size, displayCount])

    if (loading) return (
        <div className="w-full h-full bg-slate-50/50 backdrop-blur-md rounded-3xl animate-pulse" />
    )

    return (
        <div
            className="w-full h-full flex flex-col p-6 pt-10 group overflow-hidden relative cursor-pointer"
            onClick={() => router.push('/admin/tasks')}
        >
            <div className="flex-1 space-y-2 overflow-hidden">
                    {tasks.length > 0 ? (
                        tasks.map((task) => (
                            <div
                                key={task.id}
                                className="flex items-center justify-between p-2.5 bg-white border border-black/5 rounded-lg shadow-sm group-hover:bg-slate-50 transition-colors min-w-0"
                            >
                                <div className="flex items-center gap-3 overflow-hidden min-w-0">
                                    {task.completed ? (
                                        <CheckCircle2
                                            className={task.isAssigned && task.confirmationStatus === 'PENDING' ? "text-amber-500" : "text-indigo-500"}
                                            style={{ width: cellSize * 0.16, height: cellSize * 0.16 }}
                                        />
                                    ) : (
                                        <Circle
                                            className="text-slate-300 shrink-0"
                                            style={{ width: cellSize * 0.16, height: cellSize * 0.16 }}
                                        />
                                    )}
                                    <span
                                        className={`font-black text-slate-800 truncate tracking-tight ${task.completed ? 'line-through opacity-30 font-medium' : ''}`}
                                        style={{ fontSize: Math.max(9, cellSize * 0.11) }}
                                    >
                                        {task.title}
                                    </span>
                                </div>
                                
                                <div className="flex items-center gap-2 shrink-0 ml-auto pl-2">
                                    {(size !== 'SQUARE' && size !== 'SMALL') && (task.rewardStars > 0 || task.rewardCoins > 0) && (
                                        <div className="flex items-center gap-1.5 shrink-0">
                                            {task.rewardStars > 0 && (
                                                <div className="flex items-center gap-1 px-1.5 py-0.5 bg-yellow-50 rounded-md border border-yellow-100">
                                                    <Star style={{ width: cellSize * 0.08, height: cellSize * 0.08 }} className="text-yellow-500 fill-yellow-500" />
                                                    <span style={{ fontSize: Math.max(8, cellSize * 0.08) }} className="label-mono text-yellow-700">{task.rewardStars}</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        size !== 'ICON' && (
                            <div className="h-full flex flex-col items-center justify-center text-slate-300 opacity-60">
                                <span className="label-mono text-[9px] uppercase tracking-widest">{t('widget.tasks.clear')}</span>
                            </div>
                        )
                    )}
            </div>
        </div>
    )
}
