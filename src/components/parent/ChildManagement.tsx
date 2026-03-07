'use client'

import React, { useState, useEffect } from 'react'
import { Plus, Archive, Trash2, Edit2, Check, X, Camera, BarChart3, History } from 'lucide-react'
import { useI18n } from '@/contexts/I18nContext'

interface Child {
    id: string
    name: string
    avatarUrl: string | null
    isArchived: boolean
    isDeleted: boolean
    stats?: {
        currency: number
        goldStars: number
        purpleStars: number
        angerPenalties: number
    }
}

export default function ChildManagement() {
    const { t } = useI18n()
    const [children, setChildren] = useState<Child[]>([])
    const [loading, setLoading] = useState(true)
    const [editing, setEditing] = useState<string | null>(null)
    const [showAdd, setShowAdd] = useState(false)
    const [newChild, setNewChild] = useState({ name: '', pin: '' })
    const [showLogs, setShowLogs] = useState<string | null>(null)
    const [logs, setLogs] = useState<any[]>([])
    const [adjusting, setAdjusting] = useState<string | null>(null)
    const [adjData, setAdjData] = useState({ type: 'CURRENCY', amount: 0, reason: '' })

    const fetchChildren = async () => {
        try {
            const res = await fetch('/api/parent/children')
            const data = await res.json()
            setChildren(data)
        } catch (e) { console.error(e) }
        finally { setLoading(false) }
    }

    useEffect(() => { fetchChildren() }, [])

    const handleAdd = async () => {
        if (!newChild.name) return
        try {
            await fetch('/api/parent/children', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newChild)
            })
            setNewChild({ name: '', pin: '' })
            setShowAdd(false)
            fetchChildren()
        } catch (e) { console.error(e) }
    }

    const handleUpdate = async (id: string, data: any) => {
        try {
            await fetch('/api/parent/children', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, ...data })
            })
            fetchChildren()
        } catch (e) { console.error(e) }
    }

    const handleAdjust = async () => {
        if (!adjusting || !adjData.reason) return
        try {
            await fetch('/api/parent/stats', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: adjusting, ...adjData })
            })
            setAdjusting(null)
            setAdjData({ type: 'CURRENCY', amount: 0, reason: '' })
            fetchChildren()
        } catch (e) { console.error(e) }
    }

    const fetchLogs = async (userId: string) => {
        try {
            const res = await fetch(`/api/parent/stats?userId=${userId}`)
            const data = await res.json()
            setLogs(data)
            setShowLogs(userId)
        } catch (e) { console.error(e) }
    }

    const handleAvatarUpload = async (userId: string, file: File) => {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('userId', userId)
        try {
            await fetch('/api/upload/avatar', {
                method: 'POST',
                body: formData
            })
            fetchChildren()
        } catch (e) { console.error(e) }
    }

    if (loading) return <div>Loading...</div>

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">{t('parent.family')}</h2>
                <button
                    onClick={() => setShowAdd(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    {t('button.add')}
                </button>
            </div>

            {showAdd && (
                <div className="bg-white p-6 rounded-3xl border border-blue-100 shadow-sm space-y-4">
                    <h3 className="font-bold">Add Child</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <input
                            type="text"
                            placeholder="Name"
                            className="px-4 py-2 border rounded-xl"
                            value={newChild.name}
                            onChange={e => setNewChild({ ...newChild, name: e.target.value })}
                        />
                        <input
                            type="text"
                            placeholder="PIN (Optional, min 4)"
                            className="px-4 py-2 border rounded-xl"
                            value={newChild.pin}
                            onChange={e => setNewChild({ ...newChild, pin: e.target.value })}
                        />
                        <div className="flex gap-2">
                            <button onClick={handleAdd} className="flex-1 bg-blue-500 text-white rounded-xl font-bold py-2">Create</button>
                            <button onClick={() => setShowAdd(false)} className="px-4 border rounded-xl">Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {children.filter(c => !c.isDeleted).map(child => (
                    <div key={child.id} className={`bg-white p-6 rounded-3xl border ${child.isArchived ? 'border-slate-200 bg-slate-50' : 'border-slate-100'} shadow-sm space-y-4`}>
                        <div className="flex items-start gap-4">
                            <div className="relative group overflow-hidden rounded-2xl w-16 h-16 bg-slate-100 flex items-center justify-center shrink-0">
                                {child.avatarUrl ? (
                                    <img src={child.avatarUrl} alt={child.name} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-2xl font-bold text-slate-400 capitalize">{child.name[0]}</span>
                                )}
                                <label className="absolute inset-x-0 bottom-0 bg-black/50 text-white text-[10px] flex items-center justify-center py-1 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Camera className="w-3 h-3 mr-1" />
                                    Change
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={e => e.target.files?.[0] && handleAvatarUpload(child.id, e.target.files[0])}
                                    />
                                </label>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <h3 className="text-lg font-bold truncate">{child.name}</h3>
                                    {child.isArchived && <span className="bg-slate-200 text-slate-600 text-[10px] px-2 py-0.5 rounded-full uppercase">Archived</span>}
                                </div>
                                <div className="mt-1 flex gap-3 text-xs text-slate-500">
                                    <span className="flex items-center gap-1"><BarChart3 className="w-3 h-3" /> Coins: {child.stats?.currency || 0}</span>
                                    <span className="flex items-center gap-1">Stars: {child.stats?.goldStars || 0}G / {child.stats?.purpleStars || 0}P</span>
                                </div>
                            </div>
                            <div className="flex gap-1 shrink-0">
                                <button
                                    onClick={() => handleUpdate(child.id, { isArchived: !child.isArchived })}
                                    className="p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-500"
                                    title={child.isArchived ? "Unarchive" : "Archive"}
                                >
                                    <Archive className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => handleUpdate(child.id, { isDeleted: true })}
                                    className="p-2 rounded-lg hover:bg-red-50 transition-colors text-red-400"
                                    title="Delete"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        <div className="pt-2 flex flex-wrap gap-2">
                            <button
                                onClick={() => setAdjusting(adjusting === child.id ? null : child.id)}
                                className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-sm font-semibold hover:bg-blue-100 transition-colors"
                            >
                                Manual Adjust
                            </button>
                            <button
                                onClick={() => fetchLogs(child.id)}
                                className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-semibold hover:bg-indigo-100 transition-colors flex items-center gap-1.5"
                            >
                                <History className="w-4 h-4" /> Logs
                            </button>
                        </div>

                        {adjusting === child.id && (
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <select
                                        className="px-3 py-1.5 border rounded-lg text-sm"
                                        value={adjData.type}
                                        onChange={e => setAdjData({ ...adjData, type: e.target.value })}
                                    >
                                        <option value="CURRENCY">Currency</option>
                                        <option value="GOLD_STAR">Gold Stars</option>
                                        <option value="PURPLE_STAR">Purple Stars</option>
                                        <option value="ANGER_PENALTY">Anger Penalty</option>
                                    </select>
                                    <input
                                        type="number"
                                        placeholder="Amount (+/-)"
                                        className="px-3 py-1.5 border rounded-lg text-sm"
                                        onChange={e => setAdjData({ ...adjData, amount: parseInt(e.target.value) })}
                                    />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Reason (e.g., Good Behavior Bonus)"
                                    className="w-full px-3 py-1.5 border rounded-lg text-sm"
                                    value={adjData.reason}
                                    onChange={e => setAdjData({ ...adjData, reason: e.target.value })}
                                />
                                <div className="flex gap-2">
                                    <button onClick={handleAdjust} className="flex-1 bg-blue-500 text-white rounded-lg text-sm font-bold py-1.5">Apply</button>
                                    <button onClick={() => setAdjusting(null)} className="px-3 border rounded-lg text-sm">Cancel</button>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {showLogs && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/20 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-2xl max-h-[80vh] overflow-hidden rounded-3xl shadow-xl flex flex-col">
                        <div className="p-6 border-b flex justify-between items-center">
                            <h3 className="text-xl font-bold flex items-center gap-2">
                                <History className="w-6 h-6 text-indigo-500" />
                                Activity Logs
                            </h3>
                            <button onClick={() => setShowLogs(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                                <X className="w-6 h-6 text-slate-400" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {logs.length === 0 ? (
                                <p className="text-center text-slate-400 py-12">No logs found</p>
                            ) : (
                                logs.map(log => (
                                    <div key={log.id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${log.amount >= 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                            <span className="font-bold">{log.amount > 0 ? '+' : ''}{log.amount}</span>
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-baseline">
                                                <span className="font-semibold text-slate-700">{log.type}</span>
                                                <span className="text-[10px] text-slate-400">{new Date(log.createdAt).toLocaleString()}</span>
                                            </div>
                                            <p className="text-sm text-slate-500">{log.reason}</p>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-[10px] text-slate-400">Balance</div>
                                            <div className="font-bold text-slate-600">{log.balance}</div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
