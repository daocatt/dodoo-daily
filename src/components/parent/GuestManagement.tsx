'use client'

import React, { useEffect, useState } from 'react'
import { Users, UserCheck, UserX, Search, Loader2, Coins, Ticket, Plus, Trash2, ShieldAlert, Globe, MessageSquare, Mail, Phone, Clock, FileText, Check, AlertTriangle, ShoppingBag, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useI18n } from '@/contexts/I18nContext'

interface Guest {
    id: string
    name: string
    email: string | null
    phone: string | null
    status: 'PENDING' | 'APPROVED' | 'BANNED'
    currency: number
    lastIp: string | null
    createdAt: string
}

interface GuestOrder {
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

export default function GuestManagement() {
    const { t } = useI18n()
    const [guests, setGuests] = useState<Guest[]>([])
    const [rechargeCodes, setRechargeCodes] = useState<RechargeCode[]>([])
    const [ipBlacklist, setIpBlacklist] = useState<IpBlacklist[]>([])
    
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [activeTab, setActiveTab] = useState<'VISITORS' | 'CODES' | 'IP'>('VISITORS')
    const [processingId, setProcessingId] = useState<string | null>(null)
    
    // Form states
    const [codeAmount, setCodeAmount] = useState(100)
    const [adjustAmount, setAdjustAmount] = useState(0)
    const [adjustReason, setAdjustReason] = useState('')
    const [showAdjustModal, setShowAdjustModal] = useState<string | null>(null)
    const [guestOrders, setGuestOrders] = useState<GuestOrder[]>([])
    const [ordersLoading, setOrdersLoading] = useState(false)

    const fetchData = async () => {
        setLoading(true)
        try {
            const [gRes, cRes, iRes] = await Promise.all([
                fetch('/api/parent/guests'),
                fetch('/api/parent/recharge-codes'),
                fetch('/api/parent/ip-blacklist')
            ])
            if (gRes.ok) setGuests(await gRes.json())
            if (cRes.ok) setRechargeCodes(await cRes.json())
            if (iRes.ok) setIpBlacklist(await iRes.json())
        } catch (e) {
            console.error('Failed to fetch guest management data:', e)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    const handleGuestAction = async (id: string, action: 'APPROVE' | 'BAN' | 'DELETE') => {
        setProcessingId(id)
        try {
            const res = await fetch(`/api/parent/guests/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action })
            })
            if (res.ok) {
                if (action === 'DELETE') {
                    setGuests(prev => prev.filter(g => g.id !== id))
                } else {
                    const newStatus = action === 'APPROVE' ? 'APPROVED' : 'BANNED'
                    setGuests(prev => prev.map(g => g.id === id ? { ...g, status: newStatus } : g))
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
            const res = await fetch(`/api/parent/guests/${showAdjustModal}/adjust-coins`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount: adjustAmount, reason: adjustReason || 'Manual adjustment' })
            })
            if (res.ok) {
                setGuests(prev => prev.map(g => g.id === showAdjustModal ? { ...g, currency: g.currency + adjustAmount } : g))
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
            const res = await fetch(`/api/guest/orders?guestId=${id}`)
            if (res.ok) setGuestOrders(await res.json())
        } finally {
            setOrdersLoading(false)
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

    const filteredGuests = guests.filter(g => 
        g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.phone?.includes(searchTerm)
    )

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-4" />
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">{t('guests.loading')}</p>
            </div>
        )
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-20">
            {/* Header & Tabs */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                        <Users className="w-8 h-8 text-indigo-500" />
                        {t('guests.title')}
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">{t('guests.subtitle')}</p>
                </div>

                <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto min-w-full md:min-w-0">
                    {(['VISITORS', 'CODES', 'IP'] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all ${activeTab === tab ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            {tab === 'VISITORS' ? t('guests.tabs.visitors') : tab === 'CODES' ? t('guests.tabs.codes') : t('guests.tabs.ip')}
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
                            placeholder={t('guests.searchPlaceholder')}
                            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-indigo-100 outline-none shadow-sm"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <AnimatePresence mode="popLayout">
                            {filteredGuests.map((guest) => (
                                <motion.div
                                    key={guest.id}
                                    layout
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-4 hover:shadow-xl transition-all group"
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center font-black text-indigo-600 text-xl">
                                                {guest.name[0].toUpperCase()}
                                            </div>
                                            <div>
                                                <h3 className="font-black text-slate-800 text-lg leading-none">{guest.name}</h3>
                                                <div className="flex items-center gap-4 mt-2">
                                                    <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest leading-none ${
                                                        guest.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-600' : 
                                                        guest.status === 'PENDING' ? 'bg-amber-100 text-amber-600' : 'bg-rose-100 text-rose-600'
                                                    }`}>
                                                        {guest.status === 'APPROVED' ? t('guests.status.approved') : guest.status === 'PENDING' ? t('guests.status.pending') : t('guests.status.banned')}
                                                    </span>
                                                    <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                                        <Clock className="w-3 h-3" />
                                                        {new Date(guest.createdAt).toLocaleDateString()}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 bg-indigo-50 px-3 py-2 rounded-xl">
                                            <Coins className="w-4 h-4 text-amber-500" />
                                            <span className="font-black text-indigo-700">{guest.currency}</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 py-2 border-y border-slate-50">
                                        <div className="flex items-center gap-2 text-xs text-slate-500 overflow-hidden">
                                            <Mail className="w-3.5 h-3.5 text-slate-300" />
                                            <span className="truncate">{guest.email || 'N/A'}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-slate-500 overflow-hidden">
                                            <Phone className="w-3.5 h-3.5 text-slate-300" />
                                            <span className="truncate">{guest.phone || 'N/A'}</span>
                                        </div>
                                        {guest.lastIp && (
                                            <div className="flex items-center gap-2 text-xs text-slate-400 col-span-2">
                                                <Globe className="w-3.5 h-3.5 text-slate-300" />
                                                IP: {guest.lastIp}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between gap-3 pt-2">
                                        <div className="flex gap-2">
                                            {guest.status !== 'APPROVED' && (
                                                <button 
                                                    onClick={() => handleGuestAction(guest.id, 'APPROVE')}
                                                    disabled={!!processingId}
                                                    className="p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-500 hover:text-white transition-all shadow-sm"
                                                    title={t('guests.action.approve')}
                                                >
                                                    <UserCheck className="w-5 h-5" />
                                                </button>
                                            )}
                                            {guest.status !== 'BANNED' && (
                                                <button 
                                                    onClick={() => handleGuestAction(guest.id, 'BAN')}
                                                    disabled={!!processingId}
                                                    className="p-2 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                                                    title={t('guests.action.ban')}
                                                >
                                                    <UserX className="w-5 h-5" />
                                                </button>
                                            )}
                                        </div>
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => handleViewOrders(guest.id)}
                                                className="p-2 bg-slate-50 text-indigo-500 rounded-xl hover:bg-white hover:shadow-md transition-all border border-slate-100"
                                                title={t('guests.action.viewOrders')}
                                            >
                                                <ShoppingBag className="w-5 h-5" />
                                            </button>
                                            <button 
                                                onClick={() => setShowAdjustModal(guest.id)}
                                                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                                            >
                                                {t('guests.action.adjustCoins')}
                                            </button>
                                            <button 
                                                onClick={() => handleGuestAction(guest.id, 'DELETE')}
                                                disabled={!!processingId}
                                                className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:bg-rose-500 hover:text-white transition-all opacity-0 group-hover:opacity-100 shadow-sm"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        {filteredGuests.length === 0 && (
                            <div className="py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-xs bg-white rounded-3xl border-2 border-dashed border-slate-100 col-span-full">
                                {t('guests.noRecords')}
                            </div>
                        )}
                        </AnimatePresence>
                    </div>
                </div>
            )}

            {/* TAB: CODES */}
            {activeTab === 'CODES' && (
                <div className="space-y-8">
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 max-w-xl">
                        <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
                            <Ticket className="w-6 h-6 text-indigo-500" />
                            {t('guests.codes.generateTitle')}
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 block">{t('guests.codes.amountLabel')}</label>
                                <div className="flex items-center gap-4">
                                    <input 
                                        type="number"
                                        className="flex-1 px-5 py-4 bg-slate-50 border-none rounded-2xl font-black text-indigo-600 focus:ring-4 focus:ring-indigo-100 outline-none text-xl"
                                        value={codeAmount}
                                        onChange={e => setCodeAmount(parseInt(e.target.value))}
                                    />
                                    <button 
                                        onClick={handleGenerateCode}
                                        disabled={!!processingId}
                                        className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 disabled:grayscale"
                                    >
                                        {processingId === 'generating' ? <Loader2 className="w-6 h-6 animate-spin" /> : t('guests.codes.generateBtn')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50">
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{t('guests.codes.tableCode')}</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">{t('guests.codes.tableAmount')}</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-center">{t('guests.codes.tableStatus')}</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">{t('guests.codes.tableDate')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rechargeCodes.map((code) => (
                                    <tr key={code.id} className="border-t border-slate-50 hover:bg-slate-50/30 transition-colors">
                                        <td className="px-8 py-5 font-mono font-black text-indigo-600 text-lg uppercase tracking-wider">{code.code}</td>
                                        <td className="px-8 py-5 text-right">
                                            <span className="font-black text-slate-700 text-lg">+{code.amount}</span>
                                        </td>
                                        <td className="px-8 py-5 text-center">
                                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${code.isUsed ? 'bg-slate-100 text-slate-400' : 'bg-emerald-100 text-emerald-600'}`}>
                                                {code.isUsed ? t('guests.codes.statusUsed') : t('guests.codes.statusUnused')}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 text-right text-xs text-slate-400 font-bold uppercase">
                                            {new Date(code.createdAt).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                                {rechargeCodes.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-8 py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">{t('guests.noRecords')}</td>
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
                    <div className="bg-white p-8 rounded-3xl border border-rose-100 shadow-sm shadow-rose-50 max-w-xl">
                        <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
                            <ShieldAlert className="w-6 h-6 text-rose-500" />
                            {t('guests.ip.title')}
                        </h3>
                        <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                            {t('guests.ip.description')}
                        </p>
                        {/* More IP tools can be added here */}
                        <div className="text-[10px] text-rose-400 font-black uppercase tracking-[0.2em] mb-2 px-1">{t('guests.ip.countLabel', { count: ipBlacklist.length.toString() })}</div>
                        <div className="space-y-2">
                            {ipBlacklist.map(item => (
                                <div key={item.id} className="flex items-center justify-between p-4 bg-rose-50/50 rounded-2xl border border-rose-50 group">
                                    <div className="flex items-center gap-4">
                                        <code>{item.ip}</code>
                                        <span className="text-xs text-rose-400 font-medium italic">{item.reason || 'No reason'}</span>
                                    </div>
                                    <button 
                                        onClick={() => handleRemoveIp(item.id)}
                                        disabled={!!processingId}
                                        className="p-2 text-rose-300 hover:text-rose-600 transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                            {ipBlacklist.length === 0 && (
                                <div className="p-8 text-center text-slate-300 font-bold uppercase tracking-widest text-xs bg-slate-50 rounded-2xl border-2 border-dashed border-slate-100">
                                    {t('guests.ip.empty')}
                                </div>
                            )}
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
                            
                            <h3 className="text-3xl font-black text-slate-800 mb-2 uppercase tracking-tight">{t('guests.modal.adjustTitle')}</h3>
                            <p className="text-slate-500 font-medium mb-8">{t('guests.modal.adjustSubtitle')}</p>

                            <div className="space-y-6 relative z-10">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('guests.modal.adjustAmount')}</label>
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
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('guests.modal.adjustReason')}</label>
                                    <input 
                                        type="text"
                                        className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-slate-700 focus:ring-4 focus:ring-indigo-100 outline-none"
                                        value={adjustReason}
                                        onChange={e => setAdjustReason(e.target.value)}
                                        placeholder={t('guests.modal.adjustPlaceholder')}
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

            {/* GUEST ORDERS MODAL */}
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
                                    <h3 className="text-2xl font-black text-slate-800 tracking-tight">{t('guests.modal.ordersTitle')}</h3>
                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">{t('guests.modal.ordersSubtitle')}</p>
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
                                ) : guestOrders.length > 0 ? (
                                    guestOrders.map(order => (
                                        <div key={order.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex justify-between items-center">
                                            <div>
                                                <h4 className="font-black text-slate-800 text-sm uppercase tracking-tight">{order.artworkTitle}</h4>
                                                <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">{new Date(order.createdAt).toLocaleString()}</p>
                                            </div>
                                            <div className="flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-600 rounded-lg">
                                                <Check className="w-3 h-3" />
                                                <span className="text-[9px] font-black uppercase tracking-widest">{t('guests.order.completed')}</span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="py-20 text-center">
                                        <ShoppingBag className="w-12 h-12 text-slate-100 mx-auto mb-4" />
                                        <p className="text-[10px] text-slate-300 font-black uppercase tracking-widest">{t('guests.order.noHistory')}</p>
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
