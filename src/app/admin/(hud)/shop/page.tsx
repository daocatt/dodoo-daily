'use client'

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Plus, Coins, CheckCircle2, AlertCircle, Sparkles, X as XIcon, Package, Edit3, Trash, Store, Fan, Smile, Upload } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { BausteinAdminNavbar } from '@/components/BausteinAdminNavbar'
import { useI18n } from '@/contexts/I18nContext'
import EmojiPicker from '@/components/EmojiPicker'
import { clsx } from 'clsx'
import { useAuthSession } from '@/hooks/useAuthSession'

type ShopItem = {
    id: string
    name: string
    description: string | null
    costCoins: number
    iconUrl: string | null
    stock: number | null
}

interface ShopItemPayload {
    id?: string
    name: string
    costCoins: number
    description: string
    iconUrl: string
}

export default function ShopPage() {
    const [items, setItems] = useState<ShopItem[]>([])
    const [loading, setLoading] = useState(true)
    const [purchasingId, setPurchasingId] = useState<string | null>(null)
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null)
    const [confirmItem, setConfirmItem] = useState<ShopItem | null>(null)

    const [showAddModal, setShowAddModal] = useState(false)
    const [showEmojiPicker, setShowEmojiPicker] = useState(false)
    const [editingItemId, setEditingItemId] = useState<string | null>(null)
    
    const [newName, setNewName] = useState('')
    const [newDesc, setNewDesc] = useState('')
    const [newEmoji, setNewEmoji] = useState('🎁')
    const [newCost, setNewCost] = useState('10')

    const { t } = useI18n()
    const router = useRouter()
    const { isAdmin, loading: _sessionLoading } = useAuthSession()

    useEffect(() => {
        fetchItems()
    }, [])

    const fetchItems = async () => {
        setLoading(true)
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

    const handleOpenEdit = (item: ShopItem) => {
        setEditingItemId(item.id)
        setNewName(item.name)
        setNewCost(item.costCoins.toString())
        setNewDesc(item.description || '')
        setNewEmoji(item.iconUrl || '🎁')
        setShowAddModal(true)
    }

    const handleOpenAdd = () => {
        setEditingItemId(null)
        setNewName('')
        setNewCost('10')
        setNewDesc('')
        setNewEmoji('🎁')
        setShowAddModal(true)
    }

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        const formData = new FormData()
        formData.append('file', file)
        formData.append('type', 'IMAGE')

        try {
            setLoading(true)
            const res = await fetch('/api/media/upload', {
                method: 'POST',
                body: formData
            })
            const data = await res.json()
            if (data.path) {
                setNewEmoji(data.path)
            }
        } catch (error) {
            console.error('Upload failed:', error)
            setMessage({ type: 'error', text: 'Upload Failed' })
        } finally {
            setLoading(false)
        }
    }

    const handleDeleteItem = async (id: string, name: string) => {
        if (!confirm(`Confirm delete ${name}?`)) return

        try {
            const res = await fetch('/api/shop', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            })
            if (res.ok) {
                setMessage({ text: 'Deleted successfully', type: 'success' })
                fetchItems()
                setTimeout(() => setMessage(null), 3000)
            }
        } catch (_err) {
            console.error(_err)
        }
    }

    const handleSaveItem = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newName) return

        try {
            const isEditing = !!editingItemId
            const url = '/api/shop'
            const method = isEditing ? 'PATCH' : 'POST'
            
            const payload: ShopItemPayload = {
                name: newName,
                costCoins: parseInt(newCost) || 10,
                description: newDesc,
                iconUrl: newEmoji
            }
            
            if (isEditing) payload.id = editingItemId

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            if (res.ok) {
                setShowAddModal(false)
                setMessage({ text: isEditing ? 'Updated successfully' : t('shop.wish.submitted'), type: 'success' })
                fetchItems()
                setTimeout(() => setMessage(null), 4000)
            }
        } catch (_err) {
            console.error(_err)
        }
    }

    return (
        <div className="min-h-screen bg-[#D1CDBC] relative flex flex-col font-sans selection:bg-indigo-100 selection:text-indigo-900 text-slate-900">
            {/* Header / Navbar */}
            <BausteinAdminNavbar 
                onBack={() => router.push('/admin')}
                actions={
                    <div className="flex items-center gap-1.5 md:gap-3">
                        {isAdmin && (
                            <>
                                <button
                                    onClick={() => router.push('/admin/shop/orders')}
                                    className="hardware-btn group"
                                    title={t('parent.orders.shop')}
                                >
                                    <div className="hardware-well h-9 md:h-11 px-2.5 md:px-4 rounded-lg flex items-center gap-2 bg-[#DADBD4] shadow-well active:translate-y-0.5 overflow-hidden relative border-b-2 border-slate-400/20">
                                        <div className="hardware-cap absolute inset-1 bg-indigo-500 rounded flex items-center justify-center transition-all shadow-cap group-hover:bg-indigo-600 active:translate-y-0.5" />
                                        <Package className="w-3.5 h-3.5 md:w-4 md:h-4 text-white relative z-10" />
                                        <span className="hidden lg:inline label-mono text-[9px] font-black text-white uppercase tracking-wider relative z-10 drop-shadow-sm">
                                            {t('parent.orders.shop')}
                                        </span>
                                    </div>
                                </button>

                                <button
                                    onClick={() => router.push('/admin/shop/wishes')}
                                    className="hardware-btn group"
                                    title={t('shop.wishes.title')}
                                >
                                    <div className="hardware-well h-9 md:h-11 px-2.5 md:px-4 rounded-lg flex items-center gap-2 bg-[#DADBD4] shadow-well active:translate-y-0.5 overflow-hidden relative border-b-2 border-slate-400/20">
                                        <div className="hardware-cap absolute inset-1 bg-amber-500 rounded flex items-center justify-center transition-all shadow-cap group-hover:bg-amber-600 active:translate-y-0.5" />
                                        <Sparkles className="w-3.5 h-3.5 md:w-4 md:h-4 text-white relative z-10" />
                                        <span className="hidden lg:inline label-mono text-[9px] font-black text-white uppercase tracking-wider relative z-10 drop-shadow-sm">
                                            {t('shop.wishes.title')}
                                        </span>
                                    </div>
                                </button>

                                <div className="h-6 w-px bg-slate-400/30 mx-0.5 md:mx-1 hidden md:block" />

                                <button
                                    onClick={handleOpenAdd}
                                    className="hardware-btn group"
                                >
                                    <div className="hardware-well h-9 md:h-11 px-2.5 md:px-4 rounded-lg flex items-center gap-2 bg-[#DADBD4] shadow-well active:translate-y-0.5 overflow-hidden relative border-b-2 border-slate-400/20">
                                        <div className="hardware-cap absolute inset-1 bg-emerald-500 rounded flex items-center justify-center transition-all shadow-cap group-hover:bg-emerald-600 active:translate-y-0.5" />
                                        <Plus className="w-4 h-4 text-white relative z-10" />
                                        <span className="hidden lg:inline label-mono text-[9px] font-black text-white uppercase tracking-wider relative z-10 drop-shadow-sm">
                                            {t('button.add')}
                                        </span>
                                    </div>
                                </button>
                            </>
                        )}
                    </div>
                }
            />

            {/* Main Content Scroll Area */}
            <main className="flex-1 overflow-y-auto w-full max-w-[1600px] mx-auto p-4 md:p-8 pb-32 hide-scrollbar">
                {/* Status Message */}
                <AnimatePresence>
                    {message && (
                        <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            className={clsx(
                                "mb-6 p-4 rounded-xl flex items-center gap-3 font-black text-[10px] uppercase tracking-[0.2em] shadow-well border-2 transition-all",
                                message.type === 'success' ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-rose-500/10 text-rose-600 border-rose-500/20"
                            )}
                        >
                            {message.type === 'success' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                            {message.text}
                        </motion.div>
                    )}
                </AnimatePresence>

                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="hardware-well w-10 h-10 rounded-lg flex items-center justify-center bg-[#DADBD4] shadow-well animate-pulse">
                            <Store className="w-5 h-5 text-slate-400 animate-bounce" />
                        </div>
                    </div>
                ) : items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-80 text-slate-500 bg-[#C8C4B0]/20 rounded-[2rem] border-2 border-dashed border-[#C8C4B0]">
                        <Store className="w-12 h-12 mb-4 opacity-20" />
                        <p className="label-mono text-[10px] uppercase tracking-widest opacity-40">{t('gallery.empty')}</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 md:gap-8">
                        {items.map((item, idx) => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ 
                                    opacity: 1, 
                                    scale: 1,
                                    transition: { delay: idx * 0.03, duration: 0.3 }
                                }}
                                className="group flex flex-col"
                            >
                                <div className="hardware-well p-3 rounded-2xl bg-[#DADBD4]/70 shadow-well border border-black/5 relative group-hover:bg-[#DADBD4]/90 transition-all duration-300">
                                    {/* Item Slot (Recessed Well) */}
                                    <div className="aspect-square rounded-xl bg-[#C8C4B0] overflow-hidden relative border border-black/5 flex items-center justify-center group-hover:scale-[1.02] transition-transform duration-500 shadow-inner">
                                        <div className="absolute inset-0 bg-gradient-to-br from-black/10 to-transparent pointer-events-none z-10 opacity-30" />
                                        <div className="relative z-0 w-full h-full flex items-center justify-center text-6xl drop-shadow-md">
                                            {item.iconUrl?.startsWith('http') || item.iconUrl?.startsWith('/') ? (
                                                <Image 
                                                    src={item.iconUrl} 
                                                    alt={item.name} 
                                                    fill
                                                    className="object-cover transition-transform group-hover:scale-110 duration-700" 
                                                />
                                            ) : (
                                                <span className="relative z-10 transition-transform group-hover:scale-110 duration-500">{item.iconUrl || '🎁'}</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Info HUD */}
                                    <div className="mt-4 px-1 flex flex-col gap-3">
                                        <div className="flex justify-between items-start gap-2 min-h-[2.5rem]">
                                            <div className="flex flex-col flex-1 min-w-0">
                                                <h3 className="font-black text-slate-800 text-sm md:text-base tracking-tighter uppercase leading-tight line-clamp-2 mb-1">
                                                    {item.name}
                                                </h3>
                                                {item.description && (
                                                    <p className="label-mono text-[8px] font-bold text-slate-500 truncate opacity-60">
                                                        {item.description}
                                                    </p>
                                                )}
                                            </div>
                                            
                                            {isAdmin && (
                                                <div className="flex gap-1">
                                                    <button 
                                                        onClick={() => handleOpenEdit(item)}
                                                        className="hardware-well w-8 h-8 rounded bg-white/40 shadow-well-sm border border-white/20 flex items-center justify-center group/btn active:translate-y-0.5 transition-all outline-none"
                                                    >
                                                        <Edit3 className="w-3.5 h-3.5 text-slate-500 group-hover/btn:text-indigo-600" />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDeleteItem(item.id, item.name)}
                                                        className="hardware-well w-8 h-8 rounded bg-white/40 shadow-well-sm border border-white/20 flex items-center justify-center group/btn active:translate-y-0.5 transition-all text-slate-500 hover:text-rose-500 outline-none"
                                                    >
                                                        <Trash className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                        
                                        <div className="flex items-center gap-2">
                                            {/* Digital Price Slot - Transparent Style */}
                                            <div className="h-10 flex-1 flex items-center px-2 gap-2 border-b-2 border-black/5 relative active:translate-y-0.5 transition-all">
                                                <Coins className="w-4 h-4 text-amber-500 shrink-0 drop-shadow-[0_2px_4px_rgba(251,191,36,0.2)]" />
                                                <span className="font-black text-slate-800 text-lg tracking-tighter label-mono font-number antialiased">
                                                    {item.costCoins}
                                                </span>
                                            </div>

                                            <button
                                                onClick={() => setConfirmItem(item)}
                                                disabled={purchasingId === item.id}
                                                className="hardware-btn group/buy w-28 shrink-0"
                                            >
                                                <div className="hardware-well h-10 w-full rounded-lg flex items-center justify-center bg-[#B8B4A0] shadow-well active:translate-y-0.5 relative overflow-hidden transition-all group-hover/buy:bg-[#A8A490]">
                                                    <div className={clsx(
                                                        "hardware-cap absolute inset-0.5 rounded shadow-cap pointer-events-none group-hover/buy:opacity-90 transition-all", 
                                                        isAdmin ? "bg-slate-500" : "bg-emerald-500/90"
                                                    )} />
                                                    <span className="relative z-10 label-mono text-[9px] font-black text-white uppercase tracking-[0.15em] flex items-center gap-2">
                                                        {purchasingId === item.id ? <Fan className="w-3 h-3 animate-spin" /> : isAdmin ? <Package className="w-3 h-3" /> : <Sparkles className="w-3 h-3" />}
                                                        {isAdmin ? 'PREVIEW' : t('shop.buyNow')}
                                                    </span>
                                                </div>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </main>

            {/* Modals - Baustein Panel Implementation */}
            <AnimatePresence>
                {(confirmItem && !isAdmin) && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="w-full max-w-sm"
                        >
                            <div className="baustein-panel w-full bg-[#E6E2D1] rounded-3xl shadow-2xl relative overflow-hidden border-4 border-[#C8C4B0] flex flex-col p-8">
                                <div className="flex flex-col items-center gap-6">
                                    {/* Visual Confirmation Unit */}
                                    <div className="hardware-well w-32 h-32 rounded-2xl bg-[#DADBD4] shadow-well relative flex items-center justify-center text-7xl">
                                        <div className="absolute inset-0 bg-gradient-to-br from-black/5 to-transparent pointer-events-none" />
                                        {confirmItem.iconUrl?.startsWith('http') || confirmItem.iconUrl?.startsWith('/') ? (
                                            <Image 
                                                src={confirmItem.iconUrl} 
                                                width={128}
                                                height={128}
                                                alt={confirmItem.name}
                                                className="w-full h-full object-cover rounded-xl" 
                                            />
                                        ) : (
                                            <span className="drop-shadow-lg relative z-10">{confirmItem.iconUrl || '🎁'}</span>
                                        )}
                                    </div>

                                    <div className="text-center">
                                        <h3 className="text-xl font-black text-slate-900 tracking-tighter uppercase mb-1">{confirmItem.name}</h3>
                                        <p className="label-mono text-[9px] font-black text-slate-400 uppercase tracking-widest">{t('shop.confirmBuy')}</p>
                                    </div>

                                    <div className="w-full h-14 rounded-xl flex items-center justify-between px-2 border-b-[3px] border-slate-900/10 relative overflow-hidden active:translate-y-0.5 transition-all">
                                        <div className="flex items-center gap-3">
                                            <div className="hardware-well w-8 h-8 rounded-full bg-[#DADBD4] shadow-well flex items-center justify-center relative">
                                                <Coins className="w-4 h-4 text-amber-500" />
                                            </div>
                                            <span className="label-mono text-[10px] font-black text-slate-400 uppercase tracking-widest">Transaction_Value</span>
                                        </div>
                                        <span className="font-black text-slate-800 text-4xl tracking-tighter label-mono antialiased drop-shadow-sm">
                                            {confirmItem.costCoins}
                                        </span>
                                    </div>

                                    <div className="flex gap-4 w-full">
                                        <button onClick={() => setConfirmItem(null)} className="hardware-btn flex-1">
                                            <div className="hardware-well h-12 rounded-lg bg-[#DADBD4] shadow-well flex items-center justify-center relative active:translate-y-0.5 overflow-hidden group">
                                                <div className="hardware-cap absolute inset-0.5 bg-white rounded shadow-cap group-active:translate-y-0.5" />
                                                <span className="relative z-10 label-mono text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('common.cancel')}</span>
                                            </div>
                                        </button>
                                        <button onClick={() => handlePurchase(confirmItem)} disabled={purchasingId === confirmItem.id} className="hardware-btn flex-1">
                                            <div className="hardware-well h-12 rounded-lg bg-[#DADBD4] shadow-well flex items-center justify-center overflow-hidden relative group active:translate-y-0.5">
                                                <div className="hardware-cap absolute inset-0.5 bg-amber-500 rounded shadow-cap group-active:translate-y-0.5" />
                                                <span className="relative z-10 label-mono text-[10px] font-black text-white uppercase tracking-widest">
                                                    {purchasingId === confirmItem.id ? '...' : t('common.confirm')}
                                                </span>
                                            </div>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}

                {showAddModal && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
                        <motion.div
                            initial={{ scale: 0.95, y: 10, opacity: 0 }}
                            animate={{ scale: 1, y: 0, opacity: 1 }}
                            exit={{ scale: 0.95, y: 10, opacity: 0 }}
                            className="w-full max-w-lg relative"
                        >
                            <div className="baustein-panel w-full bg-[#E6E2D1] rounded-[2rem] shadow-2xl relative border-4 border-[#C8C4B0] flex flex-col">
                                <div className="p-8 flex flex-col">
                                    {/* Modal Header */}
                                    <div className="flex justify-between items-center mb-8 border-b-2 border-black/5 pb-5">
                                        <h3 className="text-lg font-black text-slate-900 tracking-tighter uppercase flex items-center gap-4">
                                            <div className="hardware-well w-9 h-9 rounded-lg bg-[#DADBD4] shadow-well relative overflow-hidden flex items-center justify-center">
                                                <div className={clsx("hardware-cap absolute inset-0.5 rounded flex items-center justify-center shadow-cap", editingItemId ? "bg-amber-500" : "bg-emerald-500")}>
                                                    {editingItemId ? <Edit3 className="w-4 h-4 text-white" /> : <Plus className="w-4 h-4 text-white" />}
                                                </div>
                                            </div>
                                            {editingItemId ? '更新商品规格 (Update Specification)' : '初始化新库存 (Initialize New Stock)'}
                                        </h3>
                                        <button onClick={() => setShowAddModal(false)} className="hardware-btn group">
                                            <div className="hardware-well w-9 h-9 rounded-full bg-[#DADBD4] shadow-well flex items-center justify-center relative active:translate-y-0.5">
                                                <div className="hardware-cap absolute inset-1 bg-white group-hover:bg-rose-50 rounded-full shadow-cap flex items-center justify-center border border-black/5">
                                                    <XIcon className="w-4 h-4 text-slate-400 group-hover:text-rose-500 transition-colors" />
                                                </div>
                                            </div>
                                        </button>
                                    </div>

                                    {/* Unified Form Grid */}
                                    <form onSubmit={handleSaveItem} className="flex flex-col gap-6">
                                        <div className="grid grid-cols-[100px_1fr] gap-x-8 gap-y-8">
                                            {/* ROW 1: ICON PREVIEW & NAME */}
                                            <div className="flex flex-col gap-3">
                                                <label className="label-mono text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">{t('shop.form.icon')}</label>
                                                <div className="relative">
                                                    <div className="hardware-well w-full h-16 rounded-2xl bg-[#DADBD4]/50 shadow-well flex items-center justify-center text-4xl overflow-hidden relative border border-black/5">
                                                        {newEmoji?.startsWith('http') || newEmoji?.startsWith('/') ? (
                                                            <Image 
                                                                src={newEmoji} 
                                                                alt="Preview" 
                                                                fill 
                                                                className="object-cover" 
                                                            />
                                                        ) : (
                                                            <span className="relative z-10 drop-shadow-md">{newEmoji || '🎁'}</span>
                                                        )}
                                                        {loading && (
                                                            <div className="absolute inset-0 bg-black/20 flex items-center justify-center z-20 backdrop-blur-[1px]">
                                                                <Fan className="w-6 h-6 text-white animate-spin" />
                                                            </div>
                                                        )}
                                                    </div>

                                                    {showEmojiPicker && (
                                                        <div className="absolute top-1/2 left-[calc(100%+24px)] -translate-y-1/2 z-[300] w-80 baustein-panel bg-[#E6E2D1] rounded-[1.5rem] shadow-2xl border-4 border-[#C8C4B0] p-4 scale-100 transition-all origin-left">
                                                            <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-4 h-4 bg-[#E6E2D1] border-l-4 border-b-4 border-[#C8C4B0] rotate-45 z-[-1]" />
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

                                            <div className="flex flex-col gap-3 min-w-0">
                                                <label className="label-mono text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">{t('shop.form.wishName')}</label>
                                                <div className="hardware-well p-1.5 rounded-2xl bg-[#DADBD4]/40 shadow-well border border-black/5 h-16 flex items-center">
                                                    <input
                                                        type="text"
                                                        value={newName}
                                                        onChange={e => setNewName(e.target.value)}
                                                        className="w-full h-full bg-white/95 px-5 rounded-xl border-2 border-transparent focus:border-indigo-500/30 outline-none font-black text-lg shadow-inner transition-all placeholder:text-slate-300"
                                                        placeholder={t('shop.form.wishPlaceholder')}
                                                        required
                                                    />
                                                </div>
                                            </div>

                                            <div className="flex gap-2 items-start mt-[-20px]">
                                                <button
                                                    type="button"
                                                    onClick={() => setShowEmojiPicker(v => !v)}
                                                    className="hardware-well flex-1 h-10 rounded-xl bg-[#DADBD4]/60 shadow-well flex items-center justify-center group active:translate-y-0.5 transition-all outline-none border border-black/5 relative"
                                                    title="Emoji"
                                                >
                                                    <div className="hardware-cap absolute inset-1 bg-white/40 rounded-lg shadow-cap pointer-events-none group-hover:bg-white/60 transition-all" />
                                                    <Smile className="w-4 h-4 text-slate-500 relative z-10" />
                                                </button>
                                                
                                                <label className="hardware-well flex-1 h-10 rounded-xl bg-[#DADBD4]/60 shadow-well flex items-center justify-center group active:translate-y-0.5 transition-all cursor-pointer border border-black/5 relative">
                                                    <div className="hardware-cap absolute inset-1 bg-white/40 rounded-lg shadow-cap pointer-events-none group-hover:bg-amber-50 transition-all" />
                                                    <input type="file" onChange={handleFileUpload} className="hidden" accept="image/*" />
                                                    <Upload className="w-4 h-4 text-slate-500 relative z-10 group-hover:text-amber-600 transition-colors" />
                                                </label>
                                            </div>

                                            <div className="flex flex-col gap-3">
                                                <label className="label-mono text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">所需金币 (Required Coins)</label>
                                                <div className="hardware-well p-1.5 rounded-2xl bg-[#DADBD4]/40 shadow-well border border-black/5 h-16 flex items-center transition-all">
                                                    <div className="relative flex items-center w-full h-full">
                                                        <Coins className="absolute left-4 w-5 h-5 text-amber-500 z-10" />
                                                        <input
                                                            type="number"
                                                            value={newCost}
                                                            onChange={e => setNewCost(e.target.value)}
                                                            className="w-full h-full bg-white/95 px-4 pl-14 rounded-xl border-2 border-transparent focus:border-amber-500/30 outline-none font-black text-slate-800 text-xl shadow-inner transition-all label-mono"
                                                            placeholder="10"
                                                            required
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* ROW 3: EMPTY & DESCRIPTION */}
                                            <div className="hidden sm:block" /> 
                                            <div className="flex flex-col gap-3">
                                                <label className="label-mono text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">{t('shop.form.descOptional')}</label>
                                                <div className="hardware-well p-1.5 rounded-2xl bg-[#DADBD4]/40 shadow-well border border-black/5 transition-all">
                                                    <textarea
                                                        value={newDesc}
                                                        onChange={e => setNewDesc(e.target.value)}
                                                        className="w-full bg-white/95 px-5 py-4 rounded-xl border-2 border-transparent focus:border-indigo-500/30 outline-none font-bold text-xs shadow-inner transition-all h-32 resize-none placeholder:text-slate-300 italic"
                                                        placeholder={t('shop.form.descPlaceholder')}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-[100px_1fr] gap-8 mt-4">
                                            <div className="hidden sm:block" />
                                            <button type="submit" className="hardware-btn group w-full">
                                                <div className="hardware-well h-16 w-full rounded-2xl bg-[#DADBD4] shadow-well active:translate-y-0.5 relative overflow-hidden transition-all group-hover:bg-[#C8C4B0]">
                                                    <div className={clsx("hardware-cap absolute inset-1 bg-slate-900 rounded-xl flex items-center justify-center gap-3 transition-opacity shadow-cap group-hover:opacity-90")}>
                                                        <CheckCircle2 className="w-5 h-5 text-white" />
                                                        <span className="text-xs font-black text-white uppercase tracking-[0.3em] label-mono italic">{editingItemId ? t('button.save') : t('button.create')}</span>
                                                    </div>
                                                </div>
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}
