'use client'

import React, { useEffect, useState } from 'react'
import { Plus, Trash2, Archive, History, Camera, X, Edit2, Star, ArrowRight, Save, AlertTriangle, Users, Coins, UserCheck, Shield, Lock, User, Info, Check, ShieldAlert } from 'lucide-react'
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

export default function ChildManagement({ onAssignTask, currentUser }: { 
    onAssignTask?: (id: string) => void,
    currentUser: { id: string; permissionRole: string }
}) {
    const { t } = useI18n()
    const [children, setChildren] = useState<Child[]>([])
    const [loading, setLoading] = useState(true)
    const [showAdd, setShowAdd] = useState(false)
    const [editingChild, setEditingChild] = useState<Partial<Child> | null>(null)
    const [newChild, setNewChild] = useState<Partial<Child>>({ name: '', nickname: '', slug: '', gender: 'OTHER', role: 'CHILD' })
    const [showLogs, setShowLogs] = useState<string | null>(null)
    const [logs, setLogs] = useState<BalanceLog[]>([])
    const [adjusting, setAdjusting] = useState<string | null>(null)
    const [adjData, setAdjData] = useState({ type: 'CURRENCY', amount: 0, reason: '' })
    const [showArchived, setShowArchived] = useState(false)
    const [confirmModal, setConfirmModal] = useState<{ type: 'delete' | 'archive', childId: string } | null>(null)
    const [processing, setProcessing] = useState(false)
    const [nicknameTouched, setNicknameTouched] = useState(false)
    const [editNicknameTouched, setEditNicknameTouched] = useState(false)

    const fetchChildren = async () => {
        try {
            const res = await fetch('/api/parent/children')
            const data = await res.json()
            setChildren(data)
        } catch (e) {
            console.error('Failed to fetch children:', e)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchChildren()
    }, [])

    const handleSave = async (data: Partial<Child>) => {
        if (!data.name || processing) return
        if (data.slug && data.slug.length < 6) {
            // Error feedback could be better but this handles it simply
            alert('Link ID must be at least 6 characters');
            return;
        }
        setProcessing(true)
        try {
            const method = data.id ? 'PATCH' : 'POST'
            await fetch('/api/parent/children', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            })
            setNewChild({ name: '', nickname: '', gender: 'OTHER', role: 'CHILD' })
            setEditingChild(null)
            setNicknameTouched(false)
            setEditNicknameTouched(false)
            fetchChildren()
        } catch (e) { console.error(e) } finally { setProcessing(false) }
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
        } catch (e) { console.error(e) } finally { setProcessing(false) }
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
                fetchChildren()
            }
        } catch (e) { console.error(e) } finally { setProcessing(false) }
    }

    const handleAdjust = async () => {
        if (!adjusting || processing) return
        setProcessing(true)
        try {
            await fetch('/api/parent/economy/distribute', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    targetUserId: adjusting,
                    ...adjData
                })
            })
            setAdjusting(null)
            setAdjData({ type: 'CURRENCY', amount: 0, reason: '' })
            fetchChildren()
        } catch (e) { console.error(e) } finally { setProcessing(false) }
    }

    const fetchLogs = async (userId: string) => {
        if (processing) return
        setProcessing(true)
        try {
            const res = await fetch(`/api/parent/logs?userId=${userId}`)
            const data = await res.json()
            setLogs(data)
            setShowLogs(userId)
        } catch (e) { console.error(e) } finally { setProcessing(false) }
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
            fetchChildren()
        } catch (e) { console.error(e) } finally { setProcessing(false) }
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
            fetchChildren()
        } catch (e) { console.error(e) } finally { setProcessing(false) }
    }

    if (loading) return <div className="p-12 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">{t('common.loading')}</div>

    const activeChildren = children.filter(c => !c.isDeleted && !c.isArchived)
    const renderMemberForm = (member: Partial<Child>, onChange: (val: Partial<Child>) => void) => {
        const genderEmojis = {
            MALE: '♂',
            FEMALE: '♀',
            OTHER: '⚧'
        };

        return (
            <div className="space-y-3">
                {/* Row 1: Name + Nickname */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('settings.realName')}</label>
                        <input
                            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-100 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                            placeholder="Full Name"
                            value={member.name || ''}
                            onChange={e => {
                                const val = e.target.value;
                                const isEditing = !!member.id;
                                const touched = isEditing ? editNicknameTouched : nicknameTouched;
                                if (!touched) {
                                    onChange({ ...member, name: val, nickname: val });
                                } else {
                                    onChange({ ...member, name: val });
                                }
                            }}
                            required
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('parent.nickname')}</label>
                        <input
                            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-100 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                            placeholder="Nickname"
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

                {/* Row 2: Gender + PIN */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('parent.gender')}</label>
                        <div className="flex gap-1.5">
                            {(['MALE', 'FEMALE', 'OTHER'] as const).map(g => (
                                <button
                                    key={g}
                                    type="button"
                                    onClick={() => onChange({ ...member, gender: g })}
                                    className={`flex-1 py-2.5 rounded-xl font-black text-[10px] transition-all border flex items-center justify-center gap-1 ${member.gender === g ? 'bg-blue-500 text-white border-blue-400 shadow-md' : 'bg-white border-slate-100 text-slate-400 hover:bg-slate-50'}`}
                                >
                                    <span>{genderEmojis[g]}</span>
                                    <span className="hidden sm:inline">{t(`gender.${g.toLowerCase()}`)}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('parent.memberPin')}</label>
                        <input
                            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-100 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-blue-100 transition-all tracking-widest"
                            placeholder="••••"
                            maxLength={4}
                            value={String(member.pin || '')}
                            onChange={e => onChange({ ...member, pin: e.target.value })}
                        />
                    </div>
                </div>

                {/* Row 3: Role + BirthDate */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Member Role</label>
                        <div className="grid grid-cols-2 gap-1.5">
                            {([
                                { value: 'CHILD', label: 'Child', emoji: '🧒' },
                                { value: 'PARENT', label: 'Parent', emoji: '👨' },
                                { value: 'GRANDPARENT', label: 'Grand', emoji: '👴' },
                                { value: 'OTHER', label: 'Other', emoji: '👤' },
                            ] as const).map(r => (
                                <button
                                    key={r.value}
                                    type="button"
                                    onClick={() => onChange({ ...member, role: r.value })}
                                    className={`py-2 rounded-xl font-black text-[10px] transition-all border flex items-center justify-center gap-1 ${(member.role || 'CHILD') === r.value ? 'bg-indigo-500 text-white border-indigo-400 shadow-md' : 'bg-white border-slate-100 text-slate-400 hover:bg-slate-50'}`}
                                >
                                    <span>{r.emoji}</span>
                                    {r.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('parent.birthDate')}</label>
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
                            placeholder={t('parent.birthDate')}
                            triggerClassName="px-3 py-2.5 bg-slate-50 border border-slate-100 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                        />
                    </div>
                </div>

                {/* Row 4: Zodiac tags + Slug / Exhibition Toggle */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex justify-between">
                            {t('parent.slugLabel')}
                            <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${member.exhibitionEnabled !== false ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                {member.exhibitionEnabled !== false ? 'ON' : 'OFF'}
                            </span>
                        </label>
                        <div className="flex gap-1.5">
                            <input
                                className="flex-1 min-w-0 px-3 py-2.5 bg-slate-50 border border-slate-100 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-blue-100 transition-all font-mono"
                                placeholder="e.g. lily-art"
                                value={member.slug || ''}
                                onChange={e => onChange({ ...member, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
                            />
                            <button
                                type="button"
                                title="Auto-generate numeric ID"
                                onClick={() => {
                                    const randId = Math.floor(10000000 + Math.random() * 90000000).toString();
                                    onChange({ ...member, slug: randId });
                                }}
                                className="px-3 bg-white border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors shadow-sm text-slate-400 hover:text-blue-500"
                            >
                                ✨
                            </button>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('settings.exhibitionStatus')}</label>
                        <button
                            type="button"
                            onClick={() => onChange({ ...member, exhibitionEnabled: member.exhibitionEnabled === false })}
                            className={`w-full h-[40px] px-4 rounded-xl font-bold text-sm flex items-center justify-between transition-all border ${member.exhibitionEnabled !== false ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-slate-50 border-slate-100 text-slate-400'}`}
                        >
                            <span className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${member.exhibitionEnabled !== false ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-300'}`} />
                                {member.exhibitionEnabled !== false ? t('settings.exhibitionEnabled') : t('settings.exhibitionDisabled')}
                            </span>
                            <div className={`w-8 h-4 rounded-full relative transition-colors ${member.exhibitionEnabled !== false ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                                <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all shadow-sm ${member.exhibitionEnabled !== false ? 'left-4.5' : 'left-0.5'}`} />
                            </div>
                        </button>
                    </div>
                </div>
                
                {/* Admin Role Toggle (Superadmin only) */}
                {currentUser.permissionRole === 'SUPERADMIN' && member.id && member.id !== currentUser.id && (
                    <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Shield className="w-4 h-4 text-indigo-500" />
                                <span className="text-[10px] font-black text-indigo-900 uppercase tracking-widest">Admin Privileges</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => onChange({ 
                                    ...member, 
                                    permissionRole: member.permissionRole === 'ADMIN' ? 'USER' : 'ADMIN' 
                                })}
                                className={`hardware-cap px-4 py-1.5 rounded-lg text-[10px] font-black transition-all border ${member.permissionRole === 'ADMIN' ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-200' : 'bg-white text-indigo-400 border-indigo-100 hover:bg-white'}`}
                            >
                                {member.permissionRole === 'ADMIN' ? 'Revoke Admin' : 'Make Admin'}
                            </button>
                        </div>
                        <p className="text-[9px] text-indigo-400 font-medium leading-relaxed italic">
                            * Admins have full access to management and system controls, but cannot manage the Superadmin.
                        </p>
                    </div>
                )}

                <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('parent.chineseZodiac')} / {t('parent.zodiac')}</label>
                        <div className="flex gap-2 py-2.5 px-3 bg-slate-100 rounded-xl">
                            <span className="text-sm font-black text-slate-500">
                                {member.chineseZodiac || (member.birthDate ? getChineseZodiac(new Date(member.birthDate)) : '—')}
                            </span>
                            <span className="text-slate-300">·</span>
                            <span className="text-sm font-black text-slate-500">
                                {member.zodiac || (member.birthDate ? getZodiac(new Date(member.birthDate)) : '—')}
                            </span>
                        </div>
                    </div>
                </div>
            )
    }

    const archivedChildren = children.filter(c => !c.isDeleted && c.isArchived)

    const renderChildCard = (child: Child) => {
        const currentVal = child.stats ? (
            adjData.type === 'CURRENCY' ? child.stats.currency :
                adjData.type === 'GOLD_STAR' ? child.stats.goldStars :
                    adjData.type === 'PURPLE_STAR' ? child.stats.purpleStars :
                        child.stats.angerPenalties
        ) : 0;
        const newVal = currentVal + (adjData.amount || 0);

        return (
            <div key={child.id} className={`bg-white p-6 rounded-xl border ${child.isArchived ? 'border-slate-200 bg-slate-50/50' : 'border-slate-100'} shadow-sm space-y-4 hover:shadow-md transition-shadow relative overflow-hidden`}>
                <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                        <div className="relative group overflow-hidden rounded-2xl w-16 h-16 bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200">
                            {child.avatarUrl ? (
                                <Image 
                                    src={`${child.avatarUrl}?v=4`} 
                                    alt={child.name} 
                                    width={64} 
                                    height={64} 
                                    className="w-full h-full object-cover" 
                                />
                            ) : (
                                <div className="w-full h-full bg-blue-50 flex items-center justify-center">
                                    <span className="text-2xl font-bold text-blue-300 capitalize">
                                        {(child.nickname?.[0] || child.name?.[0] || '?')}
                                    </span>
                                </div>
                            )}
                            <label className="absolute inset-0 bg-black/40 text-white text-[10px] flex flex-col items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                                <Camera className="w-4 h-4 mb-0.5" />
                                {t('button.save')}
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
                        <div>
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                {child.name}
                                {child.nickname && child.realName && child.realName !== child.name && (
                                    <span className="text-xs text-slate-400 font-medium">({child.realName})</span>
                                )}
                            </h3>
                            <div className="flex gap-2 flex-wrap mt-1">
                                {child.role !== 'CHILD' && (
                                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full inline-block">
                                        {child.role}
                                    </div>
                                )}
                                {child.isArchived && <span className="text-[10px] bg-slate-200 text-slate-500 px-2 py-0.5 rounded-full uppercase tracking-tighter">{t('parent.archived')}</span>}
                                {child.permissionRole === 'SUPERADMIN' && (
                                    <span className="text-[10px] bg-indigo-500 text-white px-2 py-0.5 rounded-full uppercase tracking-tighter font-black shadow-sm ring-2 ring-indigo-100 ring-offset-1">SUPERADMIN</span>
                                )}
                                {child.permissionRole === 'ADMIN' && (
                                    <span className="text-[10px] bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full uppercase tracking-tighter font-black border border-indigo-200">ADMIN</span>
                                )}
                            </div>
                            <div className="flex gap-2 flex-wrap mt-1">
                                {(child.chineseZodiac || child.birthDate) && (
                                    <div className="text-[9px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full inline-block">
                                        {child.chineseZodiac || getChineseZodiac(new Date(child.birthDate!))}
                                    </div>
                                )}
                                {(child.zodiac || child.birthDate) && (
                                    <div className="text-[9px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full inline-block">
                                        {child.zodiac || getZodiac(new Date(child.birthDate!))}
                                    </div>
                                )}
                            </div>
                            <div className="flex gap-4 mt-2">
                                <span className="text-xs font-bold text-amber-500 flex items-center gap-1">
                                    <Coins className="w-3.5 h-3.5" /> {child.stats?.currency || 0}
                                </span>
                                <span className="text-xs font-bold text-yellow-600 flex items-center gap-1">
                                    <Star className="w-3.5 h-3.5 fill-yellow-500" /> {child.stats?.goldStars || 0}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-1">
                        {!child.isArchived && (
                            <>
                                <button
                                    onClick={() => setEditingChild(child)}
                                    className="p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-300 hover:text-slate-600"
                                    title="Edit Profile"
                                >
                                    <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setConfirmModal({ type: 'archive', childId: child.id })}
                                    className="p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-300 hover:text-slate-600"
                                    title={t('button.archive') || 'Archive'}
                                >
                                    <Archive className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => handleMasquerade(child.id)}
                                    className="p-2 rounded-lg hover:bg-slate-900 hover:text-white transition-all text-slate-300"
                                    title="Masquerade (Login as this user)"
                                >
                                    <UserCheck className="w-4 h-4" />
                                </button>
                            </>
                        )}
                                <button
                                    onClick={() => setConfirmModal({ type: 'delete', childId: child.id })}
                                    className={`p-2 rounded-lg hover:bg-red-50 transition-colors ${child.isLocked ? 'opacity-20 cursor-not-allowed grayscale' : 'text-red-300 hover:text-red-500'}`}
                                    title={child.isLocked ? 'Locked' : t('button.delete')}
                                    disabled={child.isLocked}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                    </div>
                </div>

                <div className="pt-2 flex flex-wrap gap-2 border-t border-slate-50 pt-4">
                    <button
                        onClick={() => onAssignTask?.(child.id)}
                        className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-sm font-bold hover:bg-emerald-100 transition-colors flex items-center gap-2"
                    >
                        {t('parent.assignTask')}
                    </button>
                    <button
                        onClick={() => setAdjusting(adjusting === child.id ? null : child.id)}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${adjusting === child.id ? 'bg-blue-500 text-white' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}
                    >
                        <Star className="w-4 h-4" />
                        Reward
                    </button>
                    {child.slug && (
                        <button
                            onClick={() => window.open(`/u/${child.slug}`, '_blank')}
                            className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-sm font-bold hover:bg-indigo-100 transition-colors flex items-center gap-2"
                        >
                            <UserCheck className="w-4 h-4" />
                            {t('parent.viewPublicProfile')}
                        </button>
                    )}
                    <button
                        onClick={() => handleMasquerade(child.id)}
                        disabled={processing}
                        className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 rounded-2xl transition-all border border-transparent hover:border-blue-100 group/btn active:scale-[0.98] disabled:opacity-50"
                    >
                        <div className="flex items-center gap-3">
                            <UserCheck className="w-5 h-5 text-blue-500 group-hover/btn:scale-110 transition-transform" />
                            <span className="font-bold text-slate-800">{processing ? t('common.loading') : 'Login / Masquerade'}</span>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-300 group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                    <button
                        onClick={() => fetchLogs(child.id)}
                        className="px-4 py-2 bg-slate-50 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-100 transition-colors flex items-center gap-2"
                    >
                        <History className="w-4 h-4" />
                        {t('common.history')}
                    </button>
                </div>

                {
                    adjusting === child.id && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-slate-50 p-5 rounded-2xl border border-blue-100 space-y-4 shadow-inner"
                        >
                            <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-widest px-1">
                                <span>{t('parent.adjustStats')}</span>
                                <span className="text-blue-500">{t('parent.previewChanges')}</span>
                            </div>

                            <div className="flex gap-4 items-center">
                                <div className="flex-1 space-y-3">
                                    <select
                                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-400 outline-none appearance-none"
                                        value={adjData.type}
                                        onChange={e => setAdjData({ ...adjData, type: e.target.value })}
                                    >
                                        <option value="CURRENCY">{t('parent.currency')}</option>
                                        <option value="GOLD_STAR">{t('parent.goldStars')}</option>
                                        <option value="PURPLE_STAR">{t('parent.purpleStars')}</option>
                                        <option value="ANGER_PENALTY">{t('parent.angerPenalty')}</option>
                                    </select>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-black focus:ring-2 focus:ring-blue-400 outline-none"
                                            placeholder="Amount (+/-)"
                                            value={adjData.amount || ''}
                                            onChange={e => setAdjData({ ...adjData, amount: parseInt(e.target.value) || 0 })}
                                        />
                                    </div>
                                </div>

                                <div className="w-24 bg-white border border-slate-200 rounded-2xl p-3 flex flex-col items-center justify-center shadow-sm">
                                    <div className="text-[10px] text-slate-400 font-bold uppercase">{t('parent.result')}</div>
                                    <div className="text-2xl font-black text-blue-600">{newVal}</div>
                                    <div className="flex items-center gap-1 text-[8px] font-bold text-slate-300 mt-1">
                                        <span>{currentVal}</span>
                                        <ArrowRight className="w-2 h-2" />
                                        <span>{newVal}</span>
                                    </div>
                                </div>
                            </div>

                            <input
                                type="text"
                                placeholder={t('parent.reason')}
                                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-400 outline-none"
                                value={adjData.reason}
                                onChange={e => setAdjData({ ...adjData, reason: e.target.value })}
                            />

                            <div className="flex gap-2">
                                <button
                                    onClick={handleAdjust}
                                    disabled={processing}
                                    className="flex-1 bg-blue-500 text-white rounded-xl font-bold py-3 shadow-md hover:bg-blue-600 transition-colors active:scale-[0.98] disabled:opacity-50"
                                >
                                    {processing ? t('common.loading') : t('button.apply')}
                                </button>
                                <button onClick={() => setAdjusting(null)} className="px-6 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-50 transition-colors">
                                    {t('button.cancel')}
                                </button>
                            </div>
                        </motion.div>
                    )
                }
            </div >
        )
    }

    return (
        <div className="space-y-8 pb-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="mb-8">
                    <h2 className="text-3xl font-black text-slate-800 tracking-tight">{t('parent.family')}</h2>
                    <p className="text-sm text-slate-500 mt-1">{t('parent.familySub')}</p>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <button
                        onClick={() => setShowAdd(true)}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-2xl hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/20 active:scale-95 font-bold"
                    >
                        <Plus className="w-5 h-5" />
                        Add Member
                    </button>
                    {archivedChildren.length > 0 && (
                        <button
                            onClick={() => setShowArchived(!showArchived)}
                            className={`flex items-center justify-center gap-2 px-6 py-3 rounded-2xl transition-all font-bold ${showArchived ? 'bg-slate-800 text-white' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}
                        >
                            <Archive className="w-5 h-5" />
                            {showArchived ? t('parent.hideArchived') : t('parent.showArchived', { count: archivedChildren.length.toString() })}
                        </button>
                    )}
                </div>
            </div>

            <AnimatePresence>
                {(showAdd || editingChild) && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm"
                        onClick={(e) => { if (e.target === e.currentTarget) { setShowAdd(false); setEditingChild(null); } }}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 16 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 16 }}
                            className="bg-white rounded-2xl border-2 border-blue-50 shadow-2xl w-full max-w-2xl mx-4 flex flex-col max-h-[92dvh]"
                        >
                            {/* Header */}
                            <div className="flex justify-between items-center px-8 py-5 border-b border-slate-100 shrink-0">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
                                        <Users className="w-5 h-5 text-blue-500" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-slate-800">{editingChild ? 'Edit Member' : 'Add Member'}</h3>
                                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest leading-none mt-0.5">Profile Details</p>
                                    </div>
                                </div>
                                <button onClick={() => { setShowAdd(false); setEditingChild(null); }} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                                    <X className="w-5 h-5 text-slate-400" />
                                </button>
                            </div>

                            {/* Scrollable form body */}
                            <div className="flex-1 overflow-y-auto px-8 py-6">
                                {renderMemberForm(editingChild || newChild, (val) => {
                                    if (editingChild) setEditingChild(val)
                                    else setNewChild(val)
                                })}
                            </div>

                            {/* Footer actions */}
                            <div className="px-8 py-5 border-t border-slate-100 flex gap-3 shrink-0">
                                <button
                                    onClick={() => handleSave(editingChild || newChild)}
                                    disabled={processing}
                                    className="flex-1 bg-blue-600 text-white rounded-xl font-black py-3.5 shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
                                >
                                    <Save className="w-4 h-4" />
                                    {processing ? t('common.loading') : (editingChild ? t('button.save') : t('button.create'))}
                                </button>
                                <button
                                    onClick={() => {
                                        setShowAdd(false);
                                        setEditingChild(null);
                                        setNicknameTouched(false);
                                        setEditNicknameTouched(false);
                                    }}
                                    className="px-8 bg-slate-100 text-slate-500 rounded-xl font-bold hover:bg-slate-200 transition-all text-sm"
                                >
                                    {t('button.cancel')}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {activeChildren.length === 0 && !showAdd && (
                    <div className="flex flex-col items-center justify-center py-20 text-center gap-6 bg-slate-50 rounded-xl border-2 border-dashed border-slate-100">
                        <Users className="w-16 h-16 text-slate-200" />
                        <p className="text-slate-400 font-bold">{t('parent.noChildren')}</p>
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
                </div>
            )}

            {showLogs && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
                    >
                        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <div className="flex items-center gap-3">
                                <History className="w-6 h-6 text-slate-800" />
                                <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">{t('parent.balanceLogs')}</p>
                            </div>
                            <button onClick={() => setShowLogs(null)} className="p-3 hover:bg-white rounded-2xl transition-all shadow-sm">
                                <X className="w-6 h-6 text-slate-400" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-8 space-y-4">
                            {logs.map((log, i) => (
                                <div key={i} className="flex items-center justify-between p-5 bg-slate-50 rounded-xl border border-slate-100 relative overflow-hidden group hover:border-blue-200 transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg ${log.amount > 0 ? 'bg-green-100 text-green-600' : 'bg-rose-100 text-rose-600'}`}>
                                            {log.amount > 0 ? '+' : ''}{log.amount}
                                        </div>
                                        <div>
                                            <div className="font-black text-slate-700">{log.reason}</div>
                                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{new Date(log.createdAt).toLocaleString()}</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs font-black text-slate-300 uppercase underline decoration-blue-100 underline-offset-4 mb-1">{log.type}</div>
                                        <div className="text-xl font-black text-slate-800">{log.balance}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Confirmation Modals */}
            <AnimatePresence>
                {confirmModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-white w-full max-w-md rounded-xl shadow-2xl p-8 border border-slate-100"
                        >
                            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 mx-auto ${confirmModal.type === 'delete' ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-600'}`}>
                                <AlertTriangle className="w-8 h-8" />
                            </div>
                            <h3 className="text-2xl font-black text-center text-slate-800 mb-2">
                                {confirmModal.type === 'delete' ? t('parent.confirmDelete') : t('parent.confirmArchive')}
                            </h3>
                            <p className="text-center text-slate-500 font-medium mb-8">
                                {confirmModal.type === 'delete'
                                    ? t('parent.confirmDeleteDesc')
                                    : t('parent.confirmArchiveDesc')}
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => confirmModal.type === 'delete' ? handleDelete(confirmModal.childId) : handleArchive(confirmModal.childId)}
                                    disabled={processing}
                                    className={`flex-1 py-4 text-white rounded-2xl font-black transition-all shadow-lg active:scale-95 disabled:opacity-50 ${confirmModal.type === 'delete' ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-200' : 'bg-slate-800 hover:bg-black shadow-slate-200'}`}
                                >
                                    {processing ? t('common.loading') : (confirmModal.type === 'delete' ? t('button.delete') : t('button.apply'))}
                                </button>
                                <button
                                    onClick={() => setConfirmModal(null)}
                                    className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-bold hover:bg-slate-200 transition-all"
                                >
                                    {t('button.cancel')}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}
