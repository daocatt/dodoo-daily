'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { Heart, ShoppingBag, ArrowUpRight, Loader2, Sparkles, Image as ImageIcon } from 'lucide-react'
import { useI18n } from '@/contexts/I18nContext'
import Link from 'next/link'

interface GalleryItem {
    id: string
    artworkTitle: string
    artworkImage: string
    artworkId: string
    createdAt: string
}

export default function MyGalleryWidget() {
    const { t } = useI18n()
    const [likes, setLikes] = useState<GalleryItem[]>([])
    const [orders, setOrders] = useState<GalleryItem[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchGallery = async () => {
            try {
                // We use memberId since this widget is for logged-in family members
                // The API needs a visitorId or memberId.
                // We'll trust the session to provide the ID or fetch from api/stats first.
                const statsRes = await fetch('/api/stats')
                const stats = await statsRes.json()
                
                if (stats?.id) {
                    const [lRes, oRes] = await Promise.all([
                        fetch(`/api/visitor/likes?memberId=${stats.id}`),
                        fetch(`/api/visitor/orders?memberId=${stats.id}`)
                    ])
                    if (lRes.ok) setLikes(await lRes.json())
                    if (oRes.ok) setOrders(await oRes.json())
                }
            } catch (e) {
                console.error('Gallery widget fetch error:', e)
            } finally {
                setLoading(false)
            }
        }
        fetchGallery()
    }, [])

    if (loading) return (
        <div className="w-full h-full bg-slate-50/50 backdrop-blur-md rounded-3xl animate-pulse border border-slate-100 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-slate-200 animate-spin" />
        </div>
    )

    const recentItems = [...likes, ...orders]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 4)

    return (
        <motion.div
            whileHover={{ scale: 1.01 }}
            className="w-full h-full bg-white/60 backdrop-blur-xl rounded-3xl p-6 lg:p-8 border border-white/40 shadow-xl shadow-slate-200/50 flex flex-col group overflow-hidden relative"
        >
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-500 shadow-sm border border-indigo-100/50">
                        <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-slate-800 tracking-tight leading-none mb-1">My Collection</h3>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{likes.length + orders.length} Items Total</span>
                    </div>
                </div>
                <Link href="/member" className="p-2.5 bg-slate-100 rounded-xl text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 transition-all border border-transparent hover:border-indigo-100 shadow-sm">
                    <ArrowUpRight className="w-5 h-5" />
                </Link>
            </div>

            {recentItems.length > 0 ? (
                <div className="grid grid-cols-2 gap-3 flex-1">
                    {recentItems.map((item, idx) => (
                        <div key={`${item.id}-${idx}`} className="group/item relative aspect-square rounded-2xl overflow-hidden border-2 border-white shadow-md bg-slate-100">
                            <img src={item.artworkImage} alt={item.artworkTitle} className="w-full h-full object-cover transition-transform group-hover/item:scale-110 duration-700" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover/item:opacity-100 transition-opacity" />
                            <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center opacity-0 group-hover/item:opacity-100 transition-all translate-y-2 group-hover/item:translate-y-0">
                                <span className="text-[8px] font-black text-white truncate drop-shadow-md pr-2">{item.artworkTitle}</span>
                            </div>
                        </div>
                    ))}
                    {recentItems.length < 4 && Array.from({ length: 4 - recentItems.length }).map((_, i) => (
                        <div key={`empty-${i}`} className="aspect-square rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 flex items-center justify-center">
                            <ImageIcon className="w-6 h-6 text-slate-200" />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-indigo-100 bg-indigo-50/20 rounded-2xl">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-200 mb-3 shadow-inner">
                        <Heart className="w-6 h-6" />
                    </div>
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">No Collections Stored</p>
                    <p className="text-[8px] text-slate-400 italic mt-1 font-medium italic">Visit Exhibition to add items</p>
                </div>
            )}

            <div className="mt-6 flex gap-3">
                <div className="flex-1 bg-rose-50 border border-rose-100 p-3 rounded-2xl flex items-center gap-3 group/btn cursor-pointer transition-all hover:bg-rose-100/50">
                    <Heart className="w-4 h-4 text-rose-500 fill-rose-500 group-hover/btn:scale-110 transition-transform" />
                    <div className="flex flex-col">
                        <span className="text-xs font-black text-rose-700">{likes.length}</span>
                        <span className="text-[8px] font-black text-rose-400 uppercase tracking-widest leading-none">Likes</span>
                    </div>
                </div>
                <div className="flex-1 bg-indigo-50 border border-indigo-100 p-3 rounded-2xl flex items-center gap-3 group/btn cursor-pointer transition-all hover:bg-indigo-100/50">
                    <ShoppingBag className="w-4 h-4 text-indigo-500 group-hover/btn:rotate-12 transition-transform" />
                    <div className="flex flex-col">
                        <span className="text-xs font-black text-indigo-700">{orders.length}</span>
                        <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest leading-none">Order</span>
                    </div>
                </div>
            </div>
        </motion.div>
    )
}
