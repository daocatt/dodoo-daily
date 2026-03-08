'use client'

import React, { useState, useEffect, useRef } from 'react'
import { ShoppingBag, CheckCircle, RotateCcw, MessageSquare, X, Package } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useI18n } from '@/contexts/I18nContext'

interface Order {
    id: string
    costCoins: number
    status: string
    remarks: string | null
    createdAt: number
    user: { name: string, avatarUrl: string | null }
    item: { name: string, iconUrl: string | null }
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
                <img src={iconUrl} alt={name} className="w-full h-full object-cover" />
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
    const [orders, setOrders] = useState<Order[]>([])
    const [loading, setLoading] = useState(true)
    const [updating, setUpdating] = useState<string | null>(null)

    // Remark modal
    const [remarkModal, setRemarkModal] = useState<{ open: boolean; orderId: string; current: string }>({
        open: false, orderId: '', current: ''
    })
    const [remarkText, setRemarkText] = useState('')
    const remarkRef = useRef<HTMLTextAreaElement>(null)

    const fetchOrders = async () => {
        try {
            const res = await fetch('/api/parent/orders')
            const data = await res.json()
            setOrders(data)
        } catch (e) { console.error(e) }
        finally { setLoading(false) }
    }

    useEffect(() => { fetchOrders() }, [])

    useEffect(() => {
        if (remarkModal.open) {
            setRemarkText(remarkModal.current)
            setTimeout(() => remarkRef.current?.focus(), 100)
        }
    }, [remarkModal.open])

    const handleUpdate = async (id: string, data: any) => {
        setUpdating(id)
        try {
            const res = await fetch('/api/parent/orders', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, ...data })
            })
            if (!res.ok) console.error('Update failed:', await res.json())
            await fetchOrders()
        } catch (e) { console.error(e) }
        finally { setUpdating(null) }
    }

    const openRemark = (order: Order) => {
        setRemarkModal({ open: true, orderId: order.id, current: order.remarks || '' })
    }

    const saveRemark = async () => {
        await handleUpdate(remarkModal.orderId, { remarks: remarkText })
        setRemarkModal({ open: false, orderId: '', current: '' })
    }

    if (loading) return (
        <div className="flex items-center justify-center py-20 text-slate-400 text-sm">{t('common.loading')}</div>
    )

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
                <ShoppingBag className="w-6 h-6" />
                {t('parent.orders')}
            </h2>

            <div className="space-y-4">
                {orders.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-xl border border-slate-100 italic text-slate-400">
                        {t('parent.noOrders')}
                    </div>
                ) : (
                    orders.map(order => {
                        const statusCfg = STATUS_CONFIG[order.status] ?? { labelKey: order.status, className: 'bg-slate-100 text-slate-500' }
                        const isBusy = updating === order.id
                        return (
                            <div key={order.id} className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm space-y-4">

                                {/* Header: user + status */}
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden shrink-0">
                                            {order.user.avatarUrl ? (
                                                <img src={order.user.avatarUrl} alt={order.user.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center font-bold text-slate-300">
                                                    {order.user.name[0]?.toUpperCase()}
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <div className="font-bold">{order.user.name}</div>
                                            <div className="text-[10px] text-slate-400">{new Date(order.createdAt).toLocaleString()}</div>
                                        </div>
                                    </div>
                                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${statusCfg.className}`}>
                                        {t(statusCfg.labelKey)}
                                    </span>
                                </div>

                                {/* Item */}
                                <div className="flex gap-4 items-center bg-slate-50 p-4 rounded-2xl">
                                    <ItemIcon iconUrl={order.item.iconUrl} name={order.item.name} />
                                    <div className="flex-1 min-w-0">
                                        <div className="font-bold truncate">{order.item.name}</div>
                                        <div className="text-xs text-yellow-600 font-semibold">{order.costCoins} {t('hud.coins')}</div>
                                    </div>
                                </div>

                                {/* Remarks display */}
                                {order.remarks && (
                                    <div className="flex gap-2 text-sm text-slate-500 bg-blue-50/50 p-3 rounded-xl border border-blue-50">
                                        <MessageSquare className="w-4 h-4 shrink-0 mt-0.5 text-blue-400" />
                                        <p>{order.remarks}</p>
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="flex flex-wrap gap-2 pt-2">
                                    {/* CONFIRM — only when PENDING */}
                                    {order.status === 'PENDING' && (
                                        <button
                                            onClick={() => handleUpdate(order.id, { status: 'COMPLETED' })}
                                            disabled={isBusy}
                                            className="flex-1 min-w-[120px] flex items-center justify-center gap-1.5 px-4 py-3 bg-green-500 text-white rounded-2xl text-xs font-black shadow-lg shadow-green-200 hover:bg-green-600 transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100"
                                        >
                                            <CheckCircle className="w-4 h-4" />
                                            {isBusy ? '...' : t('order.action.confirm')}
                                        </button>
                                    )}

                                    {/* REFUND — only when PENDING */}
                                    {order.status === 'PENDING' && (
                                        <button
                                            onClick={() => handleUpdate(order.id, { status: 'REFUNDED' })}
                                            disabled={isBusy}
                                            className="flex-1 min-w-[120px] flex items-center justify-center gap-1.5 px-4 py-3 bg-rose-50 text-rose-600 rounded-2xl text-xs font-black hover:bg-rose-100 transition-all active:scale-95 border border-rose-100 disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100"
                                        >
                                            <RotateCcw className="w-4 h-4" />
                                            {isBusy ? '...' : t('order.action.refund')}
                                        </button>
                                    )}

                                    {/* REMARK — always visible */}
                                    <button
                                        onClick={() => openRemark(order)}
                                        disabled={isBusy}
                                        className="px-4 py-3 border-2 border-slate-100 rounded-2xl text-xs font-black flex items-center gap-1.5 hover:bg-slate-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                                    >
                                        <MessageSquare className="w-4 h-4 text-slate-400" />
                                        {t('button.remarks')}
                                    </button>
                                </div>
                            </div>
                        )
                    })
                )}
            </div>

            {/* Remark Modal */}
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
                            className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden relative"
                        >
                            <div className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center">
                                            <MessageSquare className="w-4 h-4 text-blue-500" />
                                        </div>
                                        <h3 className="font-black text-slate-800 text-base">{t('button.remarks')}</h3>
                                    </div>
                                    <button
                                        onClick={() => setRemarkModal({ open: false, orderId: '', current: '' })}
                                        className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:bg-slate-100 transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>

                                <textarea
                                    ref={remarkRef}
                                    value={remarkText}
                                    onChange={e => setRemarkText(e.target.value)}
                                    placeholder={t('order.remark.placeholder')}
                                    rows={4}
                                    className="w-full p-4 bg-slate-50 rounded-xl border border-slate-200 focus:border-blue-300 focus:ring-4 focus:ring-blue-50 outline-none text-sm font-medium text-slate-700 resize-none transition-all placeholder:text-slate-300"
                                />

                                <div className="flex gap-3 mt-4">
                                    <button
                                        onClick={() => setRemarkModal({ open: false, orderId: '', current: '' })}
                                        className="flex-1 h-11 bg-slate-100 rounded-xl font-black text-slate-500 hover:bg-slate-200 transition-all text-sm"
                                    >
                                        {t('common.cancel')}
                                    </button>
                                    <button
                                        onClick={saveRemark}
                                        disabled={updating === remarkModal.orderId}
                                        className="flex-[2] h-11 bg-blue-500 text-white rounded-xl font-black text-sm hover:bg-blue-600 shadow-lg shadow-blue-200 transition-all active:scale-95 disabled:opacity-60"
                                    >
                                        {updating === remarkModal.orderId ? '...' : t('common.confirm')}
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
