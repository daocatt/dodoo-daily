'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { CheckCircle, XCircle, Search, MessageSquare, X, Package, User, Phone, Loader2, ShoppingBag, Palette, Coins, MapPin, Truck } from 'lucide-react'
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
    const [searchTerm, setSearchTerm] = useState('')
    const [isBusy, setIsBusy] = useState(false)
    const [editShipping, setEditShipping] = useState<{
        open: boolean
        orderId: string
        name: string
        phone: string
        address: string
    }>({ open: false, orderId: '', name: '', phone: '', address: '' })

    const [remarkModal, setRemarkModal] = useState<{ open: boolean; orderId: string; initialValue: string }>({
        open: false, orderId: '', initialValue: ''
    })
    const [remarkText, setRemarkText] = useState('')
    const remarkRef = useRef<HTMLTextAreaElement>(null)
    const [children, setChildren] = useState<{ id: string; name: string; nickname: string | null }[]>([])
    const [filterUserId, setFilterUserId] = useState<string>('ALL')
    const [showMemberDrop, setShowMemberDrop] = useState(false)
    const dropRef = useRef<HTMLDivElement>(null)

    const [confirmModal, setConfirmModal] = useState<{
        open: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        type: 'DANGER' | 'PRIMARY';
    }>({
        open: false,
        title: '',
        message: '',
        onConfirm: () => {},
        type: 'PRIMARY'
    })

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
                setShowMemberDrop(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const fetchData = useCallback(async () => {
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

    const handleGalleryUpdate = async (id: string, status?: string, shippingData?: { contactName?: string, contactPhone?: string, shippingAddress?: string }) => {
        setIsBusy(true)
        try {
            const res = await fetch('/api/parent/gallery-orders', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status, ...shippingData })
            })
            if (res.ok) {
                await fetchData()
                setConfirmModal(prev => ({ ...prev, open: false }))
                setEditShipping(prev => ({ ...prev, open: false }))
            }
        } catch (e) {
            console.error('Failed to update gallery order:', e)
        } finally {
            setIsBusy(false)
        }
    }

    const saveRemark = async () => {
        await handleShopUpdate(remarkModal.orderId, { remarks: remarkText })
        setRemarkModal({ open: false, orderId: '', initialValue: '' })
    }

    const filteredShopOrders = shopOrders.filter(o => {
        const matchesUser = filterUserId === 'ALL' || o.userId === filterUserId
        const matchesSearch = !searchTerm || o.user.name.toLowerCase().includes(searchTerm.toLowerCase())
        return matchesUser && matchesSearch
    })

    const filteredGalleryOrders = galleryOrders.filter(o => {
        const matchesUser = filterUserId === 'ALL' || o.userId === filterUserId
        const matchesSearch = !searchTerm || 
            o.visitor.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
            o.visitor.phone.includes(searchTerm)
        return matchesUser && matchesSearch
    })

    if (loading) return (
        <div className="flex flex-col items-center justify-center py-40 hardware-well rounded-[40px] bg-[#DADBD4] shadow-well mt-12">
            <Loader2 className="w-10 h-10 animate-spin text-yellow-500 mb-6" />
            <p className="text-slate-500 font-black uppercase tracking-[0.4em] text-[10px] label-mono animate-pulse">{t('common.loading')}</p>
        </div>
    )

    return (
        <div className="space-y-10">
            <div className="flex flex-col md:flex-row justify-end items-center gap-4 w-full mb-4">
                <div className="relative w-full md:w-64 group shrink-0">
                    <div className="absolute inset-0 bg-[#DADBD4] rounded-2xl shadow-inner-warm border border-black/5" />
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 z-10 opacity-60" />
                    <input 
                        type="text"
                        placeholder={t('parent.orders.searchPlaceholder')}
                        className="relative z-1 w-full pl-11 pr-4 py-3 bg-transparent text-[10px] font-black uppercase tracking-widest text-slate-800 outline-none placeholder:text-slate-400 transition-all font-mono"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="relative w-full md:w-auto" ref={dropRef}>
                    <div className="flex items-center gap-2 bg-[#DADBD4] p-1.5 rounded-2xl shadow-well hardware-well shrink-0 w-full md:min-w-56">
                        <button 
                            onClick={() => setShowMemberDrop(!showMemberDrop)}
                            className="flex-1 px-4 py-2.5 bg-white text-slate-800 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-cap translate-y-[-1px] flex items-center justify-between gap-3"
                        >
                            <div className="flex items-center gap-2 whitespace-nowrap">
                                <User className="w-3.5 h-3.5 text-slate-400" />
                                {filterUserId === 'ALL' ? t('parent.orders.filterByMember') : children.find(c => c.id === filterUserId)?.name.toUpperCase() || t('parent.orders.filterByMember')}
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
                                    {t('parent.orders.allMembers')}
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

            <div className="flex flex-col gap-4">
                <AnimatePresence mode="popLayout" initial={false}>
                    {tab === 'SHOP' ? (
                        filteredShopOrders.length === 0 ? (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="col-span-full py-40 flex flex-col items-center justify-center text-center hardware-well rounded-[60px] bg-[#DADBD4] shadow-well"
                            >
                                <ShoppingBag className="w-12 h-12 text-slate-300 opacity-20 mb-4" />
                                <h3 className="text-xl font-black text-slate-500 uppercase tracking-widest mb-1">{t('parent.orders.noShopOrders')}</h3>
                                <p className="text-[10px] font-black text-slate-400 label-mono uppercase opacity-60">{t('parent.orders.manifestEmpty')}</p>
                            </motion.div>
                        ) : (
                            <div className="flex flex-col gap-3">
                                <div className="hidden lg:grid lg:grid-cols-12 gap-4 px-8 py-2 opacity-40">
                                    <div className="col-span-3 text-[9px] font-black uppercase tracking-[0.2em]">{t('parent.orders.buyer')}</div>
                                    <div className="col-span-4 text-[9px] font-black uppercase tracking-[0.2em]">{t('shop.item.name')}</div>
                                    <div className="col-span-2 text-[9px] font-black uppercase tracking-[0.2em]">{t('parent.orders.price')}</div>
                                    <div className="col-span-1 text-[9px] font-black uppercase tracking-[0.2em]">{t('visitors.codes.tableStatus')}</div>
                                    <div className="col-span-2 text-right text-[9px] font-black uppercase tracking-[0.2em]">{t('parent.controlPanel')}</div>
                                </div>

                                {filteredShopOrders.map(order => {
                                    const statusCfg = STATUS_CONFIG[order.status] ?? { labelKey: order.status, className: 'bg-slate-100 text-slate-500 ring-1 ring-slate-200' }
                                    const isBusy = updating === order.id
                                    return (
                                        <motion.div
                                            key={order.id}
                                            layout
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            className="hardware-well p-0.5 rounded-2xl bg-[#DADBD4] shadow-well group transition-all"
                                        >
                                            <div className="hardware-cap bg-[#FEFBEA] rounded-[14px] overflow-hidden shadow-base h-full flex flex-col lg:grid lg:grid-cols-12 items-center p-3 lg:px-6 lg:py-2 gap-4">
                                                <div className="col-span-3 flex items-center gap-3 w-full">
                                                    <div className="w-10 h-10 bg-white rounded-lg shadow-inner-warm border border-white/50 flex items-center justify-center relative shrink-0">
                                                        {order.user.avatarUrl ? (
                                                            <Image src={order.user.avatarUrl} alt={order.user.name} width={32} height={32} className="rounded-md object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full bg-slate-100 flex items-center justify-center rounded-md">
                                                                <User className="w-5 h-5 text-slate-300" />
                                                            </div>
                                                        )}
                                                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full border-2 border-[#FEFBEA] shadow-lg flex items-center justify-center">
                                                            <span className="text-[7px] text-white">★</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col min-w-0">
                                                        <h4 className="font-black text-slate-800 text-[10px] uppercase tracking-widest truncate">{order.user.name}</h4>
                                                        <div className="text-[8px] font-bold text-slate-400 label-mono uppercase">
                                                            {new Date(order.createdAt).toLocaleDateString()}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="col-span-4 flex items-center gap-3 w-full">
                                                    <div className="w-10 h-10 bg-slate-100 rounded-md flex items-center justify-center text-lg shrink-0 border border-black/5">
                                                        {order.item.iconUrl && (order.item.iconUrl.startsWith('/') || order.item.iconUrl.startsWith('http')) ? (
                                                            <Image src={order.item.iconUrl} alt={order.item.name} width={32} height={32} className="w-full h-full object-cover rounded-md" />
                                                        ) : (
                                                            order.item.iconUrl || <Package className="w-5 h-5 text-slate-300" />
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col min-w-0">
                                                        <h3 className="font-black text-slate-800 text-[10px] leading-tight uppercase truncate">{order.item.name}</h3>
                                                        <div className="text-[8px] font-bold text-slate-400 label-mono uppercase">ID: {order.id.slice(0, 8).toUpperCase()}</div>
                                                    </div>
                                                </div>

                                                <div className="col-span-2 flex items-center gap-2 w-full lg:w-auto">
                                                    <div className="text-[14px] font-black text-amber-600 tracking-tighter tabular-nums">{order.costCoins}</div>
                                                    <Coins className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                                                </div>

                                                <div className="col-span-1 flex items-center w-full lg:w-auto">
                                                    <div className={clsx(
                                                        "px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-[0.1em] shadow-sm whitespace-nowrap",
                                                        statusCfg.className
                                                    )}>
                                                        {t(statusCfg.labelKey)}
                                                    </div>
                                                </div>

                                                <div className="col-span-2 flex items-center justify-end gap-2 w-full">
                                                    {order.status !== 'REFUNDED' && (
                                                        <>
                                                            {order.status === 'PENDING' && (
                                                                <button
                                                                    onClick={() => setConfirmModal({
                                                                        open: true,
                                                                        title: t('parent.orders.confirm.complete.title').toUpperCase(),
                                                                        message: t('parent.orders.confirm.complete.msg').toUpperCase(),
                                                                        type: 'PRIMARY',
                                                                        onConfirm: () => handleShopUpdate(order.id, { status: 'COMPLETED' })
                                                                    })}
                                                                    disabled={isBusy}
                                                                    className="h-10 px-4 bg-emerald-500 text-white rounded-xl flex items-center justify-center gap-2 group/btn shadow-md hover:bg-emerald-600 transition-all active:translate-y-0.5 disabled:opacity-50"
                                                                >
                                                                    <CheckCircle className={clsx("w-3.5 h-3.5", isBusy && "animate-spin")} />
                                                                    <span className="text-[8.5px] font-black uppercase tracking-widest leading-none">{t('order.action.complete')}</span>
                                                                </button>
                                                            )}
                                                            <button
                                                                onClick={() => setConfirmModal({
                                                                    open: true,
                                                                    title: t('parent.orders.confirm.refund.title').toUpperCase(),
                                                                    message: t('parent.orders.confirm.refund.msg').toUpperCase(),
                                                                    type: 'DANGER',
                                                                    onConfirm: () => handleShopUpdate(order.id, { status: 'REFUNDED' })
                                                                })}
                                                                disabled={isBusy}
                                                                className="h-10 w-10 bg-white text-rose-500 rounded-xl flex items-center justify-center border border-slate-200 shadow-sm hover:bg-rose-50 transition-all active:translate-y-0.5 disabled:opacity-50 shrink-0"
                                                                title={t('order.action.refund')}
                                                            >
                                                                <XCircle className="w-3.5 h-3.5" />
                                                            </button>
                                                        </>
                                                    )}
                                                    <button
                                                        onClick={() => setRemarkModal({ open: true, orderId: order.id, initialValue: order.remarks || '' })}
                                                        className={clsx(
                                                            "h-10 w-10 rounded-xl flex items-center justify-center border transition-all active:translate-y-0.5 relative shrink-0",
                                                            order.remarks 
                                                                ? "bg-indigo-50 border-indigo-100 text-indigo-500 shadow-inner-warm" 
                                                                : "bg-white border-slate-200 text-slate-400 hover:text-indigo-500"
                                                        )}
                                                        title={t('button.remarks')}
                                                    >
                                                        <MessageSquare className="w-3.5 h-3.5" />
                                                        {order.remarks && <div className="absolute top-1 right-1 w-2 h-2 bg-indigo-500 rounded-full border-2 border-[#FEFBEA]" />}
                                                    </button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )
                                })}
                            </div>
                        )
                    ) : (
                        filteredGalleryOrders.length === 0 ? (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="col-span-full py-40 flex flex-col items-center justify-center text-center hardware-well rounded-[60px] bg-[#DADBD4] shadow-well"
                            >
                                <Palette className="w-12 h-12 text-slate-300 opacity-20 mb-4" />
                                <h3 className="text-xl font-black text-slate-500 uppercase tracking-widest mb-1">{t('parent.orders.noGalleryOrders')}</h3>
                                <p className="text-[10px] font-black text-slate-400 label-mono uppercase opacity-60">{t('parent.orders.noGalleryOrdersDesc')}</p>
                            </motion.div>
                        ) : (
                            <div className="flex flex-col gap-3">
                                <div className="hidden lg:grid lg:grid-cols-12 gap-4 px-8 py-2 opacity-40">
                                    <div className="col-span-3 text-[9px] font-black uppercase tracking-[0.2em]">{t('parent.orders.buyer')}</div>
                                    <div className="col-span-4 text-[9px] font-black uppercase tracking-[0.2em]">{t('parent.orders.artwork')}</div>
                                    <div className="col-span-1 text-[9px] font-black uppercase tracking-[0.2em]">{t('parent.orders.price')}</div>
                                    <div className="col-span-2 text-[9px] font-black uppercase tracking-[0.2em]">{t('visitors.codes.tableStatus')}</div>
                                    <div className="col-span-2 text-right text-[9px] font-black uppercase tracking-[0.2em]">{t('parent.controlPanel')}</div>
                                </div>

                                {filteredGalleryOrders.map(order => {
                                    const statusCfg = STATUS_CONFIG[order.status] ?? { labelKey: order.status, className: 'bg-slate-100 text-slate-500 ring-1 ring-slate-200' }
                                    const isBusy = updating === order.id
                                    return (
                                        <motion.div
                                            key={order.id}
                                            layout
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            className="hardware-well p-0.5 rounded-2xl bg-[#DADBD4] shadow-well group transition-all"
                                        >
                                            <div className="hardware-cap bg-[#FFF9F5] rounded-[14px] overflow-hidden shadow-base h-full flex flex-col lg:grid lg:grid-cols-12 items-center p-3 lg:px-6 lg:py-2 gap-4">
                                                <div className="col-span-3 flex items-center gap-3 w-full">
                                                    <div className="w-10 h-10 bg-white rounded-lg shadow-inner-warm border border-orange-100 flex items-center justify-center relative shrink-0">
                                                        <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 rounded-md flex items-center justify-center">
                                                            <User className="w-5 h-5 text-white/90" />
                                                        </div>
                                                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-indigo-500 rounded-full border-2 border-[#FFF9F5] shadow-lg flex items-center justify-center">
                                                            <span className="text-[7px] text-white font-black italic">V</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col min-w-0">
                                                        <h4 className="font-black text-slate-800 text-[10px] uppercase tracking-widest truncate">{order.visitor.name}</h4>
                                                        <div className="text-[8px] font-bold text-indigo-400 label-mono uppercase flex items-center gap-1">
                                                            <Phone className="w-2.5 h-2.5" />
                                                            {order.visitor.phone}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="col-span-4 flex items-center gap-3 w-full">
                                                    <div className="w-12 h-10 rounded-md overflow-hidden border border-black/5 shadow-sm relative shrink-0 bg-slate-100">
                                                        <Image src={order.artwork.imageUrl} alt={order.artwork.title} fill className="object-cover" />
                                                    </div>
                                                    <div className="flex flex-col min-w-0">
                                                        <h3 className="font-black text-slate-800 text-[10px] leading-tight uppercase truncate">{order.artwork.title}</h3>
                                                        <div className="flex items-center gap-1 text-slate-400 font-bold text-[8px] uppercase tracking-tighter">
                                                            <span>by {order.artist.nickname || order.artist.name}</span>
                                                            <div className="w-1 h-1 rounded-full bg-slate-200 mx-0.5" />
                                                            <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="col-span-1 flex flex-col gap-1 w-full lg:w-auto">
                                                    <div className="flex items-center gap-2">
                                                        <div className="text-[14px] font-black text-amber-600 tracking-tighter tabular-nums">{order.artwork.priceCoins}</div>
                                                        <Coins className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                                                    </div>
                                                    {(order.contactName || order.shippingAddress) && (
                                                        <div className="flex flex-col opacity-60">
                                                            <div className="flex items-center gap-1.5 label-mono text-[7px] font-black text-indigo-400 uppercase tracking-widest bg-indigo-50/50 px-1.5 py-0.5 rounded-md self-start border border-indigo-100/30">
                                                                <Truck className="w-2.5 h-2.5" />
                                                                {order.contactName || 'Recipient'}
                                                            </div>
                                                            {order.shippingAddress && (
                                                                <div className="text-[7.5px] font-black text-slate-400 mt-1 line-clamp-1 max-w-[120px]" title={order.shippingAddress}>
                                                                    {order.shippingAddress}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="col-span-2 flex items-center w-full lg:w-auto">
                                                    <div className={clsx(
                                                        "px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-[0.1em] shadow-sm whitespace-nowrap",
                                                        statusCfg.className
                                                    )}>
                                                        {t(statusCfg.labelKey)}
                                                    </div>
                                                </div>

                                                {/* 5. Control Actions */}
                                                <div className="col-span-2 flex items-center justify-end gap-2 w-full">
                                                    {order.status !== 'REFUNDED' && order.status !== 'SHIPPED' && (
                                                        <>
                                                            {['PENDING', 'PENDING_CONFIRM'].includes(order.status) && (
                                                                <button
                                                                    onClick={() => setConfirmModal({
                                                                        open: true,
                                                                        title: t('parent.orders.confirm.galleryConfirm.title').toUpperCase(),
                                                                        message: t('parent.orders.confirm.galleryConfirm.msg').toUpperCase(),
                                                                        type: 'PRIMARY',
                                                                        onConfirm: () => handleGalleryUpdate(order.id, 'CONFIRMED')
                                                                    })}
                                                                    disabled={isBusy}
                                                                    className="h-10 px-4 bg-indigo-600 text-white rounded-xl flex items-center justify-center gap-2 group/btn shadow-md hover:bg-indigo-700 transition-all active:translate-y-0.5 disabled:opacity-50"
                                                                    title={t('order.action.confirm')}
                                                                >
                                                                    <CheckCircle className={clsx("w-3.5 h-3.5", isBusy && "animate-spin")} />
                                                                    <span className="text-[8.5px] font-black uppercase tracking-widest leading-none">{t('common.confirm')}</span>
                                                                </button>
                                                            )}
                                                            {order.status === 'CONFIRMED' && (
                                                                <button
                                                                    onClick={() => setConfirmModal({
                                                                        open: true,
                                                                        title: t('parent.orders.confirm.galleryShip.title').toUpperCase(),
                                                                        message: t('parent.orders.confirm.galleryShip.msg').toUpperCase(),
                                                                        type: 'PRIMARY',
                                                                        onConfirm: () => handleGalleryUpdate(order.id, 'SHIPPED')
                                                                    })}
                                                                    disabled={isBusy}
                                                                    className="h-10 px-4 bg-emerald-500 text-white rounded-xl flex items-center justify-center gap-2 group/btn shadow-md hover:bg-emerald-600 transition-all active:translate-y-0.5 disabled:opacity-50"
                                                                    title="Ship"
                                                                >
                                                                    <Package className={clsx("w-3.5 h-3.5", isBusy && "animate-spin")} />
                                                                    <span className="text-[8.5px] font-black uppercase tracking-widest leading-none">{t('order.action.ship')}</span>
                                                                </button>
                                                            )}
                                                            <button
                                                                onClick={() => setEditShipping({
                                                                    open: true,
                                                                    orderId: order.id,
                                                                    name: order.contactName || '',
                                                                    phone: order.contactPhone || '',
                                                                    address: order.shippingAddress || ''
                                                                })}
                                                                className="h-10 w-10 bg-white text-indigo-500 rounded-xl flex items-center justify-center border border-slate-200 shadow-sm hover:bg-indigo-50 transition-all active:translate-y-0.5"
                                                                title={t('order.editShipping')}
                                                            >
                                                                <MapPin className="w-3.5 h-3.5" />
                                                            </button>
                                                            <button
                                                                onClick={() => setConfirmModal({
                                                                    open: true,
                                                                    title: t('parent.orders.confirm.galleryCancel.title').toUpperCase(),
                                                                    message: t('parent.orders.confirm.galleryCancel.msg').toUpperCase(),
                                                                    type: 'DANGER',
                                                                    onConfirm: () => handleGalleryUpdate(order.id, 'REFUNDED')
                                                                })}
                                                                disabled={isBusy}
                                                                className="h-10 w-10 bg-white text-rose-500 rounded-xl flex items-center justify-center border border-slate-200 shadow-sm hover:bg-rose-50 transition-all active:translate-y-0.5 disabled:opacity-50 shrink-0"
                                                                title={t('order.action.refund')}
                                                            >
                                                                <XCircle className="w-3.5 h-3.5" />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    )
                                })}
                            </div>
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

            {/* Baustein Style Confirm Dialog */}
            <AnimatePresence>
                {confirmModal.open && (
                    <div className="fixed inset-0 z-[400] flex items-center justify-center px-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setConfirmModal(prev => ({ ...prev, open: false }))}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-sm hardware-well p-1 bg-[#DADBD4] rounded-[32px] shadow-2xl overflow-hidden"
                        >
                            <div className="hardware-cap bg-[#FEFBEA] rounded-[28px] p-8 shadow-cap">
                                <div className="flex flex-col items-center text-center">
                                    <div className={clsx(
                                        "w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-inner-warm hardware-well",
                                        confirmModal.type === 'DANGER' ? "bg-rose-50 text-rose-500" : "bg-indigo-50 text-indigo-500"
                                    )}>
                                        <XCircle className="w-8 h-8" />
                                    </div>
                                    <h3 className="text-xl font-black text-slate-800 tracking-tighter uppercase mb-2">{confirmModal.title}</h3>
                                    <p className="text-[10px] font-black text-slate-400 label-mono uppercase tracking-widest leading-relaxed mb-8 max-w-[200px]">
                                        {confirmModal.message}
                                    </p>
                                    
                                    <div className="flex gap-4 w-full">
                                        <button
                                            onClick={() => {
                                                confirmModal.onConfirm();
                                                setConfirmModal(prev => ({ ...prev, open: false }));
                                            }}
                                            className={clsx(
                                                "flex-1 h-12 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg transition-all active:scale-95 text-white",
                                                confirmModal.type === 'DANGER' ? "bg-rose-500 hover:bg-rose-600" : "bg-indigo-600 hover:bg-indigo-700"
                                            )}
                                        >
                                            {t('common.confirm')}
                                        </button>
                                        <button
                                            onClick={() => setConfirmModal(prev => ({ ...prev, open: false }))}
                                            className="flex-1 h-12 bg-white text-slate-400 border border-slate-200 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] shadow-sm hover:bg-slate-50 transition-all active:scale-95"
                                        >
                                            {t('common.cancel')}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Edit Shipping Modal (System Baustein 3.0) */}
            <AnimatePresence>
                {editShipping.open && (
                    <div className="fixed inset-0 z-[2500] flex flex-col items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-md"
                            onClick={() => setEditShipping(prev => ({ ...prev, open: false }))}
                        />
                        <motion.div
                            initial={{ scale: 0.9, y: 30, opacity: 0 }}
                            animate={{ scale: 1, y: 0, opacity: 1 }}
                            exit={{ scale: 0.9, y: 30, opacity: 0 }}
                            className="relative w-full max-w-md"
                        >
                            <div className="baustein-panel w-full bg-[#E2DFD2] rounded-[2rem] shadow-2xl relative overflow-hidden border-4 border-[#C8C4B0] flex flex-col">
                                <div className="px-6 py-5 relative border-b border-black/5 bg-black/[0.02]">
                                    <button
                                        onClick={() => setEditShipping(prev => ({ ...prev, open: false }))}
                                        className="hardware-btn group absolute top-3.5 right-6"
                                    >
                                        <div className="hardware-well w-9 h-9 rounded-lg flex items-center justify-center bg-[#DADBD4] shadow-well">
                                            <div className="hardware-cap absolute inset-1 bg-white rounded-md flex items-center justify-center transition-all shadow-cap">
                                                <X className="w-3.5 h-3.5 text-slate-500" />
                                            </div>
                                        </div>
                                    </button>
                                    <h2 className="text-xl font-black text-slate-900 tracking-tight leading-none">{t('order.editShipping')}</h2>
                                    <div className="flex items-center gap-2 mt-1.5">
                                        <div className="w-1 h-1 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_4px_rgba(99,102,241,0.6)]" />
                                        <p className="label-mono text-[8px] text-slate-400 uppercase tracking-[0.1em]">Logistics Terminal Access</p>
                                    </div>
                                </div>

                                <div className="p-8 space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="label-mono text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">{t('order.contactName')}</label>
                                            <div className="hardware-well rounded-xl p-1.5 bg-[#D1CDBC]">
                                                <input
                                                    type="text"
                                                    value={editShipping.name}
                                                    onChange={e => setEditShipping(prev => ({ ...prev, name: e.target.value }))}
                                                    className="w-full h-12 !bg-white px-4 rounded-lg outline-none font-black text-slate-800 text-sm shadow-inner transition-colors border-2 border-transparent focus:border-indigo-500"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="label-mono text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">{t('order.contactPhone')}</label>
                                            <div className="hardware-well rounded-xl p-1.5 bg-[#D1CDBC]">
                                                <input
                                                    type="text"
                                                    value={editShipping.phone}
                                                    onChange={e => setEditShipping(prev => ({ ...prev, phone: e.target.value }))}
                                                    className="w-full h-12 !bg-white px-4 rounded-lg outline-none font-black text-slate-800 text-sm shadow-inner transition-colors border-2 border-transparent focus:border-indigo-500"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="label-mono text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">{t('order.address')}</label>
                                        <div className="hardware-well rounded-xl p-1.5 bg-[#D1CDBC]">
                                            <textarea
                                                rows={3}
                                                value={editShipping.address}
                                                onChange={e => setEditShipping(prev => ({ ...prev, address: e.target.value }))}
                                                className="w-full !bg-white p-4 rounded-lg outline-none font-black text-slate-800 text-sm shadow-inner transition-colors border-2 border-transparent focus:border-indigo-500 resize-none"
                                            />
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleGalleryUpdate(editShipping.orderId, undefined, {
                                            contactName: editShipping.name,
                                            contactPhone: editShipping.phone,
                                            shippingAddress: editShipping.address
                                        })}
                                        disabled={isBusy}
                                        className="hardware-btn w-full group relative"
                                    >
                                        <div className="hardware-well h-16 bg-[#D1CDBC] rounded-[1.25rem] relative overflow-hidden">
                                            <div className="hardware-cap absolute inset-1.5 bg-indigo-600 rounded-xl flex items-center justify-center gap-3 group-hover:bg-indigo-700 active:translate-y-0.5 shadow-cap disabled:opacity-50">
                                                <span className="label-mono text-[11px] font-black text-white uppercase tracking-[0.2em]">
                                                    {isBusy ? t('parent.processing') : t('order.saveShipping')}
                                                </span>
                                            </div>
                                        </div>
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}
