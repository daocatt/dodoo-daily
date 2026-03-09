'use client'

import React, { useEffect, useState } from 'react'
import { Plus, Star, User, Trash2, Clock } from 'lucide-react'
import { motion } from 'framer-motion'
import { useI18n } from '@/contexts/I18nContext'

interface Child {
    id: string
    name: string
    avatarUrl: string | null
}

interface Task {
    id: string
    title: string
    description: string | null
    rewardStars: number
    isRepeating: boolean
    isMonthlyRepeating: boolean
    plannedTime: string | null
    completed: boolean
    assignedTo: string
}

export default function TaskManagement({ preSelectId }: { preSelectId?: string | null }) {
    const { } = useI18n()
    const [children, setChildren] = useState<Child[]>([])
    const [tasks, setTasks] = useState<Task[]>([])
    const [loading, setLoading] = useState(true)
    const [showAdd, setShowAdd] = useState(!!preSelectId)
    const [selectedChild, setSelectedChild] = useState<string | 'ALL'>('ALL')

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        rewardStars: 1,
        isRepeating: false,
        isMonthlyRepeating: false,
        plannedTime: new Date().toISOString().split('T')[0],
        assignedTo: preSelectId || ''
    })

    const fetchData = async () => {
        try {
            const [cRes, tRes] = await Promise.all([
                fetch('/api/parent/children'),
                fetch('/api/tasks') // This currently only gets tasks for "default child". Need to fix API later.
            ])
            const kids = await cRes.json()
            setChildren(kids)
            const allTasks = await tRes.json()
            setTasks(allTasks)
        } catch (e) { console.error(e) }
        finally { setLoading(false) }
    }

    useEffect(() => { fetchData() }, [])

    const handleAddTask = async () => {
        if (!formData.title || !formData.assignedTo) return
        try {
            const res = await fetch('/api/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    plannedTime: formData.plannedTime ? new Date(formData.plannedTime).toISOString() : null
                })
            })
            if (res.ok) {
                setShowAdd(false)
                setFormData({ title: '', description: '', rewardStars: 1, isRepeating: false, isMonthlyRepeating: false, plannedTime: new Date().toISOString().split('T')[0], assignedTo: '' })
                fetchData()
            }
        } catch (e) { console.error(e) }
    }

    const handleDeleteTask = async (id: string) => {
        try {
            await fetch(`/api/tasks/${id}`, { method: 'DELETE' })
            fetchData()
        } catch (e) { console.error(e) }
    }

    const filteredTasks = tasks.filter(task =>
        selectedChild === 'ALL' || task.assignedTo === selectedChild
    )

    if (loading) return <div className="p-12 text-center text-slate-400">Loading Tasks...</div>

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-black text-slate-800 tracking-tight">Task Management</h2>
                    <p className="text-sm text-slate-500 mt-1">Assign and manage daily missions for your children.</p>
                </div>
                <button
                    onClick={() => setShowAdd(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-2xl hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 active:scale-95 font-bold"
                >
                    <Plus className="w-5 h-5" />
                    New Task
                </button>
            </div>

            {/* Filter Bar */}
            <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl w-fit">
                <button
                    onClick={() => setSelectedChild('ALL')}
                    className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${selectedChild === 'ALL' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:bg-white/50'}`}
                >
                    All Children
                </button>
                {children.map(child => (
                    <button
                        key={child.id}
                        onClick={() => setSelectedChild(child.id)}
                        className={`px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${selectedChild === child.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:bg-white/50'}`}
                    >
                        {child.avatarUrl && <img src={child.avatarUrl} alt={child.name} className="w-4 h-4 rounded-full object-cover" />}
                        {child.name}
                    </button>
                ))}
            </div>

            {showAdd && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white p-8 rounded-xl border-2 border-emerald-100 shadow-xl space-y-6"
                >
                    <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                        <div className="w-2 h-6 bg-emerald-500 rounded-full" />
                        Create New Task
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-400 uppercase ml-1">Task Title</label>
                            <input
                                type="text"
                                className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none focus:ring-4 focus:ring-emerald-100"
                                placeholder="Clean your room..."
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-400 uppercase ml-1">Assign To</label>
                            <select
                                className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none focus:ring-4 focus:ring-emerald-100 appearance-none"
                                value={formData.assignedTo}
                                onChange={e => setFormData({ ...formData, assignedTo: e.target.value })}
                            >
                                <option value="">Select a child</option>
                                {children.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-xs font-black text-slate-400 uppercase ml-1">Description (Optional)</label>
                            <textarea
                                className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-medium outline-none focus:ring-4 focus:ring-emerald-100 min-h-[100px]"
                                placeholder="Details..."
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-400 uppercase ml-1">Reward Stars</label>
                            <div className="flex items-center gap-4">
                                <input
                                    type="range"
                                    min="1"
                                    max="5"
                                    className="flex-1 accent-emerald-500"
                                    value={formData.rewardStars}
                                    onChange={e => setFormData({ ...formData, rewardStars: parseInt(e.target.value) })}
                                />
                                <span className="text-xl font-black text-emerald-500 flex items-center gap-1">
                                    {formData.rewardStars} <Star className="w-5 h-5 fill-emerald-500" />
                                </span>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-400 uppercase ml-1">Planned Date</label>
                            <input
                                type="date"
                                className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none focus:ring-4 focus:ring-emerald-100"
                                value={formData.plannedTime}
                                onChange={e => setFormData({ ...formData, plannedTime: e.target.value })}
                            />
                        </div>
                        <div className="flex flex-col gap-3 justify-center md:col-span-2">
                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    id="isRepeating"
                                    className="w-5 h-5 accent-emerald-500 rounded"
                                    checked={formData.isRepeating}
                                    onChange={e => setFormData({ ...formData, isRepeating: e.target.checked, isMonthlyRepeating: e.target.checked ? false : formData.isMonthlyRepeating })}
                                />
                                <label htmlFor="isRepeating" className="font-bold text-slate-700">Daily Repeating Task</label>
                            </div>
                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    id="isMonthlyRepeating"
                                    className="w-5 h-5 accent-emerald-500 rounded"
                                    checked={formData.isMonthlyRepeating}
                                    onChange={e => setFormData({ ...formData, isMonthlyRepeating: e.target.checked, isRepeating: e.target.checked ? false : formData.isRepeating })}
                                />
                                <label htmlFor="isMonthlyRepeating" className="font-bold text-slate-700">Monthly Repeating Task</label>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-3 pt-4">
                        <button onClick={handleAddTask} className="flex-1 bg-emerald-500 text-white rounded-2xl font-black py-4 shadow-lg shadow-emerald-200 hover:bg-emerald-600 transition-all">
                            Assign Task
                        </button>
                        <button onClick={() => setShowAdd(false)} className="px-8 bg-slate-100 text-slate-500 rounded-2xl font-bold hover:bg-slate-200 transition-all">
                            Cancel
                        </button>
                    </div>
                </motion.div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTasks.length === 0 ? (
                    <div className="md:col-span-2 lg:col-span-3 py-20 text-center bg-white/50 rounded-xl border-2 border-dashed border-slate-200">
                        <p className="text-slate-400 font-bold">No tasks assigned yet.</p>
                    </div>
                ) : (
                    filteredTasks.map(task => (
                        <div key={task.id} className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all relative group">
                            <div className="flex justify-between items-start mb-4">
                                <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${task.completed ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
                                    {task.completed ? 'Completed' : 'Pending'}
                                </div>
                                <button
                                    onClick={() => handleDeleteTask(task.id)}
                                    className="p-2 text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                            <h4 className="text-lg font-black text-slate-800">{task.title}</h4>
                            {task.description && <p className="text-sm text-slate-500 mt-2 line-clamp-2">{task.description}</p>}

                            <div className="mt-6 flex justify-between items-center text-xs font-bold">
                                <span className="flex items-center gap-1.5 text-amber-500">
                                    <Star className="w-4 h-4 fill-amber-500" />
                                    {task.rewardStars} Stars
                                </span>
                                {task.isRepeating && (
                                    <span className="flex items-center gap-1.5 text-blue-400">
                                        <Clock className="w-4 h-4" />
                                        Daily
                                    </span>
                                )}
                                {task.isMonthlyRepeating && (
                                    <span className="flex items-center gap-1.5 text-purple-400">
                                        <Clock className="w-4 h-4" />
                                        Monthly
                                    </span>
                                )}
                            </div>

                            <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden">
                                        <User className="w-4 h-4 text-slate-400" />
                                    </div>
                                    <span className="text-[10px] font-black text-slate-400 uppercase">
                                        {children.find(c => c.id === task.assignedTo)?.name || 'Unknown'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
