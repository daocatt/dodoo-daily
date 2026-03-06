'use client'

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { ChevronLeft, Store, Coins, ShoppingBag, CheckCircle2, AlertCircle, Plus } from 'lucide-react'
import Link from 'next/link'
import AnimatedSky from '@/components/AnimatedSky'

type ShopItem = {
    id: string
    name: string
    costCoins: number
    iconUrl: string | null
    stock: number
}

export default function ShopPage() {
    const [items, setItems] = useState<ShopItem[]>([])
    const [loading, setLoading] = useState(true)
    const [purchasingId, setPurchasingId] = useState<string | null>(null)
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null)

    const [showAddModal, setShowAddModal] = useState(false)
    const [newName, setNewName] = useState('')
    const [newCost, setNewCost] = useState('')
    const [newEmoji, setNewEmoji] = useState('🎁')

    useEffect(() => {
        fetchItems()
    }, [])

    const fetchItems = async () => {
        try {
            const res = await fetch('/api/shop')
            const data = await res.json()
            setItems(data || [])
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const handlePurchase = async (item: ShopItem) => {
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
                setMessage({ text: `Bought ${item.name}! Check your HUD!`, type: 'success' })
                fetchItems()
            } else {
                setMessage({ text: result.error || 'Purchase failed', type: 'error' })
            }
        } catch (err) {
            setMessage({ text: 'Network error', type: 'error' })
        } finally {
            setPurchasingId(null)
            setTimeout(() => setMessage(null), 4000)
        }
    }

    const handleAddItem = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newName || !newCost) return

        try {
            const res = await fetch('/api/shop', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newName, costCoins: newCost, iconUrl: newEmoji })
            })
            if (res.ok) {
                setShowAddModal(false)
                setNewName('')
                setNewCost('')
                fetchItems()
            }
        } catch (err) {
            console.error(err)
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
                        Wish Shop (愿望商店)
                    </span>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/80 hover:bg-amber-500 backdrop-blur-md transition-colors text-sm font-bold text-white shadow-sm border border-amber-400"
                >
                    <Plus className="w-4 h-4" />
                    New Wish (添加愿望)
                </button>
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
                                className="group bg-white/70 backdrop-blur-xl border border-white/60 rounded-[2.5rem] p-6 shadow-xl flex flex-col items-center text-center hover:shadow-2xl transition-all"
                            >
                                <div className="text-6xl mb-6 group-hover:scale-125 transition-transform duration-500">
                                    {item.iconUrl || '🎁'}
                                </div>
                                <h3 className="font-black text-xl mb-4 text-[#2c2416]">{item.name}</h3>

                                <div className="mt-auto w-full">
                                    <div className="flex items-center justify-center gap-1.5 mb-6">
                                        <div className="bg-amber-400 p-1 rounded-full">
                                            <Coins className="w-4 h-4 text-white" />
                                        </div>
                                        <span className="font-black text-2xl text-amber-600">{item.costCoins}</span>
                                    </div>

                                    <button
                                        onClick={() => handlePurchase(item)}
                                        disabled={purchasingId === item.id}
                                        className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black rounded-2xl shadow-lg hover:shadow-amber-500/40 transition-all active:scale-95 disabled:grayscale"
                                    >
                                        {purchasingId === item.id ? 'Loading...' : 'Buy with Coins'}
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </main>

            {/* Add Item Modal */}
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
                            className="w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col"
                        >
                            <div className="p-6 border-b border-[#f5f0e8] flex justify-between items-center bg-amber-50">
                                <h3 className="text-xl font-bold flex items-center gap-2 text-amber-700"><ShoppingBag className="w-5 h-5" /> Add New Wish</h3>
                            </div>
                            <form onSubmit={handleAddItem} className="p-6 flex flex-col gap-5">
                                <div>
                                    <label className="block text-sm font-bold text-[#6b5c45] mb-2">Wish Name / Item</label>
                                    <input
                                        type="text"
                                        value={newName}
                                        onChange={e => setNewName(e.target.value)}
                                        className="w-full bg-[#f5f0e8] border-none rounded-xl p-4 focus:ring-4 focus:ring-amber-400 outline-none font-bold text-lg"
                                        placeholder="e.g. Cinema Trip"
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-[#6b5c45] mb-2">Cost (金币)</label>
                                        <input
                                            type="number"
                                            value={newCost}
                                            onChange={e => setNewCost(e.target.value)}
                                            className="w-full bg-[#f5f0e8] border-none rounded-xl p-4 focus:ring-4 focus:ring-amber-400 outline-none font-bold text-lg"
                                            placeholder="100"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-[#6b5c45] mb-2">Emoji Icon</label>
                                        <input
                                            type="text"
                                            value={newEmoji}
                                            onChange={e => setNewEmoji(e.target.value)}
                                            className="w-full bg-[#f5f0e8] border-none rounded-xl p-4 focus:ring-4 focus:ring-amber-400 outline-none font-bold text-lg text-center"
                                            placeholder="🎁"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="mt-2 w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black tracking-wide shadow-lg hover:opacity-90 transition-opacity text-lg"
                                >
                                    Confirm Addition
                                </button>
                                <button type="button" onClick={() => setShowAddModal(false)} className="py-2 text-[#a89880] font-bold hover:text-[#2c2416]">
                                    Cancel
                                </button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
