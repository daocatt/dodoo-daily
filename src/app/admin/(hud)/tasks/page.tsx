'use client'

import BausteinAdminNavbar from '@/components/BausteinAdminNavbar'
import React, { useEffect, useState, Suspense, useRef } from 'react'
import { motion, AnimatePresence, useAnimation, PanInfo } from 'framer-motion'
import { CheckSquare, Plus, Star, CircleAlert, Sun, Sunrise, Calendar, CalendarDays, Users, Edit2, Check, CheckCheck, RotateCcw, Trash2, X as XIcon, ListTodo, Loader2 } from 'lucide-react'
import { getStartOfDayInTimezone } from '@/lib/utils'
import { useSearchParams, useRouter } from 'next/navigation'
import { useI18n } from '@/contexts/I18nContext'
import SmartDatePicker from '@/components/SmartDatePicker'
import Image from 'next/image'
import { clsx } from 'clsx'

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
    assigneeNickname?: string
    assigneeAvatar?: string
    assignerNickname?: string
    assignerAvatar?: string
    creatorId: string // From Task
    isAssigned?: boolean // Locally flag to distinguish
}

type Child = {
    id: string
    name: string
    nickname: string | null
    avatarUrl: string | null
}

// --- TaskItem Component for Individual Motion Control ---
const TaskItem = ({ 
    task, index, handleEditTask, toggleCompletion, resetTask, confirmReward, currentUserId, t, systemTimezone, isSubmitting 
}: { 
    task: Task, index: number, handleEditTask: (task: Task) => void, toggleCompletion: (task: Task) => void, resetTask: (task: Task) => void, confirmReward: (task: Task) => void, currentUserId: string, t: (key: string, options?: Record<string, unknown>) => string, systemTimezone: string, isSubmitting: boolean 
}) => {
    const controls = useAnimation();
    const isDragging = useRef(false);
    const isMyOwnTask = !task.isAssigned;
    const isAssignIGave = task.isAssigned && task.assignerId === currentUserId;
    const isAssignIReceived = task.isAssigned && task.assigneeId === currentUserId;
    const hasApproval = task.isAssigned ? task.confirmationStatus === 'APPROVED' : true;

    const handleEditWithSnap = (task: Task) => {
        controls.start({ x: 0 }); // Snap back
        handleEditTask(task);
    };

    const onDragStart = () => {
        isDragging.current = true;
    };

    const onDragEnd = (_event: unknown, info: PanInfo) => {
        if (info.offset.x < -40) {
            controls.start({ x: -120 });
        } else {
            controls.start({ x: 0 });
        }
        // Small timeout to prevent the release from being counted as a tap
        setTimeout(() => {
            isDragging.current = false;
        }, 50);
    };

    return (
        <motion.div 
            initial={{ opacity: 0, y: 8 }}
            animate={{ 
                opacity: 1, 
                y: 0,
                transition: { 
                    delay: index * 0.02,
                    duration: 0.3,
                    ease: [0.16, 1, 0.3, 1] 
                } 
            }}
            className="relative group overflow-hidden rounded-xl md:rounded-[1.25rem] bg-transparent"
        >
            {/* Background Layer - Action button that stays behind */}
            <div className="absolute inset-y-0 right-0 w-[120px] flex items-center justify-center bg-transparent">
                <button 
                    onClick={() => handleEditWithSnap(task)}
                    className="hardware-btn group h-9"
                >
                    <div className="hardware-well relative h-full min-w-[84px] rounded-full bg-[#DADBD4] shadow-well active:translate-y-0.5 transition-all flex items-center justify-center p-0.5">
                        <div className="absolute inset-[2px] rounded-full bg-white flex items-center justify-center gap-2 border border-black/5 shadow-sm group-hover:bg-slate-50 transition-colors px-3">
                            <Edit2 className="w-3 h-3 text-slate-400" />
                            <span className="text-[9px] font-black uppercase tracking-[0.15em] label-mono text-slate-400">Edit</span>
                        </div>
                    </div>
                </button>
            </div>

            {/* Foreground Draggable Layer */}
            <motion.div
                drag="x"
                dragConstraints={{ left: -120, right: 0 }}
                dragElastic={0.02}
                animate={controls}
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
                onTap={(e) => {
                    // Only proceed if we aren't currently dragging or just finished dragging
                    if (isDragging.current) return;
                    if ((e.target as HTMLElement).closest('.hardware-btn')) return;
                    handleEditWithSnap(task);
                }}
                className={clsx(
                    "p-2.5 md:p-3.5 rounded-xl md:rounded-[1.25rem] flex flex-col md:flex-row md:items-center gap-3 transition-all duration-300 relative z-10 cursor-pointer shadow-sm",
                    task.completed ? '!bg-slate-100 opacity-50 grayscale' : '!bg-white border border-slate-200/60'
                )}
            >
                <div className="flex items-center gap-3 flex-1 relative z-10">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            if (isMyOwnTask || isAssignIReceived || isAssignIGave || !task.completed) {
                                toggleCompletion(task);
                            }
                        }}
                        disabled={isSubmitting}
                        className="hardware-btn group shrink-0"
                    >
                        <div className={clsx(
                            "hardware-well relative w-4 h-4 md:w-5 md:h-5 rounded-sm flex items-center justify-center shadow-well active:translate-y-0.5 transition-all text-slate-700",
                            task.completed ? "bg-slate-100/80 grayscale" : "bg-slate-100"
                        )}>
                            <div className={clsx(
                                "absolute inset-[1px] rounded-[1.5px] md:rounded-sm flex items-center justify-center transition-all bg-white shadow-sm group-active:translate-y-0.5",
                                task.completed 
                                    ? (hasApproval ? "!bg-slate-400 !border-slate-300 shadow-inner" : "!bg-black/40 !border-black/20 font-black") 
                                    : "border border-black/10"
                            )}>
                                {task.completed && (
                                    hasApproval ? <CheckCheck className="w-2 h-2 text-white" /> : <Check className="w-2 h-2 text-white/40" />
                                )}
                            </div>
                        </div>
                    </button>

                    <div className="flex-1 min-w-0">
                        <h3 className={clsx(
                            "text-[13px] md:text-[15px] font-semibold leading-snug px-1 tracking-tight line-clamp-2 break-words transition-all",
                            task.completed && hasApproval ? 'line-through opacity-30 grayscale' : 'text-slate-700'
                        )}>
                            {task.title}
                        </h3>
                        <div className="flex flex-wrap gap-2 mt-1">
                            {task.isRepeating && (
                                <span className="text-[9px] uppercase tracking-[0.05em] label-mono bg-blue-100/40 text-blue-600 px-1.5 py-0.5 rounded-md flex items-center gap-1 border border-blue-200/30">
                                    <RotateCcw className="w-2.5 h-2.5" />
                                    {t('tasks.dailyLoop')}
                                </span>
                            )}
                            {task.plannedTime && (
                                <span className="text-[9px] font-bold label-mono text-slate-400 flex items-center gap-1.5 px-1 uppercase tracking-wider leading-none">
                                    <Calendar className="w-2.5 h-2.5 opacity-50" />
                                    {new Date(task.plannedTime).toLocaleDateString(undefined, {
                                        month: 'short',
                                        day: 'numeric',
                                        timeZone: systemTimezone
                                    })}
                                </span>
                            )}
                            {isAssignIGave && task.assigneeNickname && (
                                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-50/50 text-emerald-600 border border-emerald-100/50">
                                    <span className="text-[9px] font-black label-mono uppercase tracking-wider opacity-60">
                                        {t('tasks.status.assignTo', { name: '' }).replace('{name}', '').trim() as string}
                                    </span>
                                    {task.assigneeAvatar ? (
                                        <div className="w-3.5 h-3.5 rounded-full overflow-hidden border border-emerald-200/50">
                                            <Image src={task.assigneeAvatar} width={14} height={14} className="w-full h-full object-cover" alt={task.assigneeNickname || ''} />
                                        </div>
                                    ) : (
                                        <Users className="w-3 h-3" />
                                    )}
                                    <span className="text-[9px] font-black label-mono uppercase tracking-wider">
                                        {task.assigneeNickname}
                                    </span>
                                </div>
                            )}
                            {isAssignIReceived && task.assignerNickname && (
                                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-indigo-50/50 text-indigo-600 border border-indigo-100/50">
                                    <span className="text-[9px] font-black label-mono uppercase tracking-wider opacity-60">
                                        {t('tasks.status.assignedBy', { name: '' }).replace('{name}', '').trim() as string}
                                    </span>
                                    {task.assignerAvatar ? (
                                        <div className="w-3.5 h-3.5 rounded-full overflow-hidden border border-indigo-200/50">
                                            <Image src={task.assignerAvatar} width={14} height={14} className="w-full h-full object-cover" alt={task.assignerNickname || ''} />
                                        </div>
                                    ) : (
                                        <Users className="w-3 h-3" />
                                    )}
                                    <span className="text-[9px] font-black label-mono uppercase tracking-wider">
                                        {task.assignerNickname}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3 self-end md:self-center">
                    <div className="flex items-center gap-2">
                        {isAssignIGave && task.completed && task.confirmationStatus === 'PENDING' && (
                            <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                                <button
                                    onClick={(e) => { e.stopPropagation(); resetTask(task); }}
                                    disabled={isSubmitting}
                                    className="hardware-btn group"
                                >
                                    <div className="hardware-well h-10 px-3 rounded-xl flex items-center gap-2 bg-[#DADBD4] shadow-well active:translate-y-0.5">
                                        <div className="hardware-cap absolute inset-1 bg-white rounded-lg transition-all shadow-cap group-active:translate-y-0.5" />
                                        <RotateCcw className="w-3.5 h-3.5 text-slate-500 relative z-10" />
                                        <span className="label-mono text-[9px] font-black text-slate-500 relative z-10 uppercase tracking-widest">{t('tasks.button.restart')}</span>
                                    </div>
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); confirmReward(task); }}
                                    disabled={isSubmitting}
                                    className="hardware-btn group"
                                >
                                    <div className="hardware-well h-10 px-3 rounded-xl flex items-center gap-2 bg-[#DADBD4] shadow-well active:translate-y-0.5">
                                        <div className="hardware-cap absolute inset-1 bg-emerald-500 rounded-lg transition-all shadow-cap group-active:translate-y-0.5" />
                                        <CheckCheck className="w-3.5 h-3.5 text-white relative z-10" />
                                        <span className="label-mono text-[9px] font-black text-white relative z-10 uppercase tracking-widest">{t('tasks.button.confirmReward')}</span>
                                    </div>
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="hardware-well px-2 py-0.5 rounded-full bg-white/40 shadow-inner flex items-center gap-1 border border-white/40 shrink-0">
                        <Star className="w-3 h-3 text-amber-500/80 fill-amber-400/80" />
                        <span className="text-amber-700/80 text-[10px] md:text-xs">+{task.rewardStars}</span>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};



function TasksPageContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const assignToParam = searchParams.get('assignTo')
    const [tasks, setTasks] = useState<Task[]>([])
    const [loading, setLoading] = useState(true)
    const [showNewTaskModal, setShowNewTaskModal] = useState(false)
    const [activeTab, setActiveTab] = useState<'today' | 'tomorrow' | 'week' | 'planned' | 'assigned' | 'assigns'>('today')
    const [isAdmin, setIsAdmin] = useState(false)
    const [children, setChildren] = useState<Child[]>([])
    const [assignedChildId, setAssignedChildId] = useState<string | 'ALL'>('ALL')
    const [assignTo, setAssignTo] = useState<string[]>([]) // Changed to array
    const [currentUserId, setCurrentUserId] = useState<string>('')
    const [systemTimezone, setSystemTimezone] = useState('Asia/Shanghai')
    const { t } = useI18n()

    // Form
    const [editingTask, setEditingTask] = useState<Task | null>(null)
    const [title, setTitle] = useState('')
    const [rewardStars, setRewardStars] = useState(1)
    const [isRepeating, setIsRepeating] = useState(false)
    const [isMonthlyRepeating, setIsMonthlyRepeating] = useState(false)
    const [plannedDate, setPlannedDate] = useState<Date | null>(() => new Date())
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [modalMode, setModalMode] = useState<'PERSONAL' | 'ASSIGN'>('PERSONAL')

    useEffect(() => {
        fetchTasks()
        fetch('/api/stats')
            .then(res => res.json())
            .then(data => {
                if (data.userId) {
                    setCurrentUserId(data.userId)
                }
                if (data.timezone) setSystemTimezone(data.timezone)
                if (data.isAdmin) {
                    setIsAdmin(true)
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

    const deleteTask = async (task: Task) => {
        if (!confirm(t('common.confirmDelete')) || isSubmitting) return;
        setIsSubmitting(true)
        try {
            const baseUrl = task.isAssigned ? '/api/assigned-tasks' : '/api/tasks'
            const res = await fetch(`${baseUrl}/${task.id}`, { method: 'DELETE' })
            if (res.ok) {
                setTasks(tasks.filter(t => t.id !== task.id))
                setShowNewTaskModal(false)
                setEditingTask(null)
            }
        } catch (_error) {
            console.error('Failed to delete task:', _error)
        } finally {
            setIsSubmitting(false)
        }
    }

    const fetchTasks = async () => {
        try {
            const [pRes, aRes] = await Promise.all([
                fetch('/api/tasks'),
                fetch('/api/assigned-tasks')
            ])
            const [pData, aData] = await Promise.all([pRes.json(), aRes.json()])

            const personal = (Array.isArray(pData) ? pData : []).map((t: Task) => ({ ...t, isAssigned: false }));
            const assigned = (Array.isArray(aData) ? aData : []).map((t: Task) => ({ ...t, isAssigned: true }));

            const merged = [...personal, ...assigned].sort((a, b) => {
                const dateA = new Date(a.createdAt || 0).getTime();
                const dateB = new Date(b.createdAt || 0).getTime();
                return dateB - dateA; // Latest first
            });

            setTasks(merged)
        } catch (_err) {
            console.error(_err)
            setTasks([])
        } finally {
            setLoading(false)
        }
    }

    const toggleCompletion = async (task: Task) => {
        if (isSubmitting) return;
        const updatedTasks = tasks.map(t =>
            t.id === task.id ? { ...t, completed: !t.completed } : t
        )
        setTasks(updatedTasks)
        setIsSubmitting(true)

        try {
            const path = task.isAssigned ? `/api/assigned-tasks/${task.id}` : `/api/tasks/${task.id}`;
            await fetch(path, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ completed: !task.completed })
            })
            fetchTasks(); // Refresh to get final status/rewards
        } catch (_error) {
            console.error(_error)
            fetchTasks()
        } finally {
            setIsSubmitting(false)
        }
    }

    useEffect(() => {
        if (assignTo.length === 0 || (assignTo.length === 1 && assignTo[0] === currentUserId)) {
            setRewardStars(1)
        }
    }, [assignTo, currentUserId])

    const handleCreateTask = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!title || isSubmitting) return

        setIsSubmitting(true)
        try {
            let targets = assignTo.length === 0 ? [currentUserId] : assignTo;
            // Strict filter: Never allow self-assignment in ASSIGN mode
            if (modalMode === 'ASSIGN') {
                targets = targets.filter(id => id !== currentUserId);
            }
            if (targets.length === 0 && modalMode === 'ASSIGN') {
                throw new Error('Please select at least one assignee');
            }
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
                        rewardCoins: 0,
                        isRepeating,
                        isMonthlyRepeating,
                        plannedTime: plannedDate ? plannedDate.toISOString() : new Date().toISOString(),
                        assigneeId: isAssigned ? targetId : undefined
                    })
                })
                if (!res.ok) throw new Error('Failed to create task for ' + targetId);
            }

            setShowNewTaskModal(false)
            setEditingTask(null)
            setTitle('')
            setRewardStars(1)
            setIsRepeating(false)
            setIsMonthlyRepeating(false)
            fetchTasks()
        } catch (_err) {
            console.error(_err)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleEditTask = (task: Task) => {
        setEditingTask(task);
        setTitle(task.title);
        setRewardStars(task.rewardStars);
        setIsRepeating(task.isRepeating);
        setIsMonthlyRepeating(task.isMonthlyRepeating);
        setPlannedDate(task.plannedTime ? new Date(task.plannedTime) : new Date());
        setAssignTo(task.isAssigned ? (task.assigneeId ? [task.assigneeId] : []) : [currentUserId]);
        setModalMode(task.isAssigned ? 'ASSIGN' : 'PERSONAL');
        setShowNewTaskModal(true);
    };

    const confirmReward = async (task: Task) => {
        if (!task.isAssigned || isSubmitting) return;
        setIsSubmitting(true)
        try {
            const res = await fetch(`/api/assigned-tasks/${task.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'CONFIRM_REWARD' })
            })
            if (res.ok) fetchTasks()
        } catch (_error) {
            console.error(_error)
        } finally {
            setIsSubmitting(false)
        }
    }

    const resetTask = async (task: Task) => {
        if (isSubmitting) return;
        setIsSubmitting(true)
        const path = task.isAssigned ? `/api/assigned-tasks/${task.id}` : `/api/tasks/${task.id}`;
        try {
            const res = await fetch(path, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ completed: false })
            })
            if (res.ok) fetchTasks()
        } catch (_error) {
            console.error(_error)
        } finally {
            setIsSubmitting(false)
        }
    }


    return (
        <div className="min-h-dvh flex flex-col relative overflow-hidden bg-[#E2DFD2] app-bg-pattern text-slate-900">
            {/* Immersive Lighting Overlays */}
            <div className="absolute inset-0 pointer-events-none z-50 hud-vignette opacity-40 shadow-[inset_0_0_150px_rgba(0,0,0,0.1)]" />
            <div className="absolute inset-0 pointer-events-none z-50 bg-gradient-to-b from-black/[0.03] via-transparent to-black/[0.08]" />

            <div className="transition-opacity duration-300 opacity-100">
                <BausteinAdminNavbar 
                    onBack={() => router.push('/admin')}
                    actions={
                        <div className="flex items-center gap-2 md:gap-3">
                        {/* New Task Button (Blue) */}
                        <button
                            onClick={() => {
                                setEditingTask(null)
                                setTitle('')
                                setRewardStars(1)
                                setIsRepeating(false)
                                setIsMonthlyRepeating(false)
                                setPlannedDate(new Date())
                                setAssignTo([])
                                setModalMode('PERSONAL')
                                setShowNewTaskModal(true)
                            }}
                            className="hardware-btn group"
                            title={t('tasks.newTask')}
                        >
                            <div className="hardware-well h-10 md:h-12 px-3 md:px-5 rounded-xl flex items-center gap-2 bg-[#DADBD4] shadow-well active:translate-y-0.5 overflow-hidden relative border-b-2 border-slate-400/20">
                                <div className="hardware-cap absolute inset-1 md:inset-1.5 bg-blue-500 rounded-lg flex items-center justify-center transition-all shadow-cap group-hover:bg-blue-600 active:translate-y-0.5" />
                                <Plus className="w-4 h-4 md:w-5 md:h-5 text-white relative z-10" />
                                <span className="hidden md:inline label-mono text-[11px] font-black text-white uppercase tracking-widest relative z-10 drop-shadow-sm">
                                    {t('tasks.newTask')}
                                </span>
                            </div>
                        </button>

                        {/* Assign Task Button (Emerald Green) */}
                        {isAdmin && children.length > 0 && (
                            <button
                                onClick={() => {
                                    setEditingTask(null)
                                    setTitle('')
                                    setRewardStars(1)
                                    setIsRepeating(false)
                                    setIsMonthlyRepeating(false)
                                    setPlannedDate(new Date())
                                    if (assignedChildId !== 'ALL') {
                                        setAssignTo([assignedChildId])
                                    } else {
                                        setAssignTo(assignToParam ? [assignToParam] : [])
                                    }
                                    setModalMode('ASSIGN')
                                    setShowNewTaskModal(true)
                                }}
                                className="hardware-btn group"
                                title={t('parent.assignTask')}
                            >
                                <div className="hardware-well h-10 md:h-12 px-3 md:px-5 rounded-xl flex items-center gap-2 bg-[#DADBD4] shadow-well active:translate-y-0.5 overflow-hidden relative border-b-2 border-slate-400/20">
                                    <div className="hardware-cap absolute inset-1 md:inset-1.5 bg-emerald-500 rounded-lg flex items-center justify-center transition-all shadow-cap group-hover:bg-emerald-600 active:translate-y-0.5" />
                                    <Plus className="w-4 h-4 md:w-5 md:h-5 text-white relative z-10" />
                                    <span className="hidden md:inline label-mono text-[11px] font-black text-white uppercase tracking-widest relative z-10 drop-shadow-sm">
                                        {t('parent.assignTask')}
                                    </span>
                                </div>
                            </button>
                        )}
                    </div>
                }
            />
            </div>

            <main className="relative z-10 flex-1 w-full max-w-[1200px] mx-auto flex flex-col md:flex-row gap-6 md:gap-12 px-6 pt-6 pb-24 overflow-y-auto hide-scrollbar items-start md:justify-center">

                {/* Left Sidebar (Tabs) */}
                <aside className="w-full md:w-[180px] flex flex-col gap-4 md:sticky md:top-8 flex-shrink-0 z-20">
                    <div className="hardware-well p-1.5 md:p-3 bg-[#DADBD4]/60 shadow-well rounded-2xl md:rounded-3xl w-full border border-black/5 hide-scrollbar relative">
                        {/* Time-based Filters */}
                        <div className="flex md:flex-col gap-1.5 md:gap-3 mb-1.5 md:mb-3">
                            {[
                                { id: 'today', icon: Sun, label: t('tasks.today'), color: 'bg-orange-500' },
                                { id: 'tomorrow', icon: Sunrise, label: t('tasks.tomorrow'), color: 'bg-amber-500' },
                                { id: 'week', icon: CalendarDays, label: t('tasks.week'), color: 'bg-indigo-500' },
                                { id: 'planned', icon: Calendar, label: t('tasks.planned'), color: 'bg-blue-500' }
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as 'today' | 'tomorrow' | 'week' | 'planned' | 'assigned' | 'assigns')}
                                    className="hardware-btn group flex-1 md:w-full"
                                >
                                    <div className={clsx(
                                        "hardware-well min-h-[44px] md:h-12 px-3 md:px-4 rounded-xl md:rounded-2xl transition-all duration-300 relative overflow-hidden flex items-center justify-center md:justify-start gap-2.5",
                                        activeTab === tab.id ? "bg-[#DADBD4] shadow-inner" : "bg-[#F2F1EA] shadow-well active:translate-y-0.5"
                                    )}>
                                        <div className={clsx(
                                            "hardware-cap absolute inset-0.5 rounded-lg md:rounded-xl shadow-cap transition-all group-hover:opacity-90 active:translate-y-0",
                                            activeTab === tab.id ? tab.color : "bg-white group-hover:bg-slate-50"
                                        )} />
                                        
                                        <tab.icon className={clsx(
                                            "w-4 h-4 relative z-10 transition-transform",
                                            activeTab === tab.id ? "text-white scale-110" : "text-slate-500"
                                        )} />
                                        <span className={clsx(
                                            "hidden md:inline label-mono text-[10px] font-black uppercase tracking-widest relative z-10",
                                            activeTab === tab.id ? "text-white" : "text-slate-500"
                                        )}>
                                            {tab.label}
                                        </span>
                                    </div>
                                </button>
                            ))}
                        </div>

                        {/* Status Tabs + Assign */}
                        <div className="flex md:flex-col gap-2 md:gap-3">
                            <button
                                onClick={() => setActiveTab('assigned')}
                                className="hardware-btn group flex-1 md:w-full"
                            >
                                <div className={clsx(
                                    "hardware-well min-h-[44px] md:h-12 px-3 md:px-4 rounded-xl md:rounded-2xl transition-all duration-300 relative overflow-hidden flex items-center justify-center md:justify-start gap-2.5",
                                    activeTab === 'assigned' ? "bg-[#DADBD4] shadow-inner" : "bg-[#F2F1EA] shadow-well active:translate-y-0.5"
                                )}>
                                    <div className={clsx(
                                        "hardware-cap absolute inset-0.5 rounded-lg md:rounded-xl shadow-cap transition-all group-hover:opacity-90 active:translate-y-0",
                                        activeTab === 'assigned' ? "bg-gradient-to-r from-blue-500 to-indigo-500" : "bg-white group-hover:bg-slate-50"
                                    )} />
                                    <CheckSquare className={clsx(
                                        "w-4 h-4 relative z-10 transition-transform",
                                        activeTab === 'assigned' ? "text-white scale-110" : "text-slate-500"
                                    )} />
                                    <span className={clsx(
                                        "hidden md:inline label-mono text-[10px] font-black uppercase tracking-widest relative z-10",
                                        activeTab === 'assigned' ? "text-white" : "text-slate-500"
                                    )}>
                                        {t('tasks.assigned')}
                                    </span>
                                </div>
                            </button>

                            <button
                                onClick={() => setActiveTab('assigns')}
                                className="hardware-btn group flex-1 md:w-full"
                            >
                                <div className={clsx(
                                    "hardware-well min-h-[44px] md:h-12 px-3 md:px-4 rounded-xl md:rounded-2xl transition-all duration-300 relative overflow-hidden flex items-center justify-center md:justify-start gap-2.5",
                                    activeTab === 'assigns' ? "bg-[#DADBD4] shadow-inner" : "bg-[#F2F1EA] shadow-well active:translate-y-0.5"
                                )}>
                                    <div className={clsx(
                                        "hardware-cap absolute inset-0.5 rounded-lg md:rounded-xl shadow-cap transition-all group-hover:opacity-90 active:translate-y-0",
                                        activeTab === 'assigns' ? "bg-gradient-to-r from-emerald-500 to-teal-500" : "bg-white group-hover:bg-slate-50"
                                    )} />
                                    <Users className={clsx(
                                        "w-4 h-4 relative z-10 transition-transform",
                                        activeTab === 'assigns' ? "text-white scale-110" : "text-slate-500"
                                    )} />
                                    <span className={clsx(
                                        "hidden md:inline label-mono text-[10px] font-black uppercase tracking-widest relative z-10",
                                        activeTab === 'assigns' ? "text-white" : "text-slate-500"
                                    )}>
                                        {t('tasks.assigns')}
                                    </span>
                                </div>
                            </button>

                            {activeTab === 'assigns' && isAdmin && children.length > 0 && (
                                <div className="hidden md:flex flex-col gap-1 w-full mt-1.5 pl-1 pr-1 border-t-2 border-black/5 pt-2 animate-in slide-in-from-top-2">
                                    <button
                                        onClick={() => setAssignedChildId('ALL')}
                                        className="hardware-btn group w-full mb-1"
                                    >
                                        <div className={clsx(
                                            "hardware-well py-1.5 px-3 rounded-lg text-left transition-all duration-200",
                                            assignedChildId === 'ALL' ? "bg-blue-50/50" : "bg-transparent active:translate-y-0.5"
                                        )}>
                                            <span className={clsx(
                                                "label-mono text-[9px] font-black uppercase tracking-wider transition-colors",
                                                assignedChildId === 'ALL' ? "text-blue-600" : "text-slate-500 group-hover:text-slate-700"
                                            )}>
                                                {t('tasks.allChildren')}
                                            </span>
                                        </div>
                                    </button>
                                    {children.map(child => (
                                        <button
                                            key={child.id}
                                            onClick={() => setAssignedChildId(child.id)}
                                            className="hardware-btn group w-full mb-1"
                                        >
                                            <div className={clsx(
                                                "hardware-well py-1.5 px-3 rounded-lg transition-all duration-200 flex items-center gap-2",
                                                assignedChildId === child.id ? "bg-blue-50/50" : "bg-transparent active:translate-y-0.5"
                                            )}>
                                                {child.avatarUrl && (
                                                    <div className="w-4 h-4 rounded-full overflow-hidden border border-white shrink-0 relative z-10 shadow-sm">
                                                        <Image src={child.avatarUrl} width={16} height={16} className="w-full h-full object-cover" alt={child.nickname || child.name} />
                                                    </div>
                                                )}
                                                <span className={clsx(
                                                    "label-mono text-[9px] font-black uppercase tracking-wider truncate transition-colors",
                                                    assignedChildId === child.id ? "text-blue-600" : "text-slate-500 group-hover:text-slate-700"
                                                )}>
                                                    {child.nickname || child.name}
                                                </span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </aside>

                {/* Right Content */}
                <div className="flex-1 w-full max-w-2xl">
                    {loading ? (
                        <div className="flex justify-center items-center h-48">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-slate-400"></div>
                        </div>
                    ) : (tasks.length === 0 || tasks.filter(task => {
                        const isAssignIReceived = task.isAssigned && task.assigneeId === currentUserId;
                        const isMyOwnTask = !task.isAssigned;
                        if (activeTab === 'assigns') return task.isAssigned && task.assignerId === currentUserId;
                        if (activeTab === 'assigned') return isAssignIReceived;
                        return isMyOwnTask || isAssignIReceived;
                    }).length === 0) ? (
                        <div className="flex flex-col items-center justify-center h-48 text-slate-500">
                            <CircleAlert className="w-16 h-16 mb-4 opacity-50" />
                            <p className="text-xl font-bold">{t('tasks.noTasks')}</p>
                            <p className="text-sm">{t('tasks.noTasksSub')}</p>
                        </div>
                    ) : (
                        <div className="flex gap-4 flex-col pb-24">
                            {tasks.filter(task => {
                                const isAssignIGave = task.isAssigned && task.assignerId === currentUserId;
                                const isAssignIReceived = task.isAssigned && task.assigneeId === currentUserId;
                                const isMyOwnTask = !task.isAssigned;

                                if (activeTab === 'assigns') {
                                    if (!isAssignIGave) return false;
                                    if (assignedChildId !== 'ALL') return task.assigneeId === assignedChildId;
                                    return true;
                                }

                                if (activeTab === 'assigned') {
                                    return isAssignIReceived;
                                }

                                // In other tabs, we show personal tasks AND tasks assigned TO me
                                if (!isMyOwnTask && !isAssignIReceived) return false;

                                // Frequency filters for repeating tasks can be handled here or just show them in time categories
                                if (activeTab === 'planned') return !!task.plannedTime;

                                const pt = task.plannedTime ? getStartOfDayInTimezone(systemTimezone, 0, new Date(task.plannedTime)) : getStartOfDayInTimezone(systemTimezone);
                                const today = getStartOfDayInTimezone(systemTimezone);
                                const tomorrow = getStartOfDayInTimezone(systemTimezone, 1);
                                const weekEnd = getStartOfDayInTimezone(systemTimezone, 7);

                                if (activeTab === 'today') return pt.getTime() === today.getTime();
                                if (activeTab === 'tomorrow') return pt.getTime() === tomorrow.getTime();
                                if (activeTab === 'week') return pt >= today && pt <= weekEnd;

                                return false;
                            }).sort((a, b) => {
                                // Sort by completion status first: false (uncompleted) comes before true (completed)
                                if (a.completed !== b.completed) {
                                    return a.completed ? 1 : -1;
                                }
                                // Secondary sort by creation time (latest first) to maintain chronological order
                                return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
                            }).map((task, idx) => (
                                <TaskItem 
                                    key={task.id}
                                    task={task}
                                    index={idx}
                                    handleEditTask={handleEditTask}
                                    toggleCompletion={toggleCompletion}
                                    resetTask={resetTask}
                                    confirmReward={confirmReward}
                                    currentUserId={currentUserId}
                                    t={t}
                                    systemTimezone={systemTimezone}
                                    isSubmitting={isSubmitting}
                                />
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
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="w-full max-w-xl baustein-panel shadow-2xl relative overflow-hidden bg-[#E6E2D1] border-4 border-white/20"
                        >
                            {/* Panel Texture & Screws */}
                            <div className="absolute top-3 left-3 w-2 h-2 rounded-full bg-slate-900/10 shadow-inner" />
                            <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-slate-900/10 shadow-inner" />
                            <div className="absolute bottom-3 left-3 w-2 h-2 rounded-full bg-slate-900/10 shadow-inner" />
                            <div className="absolute bottom-3 right-3 w-2 h-2 rounded-full bg-slate-900/10 shadow-inner" />

                            <div className="p-5 md:p-7 flex flex-col">
                                <div className="flex justify-between items-center mb-5 border-b-2 border-black/5 pb-4">
                                    <h3 className="text-xl md:text-2xl font-black text-slate-900 tracking-tighter uppercase flex items-center gap-3">
                                        {editingTask ? (
                                            <>
                                                <div className="hardware-well w-9 h-9 rounded-xl bg-[#DADBD4] shadow-well relative overflow-hidden">
                                                    <div className="hardware-cap absolute inset-1 bg-blue-500 rounded-lg flex items-center justify-center">
                                                        <Edit2 className="w-4 h-4 text-white" />
                                                    </div>
                                                </div>
                                                {t('tasks.editTask')}
                                            </>
                                        ) : modalMode === 'PERSONAL' ? (
                                            <>
                                                <div className="hardware-well w-9 h-9 rounded-xl bg-[#DADBD4] shadow-well relative overflow-hidden">
                                                    <div className="hardware-cap absolute inset-1 bg-blue-500 rounded-lg flex items-center justify-center">
                                                        <ListTodo className="w-4 h-4 text-white" />
                                                    </div>
                                                </div>
                                                {t('tasks.newTask')}
                                            </>
                                        ) : (
                                            <>
                                                <div className="hardware-well w-9 h-9 rounded-xl bg-[#DADBD4] shadow-well relative overflow-hidden">
                                                    <div className="hardware-cap absolute inset-1 bg-emerald-500 rounded-lg flex items-center justify-center">
                                                        <Users className="w-4 h-4 text-white" />
                                                    </div>
                                                </div>
                                                {t('parent.assignTask')}
                                            </>
                                        )}
                                    </h3>
                                    <div className="flex items-center gap-3">
                                        <button 
                                            type="button" 
                                            onClick={() => setShowNewTaskModal(false)} 
                                            className="hardware-btn group"
                                        >
                                            <div className="hardware-well w-10 h-10 rounded-xl bg-[#DADBD4] shadow-well active:translate-y-0.5 flex items-center justify-center relative overflow-hidden">
                                                <div className="hardware-cap absolute inset-1 bg-white rounded-lg flex items-center justify-center transition-all group-hover:bg-slate-50 active:translate-y-0.5">
                                                    <XIcon className="w-5 h-5 text-slate-400" />
                                                </div>
                                            </div>
                                        </button>
                                    </div>
                                </div>

                                <form onSubmit={handleCreateTask} className="flex flex-col">
                                    <div className="space-y-4 pr-1">
                                        {/* Task Name Input */}
                                        <div className="space-y-2">
                                            <label className="label-mono text-[10px] uppercase tracking-widest text-slate-500 ml-1">{t('tasks.form.nameLabel')}</label>
                                            <div className="hardware-well rounded-2xl bg-[#DADBD4]/40 shadow-well border border-black/5 p-1.5 focus-within:ring-2 focus-within:ring-blue-400/30 transition-all">
                                                <input
                                                    type="text"
                                                    value={title}
                                                    onChange={e => setTitle(e.target.value)}
                                                    className="w-full bg-white rounded-xl p-3 md:p-4 font-black text-slate-800 text-lg md:text-xl outline-none shadow-cap placeholder:text-slate-300"
                                                    placeholder={t('tasks.form.namePlaceholder')}
                                                    required
                                                />
                                            </div>
                                        </div>

                                        {/* Assign To Selection */}
                                        {isAdmin && children.length > 0 && !editingTask && modalMode === 'ASSIGN' && (
                                            <div className="space-y-3">
                                                <div className="flex justify-between items-center px-1">
                                                    <label className="label-mono text-[10px] uppercase tracking-widest text-slate-500">{t('tasks.form.assignTo')}</label>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const assignableChildren = children.filter(c => c.id !== currentUserId);
                                                            if (assignTo.length === assignableChildren.length) setAssignTo([]);
                                                            else setAssignTo(assignableChildren.map(c => c.id));
                                                        }}
                                                        className="label-mono text-[9px] uppercase tracking-widest text-emerald-600 hover:text-emerald-500 font-black"
                                                    >
                                                        {assignTo.length === (children.length - 1) ? t('tasks.form.deselectAll') : t('tasks.form.selectAll')}
                                                    </button>
                                                </div>
                                                <div className="flex flex-nowrap overflow-x-auto hide-scrollbar gap-4 py-2 px-1 -mx-1">
                                                    {children.filter(c => c.id !== currentUserId).map(c => {
                                                        const isSelected = assignTo.includes(c.id);
                                                        return (
                                                            <button
                                                                key={c.id}
                                                                type="button"
                                                                onClick={() => {
                                                                    if (isSelected) setAssignTo(assignTo.filter(id => id !== c.id));
                                                                    else setAssignTo([...assignTo, c.id]);
                                                                }}
                                                                className="hardware-btn group shrink-0"
                                                            >
                                                                <div className={clsx(
                                                                    "hardware-well min-w-[100px] h-[72px] rounded-xl shadow-well relative overflow-hidden transition-all active:translate-y-0.5",
                                                                    isSelected ? "bg-emerald-900/10" : "bg-[#DADBD4]/60"
                                                                )}>
                                                                    <div className={clsx(
                                                                        "hardware-cap absolute inset-1.5 rounded-lg shadow-cap transition-all flex flex-col items-center justify-center gap-1.5 px-3",
                                                                        isSelected ? "bg-emerald-500" : "bg-white group-hover:bg-slate-50"
                                                                    )}>
                                                                        <div className={clsx(
                                                                            "w-8 h-8 rounded-full overflow-hidden border-2 relative z-10 shadow-sm",
                                                                            isSelected ? "border-emerald-300" : "border-[#F1F2E9]"
                                                                        )}>
                                                                            {c.avatarUrl ? (
                                                                                <Image src={c.avatarUrl} width={32} height={32} alt={c.name} className="w-full h-full object-cover" />
                                                                            ) : (
                                                                                <div className="w-full h-full flex items-center justify-center bg-slate-100 text-[10px] font-black text-slate-400">
                                                                                    {c.name[0]}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                        <span className={clsx(
                                                                            "text-[9px] label-mono font-black uppercase tracking-widest relative z-10 truncate w-full text-center",
                                                                            isSelected ? "text-white" : "text-slate-500"
                                                                        )}>
                                                                            {c.nickname || c.name}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {/* Left Column: Date & Rewards */}
                                            <div className="flex flex-col gap-4">
                                                {/* Date Picker Section */}
                                                <div className="space-y-2">
                                                    <label className="label-mono text-[10px] uppercase tracking-widest text-slate-500 ml-1">{t('tasks.form.plannedDate')}</label>
                                                    <div className="hardware-well p-1.5 rounded-xl bg-[#DADBD4]/30 shadow-well border border-black/5">
                                                        <SmartDatePicker
                                                            selected={plannedDate || undefined}
                                                            onSelect={(date) => setPlannedDate(date)}
                                                            minDate={new Date()}
                                                            placeholder={t('tasks.form.selectDate')}
                                                            triggerClassName="w-full bg-white rounded-lg p-3 md:p-3.5 font-bold text-slate-800 shadow-cap border border-black/5"
                                                        />
                                                    </div>
                                                </div>

                                                {/* Rewards Selection - Only visible for ASSIGN mode */}
                                                {modalMode === 'ASSIGN' && (
                                                    <div className="space-y-2">
                                                        <label className="label-mono text-[10px] uppercase tracking-widest text-slate-500 ml-1">{t('tasks.form.rewardLabel')}</label>
                                                        <div className="hardware-well p-3.5 rounded-xl bg-amber-50/20 shadow-well border border-amber-200/30 flex items-center justify-between">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center shadow-inner border border-amber-200">
                                                                    <Star className="w-5 h-5 text-amber-500 fill-amber-400" />
                                                                </div>
                                                                <span className="text-xl font-black text-amber-700 font-mono">+{rewardStars}</span>
                                                            </div>
                                                            <div className="flex gap-2">
                                                                <button 
                                                                    type="button" 
                                                                    onClick={() => setRewardStars(Math.max(1, rewardStars - 1))}
                                                                    className="hardware-btn group"
                                                                >
                                                                    <div className="hardware-well w-9 h-9 rounded-lg bg-white shadow-well active:translate-y-0.5 flex items-center justify-center text-lg font-black text-slate-400 transition-colors hover:text-slate-600">-</div>
                                                                </button>
                                                                <button 
                                                                    type="button" 
                                                                    onClick={() => setRewardStars(rewardStars + 1)}
                                                                    className="hardware-btn group"
                                                                >
                                                                    <div className="hardware-well w-9 h-9 rounded-lg bg-white shadow-well active:translate-y-0.5 flex items-center justify-center text-lg font-black text-slate-400 transition-colors hover:text-slate-600">+</div>
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Right Column: Loop System Management */}
                                            <div className="flex flex-col">
                                                <label className="label-mono text-[10px] uppercase tracking-widest text-slate-500 ml-1 mb-2">SYSTEM_LOOPS</label>
                                                <div className="hardware-well p-5 rounded-xl bg-[#DADBD4]/30 shadow-well border border-black/5 flex flex-col justify-center gap-5 grow">
                                                    <label className="flex items-center gap-4 cursor-pointer group">
                                                        <div className="relative w-6 h-6 flex items-center justify-center">
                                                            <input
                                                                type="checkbox"
                                                                checked={isRepeating}
                                                                onChange={(e) => {
                                                                    setIsRepeating(e.target.checked);
                                                                    if (e.target.checked) setIsMonthlyRepeating(false);
                                                                }}
                                                                className="peer sr-only"
                                                            />
                                                            <div className="w-6 h-6 rounded bg-white shadow-well peer-checked:bg-blue-500 transition-colors" />
                                                            <Check className="w-4 h-4 text-white absolute transition-transform scale-0 peer-checked:scale-100" />
                                                        </div>
                                                        <span className="label-mono text-sm text-slate-600 font-black uppercase tracking-widest grow">{t('tasks.form.recurringLabel')}</span>
                                                    </label>
                                                    
                                                    <label className="flex items-center gap-4 cursor-pointer group">
                                                        <div className="relative w-6 h-6 flex items-center justify-center">
                                                            <input
                                                                type="checkbox"
                                                                checked={isMonthlyRepeating}
                                                                onChange={(e) => {
                                                                    setIsMonthlyRepeating(e.target.checked);
                                                                    if (e.target.checked) setIsRepeating(false);
                                                                }}
                                                                className="peer sr-only"
                                                            />
                                                            <div className="w-6 h-6 rounded bg-white shadow-well peer-checked:bg-purple-500 transition-colors" />
                                                            <Check className="w-4 h-4 text-white absolute transition-transform scale-0 peer-checked:scale-100" />
                                                        </div>
                                                        <span className="label-mono text-sm text-slate-600 font-black uppercase tracking-widest grow">{t('tasks.form.monthlyRecurringLabel')}</span>
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons Console */}
                                    <div className="mt-6 mb-2 flex flex-col sm:flex-row gap-4 px-1">
                                        {editingTask && (
                                            <button
                                                type="button"
                                                onClick={() => deleteTask(editingTask)}
                                                disabled={isSubmitting}
                                                className="hardware-btn group flex-1"
                                            >
                                                <div className="hardware-well h-14 rounded-xl bg-[#DADBD4] shadow-well active:translate-y-0.5 overflow-hidden relative border-b-2 border-slate-400/20">
                                                    <div className="hardware-cap absolute inset-1.5 rounded-lg bg-rose-500 flex items-center justify-center gap-3 transition-all shadow-cap group-hover:brightness-110 active:translate-y-0.5">
                                                        <Trash2 className="w-5 h-5 !text-white" />
                                                        <span className="label-mono text-base font-black uppercase tracking-[0.1em] !text-white drop-shadow-sm">
                                                            {t('common.delete')}
                                                        </span>
                                                    </div>
                                                </div>
                                            </button>
                                        )}
                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className={clsx(
                                                "hardware-btn group",
                                                editingTask ? "flex-[1.5]" : "w-full"
                                            )}
                                        >
                                            <div className="hardware-well h-14 md:h-16 rounded-xl bg-[#DADBD4] shadow-well active:translate-y-0.5 overflow-hidden relative border-b-2 border-slate-400/20">
                                                <div className={clsx(
                                                    "hardware-cap absolute inset-1.5 rounded-lg flex items-center justify-center gap-3 transition-all shadow-cap group-hover:opacity-90 active:translate-y-0.5",
                                                    isSubmitting ? "bg-slate-400" : (assignTo.length === 0 ? "bg-blue-500" : "bg-emerald-500")
                                                )}>
                                                    {isSubmitting ? (
                                                        <Loader2 className="w-6 h-6 animate-spin !text-white" />
                                                    ) : (
                                                        <>
                                                            <CheckCheck className="w-6 h-6 !text-white" />
                                                            <span className="label-mono text-base font-black uppercase tracking-[0.2em] !text-white drop-shadow-sm">
                                                                {editingTask ? t('common.save') : t('common.create')}
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
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
    const { t } = useI18n()
    return (
        <Suspense fallback={<div className="min-h-dvh flex items-center justify-center bg-[#e0f2fe]">{t('common.loading')}</div>}>
            <TasksPageContent />
        </Suspense>
    )
}
