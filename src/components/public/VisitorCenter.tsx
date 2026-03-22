'use client'

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Coins, Ticket, History, LogOut, Loader2, ArrowUpRight, ArrowDownRight, CheckCircle, Smartphone, Mail, MapPin, Heart, Users, User } from 'lucide-react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useI18n } from '@/contexts/I18nContext'

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
    artworkImage: string
    artworkId: string
    status: string
    createdAt: string
}

const ModalHeader = ({ title, id }: { title: string, id: string }) => (
    <div className="flex items-center justify-between px-6 py-4 border-b-2 border-[#B8B4A0] bg-[#D6D2C0] shrink-0 -mx-10 -mt-10 mb-8 rounded-t-[1.8rem]">
        <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
            <span className="font-black text-[10px] tracking-[0.2em] uppercase text-slate-700">{title}</span>
        </div>
        <div className="px-2.5 py-1 bg-black/5 rounded shadow-inner text-[8px] font-black uppercase tracking-widest text-slate-400">
            ID: {id.slice(0, 8)}
        </div>
    </div>
)

export default function VisitorCenter({ guest, onLogout, onUpdateCurrency }: { guest: GuestData, onLogout: () => void, onUpdateCurrency: (newVal: number) => void }) {
    const { t } = useI18n()
    const params = useParams()
    const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'HISTORY' | 'ORDERS' | 'COLLECTIONS' | 'FAVORITES' | 'ADDRESS' | 'PROFILE'>('OVERVIEW')
    const [logs, setLogs] = useState<CurrencyLog[]>([])
    const [orders, setOrders] = useState<Order[]>([])
    const [likes, setLikes] = useState<Order[]>([])
    const [rechargeCode, setRechargeCode] = useState('')
    const [loading, setLoading] = useState(false)
    const [rechargeLoading, setRechargeLoading] = useState(false)
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null)
    const [addressInput, setAddressInput] = useState(guest.address || '')
    const [savingAddress, setSavingAddress] = useState(false)
    const [profileName, setProfileName] = useState(guest.name || '')
    const [profileEmail, setProfileEmail] = useState(guest.email || '')
    const [profilePhone, setProfilePhone] = useState(guest.phone || '')
    const [profilePassword, setProfilePassword] = useState('')
    const [savingProfile, setSavingProfile] = useState(false)

    const fetchData = async () => {
        setLoading(true)
        try {
            const [lRes, oRes, fRes] = await Promise.all([
                fetch(`/api/guest/logs?guestId=${guest.id}`),
                fetch(`/api/guest/orders?guestId=${guest.id}`),
                fetch(`/api/guest/likes?guestId=${guest.id}`)
            ])
            if (lRes.ok) setLogs(await lRes.json())
            if (oRes.ok) setOrders(await oRes.json())
            if (fRes.ok) setLikes(await fRes.json())
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

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault()
        setSavingProfile(true)
        setMessage(null)
        try {
            const res = await fetch('/api/guest/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    guestId: guest.id, 
                    name: profileName, 
                    email: profileEmail, 
                    phone: profilePhone, 
                    password: profilePassword 
                })
            })
            const data = await res.json()
            if (res.ok) {
                setMessage({ text: 'Profile identity updated.', type: 'success' })
                setProfilePassword('')
                // Update local storage
                const existing = JSON.parse(localStorage.getItem('visitor_data') || '{}')
                localStorage.setItem('visitor_data', JSON.stringify({ ...existing, ...data }))
                window.dispatchEvent(new Event('storage'))
            } else {
                setMessage({ text: data.error || 'Update failed', type: 'error' })
            }
        } finally {
            setSavingProfile(false)
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
                <div className="flex items-center gap-2">
                    <Link href="/guest/family" title="Family Exhibition" className="flex items-center gap-2 p-3 text-indigo-500 hover:text-white hover:bg-indigo-500 rounded-xl transition-all border border-transparent hover:border-indigo-600 bg-indigo-50">
                        <Users className="w-5 h-5" />
                        <span className="text-[10px] font-black uppercase hidden sm:block">Family</span>
                    </Link>
                    <button onClick={onLogout} title="Logout" className="p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all border border-transparent hover:border-rose-100">
                        <LogOut className="w-5 h-5" />
                    </button>
                </div>
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
            <div className="flex bg-[#CFCBBA] p-1 rounded-2xl gap-1 mb-8 shadow-inner border border-[#C8C4B0] overflow-x-auto no-scrollbar">
                {(['OVERVIEW', 'HISTORY', 'ORDERS', 'COLLECTIONS', 'FAVORITES', 'ADDRESS', 'PROFILE'] as const).map(tab => (
                    <button 
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 py-2.5 px-3 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab ? 'bg-white text-slate-900 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        {t(`public.visitor.${tab.toLowerCase()}`)}
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
                            {orders.filter(o => o.status === 'PENDING_CONFIRM').map(order => (
                                <div key={order.id} className="bg-white p-3 rounded-2xl border-2 border-[#CFCBBA] flex gap-3 items-center shadow-sm">
                                    <div className="w-12 h-12 bg-slate-100 rounded-lg overflow-hidden shrink-0 border border-slate-200">
                                        {order.artworkImage && <img src={order.artworkImage} alt={order.artworkTitle} className="w-full h-full object-cover" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-black text-slate-800 uppercase tracking-tight text-[10px] mb-0.5 truncate">{order.artworkTitle}</h4>
                                        <span className="text-[7px] text-slate-400 font-bold uppercase block">{new Date(order.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <div className={`px-2 py-1 rounded-lg text-[7px] font-black uppercase tracking-widest border bg-amber-50 text-amber-600 border-amber-100 shrink-0`}>
                                        {order.status}
                                    </div>
                                </div>
                            ))}
                            {orders.filter(o => o.status === 'PENDING_CONFIRM').length === 0 && <p className="text-center py-12 label-mono text-[9px] opacity-30">NO PENDING DATA</p>}
                        </motion.div>
                    ) : activeTab === 'COLLECTIONS' ? (
                        <motion.div key="collections" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                            {orders.filter(o => o.status !== 'PENDING_CONFIRM').map(order => (
                                <div key={order.id} className="bg-white p-3 rounded-2xl border-2 border-[#CFCBBA] flex gap-3 items-center shadow-sm">
                                    <div className="w-12 h-12 bg-slate-100 rounded-lg overflow-hidden shrink-0 border border-slate-200">
                                        {order.artworkImage && <img src={order.artworkImage} alt={order.artworkTitle} className="w-full h-full object-cover" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-black text-slate-800 uppercase tracking-tight text-[10px] mb-0.5 truncate">{order.artworkTitle}</h4>
                                        <span className="text-[7px] text-slate-400 font-bold uppercase block">{new Date(order.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <div className={`px-2 py-1 rounded-lg text-[7px] font-black uppercase tracking-widest border ${order.status === 'SHIPPED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-indigo-50 text-indigo-600 border-indigo-100'} shrink-0`}>
                                        {order.status}
                                    </div>
                                </div>
                            ))}
                            {orders.filter(o => o.status !== 'PENDING_CONFIRM').length === 0 && <p className="text-center py-12 label-mono text-[9px] opacity-30">NO COLLECTION DATA</p>}
                        </motion.div>
                    ) : activeTab === 'FAVORITES' ? (
                        <motion.div key="favorites" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                            {likes.map(like => (
                                <Link 
                                    key={like.id} 
                                    href={`/u/${params?.slug}/exhibition/${like.artworkId}`}
                                    className="bg-white p-3 rounded-2xl border-2 border-[#CFCBBA] flex gap-3 items-center shadow-sm hover:border-indigo-200 transition-colors"
                                >
                                    <div className="w-12 h-12 bg-slate-100 rounded-lg overflow-hidden shrink-0 border border-slate-200">
                                        {like.artworkImage && <img src={like.artworkImage} alt={like.artworkTitle} className="w-full h-full object-cover" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-black text-slate-800 uppercase tracking-tight text-[10px] mb-0.5 truncate">{like.artworkTitle}</h4>
                                        <span className="text-[7px] text-slate-400 font-bold uppercase block">{new Date(like.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <div className="p-2 text-rose-500">
                                        <Heart className="w-4 h-4 fill-rose-500" />
                                    </div>
                                </Link>
                            ))}
                            {likes.length === 0 && <p className="text-center py-12 label-mono text-[9px] opacity-30">NO FAVORITES STORED</p>}
                        </motion.div>
                    ) : activeTab === 'ADDRESS' ? (
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
                    ) : (
                        <motion.div key="profile" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                            <h4 className="label-mono text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <User className="w-3.5 h-3.5" />
                                Identity Config
                            </h4>
                            <form onSubmit={handleSaveProfile} className="space-y-4">
                                <div className="space-y-3">
                                    <div className="hardware-well rounded-2xl p-0.5 bg-[#C8C4B0]">
                                        <input
                                            required
                                            value={profileName}
                                            onChange={e => setProfileName(e.target.value)}
                                            className="w-full px-5 py-3 bg-[#F4F4F2] rounded-xl outline-none text-xs font-bold tracking-tight shadow-inner"
                                            placeholder="Nickname"
                                        />
                                    </div>
                                    <div className="hardware-well rounded-2xl p-0.5 bg-[#C8C4B0]">
                                        <input
                                            required={!profilePhone}
                                            type="email"
                                            value={profileEmail}
                                            onChange={e => setProfileEmail(e.target.value)}
                                            className="w-full px-5 py-3 bg-[#F4F4F2] rounded-xl outline-none text-xs font-bold tracking-tight shadow-inner"
                                            placeholder="Email Address"
                                        />
                                    </div>
                                    <div className="hardware-well rounded-2xl p-0.5 bg-[#C8C4B0]">
                                        <input
                                            required={!profileEmail}
                                            type="tel"
                                            value={profilePhone}
                                            onChange={e => setProfilePhone(e.target.value)}
                                            className="w-full px-5 py-3 bg-[#F4F4F2] rounded-xl outline-none text-xs font-bold tracking-tight shadow-inner"
                                            placeholder="Phone Number"
                                        />
                                    </div>
                                    <div className="hardware-well rounded-2xl p-0.5 bg-[#C8C4B0]">
                                        <input
                                            type="password"
                                            value={profilePassword}
                                            onChange={e => setProfilePassword(e.target.value)}
                                            className="w-full px-5 py-3 bg-[#F4F4F2] rounded-xl outline-none text-xs font-bold tracking-tight shadow-inner"
                                            placeholder="New Password (Optional)"
                                        />
                                    </div>
                                </div>
                                <button type="submit" disabled={savingProfile} className="hardware-btn w-full">
                                    <div className="hardware-cap bg-indigo-600 hover:bg-indigo-700 py-3 rounded-xl font-black uppercase tracking-widest text-[9px] text-white">
                                        {savingProfile ? 'Patching Identity...' : 'Execute Profile Update'}
                                    </div>
                                </button>
                            </form>
                            {message && (
                                <p className={`text-[9px] font-black uppercase tracking-widest text-center ${message.type === 'success' ? 'text-emerald-500' : 'text-rose-500'} pt-2`}>
                                    {message.text}
                                </p>
                            )}
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
