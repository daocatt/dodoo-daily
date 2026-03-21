'use client'

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Coins, Ticket, History, LogOut, Loader2, ArrowUpRight, ArrowDownRight, CheckCircle, Smartphone, Mail, MapPin } from 'lucide-react'

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

const ModalHeader = ({ title, id }: { title: string, id: string }) => (
    <div className="flex items-center justify-between px-6 py-4 border-b-2 border-[#CFCBBA] bg-[#E2DFD2] -mx-10 -mt-10 mb-8 rounded-t-[48px]">
        <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            <span className="font-black text-[10px] tracking-tight uppercase text-slate-700">{title}</span>
        </div>
        <div className="px-3 py-1 bg-black/5 rounded shadow-inner text-[8px] font-black uppercase tracking-widest text-slate-400">
            {id}
        </div>
    </div>
)

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
                setMessage({ text: `Success! Received ${data.amount} Coins`, type: 'success' })
                setRechargeCode('')
                fetchData()
            } else {
                setMessage({ text: data.error || 'Recharge failed', type: 'error' })
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
                setMessage({ text: 'Address packet saved!', type: 'success' })
            } else {
                setMessage({ text: 'Buffer write error', type: 'error' })
            }
        } finally {
            setSavingAddress(false)
        }
    }

    return (
        <div className="flex flex-col h-full">
            <ModalHeader title="VISITOR TERMINAL" id="ACTIVE_NODE" />

            {/* User Profile Micro-Header */}
            <div className="flex justify-between items-center mb-8 bg-[#F4F4F2] p-4 rounded-2xl border border-[#C8C4B0] shadow-well">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-[#2C2A20] rounded-xl flex items-center justify-center font-black text-indigo-400 text-xl shadow-lg">
                        {guest.name[0].toUpperCase()}
                    </div>
                    <div>
                        <h3 className="text-base font-black text-slate-800 uppercase tracking-tight">{guest.name}</h3>
                        <div className="flex items-center gap-3">
                            {guest.phone && <div className="flex items-center gap-1 opacity-40"><Smartphone className="w-2.5 h-2.5" /><span className="text-[8px] font-bold">{guest.phone}</span></div>}
                            {guest.email && <div className="flex items-center gap-1 opacity-40"><Mail className="w-2.5 h-2.5" /><span className="text-[8px] font-bold">{guest.email}</span></div>}
                        </div>
                    </div>
                </div>
                <button onClick={onLogout} title="Logout" className="p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all border border-transparent hover:border-rose-100">
                    <LogOut className="w-5 h-5" />
                </button>
            </div>

            {/* Balance Card - Industrial Style */}
            <div className="hardware-well rounded-3xl p-6 bg-slate-900 border-b-4 border-slate-950 flex justify-between items-center relative overflow-hidden group mb-8 shadow-well">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform duration-700">
                    <Coins className="w-24 h-24 rotate-12" />
                </div>
                <div className="relative z-10">
                    <p className="label-mono text-[9px] font-black uppercase tracking-[0.2em] text-indigo-400 mb-1">Balance Available</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-black tracking-tighter text-white">{guest.currency}</span>
                        <span className="text-indigo-400 font-bold uppercase tracking-widest text-[9px]">Units</span>
                    </div>
                </div>
                <div className="relative z-10">
                    <button onClick={() => setActiveTab('OVERVIEW')} className="hardware-btn group">
                        <div className="hardware-cap bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest text-white border border-white/10">
                            Recharge
                        </div>
                    </button>
                </div>
            </div>

            {/* Tabs - Industrial Style */}
            <div className="flex bg-[#CFCBBA] p-1 rounded-2xl gap-1 mb-8 shadow-inner border border-[#C8C4B0]">
                {(['OVERVIEW', 'HISTORY', 'ORDERS', 'ADDRESS'] as const).map(tab => (
                    <button 
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 py-2.5 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab ? 'bg-white text-slate-900 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="min-h-[250px] overflow-y-auto custom-scrollbar -mr-2 pr-2">
                <AnimatePresence mode="wait">
                    {activeTab === 'OVERVIEW' ? (
                        <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                            <div className="space-y-4">
                                <h4 className="label-mono text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <Ticket className="w-3.5 h-3.5" />
                                    Access Code Exchange
                                </h4>
                                <form onSubmit={handleRecharge} className="flex gap-2">
                                    <div className="flex-1 hardware-well rounded-xl p-0.5 bg-[#C8C4B0]">
                                        <input 
                                            type="text" 
                                            value={rechargeCode}
                                            onChange={e => setRechargeCode(e.target.value)}
                                            className="w-full px-4 py-3 bg-[#F4F4F2] rounded-lg outline-none font-black text-indigo-600 uppercase tracking-widest text-xs"
                                            placeholder="XXXX-XXXX-XXXX"
                                        />
                                    </div>
                                    <button 
                                        disabled={rechargeLoading || !rechargeCode}
                                        className="hardware-btn"
                                    >
                                        <div className="hardware-cap bg-[#2C2A20] px-6 py-3 rounded-xl font-black uppercase tracking-widest text-[9px] text-white disabled:opacity-50 transition-all">
                                            {rechargeLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sync'}
                                        </div>
                                    </button>
                                </form>
                                {message && (
                                    <p className={`text-[9px] font-black uppercase tracking-widest text-center ${message.type === 'success' ? 'text-emerald-500' : 'text-rose-500'}`}>
                                        {message.text}
                                    </p>
                                )}
                            </div>
                        </motion.div>
                    ) : activeTab === 'HISTORY' ? (
                        <motion.div key="history" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
                            {logs.map(log => (
                                <div key={log.id} className="bg-[#F4F4F2] p-3 rounded-xl border border-[#C8C4B0]/50 flex justify-between items-center text-[10px]">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-1.5 rounded-lg ${log.amount > 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                                            {log.amount > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                        </div>
                                        <div>
                                            <p className="font-black text-slate-800 uppercase tracking-tight">{log.reason}</p>
                                            <p className="text-[8px] font-bold text-slate-400">{new Date(log.createdAt).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={`font-black ${log.amount > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                            {log.amount > 0 ? '+' : ''}{log.amount}
                                        </p>
                                    </div>
                                </div>
                            ))}
                            {logs.length === 0 && <p className="text-center py-12 label-mono text-[9px] opacity-30">NO DATA LOGS</p>}
                        </motion.div>
                    ) : activeTab === 'ORDERS' ? (
                        <motion.div key="orders" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                            {orders.map(order => (
                                <div key={order.id} className="bg-white p-4 rounded-2xl border-2 border-[#CFCBBA] flex justify-between items-center shadow-sm">
                                    <div>
                                        <h4 className="font-black text-slate-800 uppercase tracking-tight text-[11px] mb-1">{order.artworkTitle}</h4>
                                        <span className="text-[8px] text-slate-400 font-bold uppercase">{new Date(order.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <div className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border ${order.status === 'SHIPPED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-500 border-slate-100'}`}>
                                        {order.status}
                                    </div>
                                </div>
                            ))}
                            {orders.length === 0 && <p className="text-center py-12 label-mono text-[9px] opacity-30">NO TRANSACTION DATA</p>}
                        </motion.div>
                    ) : (
                        <motion.div key="address" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                            <h4 className="label-mono text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <MapPin className="w-3.5 h-3.5" />
                                Shipping Destination
                            </h4>
                            <form onSubmit={handleSaveAddress} className="space-y-4">
                                <div className="hardware-well rounded-2xl p-0.5 bg-[#C8C4B0]">
                                    <textarea
                                        value={addressInput}
                                        onChange={e => setAddressInput(e.target.value)}
                                        className="w-full px-5 py-4 bg-[#F4F4F2] rounded-xl outline-none text-xs h-32 resize-none font-bold tracking-tight shadow-inner"
                                        placeholder="Enter delivery logistics destination..."
                                    />
                                </div>
                                <button type="submit" disabled={savingAddress} className="hardware-btn w-full">
                                    <div className="hardware-cap bg-[#2C2A20] py-3 rounded-xl font-black uppercase tracking-widest text-[9px] text-white">
                                        {savingAddress ? 'Syncing...' : 'Update Buffer'}
                                    </div>
                                </button>
                            </form>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            
            <style jsx global>{`
                .shadow-well {
                    box-shadow: inset 0 2px 4px rgba(0,0,0,0.1), 0 1px 2px rgba(255,255,255,0.5);
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #CFCBBA;
                    border-radius: 10px;
                }
            `}</style>
        </div>
    )
}
