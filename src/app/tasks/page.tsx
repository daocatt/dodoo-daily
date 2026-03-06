'use client'

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { ChevronLeft, CheckSquare, Plus, Star, CircleAlert } from 'lucide-react'
import Link from 'next/link'
import AnimatedSky from '@/components/AnimatedSky'

type Task = {
    id: string
    title: string
    description: string | null
    isRepeating: boolean
    rewardStars: number
    completed: boolean
}

export default function TasksPage() {
    const [tasks, setTasks] = useState<Task[]>([])
    const [loading, setLoading] = useState(true)
    const [showNewTaskModal, setShowNewTaskModal] = useState(false)

    // Form
    const [title, setTitle] = useState('')
    const [rewardStars, setRewardStars] = useState(1)
    const [isRepeating, setIsRepeating] = useState(false)

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
                body: JSON.stringify({ title, rewardStars, isRepeating })
            })
            if (res.ok) {
                setShowNewTaskModal(false)
                setTitle('')
                setRewardStars(1)
                setIsRepeating(false)
                fetchTasks()
            }
        } catch (err) {
            console.error(err)
        }
    }

    return (
        <div className="min-h-dvh flex flex-col relative overflow-hidden bg-[#e0f2fe] text-[#2c2416]">
            <AnimatedSky />

            <header className="relative z-10 flex justify-between items-center p-6 backdrop-blur-sm bg-white/20 border-b border-white/30">
                <div className="flex items-center gap-4">
                    <Link href="/" className="w-10 h-10 flex items-center justify-center rounded-full bg-white/40 hover:bg-white/60 transition-colors shadow-sm text-white border border-white/50">
                        <ChevronLeft className="w-6 h-6" />
                    </Link>
                    <span className="font-extrabold text-2xl tracking-tight text-white drop-shadow-md flex items-center gap-2">
                        <CheckSquare className="w-6 h-6" />
                        Tasks (任务)
                    </span>
                </div>
                <button
                    onClick={() => setShowNewTaskModal(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/80 hover:bg-blue-500 backdrop-blur-md transition-colors text-sm font-bold text-white shadow-sm border border-blue-400"
                >
                    <Plus className="w-4 h-4" />
                    New Task (新建任务)
                </button>
            </header>

            <main className="relative z-10 flex-1 overflow-y-auto p-6 md:p-8 hide-scrollbar flex justify-center">
                <div className="w-full max-w-2xl">
                    {loading ? (
                        <div className="flex justify-center items-center h-48">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
                        </div>
                    ) : tasks.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-48 text-white/80">
                            <CircleAlert className="w-16 h-16 mb-4 opacity-50" />
                            <p className="text-xl font-bold">No tasks found (暂无任务)</p>
                            <p className="text-sm">Click "New Task" to set a goal. (点击右上角添加)</p>
                        </div>
                    ) : (
                        <div className="flex gap-4 flex-col pb-24">
                            {tasks.map((task, idx) => (
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
                                                Daily Loop (每日)
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
                            className="w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col"
                        >
                            <div className="p-6 border-b border-[#f5f0e8] flex justify-between items-center bg-[#faf7f0]">
                                <h3 className="text-xl font-bold flex items-center gap-2"><Plus className="w-5 h-5 text-blue-500" /> New Task (新建任务)</h3>
                            </div>
                            <form onSubmit={handleCreateTask} className="p-6 flex flex-col gap-5 bg-white">
                                <div>
                                    <label className="block text-sm font-bold text-[#6b5c45] mb-2">Goal / Task Name (任务名称)</label>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={e => setTitle(e.target.value)}
                                        className="w-full bg-[#f5f0e8] border-none rounded-xl p-4 focus:ring-4 focus:ring-blue-400 outline-none font-bold text-lg"
                                        placeholder="Read a book (读书30分钟)"
                                        required
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-bold text-[#6b5c45]">Reward Stars (金星奖励)</label>
                                    <div className="flex items-center gap-3">
                                        <button type="button" onClick={() => setRewardStars(Math.max(1, rewardStars - 1))} className="w-8 h-8 rounded-full bg-[#f5f0e8] flex items-center justify-center font-bold text-[#6b5c45]">-</button>
                                        <span className="font-black text-yellow-600 text-xl w-6 text-center">{rewardStars}</span>
                                        <button type="button" onClick={() => setRewardStars(rewardStars + 1)} className="w-8 h-8 rounded-full bg-[#f5f0e8] flex items-center justify-center font-bold text-[#6b5c45]">+</button>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 bg-[#faf7f0] p-4 rounded-xl border border-[#e8dfce]">
                                    <input
                                        type="checkbox"
                                        id="isRep"
                                        checked={isRepeating}
                                        onChange={(e) => setIsRepeating(e.target.checked)}
                                        className="w-5 h-5 accent-blue-500"
                                    />
                                    <label htmlFor="isRep" className="font-bold text-[#6b5c45]">Daily Recurring (每日重复)</label>
                                </div>

                                <button
                                    type="submit"
                                    className="mt-2 w-full py-4 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-bold tracking-wide shadow-lg hover:opacity-90 transition-opacity text-lg"
                                >
                                    Create Goal
                                </button>
                                <button type="button" onClick={() => setShowNewTaskModal(false)} className="py-2 text-[#a89880] font-bold hover:text-[#2c2416]">
                                    Cancel
                                </button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
