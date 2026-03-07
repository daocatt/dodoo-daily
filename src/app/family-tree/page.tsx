'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, User, Network, Save, Trash2, Edit2, Users, ChevronRight, ChevronDown, Check, Camera, Heart, ArrowLeft, Loader2 } from 'lucide-react'
import { useI18n } from '@/contexts/I18nContext'
import { useRouter } from 'next/navigation'
import NatureBackground from '@/components/NatureBackground'
import { getZodiac } from '@/lib/utils'

interface FamilyMember {
    id: string
    name: string
    nickname?: string
    relationship: string
    parentId: string | null
    gender: 'MALE' | 'FEMALE' | 'OTHER'
    notes?: string
    avatarUrl?: string
    birthDate?: Date | string
    zodiac?: string
}

export default function FamilyTreePage() {
    const { t } = useI18n()
    const router = useRouter()
    const [members, setMembers] = useState<FamilyMember[]>([])
    const [loading, setLoading] = useState(true)
    const [editing, setEditing] = useState<Partial<FamilyMember> | null>(null)
    const [showForm, setShowForm] = useState(false)

    const fetchData = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/family/tree')
            const data = await res.json()
            setMembers(data)
        } catch (e) { console.error(e) }
        finally { setLoading(false) }
    }

    useEffect(() => {
        fetchData()
    }, [])

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!editing?.name || !editing?.relationship) return

        const method = editing.id ? 'PATCH' : 'POST'
        const payload = {
            ...editing,
            birthDate: editing.birthDate ? new Date(editing.birthDate) : null
        }
        try {
            const res = await fetch('/api/family/tree', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })
            if (res.ok) {
                setEditing(null)
                setShowForm(false)
                fetchData()
            }
        } catch (e) { console.error(e) }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this family member?')) return
        try {
            await fetch('/api/family/tree', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            })
            fetchData()
        } catch (e) { console.error(e) }
    }

    const renderNode = (member: FamilyMember, depth: number = 0) => {
        const children = members.filter(m => m.parentId === member.id)

        return (
            <div key={member.id} className="flex flex-col items-center">
                {/* Member Card */}
                <motion.div
                    layout
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className={`relative z-10 w-48 p-4 rounded-3xl border-2 transition-all group ${member.gender === 'MALE' ? 'bg-blue-50 border-blue-100' :
                        member.gender === 'FEMALE' ? 'bg-rose-50 border-rose-100' :
                            'bg-slate-50 border-slate-100'
                        } shadow-md hover:shadow-xl hover:-translate-y-1 mb-6`}
                >
                    <div className="flex flex-col items-center text-center gap-2">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner ${member.gender === 'MALE' ? 'bg-blue-100/50' :
                            member.gender === 'FEMALE' ? 'bg-rose-100/50' :
                                'bg-slate-200/50'
                            }`}>
                            <User className={`w-7 h-7 ${member.gender === 'MALE' ? 'text-blue-500' :
                                member.gender === 'FEMALE' ? 'text-rose-500' :
                                    'text-slate-400'
                                }`} />
                        </div>
                        <div>
                            <div className="font-black text-slate-800 text-sm leading-tight mb-1">
                                {member.name}
                                {member.nickname && <span className="text-[10px] text-slate-400 block font-bold">({member.nickname})</span>}
                            </div>
                            <div className="flex flex-col gap-1 items-center mt-1">
                                <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-2 py-0.5 bg-white/50 rounded-full inline-block">
                                    {member.relationship}
                                </div>
                                {member.zodiac && (
                                    <div className="text-[8px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full inline-block">
                                        {member.zodiac}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="absolute -top-2 -right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { setEditing(member); setShowForm(true); }} className="p-1.5 bg-white shadow-md rounded-lg text-slate-400 hover:text-blue-500 transition-colors">
                            <Edit2 className="w-3 h-3" />
                        </button>
                        <button onClick={() => handleDelete(member.id)} className="p-1.5 bg-white shadow-md rounded-lg text-slate-400 hover:text-rose-500 transition-colors">
                            <Trash2 className="w-3 h-3" />
                        </button>
                    </div>

                    {/* Add Child Connector */}
                    <button
                        onClick={() => { setEditing({ parentId: member.id, gender: 'OTHER' }); setShowForm(true); }}
                        className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-8 h-8 bg-white border-2 border-slate-100 rounded-full flex items-center justify-center shadow-md text-slate-300 hover:text-emerald-500 hover:border-emerald-100 transition-all active:scale-95"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                </motion.div>

                {/* Vertical Line Connector */}
                {children.length > 0 && (
                    <div className="w-0.5 h-6 bg-slate-200 relative">
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-max h-0.5 bg-slate-200" style={{ width: children.length > 1 ? `${(children.length - 1) * 12}rem` : '0' }} />
                    </div>
                )}

                {/* Children Row */}
                <div className="flex gap-8">
                    {children.map(child => renderNode(child, depth + 1))}
                </div>
            </div>
        )
    }

    const roots = members.filter(m => !m.parentId || !members.find(parent => parent.id === m.parentId))

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col relative overflow-hidden">
            <NatureBackground />

            {/* Header */}
            <header className="relative z-10 p-6 md:p-10 flex items-center justify-between backdrop-blur-md bg-white/40 border-b border-slate-200 shrink-0">
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => router.push('/')}
                        className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 text-slate-400 hover:text-slate-600 hover:shadow-md transition-all active:scale-95"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                            <Network className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-slate-800 tracking-tight leading-none">{t('hud.familyTree')}</h1>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">{t('family.generations')}</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => { setEditing({ gender: 'OTHER' }); setShowForm(true); }}
                        className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-black shadow-xl hover:bg-black transition-all active:scale-95"
                    >
                        <Plus className="w-5 h-5" />
                        {t('family.addMember')}
                    </button>
                </div>
            </header>

            {/* Tree View - Full Height/Scrollable */}
            <main className="relative z-10 flex-1 overflow-auto p-12 flex justify-center content-start">
                {loading ? (
                    <div className="flex flex-col items-center justify-center gap-4 py-20">
                        <Loader2 className="w-10 h-10 animate-spin text-emerald-400" />
                        <p className="text-slate-400 font-black uppercase tracking-widest text-xs">{t('family.growing')}</p>
                    </div>
                ) : roots.length > 0 ? (
                    <div className="flex gap-20 items-start justify-center min-w-max pt-10 px-20">
                        {roots.map(root => renderNode(root))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center gap-6 self-center">
                        <div className="w-32 h-32 bg-white rounded-[2.5rem] flex items-center justify-center shadow-xl shadow-emerald-900/5">
                            <Users className="w-16 h-16 text-slate-200" />
                        </div>
                        <div className="space-y-2">
                            <p className="text-slate-400 font-black text-xl">{t('family.emptyForest')}</p>
                            <p className="text-slate-300 font-medium max-w-xs">{t('family.emptyForestSub')}</p>
                        </div>
                        <button
                            onClick={() => { setEditing({ gender: 'OTHER' }); setShowForm(true); }}
                            className="px-8 py-4 bg-emerald-500 text-white rounded-[1.5rem] font-black shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all active:scale-95 flex items-center gap-2"
                        >
                            <Plus className="w-5 h-5" /> {t('family.startFirstRoot')}
                        </button>
                    </div>
                )}
            </main>

            {/* Form Modal */}
            <AnimatePresence>
                {showForm && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl p-8 md:p-10 border border-emerald-50"
                        >
                            <header className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                                        <User className="w-6 h-6 text-emerald-600" />
                                    </div>
                                    <h3 className="text-2xl font-black text-slate-800">{editing?.id ? t('family.editMember') : t('family.addMember')}</h3>
                                </div>
                                <button onClick={() => { setShowForm(false); setEditing(null); }} className="p-2 hover:bg-slate-50 rounded-xl transition-colors">
                                    <X className="w-5 h-5 text-slate-400" />
                                </button>
                            </header>

                            <form onSubmit={handleSave} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">{t('family.memberName')}</label>
                                    <input
                                        autoFocus
                                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold transition-all focus:ring-4 focus:ring-emerald-50 outline-none"
                                        placeholder={t('family.namePlaceholder')}
                                        value={editing?.name || ''}
                                        onChange={e => setEditing({ ...editing, name: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">{t('family.relationship')}</label>
                                    <input
                                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold transition-all focus:ring-4 focus:ring-emerald-50 outline-none"
                                        placeholder={t('family.relationshipPlaceholder')}
                                        value={editing?.relationship || ''}
                                        onChange={e => setEditing({ ...editing, relationship: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">{t('parent.gender')}</label>
                                    <div className="flex gap-2">
                                        {(['MALE', 'FEMALE', 'OTHER'] as const).map(g => (
                                            <button
                                                key={g}
                                                type="button"
                                                onClick={() => setEditing({ ...editing, gender: g })}
                                                className={`flex-1 py-3 rounded-xl font-bold text-xs transition-all ${editing?.gender === g
                                                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200'
                                                    : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                                                    }`}
                                            >
                                                {t(`gender.${g.toLowerCase()}` as any)}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">{t('parent.nickname')}</label>
                                        <input
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl font-bold transition-all focus:ring-4 focus:ring-emerald-50 outline-none"
                                            placeholder="Nickname"
                                            value={editing?.nickname || ''}
                                            onChange={e => setEditing({ ...editing, nickname: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">{t('family.parent')}</label>
                                        <select
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none appearance-none"
                                            value={editing?.parentId || ''}
                                            onChange={e => setEditing({ ...editing, parentId: e.target.value || null })}
                                        >
                                            <option value="">{t('family.none')}</option>
                                            {members.filter(m => m.id !== editing?.id).map(m => (
                                                <option key={m.id} value={m.id}>{m.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">{t('parent.birthDate')}</label>
                                        <input
                                            type="date"
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl font-bold transition-all focus:ring-4 focus:ring-emerald-50 outline-none"
                                            value={editing?.birthDate ? new Date(editing.birthDate).toISOString().split('T')[0] : ''}
                                            onChange={e => {
                                                const date = e.target.value ? new Date(e.target.value) : undefined
                                                setEditing({
                                                    ...editing,
                                                    birthDate: date,
                                                    zodiac: date ? getZodiac(date) : undefined
                                                })
                                            }}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">{t('parent.zodiac')}</label>
                                        <div className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-2xl font-black text-slate-400 flex items-center shadow-inner text-sm">
                                            {editing?.zodiac || '---'}
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 flex gap-3">
                                    <button
                                        type="submit"
                                        className="flex-1 bg-emerald-500 text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-emerald-200 hover:bg-emerald-600 active:scale-95"
                                    >
                                        {editing?.id ? t('family.updateMember') : t('family.addToTree')}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => { setShowForm(false); setEditing(null); }}
                                        className="px-6 bg-slate-100 text-slate-500 font-bold rounded-2xl hover:bg-slate-200 transition-all"
                                    >
                                        {t('button.cancel')}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}
