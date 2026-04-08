'use client'

import React, { useState, useEffect, useRef } from 'react'
import { CheckCircle, RotateCcw, MessageSquare, X, Package, User, Phone, Loader2, ShoppingBag, Palette, Star } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import Image from 'next/image'
import { useI18n } from '@/contexts/I18nContext'
import clsx from 'clsx'

interface ShopOrder {
    id: string
    costCoins: number
    status: string
    remarks: string | null
    createdAt: number
    userId: string
    user: { name: string, avatarUrl: string | null }
    item: { name: string, iconUrl: string | null }
}

interface GalleryOrder {
    id: string
    visitor: { name: string, phone: string }
    artwork: { title: string, imageUrl: string, priceCoins: number }
    artist: { name: string, nickname: string | null }
    userId: string
    amountRMB: number
    status: string
    createdAt: number
}

const STATUS_CONFIG: Record<string, { labelKey: string; className: string }> = {
    PENDING: { labelKey: 'order.status.pending', className: 'bg-amber-100 text-amber-600' },
    COMPLETED: { labelKey: 'order.status.completed', className: 'bg-green-100 text-green-600' },
    REFUNDED: { labelKey: 'order.status.refunded', className: 'bg-rose-100  text-rose-600' },
}

function ItemIcon({ iconUrl, name }: { iconUrl: string | null; name: string }) {
    const isUrl = iconUrl && (iconUrl.startsWith('/') || iconUrl.startsWith('http'))
    if (isUrl) {
        return (
            <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200/50">
                <Image 
                    src={iconUrl} 
                    alt={name} 
                    width={56} 
                    height={56} 
                    className="w-full h-full object-cover" 
                />
            </div>
        )
    }
    if (iconUrl) {
        return <div className="w-14 h-14 rounded-xl bg-slate-100 flex items-center justify-center text-3xl shrink-0">{iconUrl}</div>
    }
    return (
        <div className="w-14 h-14 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
            <Package className="w-7 h-7 text-slate-300" />
        </div>
    )
}

export default function OrderManagement({ defaultTab = 'SHOP', hideTabs = false }: { defaultTab?: 'SHOP' | 'GALLERY', hideTabs?: boolean }) {
    const { t } = useI18n()
    const [tab, setTab] = useState<'SHOP' | 'GALLERY'>(defaultTab)
    const [_shopSubView, _setShopSubView] = useState<'ITEMS' | 'WISHES'>('ITEMS')
    const [shopOrders, setShopOrders] = useState<ShopOrder[]>([])
    const [galleryOrders, setGalleryOrders] = useState<GalleryOrder[]>([])
    const [loading, setLoading] = useState(true)
    const [updating, setUpdating] = useState<string | null>(null)

    const [remarkModal, setRemarkModal] = useState<{ open: boolean; orderId: string; initialValue: string }>({
        open: false, orderId: '', initialValue: ''
    })
    const [remarkText, setRemarkText] = useState('')
    const remarkRef = useRef<HTMLTextAreaElement>(null)
    const [children, setChildren] = useState<{ id: string; name: string; nickname: string | null }[]>([])
    const [filterUserId, setFilterUserId] = useState<string>('ALL')
    const [showMemberDrop, setShowMemberDrop] = useState(false)
    const dropRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
                setShowMemberDrop(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const fetchData = React.useCallback(async () => {
        setLoading(true)
        try {
            const [shopRes, galleryRes, childrenRes] = await Promise.all([
                fetch('/api/parent/orders'),
                fetch('/api/parent/gallery-orders'),
                fetch('/api/parent/children')
            ])
            if (shopRes.ok) setShopOrders(await shopRes.json())
            if (galleryRes.ok) setGalleryOrders(await galleryRes.json())
            if (childrenRes.ok) setChildren(await childrenRes.json())
        } catch (_e) { console.error(_e) }
        finally { setLoading(false) }
    }, [])

    useEffect(() => { fetchData() }, [fetchData])

    useEffect(() => {
        if (remarkModal.open) {
            setRemarkText(remarkModal.initialValue)
            setTimeout(() => remarkRef.current?.focus(), 100)
        }
    }, [remarkModal])

    const handleShopUpdate = async (id: string, data: Record<string, unknown>) => {
        setUpdating(id)
        try {
            const res = await fetch('/api/parent/orders', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, ...data })
            })
            if (res.ok) await fetchData()
        } catch (_e) { console.error(_e) }
        finally { setUpdating(null) }
    }

    const handleGalleryUpdate = async (id: string, status: string) => {
        setUpdating(id)
        try {
            const res = await fetch('/api/parent/gallery-orders', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status })
            })
            if (res.ok) await fetchData()
        } catch (_e) { console.error(_e) }
        finally { setUpdating(null) }
    }

    if (loading) return (
        <div className="flex flex-col items-center justify-center py-40 hardware-well rounded-[40px] bg-[#DADBD4] shadow-well mt-12">
            <Loader2 className="w-10 h-10 animate-spin text-yellow-500 mb-6" />
            <p className="text-slate-500 font-black uppercase tracking-[0.4em] text-[10px] label-mono animate-pulse">{t('common.loading')}</p>
        </div>
    )

    return (
        <div className="space-y-10">
            {/* ── Baustein Header HUD ────────────────────────────────────────── */}
            <div className="flex flex-col lg:flex-row justify-between items-center gap-6 w-full mb-4">
                <div className="flex flex-col items-center lg:items-start gap-1">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#C8C9B8] rounded-xl flex items-center justify-center shadow-inner-warm hardware-well">
                            {tab === 'SHOP' ? <ShoppingBag className="w-5 h-5 text-slate-600" /> : <Palette className="w-5 h-5 text-slate-600" />}
                        </div>
                        <h2 className="text-3xl font-black text-slate-800 tracking-tighter uppercase">
                            {tab === 'SHOP' ? t('parent.orders.shop') : t('parent.orders.gallery')}
                        </h2>
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest label-mono lg:ml-12">
                        {tab === 'SHOP' ? 'REWARD REDEMPTION HISTORY' : 'VISITOR PURCHASE MANIFEST'}
                    </p>
                </div>

                <div className="flex flex-col md:flex-row items-center gap-4 w-full lg:w-auto">
                    {/* Member Filter WELL */}
                    <div className="relative w-full md:w-auto" ref={dropRef}>
                        <div className="flex items-center gap-2 bg-[#DADBD4] p-1.5 rounded-2xl shadow-well hardware-well shrink-0 w-full md:min-w-56">
                            <button 
                                onClick={() => setShowMemberDrop(!showMemberDrop)}
                                className="flex-1 px-4 py-2.5 bg-white text-slate-800 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-cap translate-y-[-1px] flex items-center justify-between gap-3"
                            >
                                <div className="flex items-center gap-2">
                                    <User className="w-3.5 h-3.5 text-slate-400" />
                                    {filterUserId === 'ALL' ? 'ALL MEMBERS' : children.find(c => c.id === filterUserId)?.name.toUpperCase() || 'ALL MEMBERS'}
                                </div>
                                <motion.div animate={{ rotate: showMemberDrop ? 180 : 0 }}>
                                    <X className={clsx("w-3.5 h-3.5 text-slate-300 transition-transform", !showMemberDrop && "rotate-45")} />
                                </motion.div>
                            </button>
                        </div>

                        <AnimatePresence>
                            {showMemberDrop && (
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9, y: 10 }}
                                    className="absolute top-full left-0 right-0 mt-3 p-2 bg-[#FEFBEA] rounded-2xl shadow-2xl border border-white/60 z-[200] overflow-hidden shadow-cap"
                                >
                                    <button
                                        onClick={() => { setFilterUserId('ALL'); setShowMemberDrop(false); }}
                                        className={clsx(
                                            "w-full px-4 py-3 text-left text-[11px] font-black uppercase tracking-widest transition-all rounded-xl",
                                            filterUserId === 'ALL' ? "bg-indigo-600 text-white shadow-lg" : "text-slate-500 hover:bg-slate-100"
                                        )}
                                    >
                                        ALL MEMBERS
                                    </button>
                                    <div className="h-px bg-slate-200/50 my-1 mx-2" />
                                    {children.map(child => (
                                        <button
                                            key={child.id}
                                            onClick={() => { setFilterUserId(child.id); setShowMemberDrop(false); }}
                                            className={clsx(
                                                "w-full px-4 py-3 text-left text-[11px] font-black uppercase tracking-widest transition-all rounded-xl mt-1",
                                                filterUserId === child.id ? "bg-indigo-600 text-white shadow-lg" : "text-slate-500 hover:bg-slate-100"
                                            )}
                                        >
                                            {child.nickname || child.name}
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {!hideTabs && (
                        <div className="flex items-center gap-1.5 bg-[#DADBD4] p-1.5 rounded-2xl shadow-well hardware-well shrink-0 w-full md:w-auto">
                            {(['SHOP', 'GALLERY'] as const).map(tView => (
                                <button
                                    key={tView}
                                    onClick={() => setTab(tView)}
                                    className={clsx(
                                        "relative px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex-1 md:flex-initial flex items-center justify-center gap-2",
                                        tab === tView 
                                            ? "bg-white text-slate-800 shadow-cap translate-y-[-1px]" 
                                            : "text-slate-500 hover:text-slate-700 opacity-60"
                                    )}
                                >
                                    {tView === 'SHOP' ? t('parent.orders.shop') : t('parent.orders.gallery')}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Order List Manifest ────────────────────────────────────────── */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 md:gap-10">
                <AnimatePresence mode="popLayout" initial={false}>
                    {tab === 'SHOP' ? (
                        shopOrders.filter(o => filterUserId === 'ALL' || o.userId === filterUserId).length === 0 ? (
                            <div className="col-span-full py-40 flex flex-col items-center justify-center text-center hardware-well rounded-[60px] bg-[#DADBD4] shadow-well">
                                <ShoppingBag className="w-12 h-12 text-slate-300 opacity-20 mb-4" />
                                <h3 className="text-xl font-black text-slate-500 uppercase tracking-widest mb-1">{t('parent.orders.noShopOrders')}</h3>
                                <p className="text-[10px] font-black text-slate-400 label-mono uppercase opacity-60">Manifest is currently empty...</p>
                            </div>
                        ) : (
                            shopOrders.filter(o => filterUserId === 'ALL' || o.userId === filterUserId).map(order => {
                                const statusCfg = STATUS_CONFIG[order.status] ?? { labelKey: order.status, className: 'bg-slate-100 text-slate-500 ring-1 ring-slate-200' }
                                const isBusy = updating === order.id
                                return (
                                    <motion.div
                                        key={order.id}
                                        layout
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className="hardware-well p-1 rounded-[32px] bg-[#DADBD4] shadow-well group transition-all hover:shadow-xl"
                                    >
                                        <div className="hardware-cap bg-[#FEFBEA] rounded-[28px] overflow-hidden shadow-cap h-full flex flex-col p-6 gap-5">
                                            {/* Order Header HUD */}
                                            <div className="flex justify-between items-start">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 bg-white rounded-xl shadow-inner-warm border border-white/50 flex items-center justify-center relative group-hover:scale-110 transition-transform">
                                                        {order.user.avatarUrl ? (
                                                            <Image src={order.user.avatarUrl} alt={order.user.name} width={40} height={40} className="rounded-lg object-cover" />
                                                        ) : (
                                                            <User className="w-6 h-6 text-slate-300" />
                                                        )}
                                                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full border-2 border-[#FEFBEA] shadow-lg flex items-center justify-center">
                                                            <span className="text-[10px] text-white">★</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <h4 className="font-black text-slate-800 text-[11px] uppercase tracking-widest mb-0.5">{order.user.name}</h4>
                                                        <div className="text-[9px] font-bold text-slate-400 label-mono uppercase">Redeemed @ {new Date(order.createdAt).toLocaleString()}</div>
                                                    </div>
                                                </div>
                                                <div className={clsx(
                                                    "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-[0.15em] shadow-sm",
                                                    statusCfg.className
                                                )}>
                                                    {t(statusCfg.labelKey)}
                                                </div>
                                            </div>

                                            {/* Item Sector WELL */}
                                            <div className="bg-[#B8B9B0]/10 rounded-2xl p-4 border border-black/5 flex items-center gap-5 shadow-inner-warm">
                                                <ItemIcon iconUrl={order.item.iconUrl} name={order.item.name} />
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-black text-slate-800 text-sm leading-tight uppercase truncate mb-1">{order.item.name}</h3>
                                                    <div className="flex items-center gap-1.5 text-yellow-600 font-black text-xs">
                                                        <span>{order.costCoins}</span>
                                                        <Star className="w-3.5 h-3.5 fill-current" />
                                                    </div>
                                                </div>
                                                <div className="h-10 w-px bg-black/5 mx-2 hidden md:block" />
                                                <div className="text-right hidden md:block">
                                                    <div className="text-[10px] font-bold text-slate-400 label-mono uppercase mb-0.5">Asset ID</div>
                                                    <div className="text-[11px] font-black text-slate-600 label-mono">#{order.id.slice(0, 8).toUpperCase()}</div>
                                                </div>
                                            </div>

                                            {/* Action Sector HARDWARE */}
                                            <div className="flex items-center gap-3 pt-2">
                                                {order.status === 'PENDING' && (
                                                    <button
                                                        onClick={() => handleShopUpdate(order.id, { status: 'COMPLETED' })}
                                                        disabled={isBusy}
                                                        className="flex-1 h-12 bg-emerald-500 text-white rounded-2xl flex items-center justify-center gap-2 group/btn shadow-lg hover:bg-emerald-600 transition-all active:translate-y-0.5 disabled:opacity-50"
                                                    >
                                                        <div className={clsx("w-5 h-5 bg-white/20 rounded-full flex items-center justify-center transition-transform group-hover/btn:scale-110", isBusy && "animate-spin")}>
                                                            <CheckCircle className="w-3 h-3 text-white" />
                                                        </div>
                                                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">{isBusy ? '...' : t('order.action.confirm')}</span>
                                                    </button>
                                                )}
                                                {['PENDING', 'COMPLETED'].includes(order.status) && (
                                                    <button
                                                        onClick={() => handleShopUpdate(order.id, { status: 'REFUNDED' })}
                                                        disabled={isBusy}
                                                        className="px-5 h-12 bg-white text-rose-500 rounded-2xl flex items-center justify-center gap-2 border border-slate-200 shadow-sm hover:bg-rose-50 transition-all active:translate-y-0.5 disabled:opacity-50"
                                                    >
                                                        <RotateCcw className="w-4 h-4" />
                                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] sr-only md:not-sr-only">{t('order.action.refund')}</span>
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => setRemarkModal({ open: true, orderId: order.id, initialValue: order.remarks || '' })}
                                                    className="px-5 h-12 bg-white text-slate-600 rounded-2xl flex items-center justify-center gap-2 border border-slate-200 shadow-sm hover:bg-slate-50 transition-all active:translate-y-0.5"
                                                >
                                                    <MessageSquare className="w-4 h-4" />
                                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] sr-only md:not-sr-only">{t('button.remarks')}</span>
                                                    {order.remarks && <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />}
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                )
                            })
                        )
                    ) : (
                        galleryOrders.filter(o => filterUserId === 'ALL' || o.userId === filterUserId).length === 0 ? (
                            <div className="col-span-full py-40 flex flex-col items-center justify-center text-center hardware-well rounded-[60px] bg-[#DADBD4] shadow-well">
                                <Palette className="w-12 h-12 text-slate-300 opacity-20 mb-4" />
                                <h3 className="text-xl font-black text-slate-500 uppercase tracking-widest mb-1">{t('parent.orders.noGalleryOrders')}</h3>
                                <p className="text-[10px] font-black text-slate-400 label-mono uppercase opacity-60">No visitor purchases recorded...</p>
                            </div>
                        ) : (
                            galleryOrders.filter(o => filterUserId === 'ALL' || o.userId === filterUserId).map(order => {
                                const statusCfg = STATUS_CONFIG[order.status] ?? { labelKey: order.status, className: 'bg-slate-100 text-slate-500 ring-1 ring-slate-200' }
                                const isBusy = updating === order.id
                                return (
                                    <motion.div
                                        key={order.id}
                                        layout
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className="hardware-well p-1 rounded-[32px] bg-[#DADBD4] shadow-well group transition-all hover:shadow-xl"
                                    >
                                        <div className="hardware-cap bg-[#FFF9F5] rounded-[28px] overflow-hidden shadow-cap h-full flex flex-col p-6 gap-5">
                                            {/* Order Header HUD */}
                                            <div className="flex justify-between items-start">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 bg-white rounded-xl shadow-inner-warm border border-orange-100 flex items-center justify-center relative group-hover:scale-110 transition-transform">
                                                        <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                                                            <User className="w-6 h-6 text-white/90" />
                                                        </div>
                                                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-indigo-500 rounded-full border-2 border-[#FFF9F5] shadow-lg flex items-center justify-center">
                                                            <span className="text-[8px] text-white font-black italic">V</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <h4 className="font-black text-slate-800 text-[11px] uppercase tracking-widest mb-0.5">{order.visitor.name}</h4>
                                                        <div className="text-[9px] font-bold text-indigo-400 label-mono uppercase flex items-center gap-1.5">
                                                            <Phone className="w-2.5 h-2.5" />
                                                            {order.visitor.phone}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className={clsx(
                                                    "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-[0.15em] shadow-sm",
                                                    statusCfg.className
                                                )}>
                                                    {t(statusCfg.labelKey)}
                                                </div>
                                            </div>

                                            {/* Artwork Sector WELL */}
                                            <div className="bg-[#B8B9B0]/10 rounded-2xl p-4 border border-black/5 flex items-center gap-5 shadow-inner-warm">
                                                <div className="w-20 h-20 rounded-xl overflow-hidden border border-black/5 shadow-md relative shrink-0 group-hover:rotate-2 transition-transform">
                                                    <Image src={order.artwork.imageUrl} alt={order.artwork.title} fill className="object-cover" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-black text-slate-800 text-sm leading-tight uppercase truncate mb-1">{order.artwork.title}</h3>
                                                    <div className="flex items-center gap-1.5 text-indigo-600 font-black text-xs">
                                                        <span>by {order.artist.nickname || order.artist.name}</span>
                                                    </div>
                                                    <div className="mt-2.5 flex items-center gap-3">
                                                        <div className="text-[16px] font-black text-slate-900 tracking-tighter">¥{order.amountRMB}</div>
                                                        <div className="px-1.5 py-0.5 bg-indigo-50 rounded text-[8px] font-black text-indigo-500 uppercase tracking-widest border border-indigo-100">{order.artwork.priceCoins} Coins</div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Action Sector HARDWARE */}
                                            <div className="flex items-center gap-3 pt-2">
                                                {['PENDING', 'PENDING_CONFIRM'].includes(order.status) && (
                                                    <button
                                                        onClick={() => handleGalleryUpdate(order.id, 'CONFIRMED')}
                                                        disabled={isBusy}
                                                        className="flex-1 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center gap-3 group/btn shadow-lg hover:bg-indigo-700 transition-all active:translate-y-0.5 disabled:opacity-50"
                                                    >
                                                        <div className={clsx("w-6 h-6 bg-white/20 rounded-full flex items-center justify-center transition-transform group-hover/btn:scale-110", isBusy && "animate-spin")}>
                                                            <CheckCircle className="w-4 h-4 text-white" />
                                                        </div>
                                                        <div className="flex flex-col items-start leading-none gap-0.5">
                                                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">{isBusy ? '...' : t('order.action.confirm')}</span>
                                                            <span className="text-[7px] font-bold text-indigo-200 uppercase tracking-widest">Mark as Paid</span>
                                                        </div>
                                                    </button>
                                                )}
                                                {order.status === 'CONFIRMED' && (
                                                    <button
                                                        onClick={() => handleGalleryUpdate(order.id, 'SHIPPED')}
                                                        disabled={isBusy}
                                                        className="flex-1 h-14 bg-emerald-500 text-white rounded-2xl flex items-center justify-center gap-3 group/btn shadow-lg hover:bg-emerald-600 transition-all active:translate-y-0.5 disabled:opacity-50"
                                                    >
                                                        <div className={clsx("w-6 h-6 bg-white/20 rounded-full flex items-center justify-center transition-transform group-hover/btn:scale-110", isBusy && "animate-spin")}>
                                                            <Package className="w-4 h-4 text-white" />
                                                        </div>
                                                        <div className="flex flex-col items-start leading-none gap-0.5">
                                                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">{isBusy ? '...' : 'SHIP ARTWORK'}</span>
                                                            <span className="text-[7px] font-bold text-emerald-100 uppercase tracking-widest">Mark as Sent</span>
                                                        </div>
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleGalleryUpdate(order.id, 'REFUNDED')}
                                                    disabled={isBusy}
                                                    className="px-6 h-14 bg-white text-rose-500 rounded-2xl flex items-center justify-center gap-2 border border-slate-200 shadow-sm hover:bg-rose-50 transition-all active:translate-y-0.5 disabled:opacity-50"
                                                >
                                                    <RotateCcw className="w-4 h-4" />
                                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] sr-only lg:not-sr-only">{t('order.action.refund')}</span>
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                )
                            })
                        )
                    )}
                </AnimatePresence>
            </div>


            {/* Remark Modal for Shop Orders */}
            <AnimatePresence>
                {remarkModal.open && (
                    <div className="fixed inset-0 z-[300] flex items-center justify-center px-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setRemarkModal({ open: false, orderId: '', initialValue: '' })}
                            className="absolute inset-0 bg-slate-900/80 backdrop-blur-xl"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 40 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 40 }}
                            className="relative w-full max-w-sm hardware-well p-1 bg-[#DADBD4] rounded-[40px] shadow-2xl"
                        >
                            <div className="hardware-cap bg-[#FEFBEA] rounded-[36px] overflow-hidden shadow-cap p-8">
                                <div className="flex items-center justify-between mb-8">
                                    <h3 className="font-black text-slate-800 text-2xl tracking-tighter uppercase">{t('button.remarks')}</h3>
                                    <button
                                        onClick={() => setRemarkModal({ open: false, orderId: '', initialValue: '' })}
                                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 text-slate-400 hover:text-rose-500 transition-all shadow-inner-warm"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="bg-[#B8B9B0]/10 rounded-2xl p-4 border border-black/5 shadow-inner-warm mb-6">
                                    <textarea
                                        ref={remarkRef}
                                        value={remarkText}
                                        onChange={e => setRemarkText(e.target.value)}
                                        placeholder={t('order.remark.placeholder')}
                                        rows={4}
                                        className="w-full bg-transparent outline-none text-[11px] font-black uppercase tracking-wider text-slate-700 resize-none transition-all placeholder:text-slate-300 h-32"
                                    />
                                </div>

                                <div className="flex gap-4">
                                    <button
                                        onClick={saveRemark}
                                        disabled={updating === remarkModal.orderId}
                                        className="flex-1 h-14 bg-indigo-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-lg hover:shadow-indigo-500/40 transition-all active:scale-95 disabled:opacity-50"
                                    >
                                        {updating === remarkModal.orderId ? '...' : t('common.confirm')}
                                    </button>
                                    <button
                                        onClick={() => setRemarkModal({ open: false, orderId: '', initialValue: '' })}
                                        className="px-6 h-14 bg-white text-slate-500 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-sm border border-slate-200 transition-all active:scale-95"
                                    >
                                        {t('common.cancel')}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )

    async function saveRemark() {
        if (!remarkModal.orderId) return
        await handleShopUpdate(remarkModal.orderId, { remarks: remarkText })
        setRemarkModal({ open: false, orderId: '', initialValue: '' })
    }
}
