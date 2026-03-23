'use client'

import React, { useState, useEffect, useRef } from 'react'
import { ShoppingBag, CheckCircle, RotateCcw, MessageSquare, X, Package, User, Palette, Phone, Calendar } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import Image from 'next/image'
import { useI18n } from '@/contexts/I18nContext'

interface ShopOrder {
    id: string
    costCoins: number
    status: string
    remarks: string | null
    createdAt: number
    user: { name: string, avatarUrl: string | null }
    item: { name: string, iconUrl: string | null }
}

interface GalleryOrder {
    id: string
    status: string
    amountRMB: number
    createdAt: number
    artwork: {
        id: string
        title: string
        imageUrl: string
        priceCoins: number
    }
    artist: {
        name: string
        nickname: string | null
    }
    visitor: {
        name: string
        phone: string
    }
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

export default function OrderManagement() {
    const { t } = useI18n()
    const [tab, setTab] = useState<'SHOP' | 'GALLERY'>('SHOP')
    const [shopOrders, setShopOrders] = useState<ShopOrder[]>([])
    const [galleryOrders, setGalleryOrders] = useState<GalleryOrder[]>([])
    const [loading, setLoading] = useState(true)
    const [updating, setUpdating] = useState<string | null>(null)

    const [remarkModal, setRemarkModal] = useState<{ open: boolean; orderId: string; current: string }>({
        open: false, orderId: '', current: ''
    })
    const [remarkText, setRemarkText] = useState('')
    const remarkRef = useRef<HTMLTextAreaElement>(null)

    const fetchData = React.useCallback(async () => {
        setLoading(true)
        try {
            const [shopRes, galleryRes] = await Promise.all([
                fetch('/api/parent/orders'),
                fetch('/api/parent/gallery-orders')
            ])
            if (shopRes.ok) setShopOrders(await shopRes.json())
            if (galleryRes.ok) setGalleryOrders(await galleryRes.json())
        } catch (e) { console.error(e) }
        finally { setLoading(false) }
    }, [])

    useEffect(() => { fetchData() }, [fetchData])

    useEffect(() => {
        if (remarkModal.open) {
            setRemarkText(remarkModal.current)
            setTimeout(() => remarkRef.current?.focus(), 100)
        }
    }, [remarkModal.open, remarkModal.current])

    const handleShopUpdate = async (id: string, data: Record<string, unknown>) => {
        setUpdating(id)
        try {
            const res = await fetch('/api/parent/orders', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, ...data })
            })
            if (res.ok) await fetchData()
        } catch (e) { console.error(e) }
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
        } catch (e) { console.error(e) }
        finally { setUpdating(null) }
    }

    if (loading) return (
        <div className="flex items-center justify-center py-20 text-slate-400 text-sm">{t('common.loading')}</div>
    )

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <h2 className="text-3xl font-black text-slate-900 flex items-center gap-3">
                    <ShoppingBag className="w-8 h-8 text-indigo-600" />
                    {t('parent.orders')}
                </h2>

                <div className="flex bg-slate-100 p-1 rounded-2xl">
                    <button
                        onClick={() => setTab('SHOP')}
                        className={`px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${tab === 'SHOP' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        {t('parent.orders.shop')}
                    </button>
                    <button
                        onClick={() => setTab('GALLERY')}
                        className={`px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${tab === 'GALLERY' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        {t('parent.orders.gallery')}
                    </button>
                </div>
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={tab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="grid grid-cols-1 gap-6"
                >
                    {tab === 'SHOP' ? (
                        shopOrders.length === 0 ? (
                            <div className="text-center py-24 bg-white rounded-3xl border-2 border-dashed border-slate-100 text-slate-400 font-bold uppercase tracking-widest px-10">
                                {t('parent.noOrders')}
                            </div>
                        ) : (
                            shopOrders.map(order => {
                                const statusCfg = STATUS_CONFIG[order.status] ?? { labelKey: order.status, className: 'bg-slate-100 text-slate-500' }
                                const isBusy = updating === order.id
                                return (
                                    <div key={order.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4 hover:shadow-xl transition-all group">
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-slate-50 overflow-hidden shrink-0 border border-slate-100 p-0.5">
                                                    {order.user.avatarUrl ? (
                                                        <Image 
                                                            src={order.user.avatarUrl} 
                                                            alt={order.user.name} 
                                                            width={48} 
                                                            height={48} 
                                                            className="w-full h-full object-cover rounded-[14px]" 
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center font-black text-slate-200 text-lg">
                                                            {order.user.name[0]?.toUpperCase()}
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="font-black text-slate-800 text-lg tracking-tight">{order.user.name}</div>
                                                    <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-2">
                                                        <Calendar className="w-3 h-3" />
                                                        {new Date(order.createdAt).toLocaleString()}
                                                    </div>
                                                </div>
                                            </div>
                                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${statusCfg.className}`}>
                                                {t(statusCfg.labelKey)}
                                            </span>
                                        </div>

                                        <div className="flex gap-4 items-center bg-slate-50 p-4 rounded-2xl border border-slate-100 shadow-inner group-hover:bg-indigo-50/50 group-hover:border-indigo-100 transition-colors">
                                            <ItemIcon iconUrl={order.item.iconUrl} name={order.item.name} />
                                            <div className="flex-1 min-w-0">
                                                <div className="font-black text-slate-800 uppercase tracking-tight truncate">{order.item.name}</div>
                                                <div className="text-xs text-amber-600 font-black uppercase tracking-widest">{order.costCoins} {t('hud.coins')}</div>
                                            </div>
                                        </div>

                                        {order.remarks && (
                                            <div className="flex gap-3 text-sm text-slate-500 bg-blue-50/50 p-4 rounded-2xl border border-blue-50 italic font-medium">
                                                <MessageSquare className="w-4 h-4 shrink-0 mt-0.5 text-blue-400" />
                                                <p>{order.remarks}</p>
                                            </div>
                                        )}

                                        <div className="flex flex-wrap gap-2 pt-2">
                                            {order.status === 'PENDING' && (
                                                <>
                                                    <button
                                                        onClick={() => handleShopUpdate(order.id, { status: 'COMPLETED' })}
                                                        disabled={isBusy}
                                                        className="flex-1 min-w-[140px] flex items-center justify-center gap-2 px-6 py-4 bg-emerald-500 text-white rounded-2xl text-xs font-black shadow-lg shadow-emerald-100 hover:bg-emerald-600 transition-all active:scale-95 disabled:opacity-50"
                                                    >
                                                        <CheckCircle className="w-4 h-4" />
                                                        {isBusy ? '...' : t('order.action.confirm')}
                                                    </button>
                                                    <button
                                                        onClick={() => handleShopUpdate(order.id, { status: 'REFUNDED' })}
                                                        disabled={isBusy}
                                                        className="flex-1 min-w-[140px] flex items-center justify-center gap-2 px-6 py-4 bg-white border-2 border-rose-100 text-rose-500 rounded-2xl text-xs font-black hover:bg-rose-50 transition-all active:scale-95 disabled:opacity-50"
                                                    >
                                                        <RotateCcw className="w-4 h-4" />
                                                        {isBusy ? '...' : t('order.action.refund')}
                                                    </button>
                                                </>
                                            )}
                                            <button
                                                onClick={() => setRemarkModal({ open: true, orderId: order.id, current: order.remarks || '' })}
                                                disabled={isBusy}
                                                className="px-6 py-4 bg-white border-2 border-slate-100 rounded-2xl text-xs font-black flex items-center gap-2 hover:bg-slate-50 text-slate-600 transition-all"
                                            >
                                                <MessageSquare className="w-4 h-4 text-slate-400" />
                                                {t('button.remarks')}
                                            </button>
                                        </div>
                                    </div>
                                )
                            })
                        )
                    ) : (
                        galleryOrders.length === 0 ? (
                            <div className="text-center py-24 bg-white rounded-3xl border-2 border-dashed border-slate-100 text-slate-400 font-bold uppercase tracking-widest px-10">
                                {t('parent.orders.noGalleryOrders')}
                            </div>
                        ) : (
                            galleryOrders.map(order => {
                                const statusCfg = STATUS_CONFIG[order.status] ?? { labelKey: order.status, className: 'bg-slate-100 text-slate-500' }
                                const isBusy = updating === order.id
                                return (
                                    <div key={order.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6 hover:shadow-xl transition-all group">
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-400 border border-indigo-100">
                                                    <User className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <div className="font-black text-slate-800 text-lg tracking-tight uppercase">{order.visitor.name}</div>
                                                    <div className="text-xs text-indigo-600 font-bold flex items-center gap-1.5 mt-0.5">
                                                        <Phone className="w-3 h-3" />
                                                        {order.visitor.phone}
                                                    </div>
                                                </div>
                                            </div>
                                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${statusCfg.className}`}>
                                                {t(statusCfg.labelKey)}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center bg-slate-50 p-6 rounded-[32px] border border-slate-100 group-hover:border-indigo-100 transition-all">
                                            <div className="flex gap-4 items-center">
                                                <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-md border-4 border-white shrink-0 relative">
                                                    <Image 
                                                        src={order.artwork.imageUrl} 
                                                        alt={order.artwork.title} 
                                                        fill 
                                                        className="object-cover" 
                                                    />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{t('parent.orders.artwork')}</p>
                                                    <h4 className="font-black text-slate-800 text-base leading-tight uppercase">{order.artwork.title}</h4>
                                                    <p className="text-xs text-indigo-500 font-black mt-1">
                                                        by {order.artist.nickname || order.artist.name}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="md:border-l border-slate-200 md:pl-8">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('parent.orders.price')}</p>
                                                <div className="text-2xl font-black text-slate-900 tracking-tight">¥{order.amountRMB} <span className="text-slate-200 font-normal">/</span> <span className="text-indigo-600">{order.artwork.priceCoins} Coins</span></div>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-2">
                                            {order.status === 'PENDING' && (
                                                <button
                                                    onClick={() => handleGalleryUpdate(order.id, 'COMPLETED')}
                                                    disabled={isBusy}
                                                    className="w-full flex items-center justify-center gap-3 px-8 py-5 bg-indigo-600 text-white rounded-[24px] font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-[0.98] uppercase tracking-widest text-xs"
                                                >
                                                    <CheckCircle className="w-5 h-5" />
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
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white w-full max-w-sm rounded-[40px] shadow-2xl overflow-hidden relative"
                        >
                            <div className="p-10">
                                <div className="flex items-center justify-between mb-8">
                                    <h3 className="font-black text-slate-900 text-2xl tracking-tight">{t('button.remarks')}</h3>
                                    <button
                                        onClick={() => setRemarkModal({ open: false, orderId: '', current: '' })}
                                        className="w-10 h-10 flex items-center justify-center rounded-2xl bg-slate-50 text-slate-400 hover:bg-slate-100 transition-colors"
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
                                    className="w-full p-6 bg-slate-50 rounded-3xl border border-slate-200 focus:border-indigo-300 focus:ring-8 focus:ring-indigo-50 outline-none text-base font-bold text-slate-700 resize-none transition-all placeholder:text-slate-300"
                                />

                                <div className="flex flex-col gap-3 mt-8">
                                    <button
                                        onClick={saveRemark}
                                        disabled={updating === remarkModal.orderId}
                                        className="w-full h-16 bg-indigo-600 text-white rounded-3xl font-black text-lg hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all active:scale-[0.98] disabled:opacity-60 uppercase tracking-widest"
                                    >
                                        {updating === remarkModal.orderId ? '...' : t('common.confirm')}
                                    </button>
                                    <button
                                        onClick={() => setRemarkModal({ open: false, orderId: '', current: '' })}
                                        className="w-full h-14 bg-slate-100 rounded-2xl font-black text-slate-500 hover:bg-slate-200 transition-all text-sm uppercase tracking-widest"
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
        await handleShopUpdate(remarkModal.orderId, { remarks: remarkText })
        setRemarkModal({ open: false, orderId: '', current: '' })
    }
}
