'use client'

import React, { useEffect, useState } from 'react'
import { Check, X, Star, Coins, User, Loader2, CheckCircle2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useI18n } from '@/contexts/I18nContext'

interface PendingTask {
    id: string
    title: string
    rewardStars: number
    rewardCoins: number
    assigneeId: string
    assigneeNickname: string
    assigneeAvatar: string | null
    updatedAt: string
    completed: boolean
    confirmationStatus: string
}

export default function TaskConfirmation() {
    const { t } = useI18n()
    const [tasks, setTasks] = useState<PendingTask[]>([])
    const [loading, setLoading] = useState(true)
    const [processing, setProcessing] = useState<string | null>(null)

    const fetchPendingTasks = async () => {
        try {
            const res = await fetch('/api/assigned-tasks')
            const data = await res.json()
            // Filter only for tasks that are completed but NOT yet approved/rejected
            const pending = data.filter((t: PendingTask) => t.completed && t.confirmationStatus === 'PENDING')
            setTasks(pending)
        } catch (e) {
            console.error('Failed to fetch pending tasks:', e)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchPendingTasks()
    }, [])

    const handleConfirm = async (taskId: string, action: 'APPROVE' | 'REJECT') => {
        setProcessing(taskId)
        try {
            const res = await fetch(`/api/assigned-tasks/${taskId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(
                    action === 'APPROVE'
                        ? { action: 'CONFIRM_REWARD' }
                        : { completed: false } // Reject means reset completion
                )
            })
            if (res.ok) {
                setTasks(prev => prev.filter(t => t.id !== taskId))
            }
        } catch (e) {
            console.error(e)
        } finally {
            setProcessing(null)
        }
    }

    if (loading) return <div className="p-12 text-center text-slate-400 text-xs font-black uppercase tracking-widest">{t('common.loading')}</div>

    return (
        <div className="space-y-8">
            <div className="mb-8">
                <h2 className="text-3xl font-black text-slate-800 tracking-tight">{t('parent.tasks')}</h2>
                <p className="text-sm text-slate-500 mt-1">{t('parent.tasksDesc')}</p>
            </div>

            {tasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center gap-6 bg-white rounded-3xl border-2 border-dashed border-slate-100 shadow-inner">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="w-10 h-10 text-slate-200" />
                    </div>
                    <div>
                        <p className="text-slate-400 font-bold">{t('tasks.noPendingTasks')}</p>
                        <p className="text-[10px] text-slate-300 font-black uppercase tracking-widest mt-2 px-6">Everything is clean and organized!</p>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    <AnimatePresence mode='popLayout'>
                        {tasks.map((task) => (
                            <motion.div
                                key={task.id}
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 hover:shadow-xl hover:border-blue-100 transition-all group overflow-hidden relative"
                            >
                                <div className="flex items-center gap-5 flex-1">
                                    <div className="relative">
                                        <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-white shadow-md bg-slate-50 flex items-center justify-center">
                                            {task.assigneeAvatar ? (
                                                <img src={task.assigneeAvatar} alt={task.assigneeNickname} className="w-full h-full object-cover" />
                                            ) : (
                                                <User className="w-6 h-6 text-slate-300" />
                                            )}
                                        </div>
                                        <div className="absolute -bottom-1 -right-1 bg-white p-1 rounded-lg shadow-sm border border-slate-50">
                                            <div className="w-4 h-4 rounded-md bg-indigo-500" />
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{task.assigneeNickname}</span>
                                            <span className="w-1 h-1 rounded-full bg-slate-200" />
                                            <span className="text-[10px] font-bold text-slate-300">{new Date(task.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                        <h3 className="text-lg font-black text-slate-800 truncate leading-tight">{task.title}</h3>
                                        <div className="flex gap-3 mt-2">
                                            <div className="flex items-center gap-1.5 px-3 py-1 bg-yellow-50 rounded-full border border-yellow-100">
                                                <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                                                <span className="text-xs font-black text-yellow-700">+{task.rewardStars}</span>
                                            </div>
                                            {task.rewardCoins > 0 && (
                                                <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 rounded-full border border-amber-100">
                                                    <Coins className="w-3.5 h-3.5 text-amber-500" />
                                                    <span className="text-xs font-black text-amber-700">+{task.rewardCoins}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 w-full md:w-auto shrink-0">
                                    <button
                                        disabled={processing === task.id}
                                        onClick={() => handleConfirm(task.id, 'REJECT')}
                                        className="flex-1 md:flex-none p-4 bg-slate-50 text-slate-400 rounded-2xl hover:bg-rose-50 hover:text-rose-500 transition-all border border-transparent hover:border-rose-100 disabled:opacity-50"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                    <button
                                        disabled={processing === task.id}
                                        onClick={() => handleConfirm(task.id, 'APPROVE')}
                                        className="flex-1 md:flex-none px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-sm hover:bg-emerald-500 transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 group-hover:px-10 disabled:opacity-50"
                                    >
                                        {processing === task.id ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                            <>
                                                <Check className="w-5 h-5" />
                                                {t('common.confirm')}
                                            </>
                                        )}
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    )
}
