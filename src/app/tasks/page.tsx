'use client'

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { ChevronLeft, CheckSquare, Plus, Star, CircleAlert, Sun, Sunrise, Calendar, Repeat, CalendarDays } from 'lucide-react'
import Link from 'next/link'
import AnimatedSky from '@/components/AnimatedSky'
import { useI18n } from '@/contexts/I18nContext'

type Task = {
    id: string
    title: string
    description: string | null
    isRepeating: boolean
    isMonthlyRepeating: boolean
    rewardStars: number
    completed: boolean
    plannedTime: string | null
}

export default function TasksPage() {
    const [tasks, setTasks] = useState<Task[]>([])
    const [loading, setLoading] = useState(true)
    const [showNewTaskModal, setShowNewTaskModal] = useState(false)
    const [activeTab, setActiveTab] = useState<'today' | 'tomorrow' | 'week' | 'daily' | 'monthly'>('today')
    const { t } = useI18n()

    // Form
    const [title, setTitle] = useState('')
    const [rewardStars, setRewardStars] = useState(1)
    const [isRepeating, setIsRepeating] = useState(false)
    const [isMonthlyRepeating, setIsMonthlyRepeating] = useState(false)
    const [plannedDate, setPlannedDate] = useState(() => new Date().toISOString().split('T')[0])

    useEffect(() => {
        fetchTasks()
    }, [])

    const fetchTasks = async () => {
        try {
            const res = await fetch('/api/tasks')
            const data = await res.json()
            setTasks(data || [])
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const toggleCompletion = async (task: Task) => {
        // Optimistic UI update
        const updatedTasks = tasks.map(t =>
            t.id === task.id ? { ...t, completed: !t.completed } : t
        )
        setTasks(updatedTasks)

        try {
            await fetch(`/api/tasks/${task.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ completed: !task.completed })
            })
        } catch (error) {
            console.error(error)
            // Reverse on fail
            fetchTasks()
        }
    }

    const handleCreateTask = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!title) return

        try {
            const res = await fetch('/api/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    rewardStars,
                    isRepeating,
                    isMonthlyRepeating,
                    plannedTime: new Date(plannedDate).toISOString()
                })
            })
            if (res.ok) {
                setShowNewTaskModal(false)
                setTitle('')
                setRewardStars(1)
                setIsRepeating(false)
                setIsMonthlyRepeating(false)
                fetchTasks()
            }
        } catch (err) {
            console.error(err)
        }
    }

    return (
        <div className="min-h-dvh flex flex-col relative overflow-hidden bg-[#e0f2fe] text-[#2c2416]">
            <AnimatedSky />

            <header className="relative z-10 flex justify-between items-center px-6 py-4 md:px-10 md:py-6 backdrop-blur-sm bg-white/40 border-b border-white/30 shadow-sm">
                <div className="flex items-center gap-4">
                    <Link href="/" className="w-10 h-10 md:w-12 md:h-12 flex-shrink-0 flex items-center justify-center rounded-2xl bg-white/40 hover:bg-white/60 transition-colors shadow-sm text-slate-800 border border-slate-200">
                        <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
                    </Link>
                    <div className="flex items-center gap-3">
                        <div className="hidden md:flex w-10 h-10 bg-blue-500 rounded-2xl items-center justify-center shadow-md shadow-blue-500/30 text-white flex-shrink-0">
                            <CheckSquare className="w-5 h-5" />
                        </div>
                        <span className="font-extrabold text-xl md:text-2xl tracking-tight text-slate-800">
                            {t('tasks.title')}
                        </span>
                    </div>
                </div>
                <button
                    onClick={() => setShowNewTaskModal(true)}
                    className="flex items-center gap-2 px-4 py-2.5 md:px-6 md:py-3 rounded-xl md:rounded-2xl bg-blue-500 hover:bg-blue-600 transition-colors text-sm md:text-base font-bold text-white shadow-md active:scale-95"
                >
                    <Plus className="w-4 h-4 md:w-5 md:h-5" />
                    <span className="hidden md:inline">{t('tasks.newTask')}</span>
                </button>
            </header>

            <main className="relative z-10 flex-1 w-full max-w-[1200px] mx-auto flex flex-col md:flex-row gap-6 md:gap-12 px-6 pt-6 pb-24 overflow-y-auto hide-scrollbar items-start md:justify-center">

                {/* Left Sidebar (Tabs) */}
                <aside className="w-full md:w-[240px] flex flex-col gap-4 md:sticky md:top-8 flex-shrink-0 z-20">
                    <div className="flex md:flex-col overflow-x-auto p-1.5 md:p-2 bg-white/60 backdrop-blur-md rounded-lg md:rounded-xl w-full shadow-inner border border-white hide-scrollbar">
                        <button
                            onClick={() => setActiveTab('today')}
                            className={`flex-1 min-w-[100px] md:w-full flex items-center justify-center md:justify-start gap-3 py-3 md:py-4 md:px-6 rounded-xl md:rounded-2xl font-black text-sm transition-all ${activeTab === 'today' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'}`}
                        >
                            <Sun className="w-5 h-5 flex-shrink-0" /> <span className="hidden md:inline whitespace-nowrap">Today</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('tomorrow')}
                            className={`flex-1 min-w-[100px] md:w-full flex items-center justify-center md:justify-start gap-3 py-3 md:py-4 md:px-6 rounded-xl md:rounded-2xl font-black text-sm transition-all ${activeTab === 'tomorrow' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'}`}
                        >
                            <Sunrise className="w-5 h-5 flex-shrink-0" /> <span className="hidden md:inline whitespace-nowrap">Tomorrow</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('week')}
                            className={`flex-1 min-w-[100px] md:w-full flex items-center justify-center md:justify-start gap-3 py-3 md:py-4 md:px-6 rounded-xl md:rounded-2xl font-black text-sm transition-all ${activeTab === 'week' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'}`}
                        >
                            <Calendar className="w-5 h-5 flex-shrink-0" /> <span className="hidden md:inline whitespace-nowrap">This Week</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('daily')}
                            className={`flex-1 min-w-[100px] md:w-full flex items-center justify-center md:justify-start gap-3 py-3 md:py-4 md:px-6 rounded-xl md:rounded-2xl font-black text-sm transition-all ${activeTab === 'daily' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'}`}
                        >
                            <Repeat className="w-5 h-5 flex-shrink-0" /> <span className="hidden md:inline whitespace-nowrap">Daily Loop</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('monthly')}
                            className={`flex-1 min-w-[100px] md:w-full flex items-center justify-center md:justify-start gap-3 py-3 md:py-4 md:px-6 rounded-xl md:rounded-2xl font-black text-sm transition-all ${activeTab === 'monthly' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'}`}
                        >
                            <CalendarDays className="w-5 h-5 flex-shrink-0" /> <span className="hidden md:inline whitespace-nowrap">Monthly Loop</span>
                        </button>
                    </div>
                </aside>

                {/* Right Content */}
                <div className="flex-1 w-full max-w-2xl">
                    {loading ? (
                        <div className="flex justify-center items-center h-48">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
                        </div>
                    ) : tasks.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-48 text-white/80">
                            <CircleAlert className="w-16 h-16 mb-4 opacity-50" />
                            <p className="text-xl font-bold">{t('tasks.noTasks')}</p>
                            <p className="text-sm">{t('tasks.noTasksSub')}</p>
                        </div>
                    ) : (
                        <div className="flex gap-4 flex-col pb-24">
                            {tasks.filter(task => {
                                if (activeTab === 'daily') return task.isRepeating && !task.isMonthlyRepeating;
                                if (activeTab === 'monthly') return task.isMonthlyRepeating;

                                if (task.isRepeating || task.isMonthlyRepeating) return false;

                                const pt = task.plannedTime ? new Date(task.plannedTime) : new Date();
                                const today = new Date();
                                today.setHours(0, 0, 0, 0);
                                const tomorrow = new Date(today);
                                tomorrow.setDate(tomorrow.getDate() + 1);
                                const weekEnd = new Date(today);
                                weekEnd.setDate(weekEnd.getDate() + 7);

                                pt.setHours(0, 0, 0, 0);

                                if (activeTab === 'today') return pt.getTime() === today.getTime();
                                if (activeTab === 'tomorrow') return pt.getTime() === tomorrow.getTime();
                                if (activeTab === 'week') return pt >= today && pt <= weekEnd;

                                return false;
                            }).map((task, idx) => (
                                <motion.div
                                    key={task.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.05, type: 'spring' }}
                                    onClick={() => toggleCompletion(task)}
                                    className={`p-5 rounded-2xl border-4 backdrop-blur-xl shadow-lg cursor-pointer flex items-center gap-4 transition-all duration-300 ${task.completed ? 'bg-white/40 border-white/30 grayscale opacity-70' : 'bg-white border-white scale-100'}`}
                                >
                                    <div className={`w-8 h-8 rounded-full border-4 flex items-center justify-center transition-colors ${task.completed ? 'border-green-500 bg-green-500' : 'border-[#e8dfce]'}`}>
                                        {task.completed && <CheckSquare className="w-4 h-4 text-white" />}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className={`text-xl font-black ${task.completed ? 'line-through text-[#6b5c45]' : 'text-[#2c2416]'}`}>
                                            {task.title}
                                        </h3>
                                        {task.isRepeating && (
                                            <span className="text-xs bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded-full mt-1 inline-block">
                                                {t('tasks.dailyLoop')}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1.5 bg-yellow-100 px-3 py-1.5 rounded-full shadow-inner border border-yellow-200">
                                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-400" />
                                        <span className="font-black text-yellow-700">+{task.rewardStars}</span>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </main>

            {/* New Task Modal */}
            <AnimatePresence>
                {showNewTaskModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="w-full max-w-sm bg-white rounded-xl overflow-hidden shadow-2xl flex flex-col"
                        >
                            <div className="p-6 border-b border-[#f5f0e8] flex justify-between items-center bg-[#faf7f0]">
                                <h3 className="text-xl font-bold flex items-center gap-2"><Plus className="w-5 h-5 text-blue-500" /> {t('tasks.newTask')}</h3>
                            </div>
                            <form onSubmit={handleCreateTask} className="p-6 flex flex-col gap-5 bg-white">
                                <div>
                                    <label className="block text-sm font-bold text-[#6b5c45] mb-2">{t('tasks.form.nameLabel')}</label>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={e => setTitle(e.target.value)}
                                        className="w-full bg-[#f5f0e8] border-none rounded-xl p-4 focus:ring-4 focus:ring-blue-400 outline-none font-bold text-lg"
                                        placeholder={t('tasks.form.namePlaceholder')}
                                        required
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-bold text-[#6b5c45]">{t('tasks.form.rewardLabel')}</label>
                                    <div className="flex items-center gap-3">
                                        <button type="button" onClick={() => setRewardStars(Math.max(1, rewardStars - 1))} className="w-8 h-8 rounded-full bg-[#f5f0e8] flex items-center justify-center font-bold text-[#6b5c45]">-</button>
                                        <span className="font-black text-yellow-600 text-xl w-6 text-center">{rewardStars}</span>
                                        <button type="button" onClick={() => setRewardStars(rewardStars + 1)} className="w-8 h-8 rounded-full bg-[#f5f0e8] flex items-center justify-center font-bold text-[#6b5c45]">+</button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-sm font-bold text-[#6b5c45]">Planned Date</label>
                                    <input
                                        type="date"
                                        value={plannedDate}
                                        onChange={e => setPlannedDate(e.target.value)}
                                        className="w-full bg-[#f5f0e8] border-none rounded-xl p-4 focus:ring-4 focus:ring-blue-400 outline-none font-bold text-lg"
                                        required
                                    />
                                </div>

                                <div className="flex flex-col gap-3 bg-[#faf7f0] p-4 rounded-xl border border-[#e8dfce]">
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            id="isRep"
                                            checked={isRepeating}
                                            onChange={(e) => {
                                                setIsRepeating(e.target.checked);
                                                if (e.target.checked) setIsMonthlyRepeating(false);
                                            }}
                                            className="w-5 h-5 accent-blue-500 rounded"
                                        />
                                        <label htmlFor="isRep" className="font-bold text-[#6b5c45]">{t('tasks.form.recurringLabel')}</label>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            id="isMonthlyRep"
                                            checked={isMonthlyRepeating}
                                            onChange={(e) => {
                                                setIsMonthlyRepeating(e.target.checked);
                                                if (e.target.checked) setIsRepeating(false);
                                            }}
                                            className="w-5 h-5 accent-purple-500 rounded"
                                        />
                                        <label htmlFor="isMonthlyRep" className="font-bold text-[#6b5c45]">Monthly Repeating Task</label>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="mt-2 w-full py-4 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-bold tracking-wide shadow-lg hover:opacity-90 transition-opacity text-lg"
                                >
                                    {t('tasks.createGoal')}
                                </button>
                                <button type="button" onClick={() => setShowNewTaskModal(false)} className="py-2 text-[#a89880] font-bold hover:text-[#2c2416]">
                                    {t('common.cancel')}
                                </button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
