'use client'

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { ChevronLeft, Store, Coins, CheckCircle2, AlertCircle, Plus, Sparkles, X, Package } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import AnimatedSky from '@/components/AnimatedSky'
import { useI18n } from '@/contexts/I18nContext'
import EmojiPicker from '@/components/EmojiPicker'

type ShopItem = {
    id: string
    name: string
    description: string | null
    costCoins: number
    iconUrl: string | null
    stock: number
}



export default function ShopPage() {
    const [items, setItems] = useState<ShopItem[]>([])
    const [loading, setLoading] = useState(true)
    const [purchasingId, setPurchasingId] = useState<string | null>(null)
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null)
    const [isAdmin, setIsAdmin] = useState(false)
    const [confirmItem, setConfirmItem] = useState<ShopItem | null>(null)

    const [showAddModal, setShowAddModal] = useState(false)
    const [showEmojiPicker, setShowEmojiPicker] = useState(false)
    const [newName, setNewName] = useState('')
    const [newDesc, setNewDesc] = useState('')
    const [newEmoji, setNewEmoji] = useState('🎁')


    const { t } = useI18n()

    useEffect(() => {
        fetchItems()
        fetchStats()
    }, [])

    const fetchStats = async () => {
        try {
            const res = await fetch('/api/stats')
            if (res.ok) {
                const data = await res.json()
                setIsAdmin(data.isAdmin || false)
            }
        } catch (_e) {
            console.error(_e)
        }
    }

    const fetchItems = async () => {
        try {
            const res = await fetch('/api/shop')
            const data = await res.json()
            setItems(data || [])
        } catch (_err) {
            console.error(_err)
        } finally {
            setLoading(false)
        }
    }


    const handlePurchase = async (item: ShopItem) => {
        setConfirmItem(null)
        setPurchasingId(item.id)
        setMessage(null)

        try {
            const res = await fetch('/api/shop/purchase', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ itemId: item.id })
            })

            const result = await res.json()

            if (res.ok) {
                setMessage({ text: t('shop.buySuccess', { name: item.name }), type: 'success' })
                fetchItems()
            } else {
                setMessage({ text: result.error || t('shop.buyError'), type: 'error' })
            }
        } catch {
            setMessage({ text: t('login.error.network'), type: 'error' })
        } finally {
            setPurchasingId(null)
            setTimeout(() => setMessage(null), 4000)
        }
    }

    const handleAddItem = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newName) return

        try {
            const res = await fetch('/api/shop/wishes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newName, description: newDesc, imageUrl: newEmoji })
            })
            if (res.ok) {
                setShowAddModal(false)
                setNewName('')
                setNewDesc('')
                setMessage({ text: t('shop.wish.submitted'), type: 'success' })
                setTimeout(() => setMessage(null), 4000)
            }
        } catch (_err) {
            console.error(_err)
        }
    }

    return (
        <div className="min-h-dvh flex flex-col relative overflow-hidden bg-amber-50 text-[#2c2416]">
            <AnimatedSky />

            <header className="relative z-10 flex justify-between items-center p-6 backdrop-blur-sm bg-white/20 border-b border-amber-200">
                <div className="flex items-center gap-4">
                    <Link href="/" className="w-10 h-10 flex items-center justify-center rounded-full bg-white/40 hover:bg-white/60 transition-colors shadow-sm text-amber-600 border border-white/50">
                        <ChevronLeft className="w-6 h-6" />
                    </Link>
                    <span className="font-extrabold text-2xl tracking-tight text-amber-800 drop-shadow flex items-center gap-2">
                        <Store className="w-6 h-6" />
                        {t('shop.title')}
                    </span>
                </div>
                {!isAdmin && (
                    <div className="flex items-center gap-2">
                        <Link
                            href="/shop/orders"
                            className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full bg-white/40 hover:bg-white/60 backdrop-blur-md transition-colors text-sm font-bold text-amber-700 border border-white/50 shadow-sm"
                        >
                            <Package className="w-4 h-4" />
                            {t('shop.orders.myOrders')}
                        </Link>
                        <Link
                            href="/shop/wishes"
                            className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full bg-white/40 hover:bg-white/60 backdrop-blur-md transition-colors text-sm font-bold text-amber-700 border border-white/50 shadow-sm"
                        >
                            <Sparkles className="w-4 h-4" />
                            {t('shop.wishes.myWishes')}
                        </Link>

                        {/* Mobile Icons */}
                        <Link
                            href="/shop/orders"
                            className="flex md:hidden w-10 h-10 items-center justify-center rounded-full bg-white/40 border border-white/50 text-amber-700"
                        >
                            <Package className="w-5 h-5" />
                        </Link>

                        <button
                            onClick={() => setShowAddModal(true)}
                            className="flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500 hover:bg-amber-600 transition-colors text-sm font-black text-white shadow-lg shadow-amber-500/30 active:scale-95 border-2 border-amber-400"
                        >
                            <Plus className="w-4 h-4" />
                            {t('shop.newWish')}
                        </button>
                    </div>
                )}
            </header>

            <main className="relative z-10 flex-1 overflow-y-auto p-6 md:p-12 pb-24 hide-scrollbar">

                {/* Feedback Message */}
                <AnimatePresence>
                    {message && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className={`mb-8 p-4 rounded-2xl flex items-center gap-3 font-bold shadow-lg ${message.type === 'success' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-200'
                                }`}
                        >
                            {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                            {message.text}
                        </motion.div>
                    )}
                </AnimatePresence>

                {loading ? (
                    <div className="flex justify-center items-center h-48">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-amber-600"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {items.map((item, idx) => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="group bg-white/70 backdrop-blur-xl border border-white/60 rounded-xl p-6 shadow-xl flex flex-col items-center text-center hover:shadow-2xl transition-all"
                            >
                                <div className="text-6xl mb-6 group-hover:scale-110 transition-transform duration-500 w-24 h-24 flex items-center justify-center">
                                    {item.iconUrl?.startsWith('http') || item.iconUrl?.startsWith('/') ? (
                                        <Image 
                                            src={item.iconUrl} 
                                            alt={item.name} 
                                            width={96}
                                            height={96}
                                            className="w-full h-full object-cover rounded-2xl shadow-sm border-2 border-amber-100" 
                                        />
                                    ) : (
                                        item.iconUrl || '🎁'
                                    )}
                                </div>
                                <h3 className="font-black text-xl mb-4 text-[#2c2416]">{item.name}</h3>

                                <div className="mt-auto w-full">
                                    <div className="flex items-center justify-center gap-1.5 mb-6">
                                        <div className="bg-amber-400 p-1 rounded-full">
                                            <Coins className="w-4 h-4 text-white" />
                                        </div>
                                        <span className="font-black text-2xl text-amber-600">{item.costCoins}</span>
                                    </div>

                                    {!isAdmin ? (
                                        <button
                                            onClick={() => setConfirmItem(item)}
                                            disabled={purchasingId === item.id}
                                            className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black rounded-2xl shadow-lg hover:shadow-amber-500/40 transition-all active:scale-95 disabled:grayscale"
                                        >
                                            {purchasingId === item.id ? t('common.loading') : t('shop.buyNow')}
                                        </button>
                                    ) : (
                                        <button
                                            disabled
                                            className="w-full py-4 bg-slate-200 text-slate-400 font-black rounded-2xl shadow-inner cursor-not-allowed"
                                        >
                                            {t('shop.previewOnly')}
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </main>

            {/* Purchase Confirmation Modal */}
            <AnimatePresence>
                {confirmItem && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
                        onClick={() => setConfirmItem(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 40 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 40 }}
                            className="w-full max-w-sm bg-white rounded-[32px] shadow-2xl overflow-hidden border border-amber-100"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="p-8 flex flex-col items-center text-center gap-5">
                                <div className="w-24 h-24 flex items-center justify-center text-6xl bg-amber-50 border-2 border-amber-200 rounded-[24px] shadow-inner overflow-hidden">
                                    {confirmItem.iconUrl?.startsWith('http') || confirmItem.iconUrl?.startsWith('/') ? (
                                        <Image 
                                            src={confirmItem.iconUrl} 
                                            width={96}
                                            height={96}
                                            alt={confirmItem.name}
                                            className="w-full h-full object-cover" 
                                        />
                                    ) : (
                                        confirmItem.iconUrl || '🎁'
                                    )}
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-slate-800 mb-1">{confirmItem.name}</h3>
                                    <p className="text-slate-500 font-medium text-sm">{t('shop.confirmBuy')}</p>
                                </div>
                                <div className="flex items-center gap-2 bg-amber-50 border-2 border-amber-200 px-6 py-3 rounded-2xl">
                                    <Coins className="w-5 h-5 text-amber-500" />
                                    <span className="font-black text-2xl text-amber-600">{confirmItem.costCoins}</span>
                                    <span className="font-bold text-amber-500 text-sm">{t('shop.coinsDeducted', { amount: '' })}</span>
                                </div>
                                <div className="flex gap-3 w-full pt-2">
                                    <button
                                        onClick={() => setConfirmItem(null)}
                                        className="flex-1 py-4 rounded-2xl bg-slate-100 text-slate-500 font-black hover:bg-slate-200 transition-colors active:scale-95"
                                    >
                                        {t('common.cancel')}
                                    </button>
                                    <button
                                        onClick={() => handlePurchase(confirmItem)}
                                        disabled={purchasingId === confirmItem.id}
                                        className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50 transition-all active:scale-95 disabled:grayscale"
                                    >
                                        {purchasingId === confirmItem.id ? t('shop.buying') : t('shop.confirmButton')}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Add Wish Modal */}
            <AnimatePresence>
                {showAddModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="w-full max-w-md max-h-[90dvh] bg-white rounded-[40px] shadow-2xl flex flex-col border border-amber-100 overflow-hidden"
                        >
                            <div className="p-6 border-b border-amber-100 flex justify-between items-center bg-amber-50">
                                <h3 className="text-xl font-black flex items-center gap-2 text-amber-800"><Sparkles className="w-5 h-5 text-amber-500" /> {t('shop.makeWish')}</h3>
                                <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-amber-100 rounded-full transition-colors text-amber-800"><X className="w-5 h-5" /></button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-6 sm:p-8 pt-4 custom-scrollbar">
                                <form onSubmit={handleAddItem} className="flex flex-col gap-6">
                                    <div className="flex flex-row items-center gap-4">
                                        <div className="flex flex-col gap-1.5 shrink-0">
                                            <label className="block text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] pl-1">{t('shop.form.icon')}</label>
                                            <div className="relative">
                                                <button
                                                    type="button"
                                                    onClick={() => setShowEmojiPicker(v => !v)}
                                                    className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center text-4xl sm:text-5xl bg-amber-50 border-2 border-amber-200 hover:border-amber-400 rounded-[20px] shadow-inner transition-all active:scale-95 overflow-hidden"
                                                    title="Click to pick an emoji"
                                                >
                                                    {newEmoji.startsWith('http') || newEmoji.startsWith('/') ? (
                                                        <Image 
                                                            src={newEmoji} 
                                                            width={80}
                                                            height={80}
                                                            alt="Emoji"
                                                            className="w-full h-full object-cover" 
                                                        />
                                                    ) : (
                                                        newEmoji
                                                    )}
                                                </button>
                                                {showEmojiPicker && (
                                                    <div className="absolute top-full left-0 mt-2 z-50 w-72 bg-white rounded-2xl shadow-2xl border border-amber-100 p-3">
                                                        <EmojiPicker
                                                            onSelect={(emoji) => {
                                                                setNewEmoji(emoji)
                                                                setShowEmojiPicker(false)
                                                            }}
                                                            currentEmoji={newEmoji}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex-1 flex flex-col gap-1.5">
                                            <label className="block text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] pl-1">{t('shop.form.wishName')}</label>
                                            <input
                                                type="text"
                                                value={newName}
                                                onChange={e => setNewName(e.target.value)}
                                                className="w-full bg-amber-50/50 border-2 border-amber-100 rounded-[20px] p-4 focus:border-amber-400 outline-none font-black text-xl transition-all h-16 sm:h-20 placeholder:text-amber-200"
                                                placeholder={t('shop.form.wishPlaceholder')}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="block text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] pl-1">{t('shop.form.descOptional')}</label>
                                        <textarea
                                            value={newDesc}
                                            onChange={e => setNewDesc(e.target.value)}
                                            className="w-full bg-amber-50/50 border-2 border-amber-100 rounded-[20px] p-4 sm:p-5 focus:border-amber-400 outline-none font-bold transition-all min-h-[100px] placeholder:text-amber-200 resize-none"
                                            placeholder={t('shop.form.descPlaceholder')}
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        className="w-full py-5 rounded-[24px] bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black text-lg shadow-xl shadow-amber-500/30 hover:shadow-amber-500/50 transition-all active:scale-95 border-b-4 border-orange-700 mt-2"
                                    >
                                        {t('shop.form.submitWish')}
                                    </button>
                                </form>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    )
}
