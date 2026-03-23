'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { 
    MessageSquare, 
    History, 
    ExternalLink, 
    Download,
    MapPin,
    X,
    Loader2,
    ArrowUpRight,
    ArrowDownRight,
    LayoutGrid,
    ExternalLink as ExternalLinkIcon,
    Settings,
    ShieldCheck,
    Heart,
    Package
} from 'lucide-react'
import Link from 'next/link'
import { useI18n } from '@/contexts/I18nContext'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'

interface MemberData {
    id: string
    name: string
    nickname?: string | null
    avatar?: string | null
    currency: number
    phone?: string | null
    email?: string | null
    address?: string | null
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

interface SystemMessage {
    id: string
    text: string
    isPublic: boolean
    createdAt: number
    visitorName?: string | null
    memberNickname?: string | null
    memberName?: string | null
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

export default function MemberCenter({ member, onLogout, onUpdateCurrency }: { 
    member: MemberData, 
    onLogout: () => void,
    onUpdateCurrency?: (newVal: number) => void
}) {
    const { t } = useI18n()
    const router = useRouter()
    const params = useParams()
    const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'HISTORY' | 'ORDERS' | 'COLLECTIONS' | 'FAVORITES' | 'PROFILE'>('OVERVIEW')
    const [logs, setLogs] = useState<VisitorLog[]>([])
    const [orders, setOrders] = useState<VisitorOrder[]>([])
    const [likes, setLikes] = useState<VisitorLike[]>([])
    const [messages, setMessages] = useState<SystemMessage[]>([])
    const [messageLoading, setMessageLoading] = useState(false)
    
    // Address State
    const [isAddressModalOpen, setIsAddressModalOpen] = useState(false)
    const [addressInput, setAddressInput] = useState(member.address || '')
    const [savingAddress, setSavingAddress] = useState(false)

    useEffect(() => {
        fetchData()
        fetchMessages()
    }, [member.id])

    const fetchData = async () => {
        try {
            const [logsRes, ordersRes, likesRes] = await Promise.all([
                fetch(`/api/public/visitor/logs?memberId=${member.id}`),
                fetch(`/api/public/visitor/orders?memberId=${member.id}`),
                fetch(`/api/public/visitor/likes?memberId=${member.id}`)
            ])
            
            if (logsRes.ok) setLogs(await logsRes.json())
            if (ordersRes.ok) setOrders(await ordersRes.json())
            if (likesRes.ok) setLikes(await likesRes.json())
        } catch (_err) {
            console.error('Failed to fetch member data', _err)
        }
    }

    const fetchMessages = async () => {
        setMessageLoading(true)
        try {
            const res = await fetch(`/api/public/message?userId=${member.id}&limit=20`)
            if (res.ok) {
                setMessages(await res.json())
            }
        } catch (_err) {
            console.error('Failed to fetch messages', _err)
        } finally {
            setMessageLoading(false)
        }
    }

    const handleSaveAddress = async (e: React.FormEvent) => {
        e.preventDefault()
        setSavingAddress(true)
        try {
            const res = await fetch('/api/public/visitor/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ memberId: member.id, address: addressInput })
            })
            if (res.ok) {
                // Update local member data
                member.address = addressInput 
                onUpdateCurrency?.(member.currency)
                setIsAddressModalOpen(false)
            }
        } finally {
            setSavingAddress(false)
        }
    }

    const openAddressModal = () => {
        setAddressInput(member.address || '')
        setIsAddressModalOpen(true)
    }

    const displayName = member.nickname || member.name

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
                                    <button onClick={handleSaveAddress} disabled={savingAddress} className="flex-1 hardware-btn">
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
                <div className="flex-1 flex bg-[#CFCBBA] p-1.5 rounded-2xl gap-1.5 shadow-inner border border-black/5 overflow-x-auto no-scrollbar">
                    {(['OVERVIEW', 'HISTORY', 'ORDERS', 'COLLECTIONS', 'FAVORITES', 'PROFILE'] as const).map(tab => (
                        <button 
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 py-2 px-4 rounded-[10px] transition-all whitespace-nowrap label-mono text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 ${
                                activeTab === tab 
                                ? 'bg-white shadow-md text-slate-900' 
                                : 'text-slate-500 hover:text-slate-700'
                            }`}
                        >
                            {t(`public.visitor.${tab.toLowerCase()}`)}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <Link href="/family/exhibitions" title="Family Exhibition" className="hardware-btn block">
                        <div className="hardware-well p-1 rounded-xl">
                            <div className="hardware-cap bg-white p-2.5 rounded-lg text-slate-600 flex items-center justify-center">
                                <LayoutGrid className="w-4 h-4" />
                            </div>
                        </div>
                    </Link>
                    {/* Yellow Admin Redirect Button (Replaces Logout) */}
                    <button onClick={() => router.push('/admin/profile')} title={t('parent.profile')} className="hardware-btn block">
                        <div className="hardware-well p-1 rounded-xl">
                            <div className="hardware-cap bg-amber-400 border border-amber-500/50 p-2.5 rounded-lg text-amber-900 flex items-center justify-center shadow-lg active:translate-y-0.5">
                                <Settings className="w-4 h-4" />
                            </div>
                        </div>
                    </button>
                </div>
            </div>

            {/* Content Area - Page Scroll handled by parent */}
            <div className="flex-1">
                <AnimatePresence mode="wait">
                    {activeTab === 'OVERVIEW' ? (
                        <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 mt-2">
                            <div className="relative bg-[#E2DFD2] rounded-2xl p-6 shadow-[inset_0_4px_12px_rgba(0,0,0,0.1)] border-4 border-[#C8C4B0] overflow-hidden">
                                <div className="flex justify-between items-center px-2 mb-6">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)] animate-pulse-slow" />
                                        <span className="label-mono text-[9px] font-black uppercase tracking-[0.25em] text-slate-800">Profile Dash</span>
                                    </div>
                                    <div className="flex gap-1.5 opacity-60">
                                        <div className="w-1 h-3 bg-indigo-500/30 rounded-full" />
                                        <div className="w-1 h-3 bg-indigo-500/80 rounded-full animate-pulse" />
                                    </div>
                                </div>

                                <div className="flex flex-col md:flex-row gap-6 items-stretch">
                                    <div className="flex-1 hardware-well rounded-xl bg-[#C8C4B0] p-1 shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] border-b border-white/30">
                                        <div className="bg-[#FAF9F6]/90 rounded-[0.7rem] p-4 flex items-center gap-4 border border-[#C8C4B0] h-full relative overflow-hidden group shadow-inner">
                                            <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#000_1.5px,transparent_1.5px)] bg-[length:4px_4px]" />
                                            <div className="w-14 h-14 bg-[#2C2A20] rounded-lg shadow-lg border-t-2 border-white/10 flex items-center justify-center font-black text-indigo-400 text-xl shrink-0 overflow-hidden relative">
                                                {member.avatar ? (
                                                    <Image src={member.avatar} alt={displayName} fill className="object-cover" />
                                                ) : (
                                                    <span>{member.name[0].toUpperCase()}</span>
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight truncate leading-tight">{displayName}</h3>
                                                <div className="flex flex-col gap-0.5 mt-1">
                                                    <span className="text-[8px] font-bold text-slate-500 tracking-widest uppercase truncate">{member.phone || '/'}</span>
                                                    <span className="text-[8px] font-bold text-slate-400 tracking-widest uppercase truncate opacity-70">{member.email || '/'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="md:w-56 hardware-well rounded-xl bg-[#1A1C18] p-4 shadow-[inset_0_4px_10px_rgba(0,0,0,0.8)] border border-[#A8A490]/50 border-b-0 flex flex-col justify-center items-center text-center group">
                                        <p className="label-mono text-[8px] font-black uppercase tracking-[0.2em] text-[#B88000]/60 mb-1">Coin Balance</p>
                                        <span className="text-4xl font-black tracking-tighter text-[#B88000]">{member.currency}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4 pt-2 overflow-hidden">
                                <div className="flex items-center justify-between px-2 mb-2">
                                    <div className="flex items-center gap-3">
                                        <h4 className="label-mono text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2 shrink-0">
                                            <MessageSquare className="w-3.5 h-3.5 opacity-50" />
                                            Signal Streams
                                        </h4>
                                        <div className="w-12 h-px bg-slate-300" />
                                    </div>
                                    <button 
                                        onClick={() => router.push('/admin/gallery/messages')}
                                        className="label-mono text-[8px] font-black text-indigo-500 hover:text-indigo-700 uppercase tracking-widest flex items-center gap-1.5 transition-colors group/entry"
                                    >
                                        <span>Manage Backend</span>
                                        <ArrowUpRight className="w-3 h-3 group-hover/entry:translate-x-0.5 group-hover/entry:-translate-y-0.5 transition-transform" />
                                    </button>
                                </div>
                                <div className="relative space-y-2 py-4">
                                    {[0, 1, 2].map((rowIndex) => {
                                        const publicMessages = messages.filter(m => m.isPublic);
                                        const rowMessages = publicMessages.filter((_, i) => i % 3 === rowIndex);
                                        if (rowMessages.length === 0) return null;

                                        return (
                                            <div key={rowIndex} className="relative group/track overflow-hidden h-9">
                                                <div 
                                                    className={`flex whitespace-nowrap animate-marquee absolute inset-y-0 ${rowIndex === 1 ? 'marquee-reverse' : ''}`}
                                                    style={{ animationDuration: `${20 + rowIndex * 5}s` }}
                                                >
                                                    {[...rowMessages, ...rowMessages, ...rowMessages].map((msg, idx) => (
                                                        <div key={`${msg.id}-${idx}`} className="inline-flex items-center mx-2 bg-[#FAF9F6] px-4 py-2 rounded-full border border-[#C8C4B0]/40 shadow-sm shrink-0">
                                                            <span className="text-[#2C2A20] text-[10px] font-bold italic mr-3 max-w-[180px] overflow-hidden whitespace-nowrap text-ellipsis">&ldquo;{msg.text}&rdquo;</span>
                                                            <span className="label-mono text-[7px] font-black uppercase tracking-widest text-indigo-500 bg-indigo-50/50 px-2 py-0.5 rounded-full shrink-0">
                                                                {msg.memberNickname || msg.memberName || msg.visitorName || 'ANONYMOUS'}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                    
                                    {messages.filter(m => m.isPublic).length === 0 && (
                                        <div className="w-full text-center label-mono text-[8px] text-slate-400 opacity-50 py-10 border-2 border-dashed border-[#C8C4B0]/30 rounded-2xl">
                                            NO COMMUNICATIONS LOGGED
                                        </div>
                                    )}

                                    {/* Gradients to hide edges */}
                                    <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[#D6D2C0] to-transparent z-10 pointer-events-none" />
                                    <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[#D6D2C0] to-transparent z-10 pointer-events-none" />
                                </div>
                            </div>
                        </motion.div>
                    ) : activeTab === 'HISTORY' ? (
                        <motion.div key="history" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-8">
                            {logs.map(log => (
                                <div key={log.id} className="bg-[#FAF9F6] p-3 rounded-xl border border-[#C8C4B0]/50 flex justify-between items-center text-[10px] shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-1.5 rounded-lg ${log.amount > 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                                            {log.amount > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                        </div>
                                        <div>
                                            <p className="font-black text-slate-800 uppercase tracking-tight">{log.reason}</p>
                                            <p className="text-[8px] font-bold text-slate-400">{new Date(log.createdAt).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <p className={`font-black ${log.amount > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                        {log.amount > 0 ? '+' : ''}{log.amount}
                                    </p>
                                </div>
                            ))}
                            {logs.length === 0 && <p className="col-span-full text-center py-20 label-mono text-[9px] opacity-30">ARCHIVE EMPTY</p>}
                        </motion.div>
                    ) : activeTab === 'ORDERS' ? (
                        <motion.div key="orders" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3 pb-8">
                            {orders.filter(o => o.status === 'PENDING_CONFIRM').map(order => (
                                <div key={order.id} className="bg-white p-3 rounded-2xl border-2 border-[#CFCBBA] flex gap-3 items-center shadow-sm">
                                    <div className="w-12 h-12 bg-slate-100 rounded-lg overflow-hidden shrink-0 border border-slate-200 relative">
                                        {order.artworkImage && <Image src={order.artworkImage} alt={order.artworkTitle} fill className="object-cover" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-black text-slate-800 uppercase tracking-tight text-[10px] mb-0.5 truncate">{order.artworkTitle}</h4>
                                        <span className="text-[7px] text-slate-400 font-bold uppercase block">{new Date(order.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <div className="px-2 py-1 rounded-lg text-[7px] font-black uppercase tracking-widest border bg-amber-50 text-amber-600 border-amber-100">{order.status}</div>
                                </div>
                            ))}
                            {orders.filter(o => o.status === 'PENDING_CONFIRM').length === 0 && <p className="text-center py-20 label-mono text-[9px] opacity-30">NO PENDING SIGNALS</p>}
                        </motion.div>
                    ) : (activeTab === 'COLLECTIONS' || activeTab === 'FAVORITES') ? (
                        <motion.div key="items" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-2 md:grid-cols-2 gap-4 pb-8">
                            {activeTab === 'COLLECTIONS' ? orders.filter(o => o.status !== 'PENDING_CONFIRM').map(order => (
                                <div key={order.id} className="bg-white p-4 rounded-2xl border-2 border-[#CFCBBA] flex flex-col gap-4 shadow-sm group">
                                    <div className="aspect-square bg-slate-100 rounded-xl overflow-hidden border border-slate-200 relative">
                                        {order.artworkImage && <Image src={order.artworkImage} alt={order.artworkTitle} fill className="object-cover transition-transform duration-700 group-hover:scale-110" />}
                                    </div>
                                    <h4 className="font-black text-slate-800 uppercase tracking-tight text-xs truncate px-1">{order.artworkTitle}</h4>
                                </div>
                            )) : likes.map(like => (
                                <Link key={like.id} href={`/u/${member.id}/exhibition/${like.artworkId}`} className="bg-white p-3 rounded-2xl border-2 border-[#CFCBBA] flex gap-3 items-center shadow-sm hover:border-indigo-200 transition-colors">
                                    <div className="w-12 h-12 bg-slate-100 rounded-lg overflow-hidden shrink-0 border border-slate-200 relative">
                                        {like.artworkImage && <Image src={like.artworkImage} alt={like.artworkTitle} fill className="object-cover" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-black text-slate-800 uppercase tracking-tight text-[10px] mb-0.5 truncate">{like.artworkTitle}</h4>
                                    </div>
                                    <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
                                </Link>
                            ))}
                        </motion.div>
                    ) : (
                        <motion.div key="profile" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10 pb-12">
                            <h4 className="label-mono text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Settings className="w-3.5 h-3.5" />
                                Credentials Shield
                            </h4>
                            
                            {/* Simplified Restricted Access Block */}
                            <div className="hardware-well rounded-[2rem] bg-[#C8C4B0] p-1 shadow-[inset_0_4px_12px_rgba(0,0,0,0.15)] relative overflow-hidden group">
                                <div className="absolute inset-0 opacity-[0.05] pointer-events-none bg-[radial-gradient(#000_1px,transparent_1px)] bg-[length:4px_4px]" />
                                <div className="bg-[#FAF9F6]/80 rounded-[1.8rem] p-12 flex flex-col items-center text-center gap-6 border border-[#C8C4B0] relative z-10">
                                    <p className="label-mono text-[10px] font-black text-slate-600 uppercase tracking-widest">
                                        Family member credentials managed via terminal.
                                    </p>
                                    
                                    <button onClick={() => router.push('/admin/profile')} className="hardware-btn group w-full max-w-[200px]">
                                        <div className="hardware-well p-1 rounded-xl w-full">
                                            <div className="hardware-cap bg-[#2C2A20] py-4 rounded-lg font-black uppercase tracking-widest text-[9px] text-amber-400 flex items-center justify-center gap-2 hover:bg-black transition-all">
                                                Go to Admin
                                                <ExternalLinkIcon className="w-3.5 h-3.5" />
                                            </div>
                                        </div>
                                    </button>
                                </div>
                            </div>

                            <div className="pt-6 border-t-2 border-[#C8C4B0]/30 space-y-4">
                                <h5 className="label-mono text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-between px-2">
                                    <span>LOGISTICS BUFFER</span>
                                    <button type="button" onClick={openAddressModal} className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-black">
                                        <MapPin className="w-3 h-3" />
                                        <span>CONFIGURE</span>
                                    </button>
                                </h5>
                                <div className="hardware-well rounded-2xl p-6 bg-white/50 border border-[#C8C4B0]/40 shadow-inner group cursor-pointer hover:bg-white transition-colors" onClick={openAddressModal}>
                                    <div className="flex items-start gap-4">
                                        <div className="p-2 bg-slate-100 rounded-lg text-slate-400 group-hover:text-indigo-500">
                                            <Package className="w-4 h-4" />
                                        </div>
                                        <p className="text-[11px] font-bold text-slate-600 leading-relaxed pt-1">
                                            {member.address || 'NO DATA REGISTERED'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            
            <style jsx global>{`
                .animate-marquee {
                    animation: marquee 30s linear infinite;
                }
                @keyframes marquee {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-33.333%); }
                }
                .marquee-reverse {
                    animation-direction: reverse;
                }
                .animate-marquee:hover {
                    animation-play-state: paused;
                }
                .shadow-well {
                    box-shadow: inset 0 2px 4px rgba(0,0,0,0.1), 0 1px 2px rgba(255,255,255,0.5);
                }
                @keyframes pulse-slow {
                    0%, 100% { opacity: 1; filter: drop-shadow(0 0 5px rgba(129,140,248,0.5)); }
                    50% { opacity: 0.8; filter: drop-shadow(0 0 2px rgba(129,140,248,0.2)); }
                }
                .animate-pulse-slow {
                    animation: pulse-slow 4s ease-in-out infinite;
                }
            `}</style>
        </div>
    )
}
