'use client'

import React, { useEffect, useState } from 'react'
import { Check, Star } from 'lucide-react'
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

const getRelativeTimeLabel = (dateStr: string | number | null | undefined) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    const now = new Date();
    
    // Reset hours to compare dates only
    const dDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const dNow = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const diffDays = Math.round((dDate.getTime() - dNow.getTime()) / (1000 * 3600 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tom';
    
    // Check if within this week
    const startOfW = new Date(dNow);
    startOfW.setDate(dNow.getDate() - dNow.getDay());
    const endOfW = new Date(startOfW);
    endOfW.setDate(startOfW.getDate() + 6);
    
    if (dDate >= startOfW && dDate <= endOfW) return 'Week';
    
    // Check if within this month
    if (date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()) return 'M';
    
    // Year
    if (date.getFullYear() === now.getFullYear()) return 'Y';
    
    return null;
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
                        tasks.map((task) => {
                            const timeLabel = getRelativeTimeLabel(task.plannedTime);
                            return (
                                <div
                                    key={task.id}
                                    className={`flex items-center justify-between p-2 px-3 rounded-lg border transition-all group/task relative min-w-0 ${
                                        task.completed 
                                        ? 'bg-black/[0.02] border-black/[0.02] opacity-40 shadow-none scale-[0.98]' 
                                        : 'bg-[var(--well-bg)]/40 border-black/5 shadow-inner hover:bg-black/[0.05]'
                                    }`}
                                >
                                    <div className="flex items-center gap-3 overflow-hidden min-w-0">
                                        {/* Industrial Optimized Checkbox */}
                                        <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border transition-all ${task.completed ? 'bg-emerald-500/10 border-emerald-500/20 shadow-inner' : 'bg-white/40 border-black/5 shadow-cap'}`}>
                                            {task.completed && (
                                                <Check
                                                    className={task.isAssigned && task.confirmationStatus === 'PENDING' ? "text-amber-500" : "text-emerald-500"}
                                                    style={{ width: cellSize * 0.1, height: cellSize * 0.1 }}
                                                />
                                            )}
                                        </div>
                                        <span
                                            className={`font-medium tracking-tight truncate uppercase ${task.completed ? 'text-slate-400 line-through opacity-50' : 'text-slate-800'}`}
                                            style={{ fontSize: Math.max(8, cellSize * 0.08) }}
                                        >
                                            {task.title}
                                        </span>
                                    </div>
                                    
                                    <div className="flex items-center gap-2 shrink-0 ml-auto pl-2">
                                        {/* Relative Time Label */}
                                        {timeLabel && !task.completed && (
                                            <span className="label-mono text-[7px] text-slate-400 opacity-60 uppercase tracking-widest bg-black/[0.03] px-1.5 py-0.5 rounded-sm">
                                                {timeLabel}
                                            </span>
                                        )}
                                        
                                        {(size !== 'SQUARE' && size !== 'SMALL') && (task.rewardStars > 0 || task.rewardCoins > 0) && (
                                            <div className="flex items-center gap-1.5 shrink-0">
                                                {task.rewardStars > 0 && (
                                                    <div className="flex items-center gap-1 px-1.5 py-0.5 bg-yellow-500/10 rounded-md border border-yellow-500/20">
                                                        <Star style={{ width: cellSize * 0.08, height: cellSize * 0.08 }} className="text-yellow-600 fill-yellow-600" />
                                                        <span style={{ fontSize: Math.max(7, cellSize * 0.07) }} className="label-mono text-yellow-700">{task.rewardStars}</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        })
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
