'use client'

import React, { useEffect, useState } from 'react'
import { Users, UserCheck, UserX, Search, Loader2, Coins, Ticket, Plus, Trash2, ShieldAlert, Globe, MessageSquare, Mail, Phone, Clock, Check, AlertTriangle, ShoppingBag, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useI18n } from '@/contexts/I18nContext'

interface Visitor {
    id: string
    name: string
    email: string | null
    phone: string | null
    status: 'PENDING' | 'APPROVED' | 'BANNED'
    currency: number
    lastIp: string | null
    createdAt: string
}

interface VisitorOrder {
    id: string
    artworkTitle: string
    createdAt: string
}
interface RechargeCode {
    id: string
    code: string
    amount: number
    isUsed: boolean
    usedAt: string | null
    createdAt: string
}

interface IpBlacklist {
    id: string
    ip: string
    reason: string | null
    createdAt: string
}

interface VisitorMessage {
    id: string
    text: string
    isPublic: boolean
    createdAt: string
    visitorName: string | null
    memberName: string | null
    memberNickname: string | null
    targetUserName: string
}

export default function VisitorManagement() {
    const { t } = useI18n()
    const [visitors, setVisitors] = useState<Visitor[]>([])
    const [rechargeCodes, setRechargeCodes] = useState<RechargeCode[]>([])
    const [ipBlacklist, setIpBlacklist] = useState<IpBlacklist[]>([])
    const [messages, setMessages] = useState<VisitorMessage[]>([])
    
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [activeTab, setActiveTab] = useState<'VISITORS' | 'CODES' | 'CONTROL' | 'IP' | 'MESSAGES'>('VISITORS')
    const [processingId, setProcessingId] = useState<string | null>(null)
    
    // Form states
    const [codeAmount, setCodeAmount] = useState(100)
    const [adjustAmount, setAdjustAmount] = useState(0)
    const [adjustReason, setAdjustReason] = useState('')
    const [showAdjustModal, setShowAdjustModal] = useState<string | null>(null)
    const [showOrdersModal, setShowOrdersModal] = useState<string | null>(null)
    const [visitorOrders, setVisitorOrders] = useState<VisitorOrder[]>([])
    const [ordersLoading, setOrdersLoading] = useState(false)
    const [newIp, setNewIp] = useState('')
    const [newIpReason, setNewIpReason] = useState('')

    // System Settings for Visitor Control
    const [requireVisitorApproval, setRequireVisitorApproval] = useState(true)
    const [requireInvitationCode, setRequireInvitationCode] = useState(false)
    const [visitorInvitationCode, setVisitorInvitationCode] = useState('')
    const [disableVisitorLogin, setDisableVisitorLogin] = useState(false)
    const [disableVisitorRegistration, setDisableVisitorRegistration] = useState(false)
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
    const [isSaving, setIsSaving] = useState(false)

    const fetchData = async () => {
        setLoading(true)
        try {
            const [gRes, cRes, iRes, sRes, mRes] = await Promise.all([
                fetch('/api/parent/visitors'),
                fetch('/api/parent/recharge-codes'),
                fetch('/api/parent/ip-blacklist'),
                fetch('/api/system/settings'),
                fetch('/api/parent/visitor/messages')
            ])
            if (gRes.ok) setVisitors(await gRes.json())
            if (cRes.ok) setRechargeCodes(await cRes.json())
            if (iRes.ok) setIpBlacklist(await iRes.json())
            if (mRes.ok) setMessages(await mRes.json())
            if (sRes.ok) {
                const sData = await sRes.json();
                setRequireVisitorApproval(sData.requireVisitorApproval ?? true)
                setRequireInvitationCode(sData.requireInvitationCode ?? false)
                setVisitorInvitationCode(sData.visitorInvitationCode || '')
                setDisableVisitorLogin(sData.disableVisitorLogin ?? false)
                setDisableVisitorRegistration(sData.disableVisitorRegistration ?? false)
            }
        } catch (e) {
            console.error('Failed to fetch visitor management data:', e)
        } finally {
            setLoading(false)
        }
    }

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ message, type })
        setTimeout(() => setToast(null), 3000)
    }

    useEffect(() => {
        fetchData()
        
        // Handle direct tab access from URL
        const params = new URLSearchParams(window.location.search)
        const qTab = params.get('tab') as 'VISITORS' | 'CODES' | 'CONTROL' | 'IP' | 'MESSAGES' | null
        if (qTab && ['VISITORS', 'CODES', 'CONTROL', 'IP', 'MESSAGES'].includes(qTab)) {
            setActiveTab(qTab)
        }
    }, [])

    const handleVisitorAction = async (id: string, action: 'APPROVE' | 'BAN' | 'DELETE') => {
        setProcessingId(id)
        try {
            const res = await fetch(`/api/parent/visitors/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action })
            })
            if (res.ok) {
                if (action === 'DELETE') {
                    setVisitors(prev => prev.filter(g => g.id !== id))
                } else {
                    const newStatus = action === 'APPROVE' ? 'APPROVED' : 'BANNED'
                    setVisitors(prev => prev.map(g => g.id === id ? { ...g, status: newStatus } : g))
                }
            }
        } finally {
            setProcessingId(null)
        }
    }

    const handleGenerateCode = async () => {
        if (codeAmount <= 0) return
        setProcessingId('generating')
        try {
            const res = await fetch('/api/parent/recharge-codes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount: codeAmount })
            })
            if (res.ok) {
                const newCode = await res.json()
                setRechargeCodes(prev => [newCode, ...prev])
            }
        } finally {
            setProcessingId(null)
        }
    }

    const handleAdjustCoins = async () => {
        if (!showAdjustModal || adjustAmount === 0) return
        setProcessingId(showAdjustModal)
        try {
            const res = await fetch(`/api/parent/visitors/${showAdjustModal}/adjust-coins`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount: adjustAmount, reason: adjustReason || t('visitors.modal.adjustDefaultReason') })
            })
            if (res.ok) {
                setVisitors(prev => prev.map(g => g.id === showAdjustModal ? { ...g, currency: g.currency + adjustAmount } : g))
                setShowAdjustModal(null)
                setAdjustAmount(0)
                setAdjustReason('')
            }
        } finally {
            setProcessingId(null)
        }
    }

    const handleViewOrders = async (id: string) => {
        setShowOrdersModal(id)
        setOrdersLoading(true)
        try {
            const res = await fetch(`/api/visitor/orders?visitorId=${id}`)
            if (res.ok) setVisitorOrders(await res.json())
        } finally {
            setOrdersLoading(false)
        }
    }

    const handleAddIp = async () => {
        if (!newIp) return
        setProcessingId('adding-ip')
        try {
            const res = await fetch('/api/parent/ip-blacklist', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ip: newIp, reason: newIpReason })
            })
            if (res.ok) {
                const newItem = await res.json()
                setIpBlacklist(prev => [newItem, ...prev])
                setNewIp('')
                setNewIpReason('')
            }
        } finally {
            setProcessingId(null)
        }
    }

    const handleRemoveIp = async (id: string) => {
        setProcessingId(id)
        try {
            const res = await fetch(`/api/parent/ip-blacklist/${id}`, { method: 'DELETE' })
            if (res.ok) setIpBlacklist(prev => prev.filter(item => item.id !== id))
        } finally {
            setProcessingId(null)
        }
    }

    const handleUpdateSettings = async (updates: Record<string, unknown>) => {
        setIsSaving(true)
        try {
            const res = await fetch('/api/system/settings', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
            })
            if (res.ok) {
                if (updates.requireVisitorApproval !== undefined) setRequireVisitorApproval(updates.requireVisitorApproval as boolean)
                if (updates.requireInvitationCode !== undefined) setRequireInvitationCode(updates.requireInvitationCode as boolean)
                if (updates.visitorInvitationCode !== undefined) setVisitorInvitationCode(updates.visitorInvitationCode as string)
                if (updates.disableVisitorLogin !== undefined) setDisableVisitorLogin(updates.disableVisitorLogin as boolean)
                if (updates.disableVisitorRegistration !== undefined) setDisableVisitorRegistration(updates.disableVisitorRegistration as boolean)
                showToast(t('visitors.control.updateSuccess'))
            } else {
                showToast('Update failed!', 'error')
            }
        } catch (e) {
            console.error('Failed to update visitor settings', e)
            showToast('Network error', 'error')
        } finally {
            setIsSaving(false)
        }
    }

    const handleToggleMessagePublic = async (id: string, current: boolean) => {
        setProcessingId(id)
        try {
            const res = await fetch('/api/parent/visitor/messages', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, isPublic: !current })
            })
            if (res.ok) {
                setMessages(prev => prev.map(m => m.id === id ? { ...m, isPublic: !current } : m))
                showToast('Message visibility updated')
            }
        } finally {
            setProcessingId(null)
        }
    }

    const handleDeleteMessage = async (id: string) => {
        if (!confirm('Are you sure you want to delete this message?')) return
        setProcessingId(id)
        try {
            const res = await fetch(`/api/parent/visitor/messages?id=${id}`, { method: 'DELETE' })
            if (res.ok) {
                setMessages(prev => prev.filter(m => m.id !== id))
                showToast('Message deleted')
            }
        } finally {
            setProcessingId(null)
        }
    }

    const filteredVisitors = visitors.filter(g => 
        g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.phone?.includes(searchTerm)
    )

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-4" />
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">{t('visitors.loading')}</p>
            </div>
        )
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-20 relative">
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: -50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -50 }}
                        className={`fixed top-8 left-1/2 -translate-x-1/2 z-[200] px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 font-bold text-white ${toast.type === 'success' ? 'bg-[#43aa8b]' : 'bg-rose-500'}`}
                    >
                        {toast.type === 'success' ? <Check className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                        {toast.message}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header & Tabs */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                        <Users className="w-8 h-8 text-indigo-500" />
                        {t('visitors.title')}
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">{t('visitors.subtitle')}</p>
                </div>

                <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto min-w-full md:min-w-0">
                    {(['VISITORS', 'MESSAGES', 'CODES', 'CONTROL', 'IP'] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all ${activeTab === tab ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            {tab === 'VISITORS' ? t('visitors.tabs.visitors') : tab === 'MESSAGES' ? t('visitors.tabs.messages') || 'Messages' : tab === 'CODES' ? t('visitors.tabs.codes') : tab === 'CONTROL' ? t('visitors.tabs.control') : t('visitors.tabs.ip')}
                        </button>
                    ))}
                </div>
            </div>

            {/* TAB: VISITORS */}
            {activeTab === 'VISITORS' && (
                <div className="space-y-6">
                    <div className="relative max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                            type="text"
                            placeholder={t('visitors.searchPlaceholder')}
                            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-indigo-100 outline-none shadow-sm"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <AnimatePresence mode="popLayout">
                            {filteredVisitors.map((visitor) => (
                                <motion.div
                                    key={visitor.id}
                                    layout
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-4 hover:shadow-xl transition-all group"
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center font-black text-indigo-600 text-xl">
                                                {visitor.name[0].toUpperCase()}
                                            </div>
                                            <div>
                                                <h3 className="font-black text-slate-800 text-lg leading-none">{visitor.name}</h3>
                                                <div className="flex items-center gap-4 mt-2">
                                                    <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest leading-none ${
                                                        visitor.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-600' : 
                                                        visitor.status === 'PENDING' ? 'bg-amber-100 text-amber-600' : 'bg-rose-100 text-rose-600'
                                                    }`}>
                                                        {visitor.status === 'APPROVED' ? t('visitors.status.approved') : visitor.status === 'PENDING' ? t('visitors.status.pending') : t('visitors.status.banned')}
                                                    </span>
                                                    <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                                        <Clock className="w-3 h-3" />
                                                        {new Date(visitor.createdAt).toLocaleDateString()}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 bg-indigo-50 px-3 py-2 rounded-xl">
                                            <Coins className="w-4 h-4 text-amber-500" />
                                            <span className="font-black text-indigo-700">{visitor.currency}</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 py-2 border-y border-slate-50">
                                        <div className="flex items-center gap-2 text-xs text-slate-500 overflow-hidden">
                                            <Mail className="w-3.5 h-3.5 text-slate-300" />
                                            <span className="truncate">{visitor.email || 'N/A'}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-slate-500 overflow-hidden">
                                            <Phone className="w-3.5 h-3.5 text-slate-300" />
                                            <span className="truncate">{visitor.phone || 'N/A'}</span>
                                        </div>
                                        {visitor.lastIp && (
                                            <div className="flex items-center gap-2 text-xs text-slate-400 col-span-2">
                                                <Globe className="w-3.5 h-3.5 text-slate-300" />
                                                IP: {visitor.lastIp}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between gap-3 pt-2">
                                        <div className="flex gap-2">
                                            {visitor.status !== 'APPROVED' && (
                                                <button 
                                                    onClick={() => handleVisitorAction(visitor.id, 'APPROVE')}
                                                    disabled={!!processingId}
                                                    className="p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-500 hover:text-white transition-all shadow-sm"
                                                    title={t('visitors.action.approve')}
                                                >
                                                    <UserCheck className="w-5 h-5" />
                                                </button>
                                            )}
                                            {visitor.status !== 'BANNED' && (
                                                <button 
                                                    onClick={() => handleVisitorAction(visitor.id, 'BAN')}
                                                    disabled={!!processingId}
                                                    className="p-2 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                                                    title={t('visitors.action.ban')}
                                                >
                                                    <UserX className="w-5 h-5" />
                                                </button>
                                            )}
                                        </div>
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => handleViewOrders(visitor.id)}
                                                className="p-2 bg-slate-50 text-indigo-500 rounded-xl hover:bg-white hover:shadow-md transition-all border border-slate-100"
                                                title={t('visitors.action.viewOrders')}
                                            >
                                                <ShoppingBag className="w-5 h-5" />
                                            </button>
                                            <button 
                                                onClick={() => setShowAdjustModal(visitor.id)}
                                                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all shadow-sm whitespace-nowrap"
                                            >
                                                {t('visitors.action.adjustCoins')}
                                            </button>
                                            <button 
                                                onClick={() => handleVisitorAction(visitor.id, 'DELETE')}
                                                disabled={!!processingId}
                                                className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:bg-rose-500 hover:text-white transition-all opacity-0 group-hover:opacity-100 shadow-sm"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        {filteredVisitors.length === 0 && (
                            <div className="py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-xs bg-white rounded-3xl border-2 border-dashed border-slate-100 col-span-full">
                                {t('visitors.noRecords')}
                            </div>
                        )}
                        </AnimatePresence>
                    </div>
                </div>
            )}
            {/* TAB: MESSAGES */}
            {activeTab === 'MESSAGES' && (
                <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-100">
                                    <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Content</th>
                                    <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">From</th>
                                    <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Target</th>
                                    <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                                    <th className="px-6 py-5 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {messages.map(msg => (
                                    <tr key={msg.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-8 py-6">
                                            <p className="text-sm font-bold text-slate-700 leading-relaxed max-w-md italic">&ldquo;{msg.text}&rdquo;</p>
                                            <p className="text-[10px] font-bold text-slate-300 mt-1 uppercase tracking-tighter">{new Date(msg.createdAt).toLocaleString()}</p>
                                        </td>
                                        <td className="px-6 py-6">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-black text-slate-600 uppercase tracking-tight">
                                                    {msg.memberNickname || msg.memberName || msg.visitorName || 'ANONYMOUS'}
                                                </span>
                                                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                                    {msg.visitorName ? 'Visitor' : 'Family'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6">
                                            <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-widest cursor-default">
                                                @{msg.targetUserName}
                                            </span>
                                        </td>
                                        <td className="px-6 py-6">
                                            <button 
                                                onClick={() => handleToggleMessagePublic(msg.id, msg.isPublic)}
                                                disabled={processingId === msg.id}
                                                className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-all ${msg.isPublic ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                                            >
                                                <div className={`w-1.5 h-1.5 rounded-full ${msg.isPublic ? 'bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]' : 'bg-slate-300'}`} />
                                                {msg.isPublic ? 'Public' : 'Private'}
                                            </button>
                                        </td>
                                        <td className="px-6 py-6 text-right">
                                            <button 
                                                onClick={() => handleDeleteMessage(msg.id)}
                                                disabled={processingId === msg.id}
                                                className="p-2.5 bg-rose-50 text-rose-400 rounded-xl hover:bg-rose-100 hover:text-rose-600 transition-all active:scale-95"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {messages.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-8 py-20 text-center">
                                            <div className="flex flex-col items-center gap-3 opacity-30">
                                                <MessageSquare className="w-12 h-12" />
                                                <p className="label-mono text-[10px] font-black uppercase tracking-widest">No communications recorded</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* TAB: CODES */}
            {activeTab === 'CODES' && (
                <div className="space-y-8">
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 max-w-xl">
                        <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
                            <Ticket className="w-6 h-6 text-indigo-500" />
                            {t('visitors.codes.generateTitle')}
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 block">{t('visitors.codes.amountLabel')}</label>
                                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                                    <input 
                                        type="number"
                                        className="flex-1 px-5 py-4 bg-slate-50 border-none rounded-2xl font-black text-indigo-600 focus:ring-4 focus:ring-indigo-100 outline-none text-xl min-w-0"
                                        value={codeAmount}
                                        onChange={e => setCodeAmount(parseInt(e.target.value))}
                                    />
                                    <button 
                                        onClick={handleGenerateCode}
                                        disabled={!!processingId}
                                        className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 disabled:grayscale whitespace-nowrap shrink-0"
                                    >
                                        {processingId === 'generating' ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : t('visitors.codes.generateBtn')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-x-auto scrollbar-hide">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50">
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{t('visitors.codes.tableCode')}</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">{t('visitors.codes.tableAmount')}</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-center">{t('visitors.codes.tableStatus')}</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">{t('visitors.codes.tableDate')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rechargeCodes.map((code) => (
                                    <tr key={code.id} className="border-t border-slate-50 hover:bg-slate-50/30 transition-colors">
                                        <td className="px-8 py-5 font-mono font-black text-indigo-600 text-lg uppercase tracking-wider">{code.code}</td>
                                        <td className="px-8 py-5 text-right">
                                            <span className="font-black text-slate-700 text-lg">+{code.amount}</span>
                                        </td>
                                        <td className="px-8 py-5 text-center whitespace-nowrap">
                                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${code.isUsed ? 'bg-slate-100 text-slate-400' : 'bg-emerald-100 text-emerald-600'}`}>
                                                {code.isUsed ? t('visitors.codes.statusUsed') : t('visitors.codes.statusUnused')}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 text-right text-xs text-slate-400 font-bold uppercase whitespace-nowrap">
                                            {new Date(code.createdAt).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                                {rechargeCodes.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-8 py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">{t('visitors.noRecords')}</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* TAB: IP BLACKLIST */}
            {activeTab === 'IP' && (
                <div className="space-y-6">
                    <div className="bg-white p-6 sm:p-8 rounded-3xl border border-rose-100 shadow-sm shadow-rose-50 max-w-2xl">
                        <h3 className="text-xl font-black text-slate-800 mb-4 flex items-center gap-2">
                            <ShieldAlert className="w-6 h-6 text-rose-500" />
                            {t('visitors.ip.title')}
                        </h3>
                        <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                            {t('visitors.ip.description')}
                        </p>
                        
                        <div className="space-y-4 mb-8 p-4 sm:p-6 bg-slate-50 rounded-2xl border border-slate-100">
                            <h4 className="text-xs font-black uppercase tracking-widest text-slate-800 flex items-center gap-2">
                                <Plus className="w-3.5 h-3.5" />
                                {t('visitors.ip.addTitle')}
                            </h4>
                             <div className="flex flex-col lg:flex-row gap-3">
                                <input 
                                    type="text"
                                    placeholder={t('visitors.ip.placeholder')}
                                    className="flex-1 px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:ring-4 focus:ring-indigo-100 outline-none transition-all shadow-sm min-w-0"
                                    value={newIp}
                                    onChange={e => setNewIp(e.target.value)}
                                />
                                <input 
                                    type="text"
                                    placeholder={t('visitors.ip.reasonPlaceholder')}
                                    className="flex-[1.5] px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:ring-4 focus:ring-indigo-100 outline-none transition-all shadow-sm min-w-0"
                                    value={newIpReason}
                                    onChange={e => setNewIpReason(e.target.value)}
                                />
                                <button 
                                    onClick={handleAddIp}
                                    disabled={!newIp || processingId === 'adding-ip'}
                                    className="px-6 py-3 bg-rose-600 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-rose-100 hover:bg-rose-700 transition-all active:scale-95 disabled:grayscale whitespace-nowrap shrink-0"
                                >
                                    {processingId === 'adding-ip' ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : t('visitors.ip.addBtn')}
                                </button>
                            </div>
                        </div>

                        <div className="text-[10px] text-rose-400 font-black uppercase tracking-[0.2em] mb-2 px-1">{t('visitors.ip.countLabel', { count: ipBlacklist.length.toString() })}</div>
                        <div className="space-y-2">
                            {ipBlacklist.map(item => (
                                <div key={item.id} className="flex items-center justify-between p-4 bg-rose-50/50 rounded-2xl border border-rose-50 group gap-4">
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 min-w-0">
                                        <code className="text-xs font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-rose-100 shrink-0">{item.ip}</code>
                                        <span className="text-xs text-rose-400 font-medium italic truncate">{item.reason || t('visitors.ip.noReason')}</span>
                                    </div>
                                    <button 
                                        onClick={() => handleRemoveIp(item.id)}
                                        disabled={!!processingId}
                                        className="p-2 text-rose-300 hover:text-rose-600 transition-colors shrink-0 sm:opacity-0 group-hover:opacity-100 disabled:opacity-50"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                            {ipBlacklist.length === 0 && (
                                <div className="p-8 text-center text-slate-300 font-bold uppercase tracking-widest text-xs bg-slate-50 rounded-2xl border-2 border-dashed border-slate-100">
                                    {t('visitors.ip.empty')}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* TAB: ACCESS CONTROL */}
            {activeTab === 'CONTROL' && (
                <div className="space-y-6">
                    <div className="bg-white p-10 rounded-3xl border border-slate-100 shadow-sm space-y-8 max-w-2xl">
                        <div className="space-y-2">
                            <h3 className="text-2xl font-black text-slate-800">{t('visitors.control.title') || 'Visitor Access Control'}</h3>
                            <p className="text-slate-500 text-sm font-medium">{t('visitors.control.subtitle') || 'Manage how visitors access your exhibition.'}</p>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-6 bg-slate-50 rounded-[2rem] border border-slate-100 group hover:border-indigo-100 transition-all">
                                <div>
                                    <h4 className="font-black text-slate-800">{t('visitors.control.approval') || 'Require Approval'}</h4>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{t('visitors.control.approvalDesc') || 'New visitors must be approved by you'}</p>
                                </div>
                                <button
                                    disabled={isSaving}
                                    onClick={() => handleUpdateSettings({ requireVisitorApproval: !requireVisitorApproval })}
                                    className={`w-14 h-8 rounded-full transition-all relative ${requireVisitorApproval ? 'bg-indigo-600 shadow-lg shadow-indigo-100' : 'bg-slate-300'}`}
                                >
                                    <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all shadow-sm ${requireVisitorApproval ? 'right-1' : 'left-1'}`} />
                                </button>
                            </div>

                            <div className="flex items-center justify-between p-6 bg-slate-50 rounded-[2rem] border border-slate-100 group hover:border-indigo-100 transition-all">
                                <div>
                                    <h4 className="font-black text-slate-800">{t('visitors.control.invitation') || 'Use Invitation Code'}</h4>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{t('visitors.control.invitationDesc') || 'Only visitors with code can register'}</p>
                                </div>
                                <button
                                    disabled={isSaving}
                                    onClick={() => handleUpdateSettings({ requireInvitationCode: !requireInvitationCode })}
                                    className={`w-14 h-8 rounded-full transition-all relative ${requireInvitationCode ? 'bg-indigo-600 shadow-lg shadow-indigo-100' : 'bg-slate-300'}`}
                                >
                                    <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all shadow-sm ${requireInvitationCode ? 'right-1' : 'left-1'}`} />
                                </button>
                            </div>

                            <AnimatePresence>
                            {requireInvitationCode && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="space-y-2 px-2"
                                >
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('visitors.control.invitationCode')}</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={visitorInvitationCode}
                                            onChange={(e) => setVisitorInvitationCode(e.target.value)}
                                            className="flex-1 bg-white border-2 border-slate-100 rounded-2xl px-6 py-3 font-black text-slate-700 outline-none focus:border-indigo-500 transition-all tracking-wide"
                                            placeholder="Enter code..."
                                        />
                                        <button
                                            disabled={isSaving}
                                            onClick={() => handleUpdateSettings({ visitorInvitationCode })}
                                            className="px-8 py-3 bg-slate-800 text-white rounded-2xl font-black text-xs hover:bg-black transition-all shadow-lg active:scale-95"
                                        >
                                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : t('visitors.control.setCode')}
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                            </AnimatePresence>

                            <div className="flex items-center justify-between p-6 bg-slate-50 rounded-[2rem] border border-slate-100 group hover:border-rose-100 transition-all">
                                <div>
                                    <h4 className="font-black text-slate-800">{t('visitors.control.disableLogin') || 'Temporarily Disable Login'}</h4>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{t('visitors.control.disableLoginDesc') || 'Existing visitors cannot log in'}</p>
                                </div>
                                <button
                                    disabled={isSaving}
                                    onClick={() => handleUpdateSettings({ disableVisitorLogin: !disableVisitorLogin })}
                                    className={`w-14 h-8 rounded-full transition-all relative ${disableVisitorLogin ? 'bg-rose-500 shadow-lg shadow-rose-100' : 'bg-slate-300'}`}
                                >
                                    <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all shadow-sm ${disableVisitorLogin ? 'right-1' : 'left-1'}`} />
                                </button>
                            </div>

                            <div className="flex items-center justify-between p-6 bg-slate-50 rounded-[2rem] border border-slate-100 group hover:border-rose-100 transition-all">
                                <div>
                                    <h4 className="font-black text-slate-800">{t('visitors.control.disableReg') || 'Disable New Registration'}</h4>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{t('visitors.control.disableRegDesc') || 'Prevent new visitor signups'}</p>
                                </div>
                                <button
                                    disabled={isSaving}
                                    onClick={() => handleUpdateSettings({ disableVisitorRegistration: !disableVisitorRegistration })}
                                    className={`w-14 h-8 rounded-full transition-all relative ${disableVisitorRegistration ? 'bg-rose-500 shadow-lg shadow-rose-100' : 'bg-slate-300'}`}
                                >
                                    <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all shadow-sm ${disableVisitorRegistration ? 'right-1' : 'left-1'}`} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ADJUST COINS MODAL */}
            <AnimatePresence>
                {showAdjustModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-white w-full max-w-md rounded-[40px] shadow-2xl p-10 relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-8 opacity-5">
                                <Coins className="w-32 h-32 text-indigo-600 rotate-12" />
                            </div>

                            <button onClick={() => setShowAdjustModal(null)} className="absolute top-6 right-6 text-slate-300 hover:text-slate-600 text-2xl font-black">&times;</button>
                            
                            <h3 className="text-3xl font-black text-slate-800 mb-2 uppercase tracking-tight">{t('visitors.modal.adjustTitle')}</h3>
                            <p className="text-slate-500 font-medium mb-8">{t('visitors.modal.adjustSubtitle')}</p>

                            <div className="space-y-6 relative z-10">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('visitors.modal.adjustAmount')}</label>
                                    <div className="relative">
                                        <input 
                                            type="number"
                                            className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl font-black text-indigo-600 focus:ring-4 focus:ring-indigo-100 focus:border-indigo-200 outline-none text-2xl transition-all"
                                            value={adjustAmount}
                                            onChange={e => setAdjustAmount(parseInt(e.target.value))}
                                            placeholder="0"
                                            autoFocus
                                        />
                                        <div className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 font-black">COINS</div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('visitors.modal.adjustReason')}</label>
                                    <input 
                                        type="text"
                                        className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-slate-700 focus:ring-4 focus:ring-indigo-100 outline-none"
                                        value={adjustReason}
                                        onChange={e => setAdjustReason(e.target.value)}
                                        placeholder={t('visitors.modal.adjustPlaceholder')}
                                    />
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <button 
                                        onClick={handleAdjustCoins}
                                        disabled={adjustAmount === 0 || !!processingId}
                                        className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 disabled:grayscale"
                                    >
                                        {processingId === showAdjustModal ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : t('common.confirm')}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* VISITOR ORDERS MODAL */}
            <AnimatePresence>
                {showOrdersModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-white w-full max-w-lg rounded-[40px] shadow-2xl p-10 relative flex flex-col max-h-[80vh]"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h3 className="text-2xl font-black text-slate-800 tracking-tight">{t('visitors.modal.ordersTitle')}</h3>
                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">{t('visitors.modal.ordersSubtitle')}</p>
                                </div>
                                <button onClick={() => setShowOrdersModal(null)} className="p-2 text-slate-300 hover:text-slate-600 transition-colors">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-hide">
                                {ordersLoading ? (
                                    <div className="flex justify-center py-20">
                                        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                                    </div>
                                ) : visitorOrders.length > 0 ? (
                                    visitorOrders.map(order => (
                                        <div key={order.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex justify-between items-center">
                                            <div>
                                                <h4 className="font-black text-slate-800 text-sm uppercase tracking-tight">{order.artworkTitle}</h4>
                                                <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">{new Date(order.createdAt).toLocaleString()}</p>
                                            </div>
                                            <div className="flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-600 rounded-lg">
                                                <Check className="w-3 h-3" />
                                                <span className="text-[9px] font-black uppercase tracking-widest">{t('visitors.order.completed')}</span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="py-20 text-center">
                                        <ShoppingBag className="w-12 h-12 text-slate-100 mx-auto mb-4" />
                                        <p className="text-[10px] text-slate-300 font-black uppercase tracking-widest">{t('visitors.order.noHistory')}</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}
