'use client'

import React, { useEffect, useState } from 'react'
import { 
    Users, UserCheck, Plus, Trash2, Archive, History, 
    X, Camera, Shield, AlertTriangle,
    Star, Edit2, Save, Zap,
    Fingerprint,
    Clock,
    ExternalLink,
    Coins,
    ChevronDown,
    Key,
    Dices
} from 'lucide-react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { useI18n } from '@/contexts/I18nContext'
import { getZodiac, getChineseZodiac } from '@/lib/utils'
import SmartDatePicker from '@/components/SmartDatePicker'

interface Child {
    id: string
    name: string
    realName?: string
    nickname?: string
    gender?: 'MALE' | 'FEMALE' | 'OTHER'
    birthDate?: Date | string
    zodiac?: string
    chineseZodiac?: string
    avatarUrl: string | null
    role: 'PARENT' | 'CHILD' | 'GRANDPARENT' | 'OTHER'
    slug?: string
    exhibitionEnabled?: boolean
    isArchived: boolean
    isDeleted: boolean
    pin?: string
    stats?: {
        goldStars: number
        purpleStars: number
        angerPenalties: number
        currency: number
    }
    permissionRole?: 'SUPERADMIN' | 'ADMIN' | 'USER'
    isLocked?: boolean
}

interface BalanceLog {
    id: string
    amount: number
    type: string
    reason: string
    balance: number
    createdAt: string
}

export default function ChildManagement({ _onAssignTask, currentUser, forceShowAdd, onSetShowAdd, forceShowArchived }: { 
    _onAssignTask?: (id: string) => void,
    currentUser: { id: string; permissionRole: string },
    forceShowAdd?: boolean,
    onSetShowAdd?: (val: boolean) => void,
    forceShowArchived?: boolean
}) {
    const { t } = useI18n()
    const [children, setChildren] = useState<Child[]>([])
    const [loading, setLoading] = useState(true)
    const [showAddInternal, setShowAddInternal] = useState(false)
    const showAdd = forceShowAdd !== undefined ? forceShowAdd : showAddInternal
    const setShowAdd = onSetShowAdd || setShowAddInternal

    const [editingChild, setEditingChild] = useState<Partial<Child> | null>(null)
    const [newChild, setNewChild] = useState<Partial<Child>>({ name: '', nickname: '', slug: '', gender: 'OTHER', role: 'CHILD' })
    const [showLogs, setShowLogs] = useState<string | null>(null)
    const [logs, setLogs] = useState<BalanceLog[]>([])
    const [adjusting, setAdjusting] = useState<string | null>(null)
    const [adjData, setAdjData] = useState({ currency: 0, goldStars: 0, reason: '' })
    const [showArchivedInternal, _setShowArchivedInternal] = useState(false)
    const showArchived = forceShowArchived !== undefined ? forceShowArchived : showArchivedInternal
    const [confirmModal, setConfirmModal] = useState<{ type: 'delete' | 'archive', childId: string } | null>(null)
    const [processing, setProcessing] = useState(false)
    const [nicknameTouched, setNicknameTouched] = useState(false)
    const [editNicknameTouched, setEditNicknameTouched] = useState(false)
    const [resettingPin, setResettingPin] = useState<{ childId: string; pin: string } | null>(null)
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ message, type })
        setTimeout(() => setToast(null), 3000)
    }

    const fetchData = async () => {
        try {
            const res = await fetch('/api/parent/children')
            if (res.ok) {
                const data = await res.json()
                if (Array.isArray(data)) {
                    setChildren(data)
                }
            } else if (res.status === 401) {
                console.warn('Unauthorized access to children data')
            }
        } catch (_err) {
            console.error('Failed to fetch children:', _err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    const handleSave = async (data: Partial<Child>) => {
        if (!data.name || processing) return
        if (data.slug && data.slug.length < 6) {
            alert('Link ID must be at least 6 characters');
            return;
        }
        setProcessing(true)
        try {
            const method = data.id ? 'PATCH' : 'POST'
            const res = await fetch('/api/parent/children', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            })
            if (res.ok) {
                setNewChild({ name: '', nickname: '', slug: '', gender: 'OTHER', role: 'CHILD' })
                setEditingChild(null)
                setShowAdd(false)
                setNicknameTouched(false)
                setEditNicknameTouched(false)
                showToast(data.id ? t('common.updateSuccess') : t('common.createSuccess'))
                fetchData() 
            } else {
                showToast(t('common.error'), 'error')
            }
        } catch (_error) { 
            console.error(_error)
            showToast('Network Error', 'error')
        } finally { setProcessing(false) }
    }

    const handleMasquerade = async (userId: string) => {
        if (processing) return
        setProcessing(true)
        try {
            const res = await fetch('/api/parent/masquerade', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ targetUserId: userId })
            })
            if (res.ok) {
                const data = await res.json()
                window.location.href = data.redirect || '/admin'
            }
        } catch (_error) { console.error(_error) } finally { setProcessing(false) }
    }

    const handleAvatarUpload = async (id: string, file: File) => {
        if (processing) return
        setProcessing(true)
        const formData = new FormData()
        formData.append('file', file)
        formData.append('userId', id)
        try {
            const res = await fetch('/api/upload/avatar', {
                method: 'POST',
                body: formData
            })
            const data = await res.json()
            if (res.ok) {
                await fetch('/api/parent/children', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id, avatarUrl: data.avatarUrl })
                })
                fetchData()
            }
        } catch (_error) { console.error(_error) } finally { setProcessing(false) }
    }

    const handleAdjust = async () => {
        if (!adjusting || processing) return
        setProcessing(true)
        try {
            const promises = []
            if (adjData.currency !== 0) {
                promises.push(fetch('/api/parent/economy/distribute', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        targetUserId: adjusting,
                        type: 'CURRENCY',
                        amount: adjData.currency,
                        reason: adjData.reason
                    })
                }))
            }
            if (adjData.goldStars !== 0) {
                promises.push(fetch('/api/parent/economy/distribute', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        targetUserId: adjusting,
                        type: 'GOLD_STAR',
                        amount: adjData.goldStars,
                        reason: adjData.reason
                    })
                }))
            }
            
            if (promises.length > 0) {
                await Promise.all(promises)
                showToast(t('common.updateSuccess'))
                setAdjusting(null)
                setAdjData({ currency: 0, goldStars: 0, reason: '' })
                fetchData()
            } else {
                setAdjusting(null)
            }
        } catch (_error) { 
            console.error(_error)
            showToast(t('common.error'), 'error')
        } finally { setProcessing(false) }
    }

    const fetchLogs = async (userId: string) => {
        if (processing) return
        setProcessing(true)
        try {
            const res = await fetch(`/api/parent/logs?userId=${userId}`)
            const data = await res.json()
            setLogs(data)
            setShowLogs(userId)
        } catch (_error) { console.error(_error) } finally { setProcessing(false) }
    }

    const handleArchive = async (id: string) => {
        if (processing) return
        setProcessing(true)
        try {
            await fetch('/api/parent/children', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, isArchived: true })
            })
            setConfirmModal(null)
            fetchData()
        } catch (_error) { console.error(_error) } finally { setProcessing(false) }
    }

    const handleDelete = async (id: string) => {
        const item = children.find(c => c.id === id)
        if (item?.isLocked) {
            alert('This account is locked and cannot be deleted.')
            setConfirmModal(null)
            return
        }
        if (processing) return
        setProcessing(true)
        try {
            await fetch('/api/parent/children', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            })
            setConfirmModal(null)
            fetchData()
        } catch (_error) { console.error(_error) } finally { setProcessing(false) }
    }

    if (loading) return <div className="p-12 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">{t('common.loading')}</div>
    
    const activeChildren = Array.isArray(children) ? children.filter(c => !c.isDeleted && !c.isArchived) : []

    const renderMemberForm = (member: Partial<Child>, onChange: (val: Partial<Child>) => void) => {
        return (
            <div className="space-y-4 py-1">
                {/* Row 1: Identity Profile (Deep Well Architecture) */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="label-mono text-[10px] opacity-60 ml-1 font-bold">{t('parent.realName')}</label>
                        <div className="hardware-well rounded-xl p-1.5 bg-[#D1CDBC]">
                            <input
                                className="w-full h-10 bg-white/95 px-3 rounded-lg border-2 border-transparent focus:border-indigo-500 outline-none font-black text-slate-800 text-[11px] shadow-inner transition-all uppercase placeholder:opacity-30"
                                placeholder="..."
                                value={(member.id ? member.realName : member.name) || ''}
                                onChange={e => {
                                    const val = e.target.value;
                                    const touched = !!member.id ? editNicknameTouched : nicknameTouched;
                                    const updates: Partial<Child> = member.id 
                                        ? { name: val, realName: val } 
                                        : { name: val };
                                    
                                    if (!touched) updates.nickname = val;
                                    onChange({ ...member, ...updates });
                                }}
                                required
                            />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="label-mono text-[10px] opacity-60 ml-1 font-bold">{t('parent.nickname')}</label>
                        <div className="hardware-well rounded-xl p-1.5 bg-[#D1CDBC]">
                            <input
                                className="w-full h-10 bg-white/95 px-3 rounded-lg border-2 border-transparent focus:border-indigo-500 outline-none font-black text-slate-800 text-[11px] shadow-inner transition-all uppercase placeholder:opacity-30"
                                placeholder="..."
                                value={member.nickname || ''}
                                onChange={e => {
                                    onChange({ ...member, nickname: e.target.value });
                                    if (member.id) setEditNicknameTouched(true);
                                    else setNicknameTouched(true);
                                }}
                                required
                            />
                        </div>
                    </div>
                </div>

                {/* Row 2: Biological & System Role (Tactile Selectors) */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="label-mono text-[10px] opacity-60 ml-1 font-bold">{t('parent.role')}</label>
                        <div className="hardware-well rounded-xl p-1.5 bg-[#D1CDBC] relative group/select">
                            <select
                                className="w-full h-10 bg-white/95 px-3 rounded-lg border-none outline-none font-black text-slate-800 text-[11px] shadow-inner appearance-none cursor-pointer pr-10"
                                value={member.role || 'CHILD'}
                                onChange={e => onChange({ ...member, role: e.target.value as Child['role'] })}
                            >
                                <option value="CHILD">CHILD</option>
                                <option value="PARENT">PARENT</option>
                                <option value="GRANDPARENT">GRANDPARENT</option>
                                <option value="OTHER">OTHER</option>
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-40 group-hover/select:opacity-100 transition-opacity">
                                <ChevronDown className="w-4 h-4 text-indigo-600" />
                            </div>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="label-mono text-[10px] opacity-60 ml-1 font-bold">{t('parent.gender')}</label>
                        <div className="hardware-well rounded-xl p-1.5 bg-[#D1CDBC] relative group/select">
                            <select
                                className="w-full h-10 bg-white/95 px-3 rounded-lg border-none outline-none font-black text-slate-800 text-[11px] shadow-inner appearance-none cursor-pointer pr-10"
                                value={member.gender || 'OTHER'}
                                onChange={e => onChange({ ...member, gender: e.target.value as Child['gender'] })}
                            >
                                <option value="MALE">♂ {t('gender.male')}</option>
                                <option value="FEMALE">♀ {t('gender.female')}</option>
                                <option value="OTHER">⚧ {t('gender.other')}</option>
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-40 group-hover/select:opacity-100 transition-opacity">
                                <ChevronDown className="w-4 h-4 text-indigo-600" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Row 3: Chronology (Birthday & Zodiac) */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="label-mono text-[10px] opacity-60 ml-1 font-bold">{t('parent.birthDate')}</label>
                        <div className="hardware-well rounded-xl p-1.5 bg-[#D1CDBC]">
                            <SmartDatePicker
                                selected={member.birthDate ? new Date(member.birthDate) : undefined}
                                onSelect={(date) => {
                                    onChange({
                                        ...member,
                                        birthDate: date,
                                        zodiac: getZodiac(date),
                                        chineseZodiac: getChineseZodiac(date)
                                    })
                                }}
                                maxDate={new Date()}
                                placeholder={"SELECT"}
                                triggerClassName="w-full h-10 bg-white/95 px-3 rounded-lg border-2 border-transparent focus:border-indigo-500 outline-none font-black text-slate-800 text-[11px] shadow-inner transition-all flex items-center justify-between uppercase"
                            />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="label-mono text-[10px] opacity-60 ml-1 font-bold">{t('parent.zodiac')}</label>
                        <div className="hardware-well rounded-xl p-1.5 bg-[#D1CDBC] flex items-center justify-between h-[52px]">
                            <div className="flex-1 h-full bg-[#DADBD4] rounded-lg shadow-well flex items-center justify-between px-4 border border-[#C8C4B0]/20">
                                <div className="flex flex-col">
                                    <span className="label-mono text-[7px] opacity-40 leading-none mb-0.5">CHN</span>
                                    <span className="font-black text-slate-700 text-[11px] uppercase tracking-tighter">
                                        {member.chineseZodiac ? t('chineseZodiac.' + member.chineseZodiac).substring(0,8) : (member.birthDate ? t('chineseZodiac.' + getChineseZodiac(new Date(member.birthDate))).substring(0,8) : 'N/A')}
                                    </span>
                                </div>
                                <div className="w-px h-6 bg-[#C8C4B0]" />
                                <div className="flex flex-col text-right">
                                    <span className="label-mono text-[7px] opacity-40 leading-none mb-0.5">ASTRO</span>
                                    <span className="font-black text-slate-700 text-[11px] uppercase tracking-tighter">
                                        {member.zodiac ? t('zodiac.' + member.zodiac).substring(0,10) : (member.birthDate ? t('zodiac.' + getZodiac(new Date(member.birthDate))).substring(0,10) : 'N/A')}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="label-mono text-[10px] opacity-60 ml-1 font-bold">{t('parent.idSlug')}</label>
                        <div className="hardware-well rounded-xl p-1.5 bg-[#D1CDBC] flex items-center gap-1.5 group/slug h-[52px]">
                            <input
                                className="flex-1 h-10 bg-white/95 px-3 rounded-lg border-none outline-none font-black text-slate-800 text-[11px] shadow-inner transition-all font-mono"
                                placeholder="..."
                                value={member.slug || ''}
                                onChange={e => onChange({ ...member, slug: e.target.value.replace(/[^0-9]/g, '').substring(0, 8) })}
                            />
                            <button
                                type="button"
                                onClick={() => {
                                    const id = Math.floor(10000000 + Math.random() * 90000000).toString();
                                    onChange({ ...member, slug: id });
                                }}
                                className="hardware-btn group w-10 h-10 shrink-0"
                            >
                                <div className="hardware-cap w-full h-full bg-[#F4F4F2] group-hover:bg-white rounded-lg flex items-center justify-center transition-all shadow-cap active:translate-y-0.5 border border-[#C8C4B0]/30 relative overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-tr from-slate-200/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <Dices className="w-5 h-5 text-indigo-600 opacity-60 group-hover:opacity-100 group-hover:rotate-12 transition-all relative z-10" />
                                </div>
                            </button>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="label-mono text-[10px] opacity-60 ml-1 font-bold">{t('parent.publicMemberPage')}</label>
                        <div className="hardware-well rounded-xl p-1.5 bg-[#D1CDBC] h-[52px]">
                            <button
                                type="button"
                                onClick={() => onChange({ ...member, exhibitionEnabled: member.exhibitionEnabled === false })}
                                className="hardware-btn group w-full h-full"
                            >
                                <div className={`hardware-cap w-full h-full rounded-lg flex items-center justify-between px-4 shadow-cap transition-all active:translate-y-0.5 ${member.exhibitionEnabled !== false ? 'bg-[#F4F4F2] text-slate-900 border border-indigo-200/50' : 'bg-[#DADBD4] text-slate-500'}`}>
                                    <span className={`label-mono font-black text-[9px] tracking-[0.2em] ${member.exhibitionEnabled !== false ? 'text-indigo-600' : ''}`}>{member.exhibitionEnabled !== false ? 'ONLINE' : 'OFFLINE'}</span>
                                    <div className={`w-2.5 h-2.5 rounded-full border ${member.exhibitionEnabled !== false ? 'bg-indigo-500 border-indigo-200 animate-pulse shadow-[0_0_8px_rgba(79,70,229,0.5)]' : 'bg-slate-400 border-transparent'}`} />
                                </div>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pb-1">
                    <div className="space-y-1">
                        <label className="label-mono text-[10px] opacity-60 ml-1 font-bold">{t('parent.setAsAdmin')}</label>
                        <div className="hardware-well rounded-xl p-1.5 bg-[#D1CDBC] h-[52px]">
                            <button
                                type="button"
                                disabled={currentUser.permissionRole !== 'SUPERADMIN' || member.id === currentUser.id}
                                onClick={() => onChange({ ...member, permissionRole: member.permissionRole === 'ADMIN' ? 'USER' : 'ADMIN' })}
                                className={`hardware-btn group w-full h-full ${currentUser.permissionRole !== 'SUPERADMIN' || member.id === currentUser.id ? 'opacity-30 cursor-not-allowed' : ''}`}
                            >
                                <div className={`hardware-cap w-full h-full rounded-lg flex items-center justify-between px-4 shadow-cap transition-all active:translate-y-0.5 ${member.permissionRole === 'ADMIN' ? 'bg-slate-900 border border-slate-700/50 text-white' : 'bg-[#F4F4F2] text-slate-500'}`}>
                                    <div className="flex items-center gap-3">
                                        <Shield className={`w-4 h-4 ${member.permissionRole === 'ADMIN' ? 'text-indigo-400' : 'text-slate-400/80 group-hover:text-amber-600 transition-colors'}`} />
                                        <span className={`label-mono font-black text-[9px] tracking-[0.15em] uppercase ${member.permissionRole === 'ADMIN' ? 'text-white' : ''}`}>{t('parent.admin')}</span>
                                    </div>
                                    <div className={`w-2 h-2 rounded-full border ${member.permissionRole === 'ADMIN' ? 'bg-indigo-400 border-indigo-300 shadow-[0_0_10px_rgba(129,140,248,0.8)] animate-pulse' : 'bg-slate-300 border-transparent'}`} />
                                </div>
                            </button>
                        </div>
                    </div>
                    <div className="hidden md:block" />
                </div>
            </div>
        )
    }

    const archivedChildren = children.filter(c => !c.isDeleted && c.isArchived)

    const renderChildCard = (child: Child) => {
        return (
            <div key={child.id} className="hardware-well bg-[#C8C4B0]/40 rounded-[24px] shadow-well border border-black/5 relative flex flex-col p-5 gap-6">
                <div className="flex items-start gap-5">
                    {/* Avatar Display Well */}
                    <div className="w-20 h-20 hardware-well rounded-2xl p-1 shadow-well bg-[#D1CDBC] overflow-hidden shrink-0">
                        <div className="w-full h-full bg-white rounded-xl relative overflow-hidden group/avatar">
                            {child.avatarUrl ? (
                                <Image 
                                    src={`${child.avatarUrl}?v=4`} 
                                    alt={child.name} 
                                    width={80} 
                                    height={80} 
                                    className="w-full h-full object-cover" 
                                />
                            ) : (
                                <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                                    <span className="text-3xl font-black text-slate-300 uppercase">
                                        {(child.nickname?.[0] || child.name?.[0] || '?')}
                                    </span>
                                </div>
                            )}
                            <label className="absolute inset-0 bg-black/60 text-white text-[10px] flex flex-col items-center justify-center cursor-pointer opacity-0 group-hover/avatar:opacity-100 transition-opacity backdrop-blur-[2px]">
                                <Camera className="w-5 h-5 mb-1" />
                                <span className="font-black tracking-widest">UPLOAD</span>
                                <input
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={e => {
                                        if (e.target.files?.[0]) {
                                            handleAvatarUpload(child.id, e.target.files[0])
                                        }
                                    }}
                                />
                            </label>
                        </div>
                    </div>

                    <div className="flex-1 min-w-0 space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase leading-none truncate pr-2">
                                {child.nickname && child.nickname !== child.name 
                                    ? `${child.nickname} (${child.name})` 
                                    : child.name}
                            </h3>
                            <div className="flex gap-1.5 shrink-0">
                                <button 
                                    onClick={() => handleMasquerade(child.id)}
                                    className="hardware-btn group/login"
                                    title="LOGIN"
                                >
                                    <div className="hardware-well w-8 h-8 rounded-lg bg-[#DADBD4] shadow-well active:translate-y-0.5 transition-all flex items-center justify-center p-0.5 relative overflow-hidden">
                                        <div className="hardware-cap absolute inset-0.5 bg-white rounded-md flex items-center justify-center transition-all shadow-cap group-hover/login:bg-blue-50">
                                            <Fingerprint className="w-4 h-4 text-blue-500" />
                                        </div>
                                    </div>
                                </button>
                                <button 
                                    onClick={() => {
                                        setEditingChild(child);
                                        setEditNicknameTouched(!!child.nickname);
                                    }}
                                    className="hardware-btn group/edit"
                                    title={t('common.edit')}
                                >
                                    <div className="hardware-well w-8 h-8 rounded-lg bg-[#DADBD4] shadow-well active:translate-y-0.5 transition-all flex items-center justify-center p-0.5 relative overflow-hidden">
                                        <div className="hardware-cap absolute inset-0.5 bg-amber-500 rounded-md flex items-center justify-center transition-all shadow-cap group-hover/edit:bg-amber-600">
                                            <Edit2 className="w-4 h-4 text-white" />
                                        </div>
                                    </div>
                                </button>
                                <button 
                                    onClick={() => setResettingPin({ childId: child.id, pin: '' })}
                                    className="hardware-btn group/key"
                                    title="RESET PIN"
                                >
                                    <div className="hardware-well w-8 h-8 rounded-lg bg-[#DADBD4] shadow-well active:translate-y-0.5 transition-all flex items-center justify-center p-0.5 relative overflow-hidden">
                                        <div className="hardware-cap absolute inset-0.5 bg-indigo-500 rounded-md flex items-center justify-center transition-all shadow-cap group-hover/key:bg-indigo-600">
                                            <Key className="w-4 h-4 text-white" />
                                        </div>
                                    </div>
                                </button>
                                <button 
                                    onClick={() => setConfirmModal({ type: 'delete', childId: child.id })}
                                    className="hardware-btn group/delete"
                                    title={t('common.delete')}
                                    disabled={child.isLocked}
                                >
                                    <div className="hardware-well w-8 h-8 rounded-lg bg-[#DADBD4] shadow-well active:translate-y-0.5 transition-all flex items-center justify-center p-0.5 relative overflow-hidden">
                                        <div className={`hardware-cap absolute inset-0.5 rounded-md flex items-center justify-center transition-all shadow-cap ${child.isLocked ? 'bg-slate-200' : 'bg-rose-500 group-hover:bg-rose-600'}`}>
                                            <Trash2 className={`w-4 h-4 ${child.isLocked ? 'text-slate-400' : 'text-white'}`} />
                                        </div>
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* Stats Badges - Unified Label Style */}
                        <div className="flex flex-wrap items-center gap-2">
                            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-amber-50 border border-amber-200 shadow-sm">
                                <span className="label-mono text-[9px] font-black text-amber-800 tracking-widest uppercase">
                                    {child.role}
                                </span>
                            </div>
                            
                            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-white border border-slate-200 shadow-sm">
                                <Coins className="w-3 h-3 text-amber-500" />
                                <span className="label-mono text-[10px] font-black text-slate-800 tabular-nums">{child.stats?.currency || 0}</span>
                            </div>
                            
                            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-white border border-slate-200 shadow-sm">
                                <Star className="w-3 h-3 text-sky-500" />
                                <span className="label-mono text-[10px] font-black text-slate-800 tabular-nums">{child.stats?.goldStars || 0}</span>
                            </div>

                            {child.isArchived && (
                                <div className="px-2 py-1 rounded bg-slate-100 border border-slate-200 shadow-xs">
                                    <span className="label-mono text-[8px] text-slate-500 font-bold uppercase tracking-widest">ARCHIVED</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Actions Matrix - 3 Column Layout */}
                <div className="grid grid-cols-3 gap-3 w-full">
                    <button onClick={() => setAdjusting(child.id)} className="hardware-btn group w-full h-14">
                        <div className="hardware-well h-14 rounded-2xl overflow-hidden relative active:translate-y-0.5 transition-transform bg-[#DADBD4] shadow-well p-1">
                            <div className="hardware-cap absolute inset-1 bg-[#F4F4F2] group-hover:bg-blue-50 rounded-xl flex flex-col items-center justify-center gap-1 shadow-cap transition-all">
                                <Zap className="w-4 h-4 text-blue-500" />
                                <span className="text-[8px] font-black uppercase tracking-tighter text-slate-500">ADJUST</span>
                            </div>
                        </div>
                    </button>

                    <button onClick={() => fetchLogs(child.id)} className="hardware-btn group w-full h-14">
                        <div className="hardware-well h-14 rounded-2xl overflow-hidden relative active:translate-y-0.5 transition-transform bg-[#DADBD4] shadow-well p-1">
                            <div className="hardware-cap absolute inset-1 bg-[#F4F4F2] group-hover:bg-amber-50 rounded-xl flex flex-col items-center justify-center gap-1 shadow-cap transition-all">
                                <Clock className="w-4 h-4 text-amber-600/70 group-hover:text-amber-600" />
                                <span className="text-[8px] font-black text-slate-500 uppercase tracking-tighter">LOGS</span>
                            </div>
                        </div>
                    </button>

                    <button onClick={() => child.slug && window.open(`/u/${child.slug}`, '_blank')} className="hardware-btn group w-full h-14" disabled={!child.slug}>
                        <div className="hardware-well h-14 rounded-2xl overflow-hidden relative active:translate-y-0.5 transition-transform bg-[#DADBD4] shadow-well p-1">
                            <div className="hardware-cap absolute inset-1 bg-[#F4F4F2] group-hover:bg-indigo-50 rounded-xl flex flex-col items-center justify-center gap-1 shadow-cap transition-all">
                                <ExternalLink className="w-4 h-4 text-indigo-500 group-hover:text-indigo-600" />
                                <span className="text-[8px] font-black text-slate-500 uppercase tracking-tighter">PAGE</span>
                            </div>
                        </div>
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-12 pb-12">
            {/* Toast HUD */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: -50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -50 }}
                        className={`fixed top-8 left-1/2 -translate-x-1/2 z-[300] px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 font-bold text-white ${toast.type === 'success' ? 'bg-[#43aa8b]' : 'bg-rose-500'}`}
                    >
                        {toast.type === 'success' ? <UserCheck className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                        {toast.message}
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {(showAdd || editingChild) && (
                    <div 
                        className="fixed inset-0 z-[2000] flex items-center justify-center p-4 sm:p-8 bg-[#D1CDBC]/40 backdrop-blur-sm"
                        onClick={(e) => { if (e.target === e.currentTarget) { setShowAdd(false); setEditingChild(null); } }}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 15 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 15 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                            className="w-full max-w-2xl relative"
                        >
                            <div className="baustein-panel w-full bg-[#E2DFD2] rounded-[48px] shadow-2xl relative overflow-hidden border-4 border-[#C8C4B0] flex flex-col max-h-[92dvh]">
                                {/* Simplified Header Panel */}
                                <div className="px-8 py-4 relative shrink-0">
                                    <div className="flex justify-between items-center relative z-10">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 flex items-center justify-center">
                                                <Users className="w-6 h-6 text-indigo-600" />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-black text-slate-900 tracking-tighter uppercase leading-none">
                                                    {editingChild ? t('common.edit') : t('parent.addMember')}
                                                </h3>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => { setShowAdd(false); setEditingChild(null); }}
                                            className="hardware-btn group w-10 h-10"
                                        >
                                            <div className="hardware-well h-10 rounded-lg overflow-hidden relative flex items-center justify-center group-hover:bg-rose-50 transition-colors">
                                                <X className="w-5 h-5 text-slate-400 group-hover:text-rose-500 transition-colors" />
                                            </div>
                                        </button>
                                    </div>
                                    <div className="bg-[#C8C4B0]/30 h-px w-full absolute bottom-0 left-0" />
                                </div>

                                {/* Main Form Body (Optimized for no scroll) */}
                                <div className="flex-1 px-8 py-6">
                                    <div className="space-y-4">
                                        {renderMemberForm(editingChild || newChild, (val) => {
                                            if (editingChild) setEditingChild(val)
                                            else setNewChild(val)
                                        })}
                                    </div>
                                </div>

                                {/* System Baustein "Hard-Well-Well" White Submit */}
                                <div className="px-8 py-6 shrink-0 flex justify-center">
                                    <button
                                        onClick={() => handleSave(editingChild || newChild)}
                                        disabled={processing}
                                        className="hardware-btn group w-full h-14"
                                    >
                                        <div className="hardware-well h-14 rounded-2xl bg-[#DADBD4] p-1.5 shadow-well active:translate-y-1 transition-all overflow-hidden relative">
                                            <div className="hardware-cap absolute inset-1.5 bg-[#F4F4F2] group-hover:bg-white rounded-xl shadow-cap flex items-center justify-center overflow-hidden transition-all">
                                                <div className="absolute inset-0 bg-gradient-to-tr from-slate-200/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                                {processing ? (
                                                    <div className="w-5 h-5 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                                                ) : (
                                                    <div className="flex items-center gap-3 relative z-10 font-black uppercase tracking-[0.3em] text-xs text-slate-900">
                                                        <Save className="w-5 h-5 text-indigo-600 group-hover:scale-110 transition-transform" />
                                                        <span>提交保存</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* MODULATION HUD (Balance Adjustment) */}
            <AnimatePresence>
                {adjusting && (
                    <div 
                        className="fixed inset-0 z-[2100] flex items-center justify-center p-4 sm:p-8 bg-slate-900/60 backdrop-blur-sm"
                        onClick={(e) => { if (e.target === e.currentTarget) setAdjusting(null); }}
                    >
                        {(() => {
                            const child = children.find(c => c.id === adjusting);
                            if (!child) return null;
                            const newCurrency = (child.stats?.currency || 0) + adjData.currency;
                            const newStars = (child.stats?.goldStars || 0) + adjData.goldStars;

                            return (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: 15 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: 15 }}
                                    transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                                    className="w-full max-w-lg relative"
                                >
                                    <div className="baustein-panel w-full bg-[#E2DFD2] rounded-[32px] shadow-2xl relative overflow-hidden border-4 border-[#C8C4B0] flex flex-col">
                                        <div className="px-8 py-6 relative shrink-0">
                                            <div className="flex justify-between items-center relative z-10">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 hardware-well rounded-xl flex items-center justify-center bg-[#DADBD4] shadow-well overflow-hidden">
                                                        {child.avatarUrl ? (
                                                            <Image src={child.avatarUrl} alt="" width={48} height={48} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center bg-slate-100 italic text-[10px] text-slate-400">NA</div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <h3 className="text-xl font-black text-slate-900 tracking-tighter uppercase leading-none">
                                                            {child.nickname || child.name}
                                                        </h3>
                                                        <p className="label-mono opacity-40 mt-1 text-[8px] tracking-widest uppercase">BALANCE MODULATION HUD</p>
                                                    </div>
                                                </div>
                                                <Zap className="w-6 h-6 text-blue-500 animate-pulse" />
                                            </div>
                                            <div className="hardware-groove absolute bottom-0 left-0" />
                                        </div>

                                        <div className="p-8 space-y-8">
                                            {/* Coins Modulation */}
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between px-2">
                                                    <label className="label-mono text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                        <Coins className="w-3 h-3 text-amber-500" />
                                                        CURRENCY MODULATION
                                                    </label>
                                                    <div className="label-mono text-[9px] font-black text-slate-300">CURR: {child.stats?.currency || 0}</div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="flex-1 hardware-well rounded-2xl p-1 bg-[#DADBD4] shadow-well">
                                                        <div className="flex items-center bg-white rounded-xl h-14 px-4 gap-4 shadow-inner">
                                                            <button 
                                                                onClick={() => {
                                                                    const val = adjData.currency - 1;
                                                                    if ((child.stats?.currency || 0) + val >= 0) setAdjData({ ...adjData, currency: val });
                                                                }}
                                                                className="w-8 h-8 rounded-lg bg-rose-50 text-rose-500 flex items-center justify-center font-black shadow-sm active:scale-90 transition-transform"
                                                            >
                                                                -
                                                            </button>
                                                            <input 
                                                                type="number"
                                                                className="flex-1 bg-transparent text-center font-black text-slate-800 text-lg outline-none"
                                                                value={adjData.currency || ''}
                                                                placeholder="DELTA"
                                                                onChange={e => {
                                                                    const val = parseInt(e.target.value) || 0;
                                                                    if ((child.stats?.currency || 0) + val >= 0) setAdjData({ ...adjData, currency: val });
                                                                }}
                                                            />
                                                            <button 
                                                                onClick={() => setAdjData({ ...adjData, currency: adjData.currency + 1 })}
                                                                className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-500 flex items-center justify-center font-black shadow-sm active:scale-90 transition-transform"
                                                            >
                                                                +
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div className="w-20 hardware-well rounded-2xl p-1 bg-[#DADBD4] shadow-well flex flex-col items-center justify-center">
                                                        <span className="label-mono text-[7px] text-slate-400 uppercase">RESULT</span>
                                                        <span className={`text-lg font-black ${newCurrency > (child.stats?.currency || 0) ? 'text-emerald-500' : newCurrency < (child.stats?.currency || 0) ? 'text-rose-500' : 'text-slate-400'}`}>
                                                            {newCurrency}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Stars Modulation */}
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between px-2">
                                                    <label className="label-mono text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                        <Star className="w-3 h-3 text-sky-500" />
                                                        GOLD STAR MODULATION
                                                    </label>
                                                    <div className="label-mono text-[9px] font-black text-slate-300">CURR: {child.stats?.goldStars || 0}</div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="flex-1 hardware-well rounded-2xl p-1 bg-[#DADBD4] shadow-well">
                                                        <div className="flex items-center bg-white rounded-xl h-14 px-4 gap-4 shadow-inner">
                                                            <button 
                                                                onClick={() => {
                                                                    const val = adjData.goldStars - 1;
                                                                    if ((child.stats?.goldStars || 0) + val >= 0) setAdjData({ ...adjData, goldStars: val });
                                                                }}
                                                                className="w-8 h-8 rounded-lg bg-rose-50 text-rose-500 flex items-center justify-center font-black shadow-sm active:scale-90 transition-transform"
                                                            >
                                                                -
                                                            </button>
                                                            <input 
                                                                type="number"
                                                                className="flex-1 bg-transparent text-center font-black text-slate-800 text-lg outline-none"
                                                                value={adjData.goldStars || ''}
                                                                placeholder="DELTA"
                                                                onChange={e => {
                                                                    const val = parseInt(e.target.value) || 0;
                                                                    if ((child.stats?.goldStars || 0) + val >= 0) setAdjData({ ...adjData, goldStars: val });
                                                                }}
                                                            />
                                                            <button 
                                                                onClick={() => setAdjData({ ...adjData, goldStars: adjData.goldStars + 1 })}
                                                                className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-500 flex items-center justify-center font-black shadow-sm active:scale-90 transition-transform"
                                                            >
                                                                +
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div className="w-20 hardware-well rounded-2xl p-1 bg-[#DADBD4] shadow-well flex flex-col items-center justify-center">
                                                        <span className="label-mono text-[7px] text-slate-400 uppercase">RESULT</span>
                                                        <span className={`text-lg font-black ${newStars > (child.stats?.goldStars || 0) ? 'text-emerald-500' : newStars < (child.stats?.goldStars || 0) ? 'text-rose-500' : 'text-slate-400'}`}>
                                                            {newStars}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Reason Field */}
                                            <div className="space-y-2">
                                                <label className="label-mono text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">ADJUSTMENT LOG REASON</label>
                                                <div className="hardware-well rounded-2xl p-1 bg-[#DADBD4] shadow-well">
                                                    <input 
                                                        className="w-full bg-white rounded-xl h-11 px-4 text-xs font-bold text-slate-700 outline-none placeholder:opacity-30"
                                                        placeholder="Mnemonic or reason for this distribution..."
                                                        value={adjData.reason}
                                                        onChange={e => setAdjData({ ...adjData, reason: e.target.value })}
                                                    />
                                                </div>
                                            </div>

                                            <div className="flex gap-4 pt-4">
                                                <button onClick={() => setAdjusting(null)} className="flex-1 hardware-btn group h-14">
                                                    <div className="hardware-well h-14 rounded-2xl bg-[#DADBD4] p-1 shadow-well active:translate-y-0.5 transition-all">
                                                        <div className="hardware-cap bg-[#F4F4F2] group-hover:bg-white h-full rounded-xl flex items-center justify-center shadow-cap transition-all">
                                                            <span className="text-slate-500 font-black uppercase tracking-widest text-xs">CANCEL</span>
                                                        </div>
                                                    </div>
                                                </button>
                                                <button 
                                                    onClick={handleAdjust} 
                                                    disabled={processing || (adjData.currency === 0 && adjData.goldStars === 0)}
                                                    className="flex-[2] hardware-btn group h-14"
                                                >
                                                    <div className="hardware-well h-14 rounded-2xl bg-[#DADBD4] p-1 shadow-well active:translate-y-0.5 transition-all">
                                                        <div className={`hardware-cap h-full rounded-xl flex items-center justify-center shadow-cap transition-all ${processing ? 'bg-slate-100' : 'bg-blue-600 group-hover:bg-blue-500'}`}>
                                                            {processing ? (
                                                                <div className="w-5 h-5 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                                                            ) : (
                                                                <div className="flex items-center gap-2">
                                                                    <Save className="w-4 h-4 text-white" />
                                                                    <span className="text-white font-black uppercase tracking-widest text-xs">COMMIT ADJUSTMENT</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })()}
                    </div>
                )}
            </AnimatePresence>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {activeChildren.length === 0 && !showAdd && (
                    <div className="md:col-span-2 hardware-well bg-[#D1CDBC] rounded-3xl p-16 flex flex-col items-center justify-center gap-6 shadow-well group transition-all">
                        <div className="w-24 h-24 hardware-well rounded-2xl flex items-center justify-center bg-[#E2DFD2] shadow-well group-hover:scale-110 transition-transform">
                            <Users className="w-12 h-12 text-[#A8A490]" />
                        </div>
                        <div className="text-center space-y-2">
                            <h4 className="text-xl font-black text-slate-800 uppercase tracking-tighter leading-none">{t('parent.noChildren')}</h4>
                            <p className="label-mono opacity-40 max-w-[320px] mx-auto">No family member records found. Initialize protocol by adding your first unit.</p>
                        </div>
                        <button 
                            onClick={() => {
                                setShowAdd(true);
                                setNicknameTouched(false);
                            }}
                            className="hardware-btn group w-48 h-12 mt-4"
                        >
                            <div className="hardware-well h-12 rounded-xl overflow-hidden relative active:translate-y-0.5 transition-transform">
                                <div className="hardware-cap absolute inset-1 bg-blue-600 rounded-lg flex items-center justify-center gap-2 group-hover:bg-blue-500 transition-colors shadow-cap">
                                    <Plus className="w-4 h-4 text-white" />
                                    <span className="text-white font-black uppercase tracking-wider text-[10px]">ADD UNIT</span>
                                </div>
                            </div>
                        </button>
                    </div>
                )}
                {activeChildren.map(child => renderChildCard(child))}
            </div>

            {showArchived && archivedChildren.length > 0 && (
                <div className="space-y-6 pt-12 border-t border-slate-200">
                    <h3 className="text-xl font-black text-slate-400 uppercase tracking-widest flex items-center gap-3">
                        <Archive className="w-5 h-5" />
                        {t('parent.archivedMembers')}
                    </h3>
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                        {archivedChildren.map(child => renderChildCard(child))}
                    </div>
                  <AnimatePresence>
                {showLogs && (
                    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6 bg-[#D1CDBC]/40 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 15 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 15 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                            className="w-full max-w-2xl relative"
                        >
                            <div className="baustein-panel w-full bg-[#E2DFD2] rounded-[2rem] shadow-2xl relative overflow-hidden border-4 border-[#C8C4B0] flex flex-col max-h-[85dvh]">
                                <div className="hardware-well px-8 py-6 relative shrink-0">
                                    <div className="flex justify-between items-center relative z-10">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 hardware-well rounded-xl flex items-center justify-center shadow-well bg-[#DADBD4]">
                                                <History className="w-6 h-6 text-slate-700" />
                                            </div>
                                            <div>
                                                <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase leading-none">{t('parent.balanceLogs')}</h3>
                                                <p className="label-mono opacity-60 mt-1.5">HISTORICAL SYSTEM AUDIT</p>
                                            </div>
                                        </div>
                                        <button onClick={() => setShowLogs(null)} className="hardware-btn group w-10 h-10">
                                            <div className="hardware-well h-10 rounded-lg overflow-hidden relative flex items-center justify-center group-hover:bg-slate-50 transition-colors">
                                                <X className="w-5 h-5 text-slate-400" />
                                            </div>
                                        </button>
                                    </div>
                                    <div className="hardware-groove absolute bottom-0 left-0" />
                                </div>
                                
                                <div className="flex-1 overflow-y-auto px-8 py-8 space-y-4 custom-scrollbar bg-[#DADBD4]/30">
                                    {logs.map((log, i) => (
                                        <div key={i} className="hardware-well group p-1.5 rounded-2xl overflow-hidden hover:bg-[#D1CDBC] transition-colors">
                                            <div className="bg-white/90 rounded-xl p-4 flex items-center justify-between border-2 border-transparent group-hover:border-blue-200 transition-all">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-14 h-14 hardware-well rounded-xl flex flex-col items-center justify-center shadow-inner ${log.amount > 0 ? 'bg-emerald-50' : 'bg-rose-50'}`}>
                                                        <span className={`text-lg font-black ${log.amount > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                            {log.amount > 0 ? '+' : ''}{log.amount}
                                                        </span>
                                                        <span className="text-[8px] font-black opacity-30 tracking-widest">UNIT</span>
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-slate-800 text-sm">{log.reason}</div>
                                                        <div className="label-mono text-[9px] opacity-40 mt-1">{new Date(log.createdAt).toLocaleString()}</div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="label-mono text-[8px] text-blue-500 font-black mb-1">{log.type}</div>
                                                    <div className="text-xl font-black text-slate-900 tracking-tighter">{log.balance}</div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="px-8 py-6 hardware-well shrink-0">
                                    <div className="hardware-groove absolute top-0 left-0" />
                                    <button 
                                        onClick={() => setShowLogs(null)}
                                        className="hardware-btn group w-full h-14"
                                    >
                                        <div className="hardware-well h-14 rounded-xl overflow-hidden relative active:translate-y-0.5 transition-transform">
                                            <div className="hardware-cap absolute inset-1.5 bg-[#F4F4F2] group-hover:bg-white rounded-lg flex items-center justify-center transition-all shadow-cap">
                                                <span className="text-slate-600 font-black uppercase tracking-widest text-xs">Acknowledge</span>
                                            </div>
                                        </div>
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
           </div>
            )}

            {/* Confirmation Modals */}
            <AnimatePresence>
                {confirmModal && (
                    <div 
                        className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
                        onClick={(e) => { if (e.target === e.currentTarget) setConfirmModal(null); }}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 15 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 15 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                            className="w-full max-w-md relative"
                        >
                            <div className="baustein-panel w-full bg-[#E2DFD2] rounded-[2rem] shadow-2xl relative overflow-hidden border-4 border-[#C8C4B0] p-8 flex flex-col items-center text-center">
                                <div className={`w-20 h-20 hardware-well rounded-2xl flex items-center justify-center mb-6 shadow-well ${confirmModal.type === 'delete' ? 'bg-rose-100 bg-rose-50' : 'bg-[#DADBD4]'}`}>
                                    <AlertTriangle className={`w-10 h-10 ${confirmModal.type === 'delete' ? 'text-rose-500' : 'text-slate-600'}`} />
                                </div>
                                <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase mb-2">
                                    {confirmModal.type === 'delete' ? t('parent.confirmDelete') : t('parent.confirmArchive')}
                                </h3>
                                <p className="label-mono opacity-60 max-w-[280px] leading-relaxed mb-8">
                                    {confirmModal.type === 'delete'
                                        ? t('parent.confirmDeleteDesc')
                                        : t('parent.confirmArchiveDesc')}
                                </p>
                                
                                <div className="grid grid-cols-2 gap-4 w-full">
                                    <button
                                        onClick={() => confirmModal.type === 'delete' ? handleDelete(confirmModal.childId) : handleArchive(confirmModal.childId)}
                                        disabled={processing}
                                        className="hardware-btn group h-14"
                                    >
                                        <div className="hardware-well h-14 rounded-xl overflow-hidden relative active:translate-y-0.5 transition-transform">
                                            <div className={`hardware-cap absolute inset-1.5 rounded-lg flex items-center justify-center transition-all shadow-cap ${confirmModal.type === 'delete' ? 'bg-rose-600 group-hover:bg-rose-500 text-white' : 'bg-slate-800 group-hover:bg-slate-700 text-white'}`}>
                                                <span className="font-black uppercase tracking-widest text-xs">
                                                    {processing ? '...' : (confirmModal.type === 'delete' ? t('button.delete') : t('button.apply'))}
                                                </span>
                                            </div>
                                        </div>
                                    </button>
                                    <button
                                        onClick={() => setConfirmModal(null)}
                                        className="hardware-btn group h-14"
                                    >
                                        <div className="hardware-well h-14 rounded-xl overflow-hidden relative active:translate-y-0.5 transition-transform">
                                            <div className="hardware-cap absolute inset-1.5 bg-[#F4F4F2] group-hover:bg-white rounded-lg flex items-center justify-center transition-all shadow-cap">
                                                <span className="text-slate-600 font-black uppercase tracking-widest text-xs">{t('button.cancel')}</span>
                                            </div>
                                        </div>
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Reset PIN Modal */}
            <AnimatePresence>
                {resettingPin && (
                    <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 15 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 15 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                            className="baustein-panel w-full max-w-sm bg-[#E2DFD2] rounded-[2.5rem] shadow-2xl border-4 border-[#C8C4B0] p-8 flex flex-col items-center"
                        >
                            <div className="w-16 h-16 hardware-well bg-indigo-100 rounded-2xl flex items-center justify-center mb-4 shadow-well">
                                <Key className="w-8 h-8 text-indigo-600" />
                            </div>
                            <h3 className="text-xl font-black text-slate-900 tracking-tighter uppercase mb-6">{t('parent.resetPassword')}</h3>
                            
                            <div className="hardware-well rounded-xl p-1 bg-[#D1CDBC] w-full mb-6">
                                <input
                                    autoFocus
                                    className="w-full bg-white px-4 py-3 rounded-lg border-none outline-none font-black text-slate-800 text-lg shadow-inner tracking-[1em] text-center"
                                    placeholder="••••"
                                    maxLength={4}
                                    value={resettingPin.pin}
                                    onChange={e => setResettingPin({ ...resettingPin, pin: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3 w-full">
                                <button
                                    onClick={async () => {
                                        if (resettingPin.pin.length !== 4) return;
                                        setProcessing(true);
                                        try {
                                            const res = await fetch(`/api/parent/children/${resettingPin.childId}`, {
                                                method: 'PATCH',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ pin: resettingPin.pin })
                                            });
                                            if (res.ok) {
                                                setResettingPin(null);
                                                fetchData();
                                            }
                                        } finally {
                                            setProcessing(false);
                                        }
                                    }}
                                    disabled={resettingPin.pin.length !== 4 || processing}
                                    className="hardware-btn group h-12"
                                >
                                    <div className="hardware-well h-12 rounded-xl overflow-hidden relative active:translate-y-0.5 transition-transform">
                                        <div className="hardware-cap absolute inset-1 bg-indigo-600 text-white rounded-lg flex items-center justify-center shadow-cap transition-colors group-hover:bg-indigo-500">
                                            <span className="font-black text-[10px] uppercase tracking-widest">Update</span>
                                        </div>
                                    </div>
                                </button>
                                <button
                                    onClick={() => setResettingPin(null)}
                                    className="hardware-btn group h-12"
                                >
                                    <div className="hardware-well h-12 rounded-xl overflow-hidden relative active:translate-y-0.5 transition-transform">
                                        <div className="hardware-cap absolute inset-1 bg-[#DADBD4] text-slate-600 rounded-lg flex items-center justify-center shadow-cap transition-colors group-hover:bg-white">
                                            <span className="font-black text-[10px] uppercase tracking-widest">Cancel</span>
                                        </div>
                                    </div>
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}
