'use client'

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Coins, Ticket, History, LogOut, Loader2, ArrowUpRight, ArrowDownRight, CheckCircle } from 'lucide-react'

interface GuestData {
    id: string
    name: string
    currency: number
    phone?: string
    email?: string
    address?: string | null
}

interface CurrencyLog {
    id: string
    amount: number
    balance: number
    reason: string
    createdAt: string
}

interface Order {
    id: string
    artworkTitle: string
    status: string
    createdAt: string
}

export default function VisitorCenter({ guest, onLogout, onUpdateCurrency }: { guest: GuestData, onLogout: () => void, onUpdateCurrency: (newVal: number) => void }) {
    const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'HISTORY' | 'ORDERS' | 'ADDRESS'>('OVERVIEW')
    const [logs, setLogs] = useState<CurrencyLog[]>([])
    const [orders, setOrders] = useState<Order[]>([])
    const [rechargeCode, setRechargeCode] = useState('')
    const [loading, setLoading] = useState(false)
    const [rechargeLoading, setRechargeLoading] = useState(false)
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null)
    const [addressInput, setAddressInput] = useState(guest.address || '')
    const [savingAddress, setSavingAddress] = useState(false)

    const fetchData = async () => {
        setLoading(true)
        try {
            const [lRes, oRes] = await Promise.all([
                fetch(`/api/guest/logs?guestId=${guest.id}`),
                fetch(`/api/guest/orders?guestId=${guest.id}`)
            ])
            if (lRes.ok) setLogs(await lRes.json())
            if (oRes.ok) setOrders(await oRes.json())
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const handleRecharge = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!rechargeCode) return
        setRechargeLoading(true)
        setMessage(null)
        try {
            const res = await fetch('/api/guest/recharge', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ guestId: guest.id, code: rechargeCode })
            })
            const data = await res.json()
            if (res.ok) {
                onUpdateCurrency(data.balance)
                setMessage({ text: `充值成功！获得 ${data.amount} Coins`, type: 'success' })
                setRechargeCode('')
                fetchData()
            } else {
                setMessage({ text: data.error || '充值失败', type: 'error' })
            }
        } finally {
            setRechargeLoading(false)
        }
    }

    const handleSaveAddress = async (e: React.FormEvent) => {
        e.preventDefault()
        setSavingAddress(true)
        try {
            const res = await fetch('/api/open/visitor/address', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ guestId: guest.id, address: addressInput })
            })
            if (res.ok) {
                setMessage({ text: 'Address saved!', type: 'success' })
            } else {
                setMessage({ text: 'Failed to save address', type: 'error' })
            }
        } finally {
            setSavingAddress(false)
        }
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex justify-between items-center bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center font-black text-white text-2xl">
                        {guest.name[0].toUpperCase()}
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-slate-800">{guest.name}</h3>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">访客帐号</p>
                    </div>
                </div>
                <button onClick={onLogout} className="p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all">
                    <LogOut className="w-5 h-5" />
                </button>
            </div>

            {/* Stats */}
            <div className="bg-slate-900 p-8 rounded-[40px] text-white overflow-hidden relative group">
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
                    <Coins className="w-32 h-32 rotate-12" />
                </div>
                <div className="relative z-10">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-300 mb-2">My Balance</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-5xl font-black tracking-tighter">{guest.currency}</span>
                        <span className="text-indigo-400 font-bold uppercase tracking-widest text-xs">Coins</span>
                    </div>
                </div>
            </div>

            {/* Recharge Section */}
            <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm space-y-4">
                <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                    <Ticket className="w-4 h-4 text-indigo-500" />
                    兑换充值码
                </h4>
                <form onSubmit={handleRecharge} className="flex gap-3">
                    <input 
                        type="text" 
                        value={rechargeCode}
                        onChange={e => setRechargeCode(e.target.value)}
                        className="flex-1 px-5 py-3 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-indigo-600 focus:bg-white transition-all outline-none font-black text-indigo-600 uppercase tracking-widest text-sm"
                        placeholder="输入 8 位充值码"
                    />
                    <button 
                        disabled={rechargeLoading || !rechargeCode}
                        className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-indigo-100 disabled:grayscale transition-all active:scale-95"
                    >
                        {rechargeLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : '兑换'}
                    </button>
                </form>
                {message && (
                    <p className={`text-[10px] font-black uppercase tracking-widest text-center ${message.type === 'success' ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {message.text}
                    </p>
                )}
            </div>

            {/* Tabs */}
            <div className="flex bg-slate-100 p-1.5 rounded-2xl overflow-x-auto gap-1">
                {(['HISTORY', 'ORDERS', 'ADDRESS'] as const).map(tab => (
                    <button 
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        {tab === 'HISTORY' ? 'Balance' : tab === 'ORDERS' ? 'Orders' : 'Address'}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="min-h-[300px]">
                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-indigo-500/20" />
                    </div>
                ) : (
                    <AnimatePresence mode="wait">
                        {activeTab === 'HISTORY' ? (
                            <motion.div 
                                key="history" 
                                initial={{ opacity: 0, y: 10 }} 
                                animate={{ opacity: 1, y: 0 }} 
                                className="space-y-3"
                            >
                                {logs.map(log => (
                                    <div key={log.id} className="bg-white p-4 rounded-2xl border border-slate-50 flex justify-between items-center group">
                                        <div className="flex items-center gap-4">
                                            <div className={`p-2 rounded-xl ${log.amount > 0 ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'}`}>
                                                {log.amount > 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                                            </div>
                                            <div>
                                                <p className="text-xs font-black text-slate-800 uppercase tracking-tight">{log.reason === 'RECHARGE' ? 'Recharge' : log.reason === 'PURCHASE' ? 'Purchase' : 'Adjustment'}</p>
                                                <p className="text-[9px] font-bold text-slate-300 uppercase">{new Date(log.createdAt).toLocaleString()}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className={`font-black ${log.amount > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                {log.amount > 0 ? '+' : ''}{log.amount}
                                            </p>
                                            <p className="text-[9px] font-black text-slate-300 uppercase">Balance: {log.balance}</p>
                                        </div>
                                    </div>
                                ))}
                                {logs.length === 0 && <p className="text-center py-20 text-[10px] text-slate-300 font-black uppercase tracking-widest">No records yet</p>}
                            </motion.div>
                        ) : activeTab === 'ORDERS' ? (
                            <motion.div 
                                key="orders" 
                                initial={{ opacity: 0, y: 10 }} 
                                animate={{ opacity: 1, y: 0 }} 
                                className="space-y-3"
                            >
                                {orders.map(order => {
                                    const statusMap: Record<string, { label: string, color: string }> = {
                                        PENDING_CONFIRM: { label: 'Awaiting Confirm', color: 'text-amber-600 bg-amber-50' },
                                        CONFIRMED: { label: 'Processing', color: 'text-blue-600 bg-blue-50' },
                                        SHIPPED: { label: 'Shipped', color: 'text-indigo-600 bg-indigo-50' },
                                        REFUNDED: { label: 'Refunded', color: 'text-slate-600 bg-slate-100' },
                                        CANCELLED: { label: 'Cancelled', color: 'text-rose-600 bg-rose-50' },
                                    }
                                    const statusInfo = statusMap[order.status] || { label: order.status, color: 'text-emerald-600 bg-emerald-50' }
                                    return (
                                        <div key={order.id} className="bg-white p-5 rounded-3xl border border-indigo-50 flex justify-between items-center">
                                            <div>
                                                <h4 className="font-black text-slate-800 uppercase tracking-tight leading-none mb-2">{order.artworkTitle}</h4>
                                                <div className="flex items-center gap-2">
                                                    <History className="w-3 h-3 text-slate-300" />
                                                    <span className="text-[9px] text-slate-400 font-bold uppercase">{new Date(order.createdAt).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                            <div className={`flex items-center gap-1.5 px-3 py-1.5 ${statusInfo.color} rounded-xl`}>
                                                <CheckCircle className="w-3 h-3" />
                                                <span className="text-[9px] font-black uppercase tracking-widest">{statusInfo.label}</span>
                                            </div>
                                        </div>
                                    )
                                })}
                                {orders.length === 0 && <p className="text-center py-20 text-[10px] text-slate-300 font-black uppercase tracking-widest">No orders yet</p>}
                            </motion.div>
                        ) : (
                            <motion.div 
                                key="address" 
                                initial={{ opacity: 0, y: 10 }} 
                                animate={{ opacity: 1, y: 0 }} 
                                className="space-y-4"
                            >
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Default Shipping Address</p>
                                <p className="text-xs text-slate-500">Your default address will be pre-filled when you place an order. You can always edit it at checkout.</p>
                                <form onSubmit={handleSaveAddress} className="space-y-4">
                                    <textarea
                                        value={addressInput}
                                        onChange={e => setAddressInput(e.target.value)}
                                        className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-50 focus:border-indigo-600 focus:bg-white transition-all outline-none rounded-2xl text-sm h-32 resize-none"
                                        placeholder="Full address including city, province, postal code..."
                                    />
                                    <button 
                                        type="submit"
                                        disabled={savingAddress}
                                        className="w-full py-3 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-indigo-100 disabled:grayscale transition-all active:scale-95"
                                    >
                                        {savingAddress ? 'Saving...' : 'Save Address'}
                                    </button>
                                </form>
                                {message && (
                                    <p className={`text-[10px] font-black uppercase tracking-widest text-center ${message.type === 'success' ? 'text-emerald-500' : 'text-rose-500'}`}>
                                        {message.text}
                                    </p>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                )}
            </div>
        </div>
    )
}
