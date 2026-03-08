'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { ChevronLeft, Sparkles, Heart, Clock, X, Package } from 'lucide-react'
import Link from 'next/link'
import AnimatedSky from '@/components/AnimatedSky'
import { useI18n } from '@/contexts/I18nContext'
import { format } from 'date-fns'

type Wish = {
    id: string
    name: string
    description: string | null
    imageUrl: string | null
    status: 'PENDING' | 'APPROVED' | 'CANCELED'
    createdAt: string
}

export default function WishesPage() {
    const [wishes, setWishes] = useState<Wish[]>([])
    const [loading, setLoading] = useState(true)
    const { t } = useI18n()

    useEffect(() => {
        fetchWishes()
    }, [])

    const fetchWishes = async () => {
        try {
            const res = await fetch('/api/shop/wishes')
            if (res.ok) setWishes(await res.json())
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-dvh flex flex-col relative overflow-hidden bg-purple-50 text-slate-800">
            <AnimatedSky color="#f3e8ff" />

            <header className="relative z-10 flex items-center justify-between p-6 backdrop-blur-md bg-white/40 border-b border-purple-200 shadow-sm">
                <div className="flex items-center gap-4">
                    <Link href="/shop" className="w-10 h-10 flex items-center justify-center rounded-2xl bg-white hover:bg-slate-50 transition-all shadow-sm text-slate-600 border border-purple-200 group active:scale-95">
                        <ChevronLeft className="w-6 h-6 group-hover:-translate-x-0.5 transition-transform" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-black tracking-tight text-purple-900 flex items-center gap-3">
                            <Sparkles className="w-7 h-7 text-purple-500" />
                            My Wishes
                        </h1>
                        <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest mt-0.5">Waiting for parents</p>
                    </div>
                </div>
            </header>

            <main className="relative z-10 flex-1 overflow-y-auto p-6 md:p-12 pb-24 max-w-4xl mx-auto w-full">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-32 gap-4">
                        <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-500 rounded-full animate-spin" />
                        <p className="font-black text-purple-400 animate-pulse text-sm uppercase tracking-widest">Loading wishes...</p>
                    </div>
                ) : wishes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 text-center">
                        <div className="w-24 h-24 bg-white rounded-[32px] shadow-xl shadow-purple-200/50 flex items-center justify-center mb-6 border border-purple-100 animate-bounce">
                            <Heart className="w-12 h-12 text-purple-200" />
                        </div>
                        <h2 className="text-2xl font-black text-purple-900 mb-2">No wishes yet</h2>
                        <p className="text-purple-600 font-medium max-w-xs">Ask for something you'd like to see in the shop!</p>
                        <Link href="/shop" className="mt-8 px-8 py-3 bg-purple-500 text-white font-black rounded-2xl shadow-lg shadow-purple-200 hover:bg-purple-600 transition-all active:scale-95">
                            Make a Wish
                        </Link>
                    </div>
                ) : (
                    <div className="grid gap-6">
                        {wishes.map((wish, idx) => (
                            <motion.div
                                key={wish.id}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: idx * 0.05 }}
                                className="group bg-white rounded-[32px] border-2 border-transparent hover:border-purple-300 shadow-xl hover:shadow-2xl hover:shadow-purple-200/50 transition-all duration-300 overflow-hidden flex flex-col sm:flex-row items-center sm:items-stretch"
                            >
                                <div className="sm:w-48 w-full h-48 sm:h-auto bg-purple-50 border-r border-purple-100 flex items-center justify-center text-6xl group-hover:scale-105 transition-transform duration-500">
                                    {wish.imageUrl?.startsWith('http') || wish.imageUrl?.startsWith('/') ? (
                                        <img src={wish.imageUrl} alt={wish.name} className="w-full h-full object-cover" />
                                    ) : (
                                        wish.imageUrl || '🎁'
                                    )}
                                </div>
                                <div className="flex-1 p-8">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex-1">
                                            <h4 className="font-black text-2xl text-purple-900 mb-1 leading-tight">{wish.name}</h4>
                                            <div className="flex items-center gap-3">
                                                <Clock className="w-4 h-4 text-purple-300" />
                                                <span className="text-xs font-black text-purple-400 uppercase tracking-widest bg-purple-50 px-3 py-1 rounded-lg border border-purple-100/50">
                                                    Requested: {format(new Date(wish.createdAt), 'MMM d, yyyy')}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="shrink-0 text-right">
                                            <span className={`px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-sm ${wish.status === 'CONFIRMED' || wish.status === 'APPROVED' ? 'bg-green-500 text-white shadow-green-100' :
                                                    wish.status === 'REJECTED' || wish.status === 'CANCELED' ? 'bg-rose-100 text-rose-600' :
                                                        'bg-purple-100 text-purple-700 font-black'
                                                }`}>
                                                {wish.status === 'CONFIRMED' || wish.status === 'APPROVED' ? 'Confirmed' :
                                                    wish.status === 'REJECTED' || wish.status === 'CANCELED' ? 'Rejected' : 'Waiting'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="relative">
                                        <p className="text-slate-600 font-medium leading-relaxed bg-slate-50 p-4 rounded-2xl italic">
                                            {wish.description || "No description provided."}
                                        </p>
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
