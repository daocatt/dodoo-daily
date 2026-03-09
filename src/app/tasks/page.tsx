'use client'

import React, { useEffect, useState, Suspense } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, CheckSquare, Plus, Star, CircleAlert, Sun, Sunrise, Calendar, Repeat, CalendarDays, Users, Edit2, User, Coins, Check, CheckCheck, RotateCcw, Trash2 } from 'lucide-react'
import { getStartOfDayInTimezone, getTodayStringInTimezone } from '@/lib/utils'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import AnimatedSky from '@/components/AnimatedSky'
import { useI18n } from '@/contexts/I18nContext'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'

type Task = {
    id: string
    title: string
    description: string | null
    isRepeating: boolean
    isMonthlyRepeating: boolean
    rewardStars: number
    rewardCoins: number
    completed: boolean
    completedById: string | null
    completedByNickname: string | null
    plannedTime: string | null
    confirmationStatus?: 'PENDING' | 'APPROVED' | 'REJECTED'
    assigneeId?: string // From AssignedTask
    assignerId?: string // From AssignedTask
    creatorId: string // From Task
    isAssigned?: boolean // Locally flag to distinguish
}

type Child = {
    id: string
    name: string
    nickname: string | null
    avatarUrl: string | null
}

type ParentInfo = {
    id: string
    name: string
    nickname: string
    avatarUrl: string | null
}

function TasksPageContent() {
    const searchParams = useSearchParams()
    const assignToParam = searchParams.get('assignTo')
    const [tasks, setTasks] = useState<Task[]>([])
    const [loading, setLoading] = useState(true)
    const [showNewTaskModal, setShowNewTaskModal] = useState(false)
    const [activeTab, setActiveTab] = useState<'today' | 'tomorrow' | 'week' | 'daily' | 'monthly' | 'assigns'>('today')
    const [isParent, setIsParent] = useState(false)
    const [children, setChildren] = useState<Child[]>([])
    const [assignedChildId, setAssignedChildId] = useState<string | 'ALL'>('ALL')
    const [assignTo, setAssignTo] = useState<string[]>([]) // Changed to array
    const [currentUserId, setCurrentUserId] = useState<string>('')
    const [parentInfo, setParentInfo] = useState<ParentInfo | null>(null)
    const [systemTimezone, setSystemTimezone] = useState('Asia/Shanghai')
    const { t } = useI18n()

    // Form
    const [editingTask, setEditingTask] = useState<Task | null>(null)
    const [title, setTitle] = useState('')
    const [rewardStars, setRewardStars] = useState(1)
    const [rewardCoins, setRewardCoins] = useState(0)
    const [isRepeating, setIsRepeating] = useState(false)
    const [isMonthlyRepeating, setIsMonthlyRepeating] = useState(false)
    const [plannedDate, setPlannedDate] = useState<Date | null>(() => new Date())
    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
        fetchTasks()
        fetch('/api/stats')
            .then(res => res.json())
            .then(data => {
                if (data.userId) {
                    setCurrentUserId(data.userId)
                    setParentInfo({
                        id: data.userId,
                        name: data.name || 'Parent',
                        nickname: data.nickname || data.name || 'Parent',
                        avatarUrl: data.avatarUrl
                    })
                }
                if (data.timezone) setSystemTimezone(data.timezone)
                if (data.isParent) {
                    setIsParent(true)
                    fetch('/api/parent/children')
                        .then(res => res.json())
                        .then(kids => {
                            setChildren(kids || [])
                            if (assignToParam) {
                                setAssignTo([assignToParam])
                                setShowNewTaskModal(true)
                                setActiveTab('assigns')
                            } else {
                                setAssignTo([]) // Default to myself
                            }
                        })
                }
            })
    }, [assignToParam])

    const fetchTasks = async () => {
        try {
            const [pRes, aRes] = await Promise.all([
                fetch('/api/tasks'),
                fetch('/api/assigned-tasks')
            ])
            const [pData, aData] = await Promise.all([pRes.json(), aRes.json()])

            const personal = (Array.isArray(pData) ? pData : []).map((t: Task) => ({ ...t, isAssigned: false }));
            const assigned = (Array.isArray(aData) ? aData : []).map((t: Task) => ({ ...t, isAssigned: true }));

            setTasks([...personal, ...assigned])
        } catch (err) {
            console.error(err)
            setTasks([])
        } finally {
            setLoading(false)
        }
    }

    const toggleCompletion = async (task: Task) => {
        const updatedTasks = tasks.map(t =>
            t.id === task.id ? { ...t, completed: !t.completed } : t
        )
        setTasks(updatedTasks)

        try {
            const path = task.isAssigned ? `/api/assigned-tasks/${task.id}` : `/api/tasks/${task.id}`;
            await fetch(path, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ completed: !task.completed })
            })
            fetchTasks(); // Refresh to get final status/rewards
        } catch (error) {
            console.error(error)
            fetchTasks()
        }
    }

    useEffect(() => {
        if (assignTo.length === 0 || (assignTo.length === 1 && assignTo[0] === currentUserId)) {
            setRewardStars(1)
            setRewardCoins(0)
        }
    }, [assignTo, currentUserId])

    const handleCreateTask = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!title || isSubmitting) return

        setIsSubmitting(true)
        try {
            const targets = assignTo.length === 0 ? [currentUserId] : assignTo;

            for (const targetId of targets) {
                const isAssigned = targetId !== currentUserId;
                const baseUrl = isAssigned ? '/api/assigned-tasks' : '/api/tasks';
                const url = editingTask ? `${baseUrl}/${editingTask.id}` : baseUrl;
                const method = editingTask ? 'PUT' : 'POST'

                const res = await fetch(url, {
                    method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        title,
                        rewardStars: isAssigned ? rewardStars : 1,
                        rewardCoins: isAssigned ? rewardCoins : 0,
                        isRepeating,
                        isMonthlyRepeating,
                        plannedTime: plannedDate ? plannedDate.toISOString() : new Date().toISOString(),
                        assignedTo: isAssigned ? targetId : undefined
                    })
                })
                if (!res.ok) throw new Error('Failed to create task for ' + targetId);
            }

            setShowNewTaskModal(false)
            setEditingTask(null)
            setTitle('')
            setRewardStars(1)
            setRewardCoins(0)
            setIsRepeating(false)
            setIsMonthlyRepeating(false)
            fetchTasks()
        } catch (err) {
            console.error(err)
        } finally {
            setIsSubmitting(false)
        }
    }

    const confirmReward = async (task: Task) => {
        if (!task.isAssigned) return;
        try {
            const res = await fetch(`/api/assigned-tasks/${task.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'CONFIRM_REWARD' })
            })
            if (res.ok) fetchTasks()
        } catch (error) {
            console.error(error)
        }
    }

    const resetTask = async (task: Task) => {
        const path = task.isAssigned ? `/api/assigned-tasks/${task.id}` : `/api/tasks/${task.id}`;
        try {
            const res = await fetch(path, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ completed: false })
            })
            if (res.ok) fetchTasks()
        } catch (error) {
            console.error(error)
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
                            setRewardCoins(0)
                            setIsRepeating(false)
                            setIsMonthlyRepeating(false)
                            setPlannedDate(new Date())
                            setAssignTo([])
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
                                setRewardCoins(0)
                                setIsRepeating(false)
                                setIsMonthlyRepeating(false)
                                setPlannedDate(new Date())
                                setAssignTo(assignToParam ? [assignToParam] : [children[0].id])
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
                            <Repeat className="w-5 h-5 flex-shrink-0" /> <span className="hidden md:inline whitespace-nowrap">{t('tasks.dailyLoop')}</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('monthly')}
                            className={`flex-1 min-w-[100px] md:w-full flex items-center justify-center md:justify-start gap-3 py-3 md:py-4 md:px-6 rounded-xl md:rounded-2xl font-black text-sm transition-all ${activeTab === 'monthly' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'}`}
                        >
                            <CalendarDays className="w-5 h-5 flex-shrink-0" /> <span className="hidden md:inline whitespace-nowrap">{t('tasks.monthlyLoop')}</span>
                        </button>
                        {!isParent && (
                            <div className="flex flex-col gap-1 w-full mt-2 md:mt-4 pt-2 md:pt-4 md:border-t md:border-slate-200/50">
                                <button
                                    onClick={() => setActiveTab('assigns')}
                                    className={`flex-1 min-w-[100px] md:w-full flex items-center justify-center md:justify-start gap-3 py-3 md:py-4 md:px-6 rounded-xl md:rounded-2xl font-black text-sm transition-all ${activeTab === 'assigns' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'}`}
                                >
                                    <Users className="w-5 h-5 flex-shrink-0" /> <span className="hidden md:inline whitespace-nowrap">{t('tasks.assigned')}</span>
                                </button>
                            </div>
                        )}
                        {isParent && (
                            <div className="flex flex-col gap-1 w-full mt-2 md:mt-4 pt-2 md:pt-4 md:border-t md:border-slate-200/50">
                                <button
                                    onClick={() => setActiveTab('assigns')}
                                    className={`flex-1 min-w-[100px] md:w-full flex items-center justify-center md:justify-start gap-3 py-3 md:py-4 md:px-6 rounded-xl md:rounded-2xl font-black text-sm transition-all ${activeTab === 'assigns' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'}`}
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
                                // Updated logic with split tables:
                                const isAssignIGave = task.isAssigned && task.assignerId === currentUserId;
                                const isAssignIReceived = task.isAssigned && task.assigneeId === currentUserId;
                                const isMyOwnTask = !task.isAssigned;

                                if (activeTab === 'assigns') {
                                    // In "Assigns" tab:
                                    // - If Parent: show tasks I gave to others
                                    // - If Child: show tasks I received from parent
                                    if (isParent) {
                                        if (!isAssignIGave) return false;
                                        if (assignedChildId !== 'ALL') return task.assigneeId === assignedChildId;
                                    } else {
                                        if (!isAssignIReceived) return false;
                                    }
                                    return true;
                                }

                                // In other tabs, we ONLY show personal tasks created by self
                                if (!isMyOwnTask) return false;

                                // Frequency filters
                                if (activeTab === 'daily') return task.isRepeating && !task.isMonthlyRepeating;
                                if (activeTab === 'monthly') return task.isMonthlyRepeating;

                                // If looking for one-off tasks (Today/Tomorrow/Week)
                                if (task.isRepeating || task.isMonthlyRepeating) return false;

                                const pt = task.plannedTime ? getStartOfDayInTimezone(systemTimezone, 0, new Date(task.plannedTime)) : getStartOfDayInTimezone(systemTimezone);
                                const today = getStartOfDayInTimezone(systemTimezone);
                                const tomorrow = getStartOfDayInTimezone(systemTimezone, 1);
                                const weekEnd = getStartOfDayInTimezone(systemTimezone, 7);

                                if (activeTab === 'today') return pt.getTime() === today.getTime();
                                if (activeTab === 'tomorrow') return pt.getTime() === tomorrow.getTime();
                                if (activeTab === 'week') return pt >= today && pt <= weekEnd;

                                return false;
                            }).map((task, idx) => {
                                const isMyOwnTask = !task.isAssigned;
                                const isAssignIGave = task.isAssigned && task.assignerId === currentUserId;
                                const isAssignIReceived = task.isAssigned && task.assigneeId === currentUserId;
                                const hasApproval = task.isAssigned ? task.confirmationStatus === 'APPROVED' : true;

                                return (
                                    <motion.div
                                        key={task.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.05, type: 'spring' }}
                                        className={`p-3 md:p-3.5 rounded-xl md:rounded-2xl border-2 md:border-4 backdrop-blur-xl shadow-sm flex flex-col md:flex-row md:items-center gap-3 transition-all duration-300 ${task.completed ? 'bg-white/40 border-white/30' : 'bg-white border-white'}`}
                                    >
                                        <div className="flex items-center gap-3 flex-1">
                                            <div
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    // Allow toggle if:
                                                    // 1. It's a personal task
                                                    // 2. It's assigned to me
                                                    // 3. I assigned it to someone else (parent unilateral complete)
                                                    // 4. Or if we are un-completing it
                                                    if (isMyOwnTask || isAssignIReceived || isAssignIGave || !task.completed) {
                                                        toggleCompletion(task);
                                                    }
                                                }}
                                                className={`w-8 h-8 md:w-9 md:h-9 rounded-full border-[3px] md:border-4 flex items-center justify-center transition-colors flex-shrink-0 cursor-pointer active:scale-90 ${task.completed ? (hasApproval ? 'border-green-500 bg-green-500' : 'border-amber-400 bg-amber-400') : 'border-[#e8dfce] hover:border-blue-300'}`}
                                            >
                                                {task.completed && (
                                                    hasApproval ? <CheckCheck className="w-4 h-4 md:w-5 md:h-5 text-white" /> : <Check className="w-4 h-4 md:w-5 md:h-5 text-white" />
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <h3 className={`text-base md:text-lg font-black leading-tight ${task.completed && hasApproval ? 'line-through text-[#6b5c45]' : 'text-[#2c2416]'}`}>
                                                    {task.title}
                                                </h3>
                                                <div className="flex flex-wrap gap-2 mt-1.5">
                                                    {task.isRepeating && (
                                                        <span className="text-[10px] uppercase tracking-wider bg-blue-100/50 text-blue-700 font-black px-2 py-0.5 rounded-lg">
                                                            {t('tasks.dailyLoop')}
                                                        </span>
                                                    )}
                                                    {task.isMonthlyRepeating && (
                                                        <span className="text-[10px] uppercase tracking-wider bg-purple-100/50 text-purple-700 font-black px-2 py-0.5 rounded-lg">
                                                            {t('tasks.monthlyLoop')}
                                                        </span>
                                                    )}
                                                    {task.plannedTime && (
                                                        <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 py-0.5">
                                                            <Calendar className="w-3 h-3 opacity-60" />
                                                            {new Date(task.plannedTime).toLocaleDateString(undefined, {
                                                                month: 'short',
                                                                day: 'numeric',
                                                                timeZone: systemTimezone
                                                            })}
                                                        </span>
                                                    )}
                                                    {task.completed && (
                                                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-lg flex items-center gap-1.5 ${hasApproval ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                                            {task.completedByNickname || 'User'} 标记任务已完成
                                                            {task.isAssigned && task.confirmationStatus === 'PENDING' && '，待确认'}
                                                            {hasApproval && <CheckCheck className="w-3 h-3" />}
                                                        </span>
                                                    )}
                                                    {!task.completed && isAssignIReceived && (
                                                        <span className="text-[10px] uppercase tracking-wider bg-emerald-100/50 text-emerald-700 font-black px-2 py-0.5 rounded-lg">
                                                            Assigned by Parent
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2.5 self-end md:self-center">
                                            <div className="flex items-center gap-2">
                                                <div className="flex items-center gap-1 bg-yellow-100 px-2 py-1 rounded-full shadow-inner border border-yellow-200">
                                                    <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-400" />
                                                    <span className="font-black text-yellow-700 text-xs md:text-sm">+{task.rewardStars}</span>
                                                </div>
                                                {task.rewardCoins > 0 && (
                                                    <div className="flex items-center gap-1 bg-amber-100 px-2 py-1 rounded-full shadow-inner border border-amber-200">
                                                        <Coins className="w-3.5 h-3.5 text-amber-500" />
                                                        <span className="font-black text-amber-700 text-xs md:text-sm">+{task.rewardCoins}</span>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-2">
                                                {isAssignIGave && task.completed && task.confirmationStatus === 'PENDING' && (
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); resetTask(task); }}
                                                            className="h-10 px-3 flex items-center gap-1.5 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors font-bold text-xs"
                                                        >
                                                            <RotateCcw className="w-4 h-4" /> 重启
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); confirmReward(task); }}
                                                            className="h-10 px-3 flex items-center gap-1.5 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 shadow-md shadow-emerald-500/20 transition-all font-bold text-xs"
                                                        >
                                                            <CheckCheck className="w-4 h-4" /> 确认奖励
                                                        </button>
                                                    </div>
                                                )}
                                                {task.creatorId === currentUserId && !task.completed && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setEditingTask(task);
                                                            setTitle(task.title);
                                                            setRewardStars(task.rewardStars);
                                                            setRewardCoins(task.rewardCoins || 0);
                                                            setIsRepeating(task.isRepeating);
                                                            setIsMonthlyRepeating(task.isMonthlyRepeating);
                                                            setPlannedDate(task.plannedTime ? new Date(task.plannedTime) : new Date());
                                                            setAssignTo(task.isAssigned ? (task.assigneeId ? [task.assigneeId] : []) : [currentUserId]);
                                                            setShowNewTaskModal(true);
                                                        }}
                                                        className="w-10 h-10 flex items-center justify-center rounded-2xl bg-slate-100 text-slate-400 hover:bg-blue-100 hover:text-blue-500 transition-colors shadow-sm"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                )
                            })}
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
                            className="w-full max-w-sm md:max-w-2xl bg-white rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[95vh]"
                        >
                            <div className={`p-4 md:p-5 border-b flex justify-between items-center ${assignTo === '' ? 'bg-gradient-to-r from-blue-50 to-blue-100/50 border-blue-100' : 'bg-gradient-to-r from-emerald-50 to-emerald-100/50 border-emerald-100'}`}>
                                <h3 className="text-lg md:text-xl font-black flex items-center gap-2 text-slate-800">
                                    {editingTask ? <Edit2 className="w-5 h-5 text-blue-500" /> : (assignTo.length === 0 ? <Plus className="w-5 h-5 text-blue-500" /> : <Users className="w-5 h-5 text-emerald-500" />)}
                                    {editingTask ? 'Edit Task' : (assignTo.length === 0 || (assignTo.length === 1 && assignTo[0] === currentUserId) ? t('tasks.newTask') : t('parent.assignTask') || 'Assign Task')}
                                </h3>
                            </div>
                            <div className="overflow-y-auto hide-scrollbar">
                                <form onSubmit={handleCreateTask} className="p-4 md:p-6 bg-white">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-x-8 md:gap-y-5">
                                        <div className="md:col-span-2">
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

                                        {/* Assign To - Multi-select Pill Style */}
                                        {isParent && children.length > 0 && !editingTask && (
                                            <div className="md:col-span-2 space-y-3">
                                                <div className="flex justify-between items-center">
                                                    <label className="block text-xs md:text-sm font-bold text-[#6b5c45]">Assign To</label>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            if (assignTo.length === children.length) setAssignTo([]);
                                                            else setAssignTo(children.map(c => c.id));
                                                        }}
                                                        className="text-[10px] font-black uppercase tracking-widest text-[#43aa8b] hover:opacity-80 transition-colors"
                                                    >
                                                        {assignTo.length === children.length ? 'Deselect All' : 'Select All'}
                                                    </button>
                                                </div>
                                                <div className="flex flex-wrap gap-3">
                                                    {children.map(c => {
                                                        const isSelected = assignTo.includes(c.id);
                                                        return (
                                                            <button
                                                                key={c.id}
                                                                type="button"
                                                                onClick={() => {
                                                                    if (isSelected) {
                                                                        setAssignTo(assignTo.filter(id => id !== c.id));
                                                                    } else {
                                                                        setAssignTo([...assignTo, c.id]);
                                                                    }
                                                                }}
                                                                className={`flex items-center gap-3 p-1.5 pr-4 rounded-full border-2 transition-all ${isSelected ? 'bg-emerald-500 border-emerald-400 text-white shadow-md' : 'bg-slate-50 border-slate-100 text-slate-500 hover:bg-white'}`}
                                                            >
                                                                <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-white bg-slate-200">
                                                                    {c.avatarUrl ? (
                                                                        <img src={c.avatarUrl} alt={c.name} className="w-full h-full object-cover" />
                                                                    ) : (
                                                                        <div className="w-full h-full flex items-center justify-center bg-emerald-100 text-emerald-500 font-bold text-xs uppercase">
                                                                            {c.nickname?.[0] || c.name[0]}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <span className="font-bold text-sm">{c.nickname || c.name}</span>
                                                                {isSelected && <Check className="w-3.5 h-3.5" />}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        {/* Rewards - Show if assignment is selected (at least one child) */}
                                        {assignTo.length > 0 && !assignTo.includes(currentUserId) && (
                                            <>
                                                <div className="flex items-center justify-between bg-yellow-50/50 p-3 md:p-4 rounded-xl border border-yellow-100/50">
                                                    <label className="text-xs md:text-sm font-bold text-[#6b5c45]">{t('tasks.form.rewardLabel')}</label>
                                                    <div className="flex items-center gap-2">
                                                        <button type="button" onClick={() => setRewardStars(Math.max(1, rewardStars - 1))} className="w-8 h-8 rounded-full bg-white flex items-center justify-center font-bold text-[#6b5c45] shadow-sm hover:shadow-md transition-shadow">-</button>
                                                        <span className="font-black text-yellow-600 text-lg md:text-xl w-6 text-center">{rewardStars}</span>
                                                        <button type="button" onClick={() => setRewardStars(rewardStars + 1)} className="w-8 h-8 rounded-full bg-white flex items-center justify-center font-bold text-[#6b5c45] shadow-sm hover:shadow-md transition-shadow">+</button>
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between bg-amber-50/50 p-3 md:p-4 rounded-xl border border-amber-100/50">
                                                    <label className="text-xs md:text-sm font-bold text-[#6b5c45]">Bonus Coins</label>
                                                    <div className="flex items-center gap-2">
                                                        <button type="button" onClick={() => setRewardCoins(Math.max(0, rewardCoins - 1))} className="w-8 h-8 rounded-full bg-white flex items-center justify-center font-bold text-[#6b5c45] shadow-sm hover:shadow-md transition-shadow">-</button>
                                                        <div className="flex items-center gap-1 justify-center w-12 text-center">
                                                            <span className="font-black text-amber-600 text-lg md:text-xl">{rewardCoins}</span>
                                                        </div>
                                                        <button type="button" onClick={() => setRewardCoins(rewardCoins + 1)} className="w-8 h-8 rounded-full bg-white flex items-center justify-center font-bold text-[#6b5c45] shadow-sm hover:shadow-md transition-shadow">+</button>
                                                    </div>
                                                </div>
                                            </>
                                        )}

                                        <div className="space-y-1.5">
                                            <label className="block text-xs md:text-sm font-bold text-[#6b5c45]">Planned Date</label>
                                            <DatePicker
                                                selected={plannedDate}
                                                onChange={(date: Date | null) => setPlannedDate(date)}
                                                dateFormat="yyyy-MM-dd"
                                                className="w-full bg-[#f5f0e8] border-none rounded-xl p-3 md:p-3.5 focus:ring-4 focus:ring-blue-400 outline-none font-bold text-base"
                                                required
                                                placeholderText="Select date"
                                            />
                                        </div>

                                        <div className="flex flex-col gap-2.5 bg-[#faf7f0] p-3 md:p-4 rounded-xl border border-[#e8dfce] justify-center">
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="checkbox"
                                                    id="isRep"
                                                    checked={isRepeating}
                                                    onChange={(e) => {
                                                        setIsRepeating(e.target.checked);
                                                        if (e.target.checked) setIsMonthlyRepeating(false);
                                                    }}
                                                    className="w-5 h-5 accent-blue-500 rounded cursor-pointer"
                                                />
                                                <label htmlFor="isRep" className="font-bold text-sm text-[#6b5c45] cursor-pointer">{t('tasks.form.recurringLabel')}</label>
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
                                                    className="w-4 h-4 md:w-5 md:h-5 accent-purple-500 rounded cursor-pointer"
                                                />
                                                <label htmlFor="isMonthlyRep" className="font-bold text-sm text-[#6b5c45] cursor-pointer">{t('tasks.form.monthlyRecurringLabel')}</label>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-6 md:mt-8 space-y-3">
                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className={`w-full py-3.5 md:py-4 rounded-2xl text-white font-black tracking-wide shadow-lg transition-all text-base md:text-lg ${isSubmitting ? 'bg-slate-400 cursor-not-allowed' : (assignTo === '' ? 'bg-gradient-to-r from-blue-500 to-indigo-500 shadow-blue-500/20 hover:opacity-90' : 'bg-gradient-to-r from-emerald-500 to-teal-500 shadow-emerald-500/20 hover:opacity-90')}`}
                                        >
                                            {isSubmitting ? (editingTask ? 'Saving...' : 'Creating...') : (editingTask ? t('common.save') : (assignTo.length === 0 || (assignTo.length === 1 && assignTo[0] === currentUserId) ? t('tasks.createGoal') : t('common.confirm')))}
                                        </button>
                                        <button type="button" onClick={() => setShowNewTaskModal(false)} className="w-full py-2 text-sm md:text-base text-[#a89880] font-bold hover:text-[#2c2416] transition-colors">
                                            {t('common.cancel')}
                                        </button>
                                    </div>
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
