'use client'

import React, { useState, useEffect } from 'react'
import { ShoppingBag, Clock, Truck, CheckCircle, XCircle, MessageSquare } from 'lucide-react'
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

const statusColors: any = {
    'PENDING': 'bg-amber-100 text-amber-600',
    'SHIPPED': 'bg-blue-100 text-blue-600',
    'COMPLETED': 'bg-green-100 text-green-600',
    'CANCELLED': 'bg-red-100 text-red-600'
}

export default function OrderManagement() {
    const { t } = useI18n()
    const [orders, setOrders] = useState<Order[]>([])
    const [loading, setLoading] = useState(true)
    const [updating, setUpdating] = useState<string | null>(null)

    const fetchOrders = async () => {
        try {
            const res = await fetch('/api/parent/orders')
            const data = await res.json()
            setOrders(data)
        } catch (e) { console.error(e) }
        finally { setLoading(false) }
    }

    useEffect(() => { fetchOrders() }, [])

    const handleUpdate = async (id: string, data: any) => {
        setUpdating(id)
        try {
            await fetch('/api/parent/orders', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, ...data })
            })
            fetchOrders()
        } catch (e) { console.error(e) }
        finally { setUpdating(null) }
    }

    if (loading) return <div>Loading...</div>

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
                <ShoppingBag className="w-6 h-6" />
                {t('parent.orders')}
            </h2>

            <div className="space-y-4">
                {orders.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 italic text-slate-400">
                        {t('parent.noOrders')}
                    </div>
                ) : (
                    orders.map(order => (
                        <div key={order.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden shrink-0">
                                        {order.user.avatarUrl ? (
                                            <img src={order.user.avatarUrl} alt={order.user.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center font-bold text-slate-300">{order.user.name[0]?.toUpperCase()}</div>
                                        )}
                                    </div>
                                    <div>
                                        <div className="font-bold">{order.user.name}</div>
                                        <div className="text-[10px] text-slate-400">{new Date(order.createdAt).toLocaleString()}</div>
                                    </div>
                                </div>
                                <span className={`px-2 py-1 rounded-lg text-[10px] font-bold ${statusColors[order.status] || 'bg-slate-100'}`}>
                                    {order.status}
                                </span>
                            </div>

                            <div className="flex gap-4 items-center bg-slate-50 p-4 rounded-2xl">
                                <div className="text-3xl">{order.item.iconUrl || '🎁'}</div>
                                <div className="flex-1">
                                    <div className="font-bold">{order.item.name}</div>
                                    <div className="text-xs text-yellow-600 font-semibold">{order.costCoins} {t('hud.coins')}</div>
                                </div>
                            </div>

                            {order.remarks && (
                                <div className="flex gap-2 text-sm text-slate-500 bg-blue-50/50 p-3 rounded-xl border border-blue-50">
                                    <MessageSquare className="w-4 h-4 shrink-0 mt-0.5 text-blue-400" />
                                    <p>{order.remarks}</p>
                                </div>
                            )}

                            <div className="flex flex-wrap gap-2 pt-2">
                                <button
                                    onClick={() => handleUpdate(order.id, { status: 'PENDING' })}
                                    className="flex-1 min-w-[100px] flex items-center justify-center gap-1.5 px-3 py-2 border rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors"
                                >
                                    <Clock className="w-3.5 h-3.5" /> PENDING
                                </button>
                                <button
                                    onClick={() => handleUpdate(order.id, { status: 'SHIPPED' })}
                                    className="flex-1 min-w-[100px] flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-50 text-blue-600 rounded-xl text-xs font-bold hover:bg-blue-100 transition-colors"
                                >
                                    <Truck className="w-3.5 h-3.5" /> {t('button.ship')}
                                </button>
                                <button
                                    onClick={() => handleUpdate(order.id, { status: 'COMPLETED' })}
                                    className="flex-1 min-w-[100px] flex items-center justify-center gap-1.5 px-3 py-2 bg-green-50 text-green-600 rounded-xl text-xs font-bold hover:bg-green-100 transition-colors"
                                >
                                    <CheckCircle className="w-3.5 h-3.5" /> {t('button.complete')}
                                </button>
                                <button
                                    onClick={() => handleUpdate(order.id, { status: 'CANCELLED' })}
                                    className="flex-1 min-w-[100px] flex items-center justify-center gap-1.5 px-3 py-2 bg-red-50 text-red-600 rounded-xl text-xs font-bold hover:bg-red-100 transition-colors"
                                >
                                    <XCircle className="w-3.5 h-3.5" /> {t('common.cancel')}
                                </button>
                                <button
                                    onClick={() => {
                                        const msg = prompt('Enter remarks:', order.remarks || '')
                                        if (msg !== null) handleUpdate(order.id, { remarks: msg })
                                    }}
                                    className="px-3 py-2 border rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-slate-50"
                                >
                                    <MessageSquare className="w-3.5 h-3.5" /> {t('button.remarks')}
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
