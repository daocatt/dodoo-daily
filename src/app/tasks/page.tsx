'use client'

import React, { useEffect, useState, Suspense } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { ChevronLeft, CheckSquare, Plus, Star, CircleAlert, Sun, Sunrise, Calendar, Repeat, CalendarDays, Users, Edit2, User } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
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
    assignedTo: string
    creatorId: string
}

function TasksPageContent() {
    const searchParams = useSearchParams()
    const assignToParam = searchParams.get('assignTo')
    const [tasks, setTasks] = useState<Task[]>([])
    const [loading, setLoading] = useState(true)
    const [showNewTaskModal, setShowNewTaskModal] = useState(false)
    const [activeTab, setActiveTab] = useState<'today' | 'tomorrow' | 'week' | 'daily' | 'monthly' | 'assigns'>('today')
    const [isParent, setIsParent] = useState(false)
    const [children, setChildren] = useState<any[]>([])
    const [assignedChildId, setAssignedChildId] = useState<string | 'ALL'>('ALL')
    const [assignTo, setAssignTo] = useState<string>('')
    const [currentUserId, setCurrentUserId] = useState<string>('')
    const { t } = useI18n()

    // Form
    const [editingTask, setEditingTask] = useState<Task | null>(null)
    const [title, setTitle] = useState('')
    const [rewardStars, setRewardStars] = useState(1)
    const [isRepeating, setIsRepeating] = useState(false)
    const [isMonthlyRepeating, setIsMonthlyRepeating] = useState(false)
    const [plannedDate, setPlannedDate] = useState(() => new Date().toISOString().split('T')[0])

    useEffect(() => {
        fetchTasks()
        fetch('/api/stats')
            .then(res => res.json())
            .then(data => {
                if (data.userId) setCurrentUserId(data.userId)
                if (data.isParent) {
                    setIsParent(true)
                    fetch('/api/parent/children')
                        .then(res => res.json())
                        .then(kids => {
                            setChildren(kids || [])
                            if (assignToParam) {
                                setAssignTo(assignToParam)
                                setShowNewTaskModal(true)
                                setActiveTab('assigns')
                            } else if (kids && kids.length > 0) {
                                setAssignTo(kids[0].id)
                            }
                        })
                }
            })
    }, [assignToParam])

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
            const url = editingTask ? `/api/tasks/${editingTask.id}` : '/api/tasks'
            const method = editingTask ? 'PUT' : 'POST'

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    rewardStars,
                    isRepeating,
                    isMonthlyRepeating,
                    plannedTime: new Date(plannedDate).toISOString(),
                    assignedTo: (!editingTask && isParent) ? assignTo : undefined
                })
            })
            if (res.ok) {
                setShowNewTaskModal(false)
                setEditingTask(null)
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
                <div className="flex items-center gap-2 md:gap-3">
                    <button
                        onClick={() => {
                            setEditingTask(null)
                            setTitle('')
                            setRewardStars(1)
                            setIsRepeating(false)
                            setIsMonthlyRepeating(false)
                            setPlannedDate(new Date().toISOString().split('T')[0])
                            setAssignTo('')
                            setShowNewTaskModal(true)
                        }}
                        className="flex items-center gap-2 px-3 py-2 md:px-5 md:py-2.5 rounded-xl md:rounded-2xl bg-blue-500 hover:bg-blue-600 transition-colors text-sm md:text-base font-bold text-white shadow-md active:scale-95 border-2 border-blue-400"
                    >
                        <Plus className="w-4 h-4 md:w-5 md:h-5" />
                        <span className="hidden md:inline">{t('tasks.newTask')}</span>
                    </button>
                    {isParent && children.length > 0 && (
                        <button
                            onClick={() => {
                                setEditingTask(null)
                                setTitle('')
                                setRewardStars(1)
                                setIsRepeating(false)
                                setIsMonthlyRepeating(false)
                                setPlannedDate(new Date().toISOString().split('T')[0])
                                setAssignTo(assignToParam || children[0].id || '')
                                setShowNewTaskModal(true)
                            }}
                            className="flex items-center gap-2 px-3 py-2 md:px-5 md:py-2.5 rounded-xl md:rounded-2xl bg-emerald-500 hover:bg-emerald-600 transition-colors text-sm md:text-base font-bold text-white shadow-md shadow-emerald-500/20 active:scale-95 border-2 border-emerald-400"
                        >
                            <Users className="w-4 h-4 md:w-5 md:h-5" />
                            <span className="hidden md:inline">{t('parent.assignTask') || 'Assign Task'}</span>
                        </button>
                    )}
                </div>
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
                        {isParent && (
                            <div className="flex flex-col gap-1 w-full mt-2 md:mt-4 pt-2 md:pt-4 md:border-t md:border-slate-200/50">
                                <button
                                    onClick={() => setActiveTab('assigns')}
                                    className={`flex-1 min-w-[100px] md:w-full flex items-center justify-center md:justify-start gap-3 py-3 md:py-4 md:px-6 rounded-xl md:rounded-2xl font-black text-sm transition-all ${activeTab === 'assigns' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'}`}
                                >
                                    <CheckSquare className="w-5 h-5 flex-shrink-0" /> <span className="hidden md:inline whitespace-nowrap">Assigns</span>
                                </button>
                                {activeTab === 'assigns' && children.length > 1 && (
                                    <div className="flex md:flex-col gap-1 md:pl-8 mt-1 w-full">
                                        <button
                                            onClick={() => setAssignedChildId('ALL')}
                                            className={`py-2 px-4 rounded-xl text-center md:text-left font-bold text-xs transition-colors shrink-0 ${assignedChildId === 'ALL' ? 'bg-blue-100 text-blue-600 md:shadow-inner' : 'text-slate-500 hover:bg-white/50'}`}
                                        >
                                            All Children
                                        </button>
                                        {children.map(child => (
                                            <button
                                                key={child.id}
                                                onClick={() => setAssignedChildId(child.id)}
                                                className={`py-2 px-4 rounded-xl text-center md:text-left font-bold text-xs transition-colors shrink-0 flex items-center justify-center md:justify-start gap-2 ${assignedChildId === child.id ? 'bg-blue-100 text-blue-600 md:shadow-inner' : 'text-slate-500 hover:bg-white/50'}`}
                                            >
                                                {child.avatarUrl && <img src={child.avatarUrl} className="w-4 h-4 rounded-full object-cover hidden md:block" />}
                                                {child.name}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
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
                                // Logic:
                                // 1. If I am the creator and assignedTo is someone else -> This is an "Assign" I gave out.
                                // 2. If I am the assignedTo and creator is someone else -> This is an "Assign" I received.
                                // 3. If I am both creator and assignedTo -> This is my own personal task.

                                const isAssignIGave = task.creatorId === currentUserId && task.assignedTo !== currentUserId;
                                const isAssignIReceived = task.assignedTo === currentUserId && task.creatorId !== currentUserId;
                                const isMyOwnTask = task.assignedTo === currentUserId && task.creatorId === currentUserId;

                                if (activeTab === 'assigns') {
                                    // In "Assigns" tab, we ONLY show tasks I gave to others (if Parent)
                                    if (!isAssignIGave) return false;
                                    if (assignedChildId !== 'ALL') return task.assignedTo === assignedChildId;
                                    return true;
                                }

                                // In other tabs, we ONLY show tasks assigned to ME (personal or received from parent)
                                if (task.assignedTo !== currentUserId) return false;

                                // Frequency filters
                                if (activeTab === 'daily') return task.isRepeating && !task.isMonthlyRepeating;
                                if (activeTab === 'monthly') return task.isMonthlyRepeating;

                                // If looking for one-off tasks (Today/Tomorrow/Week)
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
                                            <span className="text-xs bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded-full mt-1 inline-block mr-2">
                                                {t('tasks.dailyLoop')}
                                            </span>
                                        )}
                                        {task.creatorId !== currentUserId && task.assignedTo === currentUserId && (
                                            <span className="text-xs bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded-full mt-1 inline-flex items-center gap-1">
                                                <User className="w-3 h-3" />
                                                Assigned by Parent
                                            </span>
                                        )}
                                        {task.creatorId === currentUserId && task.assignedTo !== currentUserId && (
                                            <span className="text-xs bg-purple-100 text-purple-700 font-bold px-2 py-0.5 rounded-full mt-1 inline-flex items-center gap-1">
                                                <User className="w-3 h-3" />
                                                To: {children.find(c => c.id === task.assignedTo)?.name || 'Child'}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1.5 bg-yellow-100 px-3 py-1.5 rounded-full shadow-inner border border-yellow-200">
                                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-400" />
                                        <span className="font-black text-yellow-700">+{task.rewardStars}</span>
                                    </div>
                                    {task.creatorId === currentUserId && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setEditingTask(task);
                                                setTitle(task.title);
                                                setRewardStars(task.rewardStars);
                                                setIsRepeating(task.isRepeating);
                                                setIsMonthlyRepeating(task.isMonthlyRepeating);
                                                setPlannedDate(task.plannedTime ? new Date(task.plannedTime).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
                                                setAssignTo(task.assignedTo);
                                                setShowNewTaskModal(true);
                                            }}
                                            className="ml-2 w-10 h-10 flex items-center justify-center rounded-2xl bg-slate-100 text-slate-400 hover:bg-blue-100 hover:text-blue-500 transition-colors shadow-sm"
                                        >
                                            <Edit2 className="w-5 h-5" />
                                        </button>
                                    )}
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
                            initial={{ scale: 0.95, y: 10 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 10 }}
                            className="w-full max-w-sm bg-white rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
                        >
                            <div className={`p-4 md:p-5 border-b flex justify-between items-center ${assignTo === '' ? 'bg-gradient-to-r from-blue-50 to-blue-100/50 border-blue-100' : 'bg-gradient-to-r from-emerald-50 to-emerald-100/50 border-emerald-100'}`}>
                                <h3 className="text-lg md:text-xl font-black flex items-center gap-2 text-slate-800">
                                    {editingTask ? <Edit2 className="w-5 h-5 text-blue-500" /> : (assignTo === '' ? <Plus className="w-5 h-5 text-blue-500" /> : <Users className="w-5 h-5 text-emerald-500" />)}
                                    {editingTask ? 'Edit Task' : (assignTo === '' ? t('tasks.newTask') : t('parent.assignTask') || 'Assign Task')}
                                </h3>
                            </div>
                            <div className="overflow-y-auto hide-scrollbar">
                                <form onSubmit={handleCreateTask} className="p-4 md:p-5 flex flex-col gap-4 bg-white">
                                    <div>
                                        <label className="block text-xs md:text-sm font-bold text-[#6b5c45] mb-1.5">{t('tasks.form.nameLabel')}</label>
                                        <input
                                            type="text"
                                            value={title}
                                            onChange={e => setTitle(e.target.value)}
                                            className="w-full bg-[#f5f0e8] border-none rounded-xl p-3 md:p-3.5 focus:ring-4 focus:ring-blue-400 outline-none font-bold text-base"
                                            placeholder={t('tasks.form.namePlaceholder')}
                                            required
                                        />
                                    </div>

                                    {isParent && children.length > 0 && !editingTask && (
                                        <div className="space-y-1.5">
                                            <label className="block text-xs md:text-sm font-bold text-[#6b5c45]">Assign To</label>
                                            <select
                                                value={assignTo}
                                                onChange={e => setAssignTo(e.target.value)}
                                                className="w-full bg-[#f5f0e8] border-none rounded-xl p-3 md:p-3.5 focus:ring-4 focus:ring-blue-400 outline-none font-bold text-base"
                                            >
                                                <option value="">Myself (Parent)</option>
                                                {children.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                            </select>
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between">
                                        <label className="text-xs md:text-sm font-bold text-[#6b5c45]">{t('tasks.form.rewardLabel')}</label>
                                        <div className="flex items-center gap-2">
                                            <button type="button" onClick={() => setRewardStars(Math.max(1, rewardStars - 1))} className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-[#f5f0e8] flex items-center justify-center font-bold text-[#6b5c45]">-</button>
                                            <span className="font-black text-yellow-600 text-lg md:text-xl w-6 text-center">{rewardStars}</span>
                                            <button type="button" onClick={() => setRewardStars(rewardStars + 1)} className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-[#f5f0e8] flex items-center justify-center font-bold text-[#6b5c45]">+</button>
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="block text-xs md:text-sm font-bold text-[#6b5c45]">Planned Date</label>
                                        <input
                                            type="date"
                                            value={plannedDate}
                                            onChange={e => setPlannedDate(e.target.value)}
                                            className="w-full bg-[#f5f0e8] border-none rounded-xl p-3 md:p-3.5 focus:ring-4 focus:ring-blue-400 outline-none font-bold text-base"
                                            required
                                        />
                                    </div>

                                    <div className="flex flex-col gap-2.5 bg-[#faf7f0] p-3 md:p-4 rounded-xl border border-[#e8dfce]">
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
                                            <label htmlFor="isRep" className="font-bold text-sm text-[#6b5c45]">{t('tasks.form.recurringLabel')}</label>
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
                                                className="w-4 h-4 md:w-5 md:h-5 accent-purple-500 rounded"
                                            />
                                            <label htmlFor="isMonthlyRep" className="font-bold text-sm text-[#6b5c45]">Monthly Repeating Task</label>
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        className={`mt-1 w-full py-3 md:py-3.5 rounded-2xl text-white font-black tracking-wide shadow-lg hover:opacity-90 transition-opacity text-base md:text-lg ${assignTo === '' ? 'bg-gradient-to-r from-blue-500 to-indigo-500 shadow-blue-500/20' : 'bg-gradient-to-r from-emerald-500 to-teal-500 shadow-emerald-500/20'}`}
                                    >
                                        {assignTo === '' ? t('tasks.createGoal') : 'Confirm Assignment'}
                                    </button>
                                    <button type="button" onClick={() => setShowNewTaskModal(false)} className="py-1.5 md:py-2 text-sm md:text-base text-[#a89880] font-bold hover:text-[#2c2416]">
                                        {t('common.cancel')}
                                    </button>
                                </form>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

export default function TasksPage() {
    return (
        <Suspense fallback={<div className="min-h-dvh flex items-center justify-center bg-[#e0f2fe]">Loading...</div>}>
            <TasksPageContent />
        </Suspense>
    )
}
