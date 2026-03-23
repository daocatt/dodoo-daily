'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { 
    User, 
    Ticket, 
    History, 
    ShoppingBag, 
    Heart, 
    LogOut, 
    ExternalLink, 
    Download,
    MapPin,
    X,
    Loader2,
    Ticket as TicketIcon,
    Package,
    ArrowUpRight,
    ArrowDownRight,
    LayoutGrid
} from 'lucide-react'
import Link from 'next/link'
import { useI18n } from '@/contexts/I18nContext'
import { useParams } from 'next/navigation'

interface VisitorData {
    id: string
    name: string
    currency: number
    phone?: string
    email?: string
    address?: string | null
    isMember?: boolean
}

interface VisitorLog {
    id: string
    amount: number
    reason: string
    createdAt: number
}

interface VisitorOrder {
    id: string
    artworkId: string
    artworkTitle: string
    artworkImage: string
    status: string
    amount: number
    createdAt: number
}

interface VisitorLike {
    id: string
    artworkId: string
    artworkTitle: string
    artworkImage: string
    createdAt: number
}

const ModalHeader = ({ title, id, accentColor }: { title: string, id: string, accentColor?: string }) => (
    <div className="flex items-center justify-between px-6 py-4 border-b-2 border-[#B8B4A0] bg-[#D6D2C0] shrink-0 -mx-8 md:-mx-12 -mt-8 md:-mt-12 mb-8">
        <div className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full ${accentColor ? `bg-[${accentColor}]` : 'bg-indigo-500'} shadow-[0_0_8px_rgba(79,70,229,0.5)] animate-pulse`} />
            <h2 className="font-black text-[10px] tracking-[0.25em] uppercase text-slate-700">{title}</h2>
        </div>
        <div className="flex items-center gap-3">
            <div className="px-2 py-0.5 bg-black/5 rounded text-[7px] font-black uppercase tracking-widest text-slate-400 border border-black/5">
                NODE_ID: {id}
            </div>
            <div className="w-1 h-3 bg-slate-400/20 rounded-full" />
            <div className="w-1 h-3 bg-slate-400/40 rounded-full animate-pulse" />
        </div>
    </div>
)

export default function VisitorCenter({ visitor, onLogout, onUpdateCurrency }: { 
    visitor: VisitorData, 
    onLogout: () => void,
    onUpdateCurrency?: (newVal: number) => void
}) {
    const { t } = useI18n()
    const params = useParams()
    const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'HISTORY' | 'ORDERS' | 'COLLECTIONS' | 'FAVORITES' | 'PROFILE'>('OVERVIEW')
    const [logs, setLogs] = useState<VisitorLog[]>([])
    const [orders, setOrders] = useState<VisitorOrder[]>([])
    const [likes, setLikes] = useState<VisitorLike[]>([])
    const [rechargeCode, setRechargeCode] = useState('')
    const [rechargeLoading, setRechargeLoading] = useState(false)
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null)
    
    // Profile Edit State
    const [profileName, setProfileName] = useState(visitor.name)
    const [profileEmail, setProfileEmail] = useState(visitor.email || '')
    const [profilePhone, setProfilePhone] = useState(visitor.phone || '')
    const [profilePassword, setProfilePassword] = useState('')
    const [currentPassword, setCurrentPassword] = useState('')
    const [savingProfile, setSavingProfile] = useState(false)
    
    // Address State
    const [isAddressModalOpen, setIsAddressModalOpen] = useState(false)
    const [addressInput, setAddressInput] = useState(visitor.address || '')
    const [savingAddress, setSavingAddress] = useState(false)

    useEffect(() => {
        fetchData()
    }, [visitor.id])

    const fetchData = async () => {
        try {
            const [logsRes, ordersRes, likesRes] = await Promise.all([
                fetch(`/api/public/visitor/logs?visitorId=${visitor.id}`),
                fetch(`/api/public/visitor/orders?visitorId=${visitor.id}`),
                fetch(`/api/public/visitor/likes?visitorId=${visitor.id}`)
            ])
            
            if (logsRes.ok) setLogs(await logsRes.json())
            if (ordersRes.ok) setOrders(await ordersRes.json())
            if (likesRes.ok) setLikes(await likesRes.json())
        } catch (err) {
            console.error('Failed to fetch visitor data', err)
        }
    }

    const handleRecharge = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!rechargeCode) return
        
        setRechargeLoading(true)
        setMessage(null)
        
        try {
            const res = await fetch('/api/public/visitor/recharge', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ visitorId: visitor.id, code: rechargeCode })
            })
            
            const data = await res.json()
            if (res.ok) {
                setMessage({ text: t('public.visitor.rechargeSuccess'), type: 'success' })
                setRechargeCode('')
                onUpdateCurrency?.(data.newBalance)
                fetchData()
            } else {
                setMessage({ text: data.error || t('public.visitor.rechargeError'), type: 'error' })
            }
        } catch (err) {
            setMessage({ text: t('public.visitor.rechargeError'), type: 'error' })
        } finally {
            setRechargeLoading(false)
        }
    }

    const handleSaveAddress = async (e: React.FormEvent) => {
        e.preventDefault()
        setSavingAddress(true)
        try {
            const res = await fetch('/api/public/visitor/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ visitorId: visitor.id, address: addressInput })
            })
            if (res.ok) {
                const existing = JSON.parse(localStorage.getItem('visitor_data') || '{}')
                localStorage.setItem('visitor_data', JSON.stringify({ ...existing, address: addressInput }))
                window.dispatchEvent(new Event('storage'))
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
            const res = await fetch('/api/public/visitor/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    visitorId: visitor.id, 
                    name: profileName,
                    email: profileEmail,
                    phone: profilePhone,
                    password: profilePassword,
                    currentPassword: currentPassword
                })
            })
            
            const data = await res.json()
            if (res.ok) {
                setMessage({ text: 'Profile updated successfully', type: 'success' })
                setProfilePassword('')
                setCurrentPassword('')
                // Update local storage for immediate UI reflect
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
        <div className="flex flex-col h-full relative">
            <AnimatePresence>
                {isAddressModalOpen && (
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0 }} 
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="w-full max-w-sm bg-[#D6D2C0] rounded-xl border-2 border-black/10 shadow-2xl overflow-hidden flex flex-col"
                        >
                            <div className="px-6 py-2.5 bg-[#B8B4A0]/20 border-b border-black/5 flex justify-between items-center">
                                <span className="label-mono text-[9px] font-black uppercase tracking-widest text-[#2C2A20]/60">{t('public.visitor.logisticsHeader')}</span>
                                <button onClick={() => setIsAddressModalOpen(false)} className="hardware-well p-1 rounded-lg bg-black/5 shadow-inner hover:bg-black/10 transition-colors text-[#2C2A20]">
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </div>
                            <div className="p-6 space-y-4 bg-[#D6D2C0]">
                                <div className="hardware-well rounded-xl p-0.5 bg-[#C8C4B0]">
                                    <textarea
                                        value={addressInput}
                                        onChange={e => setAddressInput(e.target.value)}
                                        className="w-full px-5 py-4 bg-[#F4F4F2] rounded-lg outline-none text-xs h-32 resize-none font-bold tracking-tight shadow-inner"
                                        placeholder={t('public.visitor.addressPlaceholder')}
                                    />
                                </div>
                                <div className="flex gap-2 pt-2">
                                    <button onClick={() => setIsAddressModalOpen(false)} className="flex-1 hardware-btn">
                                        <div className="hardware-well p-1 rounded-xl w-full">
                                            <div className="hardware-cap bg-[#E2DFC8] py-3 rounded-lg font-black uppercase tracking-widest text-[9px] text-slate-600 flex items-center justify-center">
                                                CANCEL
                                            </div>
                                        </div>
                                    </button>
                                    <button 
                                        onClick={(e) => {
                                            handleSaveAddress(e);
                                            setIsAddressModalOpen(false);
                                        }} 
                                        disabled={savingAddress} 
                                        className="flex-1 hardware-btn"
                                    >
                                        <div className="hardware-well p-1 rounded-xl w-full">
                                            <div className="hardware-cap bg-white py-3 rounded-lg font-black uppercase tracking-widest text-[9px] text-slate-900 flex items-center justify-center">
                                                {savingAddress ? '...' : t('public.visitor.updateBtn')}
                                            </div>
                                        </div>
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
            <ModalHeader title="VISITOR TERMINAL" id="ACTIVE_NODE" />

            {/* Global Actions & Tabs Row */}
            <div className="flex items-center gap-4 mb-8">
                {/* Tabs - Hardware Switch Style (Matched with Exhibition Controls) */}
                <div className="flex-1 flex bg-[#CFCBBA] p-1.5 rounded-2xl gap-1.5 shadow-inner border border-black/5 overflow-x-auto no-scrollbar">
                    {(['OVERVIEW', 'HISTORY', 'ORDERS', 'COLLECTIONS', 'FAVORITES', 'PROFILE'] as const).map(tab => (
                        <button 
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 py-2 px-4 rounded-[10px] transition-all whitespace-nowrap label-mono text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 ${
                                activeTab === tab 
                                ? 'bg-white shadow-md text-slate-900 scale-[0.98]' 
                                : 'text-slate-500 hover:text-slate-700'
                            }`}
                        >
                            {t(`public.visitor.${tab.toLowerCase()}`)}
                        </button>
                    ))}
                </div>

                {/* Global Fast Actions */}
                <div className="flex items-center gap-2 shrink-0">
                    <Link href="/family/exhibitions" title="Family Exhibition" className="hardware-btn block">
                        <div className="hardware-well p-1 rounded-xl">
                            <div className="hardware-cap bg-white p-2.5 rounded-lg text-slate-600 flex items-center justify-center">
                                <LayoutGrid className="w-4 h-4" />
                            </div>
                        </div>
                    </Link>
                    <button onClick={onLogout} title="Logout" className="hardware-btn block">
                        <div className="hardware-well p-1 rounded-xl">
                            <div className="hardware-cap bg-rose-500 border border-rose-600/50 p-2.5 rounded-lg text-white flex items-center justify-center shadow-lg">
                                <LogOut className="w-4 h-4" />
                            </div>
                        </div>
                    </button>
                </div>
            </div>

            {/* Tab Content Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar -mr-2 pr-2">
                <AnimatePresence mode="wait">
                    {activeTab === 'OVERVIEW' ? (
                        <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 mt-2">
                            {/* Hardpoint Terminal Dashboard */}
                            <div className="relative bg-[#D6D2C0] rounded-2xl p-6 shadow-[inset_0_4px_12px_rgba(0,0,0,0.1)] border-4 border-[#C8C4B0] overflow-hidden">
                                
                                {/* Status Header */}
                                <div className="flex justify-between items-center px-2 mb-6">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]" />
                                        <span className="label-mono text-[9px] font-black uppercase tracking-[0.25em] text-slate-800">Profile</span>
                                    </div>
                                    <div className="flex gap-1.5 opacity-60">
                                        <div className="w-1 h-3 bg-amber-500/30 rounded-full" />
                                        <div className="w-1 h-3 bg-amber-500/80 rounded-full animate-pulse" />
                                    </div>
                                </div>

                                <div className="flex flex-col md:flex-row gap-6 items-stretch">
                                    {/* Identity Component (Deep Recessed) */}
                                    <div className="flex-1 hardware-well rounded-xl bg-[#C8C4B0] p-1 shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] border-b border-white/30 relative">
                                        <div className="bg-[#FAF9F6]/90 rounded-[0.7rem] p-4 flex items-center gap-4 border border-[#C8C4B0] h-full relative overflow-hidden group shadow-inner">
                                            {/* Micro Texture Background */}
                                            <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#000_1px,transparent_1px)] bg-[length:4px_4px]" />
                                            
                                            <div className="w-14 h-14 bg-[#2C2A20] rounded-lg shadow-lg border-t-2 border-white/10 flex items-center justify-center font-black text-indigo-400 text-xl shrink-0 relative transition-transform group-hover:scale-95 duration-500">
                                                {visitor.name[0].toUpperCase()}
                                            </div>
                                            <div className="min-w-0">
                                                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight truncate leading-tight">{visitor.name}</h3>
                                                <div className="flex flex-col gap-0.5 mt-1">
                                                    {visitor.phone && <span className="text-[8px] font-bold text-slate-500 tracking-widest uppercase truncate">{visitor.phone}</span>}
                                                    {visitor.email && <span className="text-[8px] font-bold text-slate-400 tracking-widest uppercase truncate opacity-70">{visitor.email}</span>}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Balance Component (Hard Recessed) */}
                                    <div className="md:w-56 hardware-well rounded-xl bg-[#1A1C18] p-4 shadow-[inset_0_4px_10px_rgba(0,0,0,0.8)] border border-[#A8A490]/50 border-b-0 flex flex-col justify-center items-center text-center relative group">
                                        <div className="absolute inset-0 bg-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <p className="label-mono text-[8px] font-black uppercase tracking-[0.2em] text-[#B88000]/60 mb-1">Coin Balance</p>
                                        <div className="flex items-baseline justify-center gap-2 relative z-10">
                                            <span className="text-4xl font-black tracking-tighter text-[#B88000]">
                                                {visitor.currency}
                                            </span>
                                            <div className="w-1.5 h-1.5 rounded-sm bg-indigo-500/20 shadow-inner" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6 pt-2">
                                <div className="flex items-center gap-3 px-2">
                                    <h4 className="label-mono text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2 shrink-0">
                                        <Ticket className="w-3.5 h-3.5 opacity-50" />
                                        {t('public.visitor.recharge')}
                                    </h4>
                                    <div className="flex-1 h-px bg-slate-300" />
                                </div>
                                <form onSubmit={handleRecharge} className="flex gap-2">
                                    <div className="flex-1 hardware-well rounded-lg p-0.5 bg-[#C8C4B0]">
                                        <input 
                                            type="text" 
                                            value={rechargeCode}
                                            onChange={e => setRechargeCode(e.target.value)}
                                            className="w-full px-4 py-3 bg-[#F4F4F2] rounded-md outline-none font-black text-slate-900 uppercase tracking-widest text-xs placeholder:text-slate-400"
                                            placeholder="XXXX-XXXX-XXXX"
                                        />
                                    </div>
                                    <button 
                                        disabled={rechargeLoading || !rechargeCode}
                                        className="hardware-btn min-w-[100px]"
                                    >
                                        <div className="hardware-well p-1 rounded-xl w-full">
                                            <div className="hardware-cap bg-white py-3 rounded-lg font-black uppercase tracking-widest text-[9px] text-slate-900 disabled:opacity-50 transition-all flex items-center justify-center px-4">
                                                {rechargeLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : t('public.visitor.rechargeBtn')}
                                            </div>
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
                        <motion.div key="collections" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {orders.filter(o => o.status !== 'PENDING_CONFIRM').map(order => (
                                <div key={order.id} className="bg-white p-4 rounded-2xl border-2 border-[#CFCBBA] flex flex-col gap-4 shadow-sm group hover:border-indigo-300 transition-all">
                                    <div className="aspect-square bg-slate-100 rounded-xl overflow-hidden border border-slate-200 relative">
                                        {order.artworkImage && (
                                            <img 
                                                src={order.artworkImage} 
                                                alt={order.artworkTitle} 
                                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                                            />
                                        )}
                                        <div className="absolute top-3 right-3">
                                            <div className={`px-2 py-1 rounded-lg text-[7px] font-black uppercase tracking-widest border shadow-sm ${order.status === 'SHIPPED' ? 'bg-emerald-500 text-white border-emerald-600' : 'bg-indigo-500 text-white border-indigo-600'}`}>
                                                {order.status}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="px-1">
                                        <h4 className="font-black text-slate-800 uppercase tracking-tight text-xs mb-1 truncate">{order.artworkTitle}</h4>
                                        <div className="flex items-center justify-between mt-3">
                                            <span className="text-[7px] text-slate-400 font-black uppercase tracking-[0.2em]">{new Date(order.createdAt).toLocaleDateString()}</span>
                                            <div className="flex gap-2">
                                                <a href={order.artworkImage} target="_blank" rel="noopener noreferrer" className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors border border-slate-200" title="View Original">
                                                    <ExternalLink className="w-3.5 h-3.5" />
                                                </a>
                                                <a href={order.artworkImage} download={`${order.artworkTitle}.jpg`} className="p-2 bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-600 rounded-lg transition-all border border-indigo-100" title="Download Data">
                                                    <Download className="w-3.5 h-3.5" />
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {orders.filter(o => o.status !== 'PENDING_CONFIRM').length === 0 && (
                                <div className="col-span-full py-20 bg-slate-100/50 rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center">
                                    <History className="w-8 h-8 text-slate-300 mb-3 opacity-50" />
                                    <p className="label-mono text-[9px] font-black text-slate-400 uppercase tracking-widest">Archive empty. Orders will appear here after confirmation.</p>
                                </div>
                            )}
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
                    ) : (
                        <motion.div key="profile" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                            <h4 className="label-mono text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <User className="w-3.5 h-3.5" />
                                {t('public.visitor.identityConfig')}
                            </h4>
                            <form onSubmit={handleSaveProfile} className="space-y-4">
                                <div className="space-y-3">
                                    <div className="hardware-well rounded-lg p-0.5 bg-[#C8C4B0]">
                                        <input
                                            required
                                            value={profileName}
                                            onChange={e => setProfileName(e.target.value)}
                                            className="w-full px-5 py-3 bg-[#F4F4F2] rounded-md outline-none text-xs font-bold tracking-tight shadow-inner"
                                            placeholder={t('public.visitor.nickname')}
                                        />
                                    </div>
                                    <div className="hardware-well rounded-lg p-0.5 bg-[#C8C4B0]">
                                        <input
                                            required={!profilePhone}
                                            type="email"
                                            value={profileEmail}
                                            onChange={e => setProfileEmail(e.target.value)}
                                            className="w-full px-5 py-3 bg-[#F4F4F2] rounded-md outline-none text-xs font-bold tracking-tight shadow-inner"
                                            placeholder={t('public.visitor.email')}
                                        />
                                    </div>
                                    <div className="hardware-well rounded-lg p-0.5 bg-[#C8C4B0]">
                                        <input
                                            required={!profileEmail}
                                            type="tel"
                                            value={profilePhone}
                                            onChange={e => setProfilePhone(e.target.value)}
                                            className="w-full px-5 py-3 bg-[#F4F4F2] rounded-md outline-none text-xs font-bold tracking-tight shadow-inner"
                                            placeholder={t('public.visitor.phone')}
                                        />
                                    </div>
                                    
                                    <div className="pt-2 border-t border-slate-200" />
                                    
                                    <div className="px-1">
                                        <p className="label-mono text-[8px] text-slate-500 mb-2 uppercase tracking-widest">
                                            {t('public.visitor.passwordTip')}
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div className="hardware-well rounded-lg p-0.5 bg-[#C8C4B0]">
                                            <input
                                                type="password"
                                                value={profilePassword}
                                                onChange={e => setProfilePassword(e.target.value)}
                                                className="w-full px-5 py-3 bg-[#F4F4F2] rounded-md outline-none text-xs font-bold tracking-tight shadow-inner"
                                                placeholder={t('public.visitor.newPassword')}
                                            />
                                        </div>
                                        <div className={`hardware-well rounded-lg p-0.5 ${profilePassword ? 'bg-amber-400 animate-pulse' : 'bg-[#C8C4B0]'}`}>
                                            <input
                                                type="password"
                                                required={!!profilePassword}
                                                value={currentPassword}
                                                onChange={e => setCurrentPassword(e.target.value)}
                                                className="w-full px-5 py-3 bg-[#F4F4F2] rounded-md outline-none text-xs font-bold tracking-tight shadow-inner"
                                                placeholder={profilePassword ? t('public.visitor.currentPassword') : t('public.visitor.passwordVerification')}
                                            />
                                        </div>
                                    </div>
                                    {profilePassword && (
                                        <p className="text-[8px] text-amber-600 font-bold uppercase tracking-widest px-2">
                                            {t('public.visitor.securityWarning')}
                                        </p>
                                    )}
                                </div>

                                <div className="pt-4 border-t border-slate-200 space-y-3">
                                    <h5 className="label-mono text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-between">
                                        <span>LOGISTICS BUFFER</span>
                                        <button type="button" onClick={() => setIsAddressModalOpen(true)} className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors font-black">
                                            <MapPin className="w-3 h-3" />
                                            <span>{t('public.visitor.configure')}</span>
                                        </button>
                                    </h5>
                                    <div className="hardware-well rounded-lg p-4 bg-white/50 border border-slate-200 shadow-inner group cursor-pointer hover:bg-white transition-colors" onClick={() => setIsAddressModalOpen(true)}>
                                        <p className="text-[10px] font-bold text-slate-600 leading-relaxed line-clamp-2">
                                            {addressInput || t('public.visitor.logisticsEmpty')}
                                        </p>
                                    </div>
                                </div>

                                <button type="submit" disabled={savingProfile} className="hardware-btn w-full mt-4">
                                    <div className="hardware-well p-1 rounded-xl w-full">
                                        <div className="hardware-cap bg-white py-3 rounded-lg font-black uppercase tracking-widest text-[9px] text-slate-900 flex items-center justify-center">
                                            {savingProfile ? 'PATCHING...' : t('public.visitor.updateBtn')}
                                        </div>
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
                    background: #C8C4B0;
                    border-radius: 10px;
                }
            `}</style>
        </div>
    )
}
