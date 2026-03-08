'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { ChevronLeft, Package, Coins, History, X } from 'lucide-react'
import Link from 'next/link'
import AnimatedSky from '@/components/AnimatedSky'
import { useI18n } from '@/contexts/I18nContext'
import { format } from 'date-fns'

type Order = {
    id: string
    itemName: string
    itemIcon: string | null
    costCoins: number
    status: string
    createdAt: string
}

export default function OrdersPage() {
    const [orders, setOrders] = useState<Order[]>([])
    const [loading, setLoading] = useState(true)
    const { t } = useI18n()

    useEffect(() => {
        fetchOrders()
    }, [])

    const fetchOrders = async () => {
        try {
            const res = await fetch('/api/shop/orders')
            if (res.ok) setOrders(await res.json())
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-dvh flex flex-col relative overflow-hidden bg-slate-50 text-slate-800">
            <AnimatedSky />

            <header className="relative z-10 flex items-center justify-between p-6 backdrop-blur-md bg-white/40 border-b border-slate-200 shadow-sm">
                <div className="flex items-center gap-4">
                    <Link href="/shop" className="w-10 h-10 flex items-center justify-center rounded-2xl bg-white hover:bg-slate-50 transition-all shadow-sm text-slate-600 border border-slate-200 group active:scale-95">
                        <ChevronLeft className="w-6 h-6 group-hover:-translate-x-0.5 transition-transform" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-black tracking-tight text-slate-800 flex items-center gap-3">
                            <Package className="w-7 h-7 text-amber-500" />
                            {t('order.myOrders')}
                        </h1>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{t('order.purchaseHistory')}</p>
                    </div>
                </div>
            </header>

            <main className="relative z-10 flex-1 overflow-y-auto p-6 md:p-12 pb-24 max-w-4xl mx-auto w-full">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-32 gap-4">
                        <div className="w-12 h-12 border-4 border-amber-200 border-t-amber-500 rounded-full animate-spin" />
                        <p className="font-black text-slate-400 animate-pulse text-sm uppercase tracking-widest">{t('order.loadingOrders')}</p>
                    </div>
                ) : orders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 text-center">
                        <div className="w-24 h-24 bg-white rounded-[32px] shadow-xl shadow-slate-200/50 flex items-center justify-center mb-6 border border-slate-100">
                            <History className="w-12 h-12 text-slate-200" />
                        </div>
                        <h2 className="text-2xl font-black text-slate-800 mb-2">{t('parent.noOrders')}</h2>
                        <p className="text-slate-500 font-medium max-w-xs">{t('order.noOrdersDesc')}</p>
                        <Link href="/shop" className="mt-8 px-8 py-3 bg-amber-500 text-white font-black rounded-2xl shadow-lg shadow-amber-200 hover:bg-amber-600 transition-all active:scale-95">
                            {t('order.goShopping')}
                        </Link>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {orders.map((order, idx) => (
                            <motion.div
                                key={order.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="group flex items-center gap-6 p-6 rounded-[32px] bg-white border border-slate-100 hover:border-amber-200 hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-300"
                            >
                                <div className="w-20 h-20 shrink-0 flex items-center justify-center bg-slate-50 rounded-2xl text-4xl shadow-inner border border-slate-100 group-hover:scale-110 transition-transform">
                                    {order.itemIcon?.startsWith('http') || order.itemIcon?.startsWith('/') ? (
                                        <img src={order.itemIcon} alt={order.itemName} className="w-full h-full object-cover rounded-2xl" />
                                    ) : (
                                        order.itemIcon || '🎁'
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-black text-xl text-slate-800 mb-1 truncate">{order.itemName}</h4>
                                    <div className="flex flex-wrap items-center gap-4">
                                        <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 rounded-xl text-sm font-black text-amber-600 border border-amber-100/50">
                                            <Coins className="w-4 h-4" /> {order.costCoins}
                                        </span>
                                        <span className="text-xs text-slate-400 font-black uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-xl">
                                            {format(new Date(order.createdAt), 'MMM d, HH:mm')}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-right shrink-0">
                                    <div className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-sm ${order.status === 'COMPLETED' ? 'bg-green-500 text-white shadow-green-200' :
                                        order.status === 'REFUNDED' ? 'bg-rose-100 text-rose-600' :
                                            'bg-amber-100 text-amber-700 shadow-amber-100'
                                        }`}>
                                        {order.status === 'PENDING' ? t('order.status.pending') :
                                            order.status === 'COMPLETED' ? t('order.status.completed') :
                                                order.status === 'REFUNDED' ? t('order.status.refunded') :
                                                    order.status}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    )
}
