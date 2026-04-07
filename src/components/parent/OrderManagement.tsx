'use client'

import React, { useState, useEffect, useRef } from 'react'
import { CheckCircle, RotateCcw, MessageSquare, X, Package, User, Phone } from 'lucide-react'
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
        <div className="flex items-center justify-center py-20 text-slate-400 text-sm">{t('common.loading')}</div>
    )

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
                <div className="flex items-center gap-2 relative" ref={dropRef}>
                    <div className="bg-slate-100 p-1 rounded-lg flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-slate-400 ml-2" />
                        <button 
                            onClick={() => setShowMemberDrop(!showMemberDrop)}
                            className="bg-transparent text-[10px] font-bold text-slate-600 outline-none px-2 py-1 flex items-center gap-2 uppercase tracking-wider"
                        >
                            {filterUserId === 'ALL' ? 'ALL MEMBERS' : children.find(c => c.id === filterUserId)?.name.toUpperCase() || 'ALL MEMBERS'}
                            <motion.div animate={{ rotate: showMemberDrop ? 180 : 0 }}>
                                <X className={clsx("w-3 h-3", !showMemberDrop && "rotate-45")} />
                            </motion.div>
                        </button>
                    </div>

                    <AnimatePresence>
                        {showMemberDrop && (
                            <motion.div 
                                initial={{ opacity: 0, y: 5, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 5, scale: 0.95 }}
                                className="absolute top-full left-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-[100] overflow-hidden"
                            >
                                <button
                                    onClick={() => { setFilterUserId('ALL'); setShowMemberDrop(false); }}
                                    className={clsx(
                                        "w-full px-4 py-2 text-left text-[10px] font-bold uppercase tracking-wider transition-colors",
                                        filterUserId === 'ALL' ? "bg-indigo-50 text-indigo-600" : "text-slate-500 hover:bg-slate-50"
                                    )}
                                >
                                    ALL MEMBERS
                                </button>
                                {children.map(child => (
                                    <button
                                        key={child.id}
                                        onClick={() => { setFilterUserId(child.id); setShowMemberDrop(false); }}
                                        className={clsx(
                                            "w-full px-4 py-2 text-left text-[10px] font-bold uppercase tracking-wider transition-colors",
                                            filterUserId === child.id ? "bg-indigo-50 text-indigo-600" : "text-slate-500 hover:bg-slate-50"
                                        )}
                                    >
                                        {child.name.toUpperCase()}
                                    </button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {!hideTabs && (
                    <div className="bg-slate-100 p-1 rounded-lg flex gap-1">
                        <button
                            onClick={() => setTab('SHOP')}
                            className={clsx(
                                "px-4 py-1.5 rounded-md font-bold text-[10px] uppercase tracking-wider transition-all",
                                tab === 'SHOP' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-500"
                            )}
                        >
                            {t('parent.orders.shop')}
                        </button>
                        <button
                            onClick={() => setTab('GALLERY')}
                            className={clsx(
                                "px-4 py-1.5 rounded-md font-bold text-[10px] uppercase tracking-wider transition-all",
                                tab === 'GALLERY' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-500"
                            )}
                        >
                            {t('parent.orders.gallery')}
                        </button>
                    </div>
                )}
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={`${tab}-${filterUserId}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="grid grid-cols-1 gap-4"
                >
                    {tab === 'SHOP' ? (
                        shopOrders.filter(o => filterUserId === 'ALL' || o.userId === filterUserId).length === 0 ? (
                            <div className="text-center py-20 bg-white/50 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 font-bold uppercase tracking-widest px-10 text-xs">
                                {t('parent.noOrders')}
                            </div>
                        ) : (
                            shopOrders.filter(o => filterUserId === 'ALL' || o.userId === filterUserId).map(order => {
                                const statusCfg = STATUS_CONFIG[order.status] ?? { labelKey: order.status, className: 'bg-slate-100 text-slate-500' }
                                const isBusy = updating === order.id
                                return (
                                    <div key={order.id} className="bg-white p-4 rounded-2xl border border-slate-200/60 shadow-sm space-y-4">
                                        <div className="flex justify-between items-center px-1">
                                            <div className="flex flex-col">
                                                <div className="font-bold text-slate-800 text-sm tracking-tight flex items-center gap-2">
                                                    <User className="w-3.5 h-3.5 text-indigo-400" />
                                                    {order.user.nickname || order.user.name}
                                                </div>
                                                <div className="text-[9px] text-slate-400 font-medium uppercase tracking-wider mt-0.5">{new Date(order.createdAt).toLocaleString()}</div>
                                            </div>
                                            <span className={clsx(
                                                "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider",
                                                statusCfg.className
                                            )}>
                                                {t(statusCfg.labelKey)}
                                            </span>
                                        </div>

                                        <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100 flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-lg bg-white border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center p-0.5">
                                                <ItemIcon iconUrl={order.item.iconUrl} name={order.item.name} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-black text-slate-700 text-sm uppercase truncate leading-tight mb-0.5">{order.item.name}</div>
                                                <div className="text-[10px] text-amber-600 font-black uppercase tracking-widest">{order.costCoins} CC</div>
                                            </div>
                                        </div>

                                        {order.remarks && (
                                            <div className="px-1 text-[11px] text-slate-500 italic leading-relaxed border-l-2 border-indigo-100 pl-3">
                                                {order.remarks}
                                            </div>
                                        )}

                                        <div className="flex gap-2 pt-1 px-1">
                                            {order.status === 'PENDING' && (
                                                <>
                                                    <button
                                                        onClick={() => handleShopUpdate(order.id, { status: 'COMPLETED' })}
                                                        disabled={isBusy}
                                                        className="flex-1 h-9 flex items-center justify-center gap-2 bg-emerald-500 text-white rounded-lg text-xs font-black hover:bg-emerald-600 transition-all disabled:opacity-50"
                                                    >
                                                        <CheckCircle className="w-4 h-4" />
                                                        {isBusy ? '...' : t('order.action.confirm')}
                                                    </button>
                                                    <button
                                                        onClick={() => handleShopUpdate(order.id, { status: 'REFUNDED' })}
                                                        disabled={isBusy}
                                                        className="flex-1 h-9 flex items-center justify-center gap-2 bg-slate-50 border border-slate-200 text-slate-500 rounded-lg text-xs font-black hover:bg-slate-100 transition-all disabled:opacity-50"
                                                    >
                                                        <RotateCcw className="w-4 h-4" />
                                                        {t('order.action.refund')}
                                                    </button>
                                                </>
                                            )}
                                            <button
                                                onClick={() => setRemarkModal({ open: true, orderId: order.id, initialValue: order.remarks || '' })}
                                                disabled={isBusy}
                                                className="w-9 h-9 flex items-center justify-center bg-slate-50 border border-slate-200 rounded-lg text-slate-400 hover:text-indigo-500 transition-all"
                                            >
                                                <MessageSquare className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                )
                            })
                        )
                    ) : (
                        galleryOrders.filter(o => filterUserId === 'ALL' || o.userId === filterUserId).length === 0 ? (
                            <div className="text-center py-20 bg-white/50 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 font-bold uppercase tracking-widest px-10 text-xs">
                                {t('parent.orders.noGalleryOrders')}
                            </div>
                        ) : (
                            galleryOrders.filter(o => filterUserId === 'ALL' || o.userId === filterUserId).map(order => {
                                const statusCfg = STATUS_CONFIG[order.status] ?? { labelKey: order.status, className: 'bg-slate-100 text-slate-500' }
                                const isBusy = updating === order.id
                                return (
                                    <div key={order.id} className="bg-white p-4 rounded-2xl border border-slate-200/60 shadow-sm space-y-4">
                                        <div className="flex justify-between items-center px-1">
                                            <div className="flex flex-col">
                                                <div className="font-bold text-slate-800 text-sm tracking-tight uppercase leading-none flex items-center gap-2">
                                                    <User className="w-3.5 h-3.5 text-indigo-400" />
                                                    {order.artist.nickname || order.artist.name}
                                                </div>
                                                <div className="text-[9px] text-indigo-600 font-bold flex items-center gap-1.5 mt-1.5">
                                                    <Phone className="w-2.5 h-2.5" />
                                                    {order.visitor.name} ({order.visitor.phone})
                                                </div>
                                            </div>
                                            <span className={clsx(
                                                "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider",
                                                statusCfg.className
                                            )}>
                                                {t(statusCfg.labelKey)}
                                            </span>
                                        </div>

                                        <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100 grid grid-cols-1 md:grid-cols-[1fr,auto] gap-4 items-center">
                                            <div className="flex gap-3 items-center min-w-0">
                                                <div className="w-12 h-12 rounded-lg overflow-hidden border border-slate-200 shrink-0 relative bg-white">
                                                    <Image src={order.artwork.imageUrl} alt={order.artwork.title} fill className="object-cover" />
                                                </div>
                                                <div className="min-w-0">
                                                    <h4 className="font-black text-slate-800 text-sm leading-tight uppercase truncate mb-0.5">{order.artwork.title}</h4>
                                                    <p className="text-[10px] text-indigo-500 font-bold">
                                                        by {order.artist.nickname || order.artist.name}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="md:border-l border-slate-200 md:pl-4 flex flex-col items-start md:items-end">
                                                <div className="text-[14px] font-black text-slate-900 tracking-tight">¥{order.amountRMB}</div>
                                                <div className="text-[9px] text-indigo-600 font-bold uppercase">{order.artwork.priceCoins} CC</div>
                                            </div>
                                        </div>

                                        <div className="pt-1 px-1">
                                            {order.status === 'PENDING' && (
                                                <button
                                                    onClick={() => handleGalleryUpdate(order.id, 'COMPLETED')}
                                                    disabled={isBusy}
                                                    className="w-full h-10 flex items-center justify-center gap-2 bg-indigo-600 text-white rounded-lg text-xs font-black hover:bg-indigo-700 transition-all disabled:opacity-50 uppercase tracking-widest"
                                                >
                                                    <CheckCircle className="w-4 h-4" />
                                                    {isBusy ? '...' : t('order.action.confirm')}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )
                            })
                        )
                    )}
                </motion.div>
            </AnimatePresence>


            {/* Remark Modal for Shop Orders */}
            <AnimatePresence>
                {remarkModal.open && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center px-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setRemarkModal({ open: false, orderId: '', current: '' })}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="bg-white w-full max-w-sm rounded-3xl shadow-xl overflow-hidden relative border border-slate-200 p-8"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="font-black text-slate-800 text-xl tracking-tight">{t('button.remarks')}</h3>
                                <button
                                    onClick={() => setRemarkModal({ open: false, orderId: '', initialValue: '' })}
                                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 transition-all"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <textarea
                                ref={remarkRef}
                                value={remarkText}
                                onChange={e => setRemarkText(e.target.value)}
                                placeholder={t('order.remark.placeholder')}
                                rows={4}
                                className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 outline-none text-sm font-bold text-slate-600 resize-none transition-all placeholder:text-slate-200"
                            />

                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={saveRemark}
                                    disabled={updating === remarkModal.orderId}
                                    className="flex-1 h-12 bg-indigo-600 text-white rounded-xl font-black text-sm hover:bg-indigo-700 transition-all disabled:opacity-50"
                                >
                                    {updating === remarkModal.orderId ? '...' : t('common.confirm')}
                                </button>
                                <button
                                    onClick={() => setRemarkModal({ open: false, orderId: '', initialValue: '' })}
                                    className="px-6 h-12 bg-slate-100 text-slate-500 rounded-xl font-black text-sm hover:bg-slate-200 transition-all"
                                >
                                    {t('common.cancel')}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )

    async function saveRemark() {
        await handleShopUpdate(remarkModal.orderId, { remarks: remarkText })
        setRemarkModal({ open: false, orderId: '', initialValue: '' })
    }
}
