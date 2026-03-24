'use client'

import React, { useState, useEffect } from 'react'
import {
    Plus, Edit2, Trash2, Eye, EyeOff, Tag, Package, Save, X,
    Camera, Clock, Loader2, Star, ShoppingBag, CheckCircle, AlertCircle
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useI18n } from '@/contexts/I18nContext'
import Image from 'next/image'

interface ShopItem {
    id: string
    name: string
    description: string | null
    costCoins: number
    iconUrl: string | null
    stock: number
    deliveryDays: number
    isActive: boolean
    isDeleted: boolean
}

interface Wish {
    id: string
    name: string
    description: string | null
    imageUrl: string | null
    status: string
    addedToShopAt: number | null
    createdAt: number
    user: { id: string; name: string; avatarUrl: string | null }
}

type View = 'ITEMS' | 'WISHES'

export default function ShopManagement({ onOrdersClick }: { onOrdersClick?: () => void }) {
    const { t } = useI18n()
    const [items, setItems] = useState<ShopItem[]>([])
    const [loading, setLoading] = useState(true)
    const [wishes, setWishes] = useState<Wish[]>([])
    const [wishesLoading, setWishesLoading] = useState(false)
    const [view, setView] = useState<View>('ITEMS')

    // Item form modal
    const [showItemModal, setShowItemModal] = useState(false)
    const [editingItem, setEditingItem] = useState<ShopItem | null>(null)
    const [saving, setSaving] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [formData, setFormData] = useState({
        name: '', description: '', costCoins: 10, iconUrl: '', stock: 1, deliveryDays: 1
    })

    // Delete confirm modal
    const [deleteTarget, setDeleteTarget] = useState<ShopItem | null>(null)
    const [deleting, setDeleting] = useState(false)

    // Add-to-shop modal (from wish)
    const [addToShopWish, setAddToShopWish] = useState<Wish | null>(null)
    const [addToShopCost, setAddToShopCost] = useState(10)

    // Wish action in-progress
    const [wishBusy, setWishBusy] = useState<string | null>(null)

    /* ── Data fetching ─────────────────────────────────────────────────── */
    const fetchItems = async () => {
        try {
            const res = await fetch('/api/shop')
            setItems(await res.json())
        } catch (_e) { console.error(_e) }
        finally { setLoading(false) }
    }

    const fetchWishes = async () => {
        setWishesLoading(true)
        try {
            const res = await fetch('/api/parent/wishes')
            setWishes(await res.json())
        } catch (_e) { console.error(_e) }
        finally { setWishesLoading(false) }
    }

    useEffect(() => { fetchItems(); fetchWishes() }, [])

    /* ── Item CRUD ─────────────────────────────────────────────────────── */
    const openAdd = () => {
        setEditingItem(null)
        setFormData({ name: '', description: '', costCoins: 10, iconUrl: '', stock: 1, deliveryDays: 1 })
        setShowItemModal(true)
    }

    const openEdit = (item: ShopItem) => {
        setEditingItem(item)
        setFormData({
            name: item.name,
            description: item.description || '',
            costCoins: item.costCoins,
            iconUrl: item.iconUrl || '',
            stock: item.stock,
            deliveryDays: item.deliveryDays || 1
        })
        setShowItemModal(true)
    }

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        setUploading(true)
        try {
            const fd = new FormData()
            fd.append('file', file)
            fd.append('type', 'IMAGE')
            const res = await fetch('/api/media/upload', { method: 'POST', body: fd })
            const data = await res.json()
            if (data.path) setFormData(prev => ({ ...prev, iconUrl: data.path }))
        } catch (_e) { console.error(_e) }
        finally { setUploading(false) }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        try {
            const method = editingItem ? 'PATCH' : 'POST'
            const body = editingItem ? { id: editingItem.id, ...formData } : formData
            const res = await fetch('/api/shop', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            })
            if (res.ok) { setShowItemModal(false); fetchItems() }
        } catch (_e) { console.error(_e) }
        finally { setSaving(false) }
    }

    const toggleActive = async (item: ShopItem) => {
        await fetch('/api/shop', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: item.id, isActive: !item.isActive })
        })
        fetchItems()
    }

    const handleDelete = async () => {
        if (!deleteTarget) return
        setDeleting(true)
        try {
            await fetch('/api/shop', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: deleteTarget.id })
            })
            setDeleteTarget(null)
            fetchItems()
        } catch (_e) { console.error(_e) }
        finally { setDeleting(false) }
    }

    /* ── Wish actions ──────────────────────────────────────────────────── */
    const wishAction = async (wishId: string, action: string, extra?: object) => {
        setWishBusy(wishId)
        try {
            await fetch('/api/parent/wishes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ wishId, action, ...extra })
            })
            fetchWishes()
            if (action === 'ADD_TO_SHOP') fetchItems()
        } catch (_e) { console.error(_e) }
        finally { setWishBusy(null) }
    }

    const pendingWishes = wishes.filter(w => w.status === 'PENDING')

    /* ── Render ────────────────────────────────────────────────────────── */
    if (loading) return (
        <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
        </div>
    )

    return (
        <div className="space-y-6">

            {/* ── Header bar ─────────────────────────────────────────────── */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                    <button
                        onClick={() => setView('ITEMS')}
                        className={`relative px-5 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${view === 'ITEMS'
                            ? 'bg-white text-slate-800 shadow-sm'
                            : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        <ShoppingBag className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
                        {t('shop.management.title')}
                    </button>
                    <button
                        onClick={() => setView('WISHES')}
                        className={`relative px-5 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${view === 'WISHES'
                            ? 'bg-white text-slate-800 shadow-sm'
                            : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        <Star className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
                        {t('shop.wishes.title')}
                        {pendingWishes.length > 0 && (
                            <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 bg-red-500 text-white text-[8px] rounded-full font-black">
                                {pendingWishes.length}
                            </span>
                        )}
                    </button>
                </div>

                {onOrdersClick && (
                    <button
                        onClick={onOrdersClick}
                        className="flex items-center gap-2 px-5 py-2.5 bg-orange-50 text-orange-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-orange-100 transition-all border border-orange-100 shadow-sm ml-auto mr-4"
                    >
                        <ShoppingBag className="w-4 h-4" />
                        {t('parent.orders.shop')}
                    </button>
                )}

                {view === 'ITEMS' && (
                    <button
                        onClick={openAdd}
                        className="flex items-center gap-2 px-5 py-2.5 bg-yellow-500 text-white rounded-xl hover:bg-yellow-600 active:scale-95 transition-all font-black shadow-lg shadow-yellow-200 text-sm"
                    >
                        <Plus className="w-4 h-4" />
                        {t('shop.management.add')}
                    </button>
                )}
            </div>

            {/* ── ITEMS tab ──────────────────────────────────────────────── */}
            {view === 'ITEMS' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {items.length === 0 && (
                        <div className="col-span-2 text-center py-16 bg-white rounded-xl border border-slate-100 text-slate-400 font-bold italic">
                            {t('parent.noOrders')}
                        </div>
                    )}
                    {items.map(item => (
                        <div
                            key={item.id}
                            className={`group relative bg-white rounded-xl border-2 transition-all duration-200 overflow-hidden
                                ${item.isActive
                                    ? 'border-slate-100 hover:border-yellow-200 hover:shadow-lg hover:shadow-yellow-900/5'
                                    : 'border-slate-100 bg-slate-50/60 opacity-70'}`}
                        >
                            {/* Status strip */}
                            <div className={`h-1 w-full ${item.isActive ? 'bg-green-400' : 'bg-slate-200'}`} />

                            <div className="p-5 flex gap-4">
                                {/* Image */}
                                <div className="w-20 h-20 rounded-xl bg-slate-50 overflow-hidden shrink-0 border border-slate-100 shadow-inner relative">
                                    {item.iconUrl?.startsWith('/') || item.iconUrl?.startsWith('http') ? (
                                        <Image src={item.iconUrl} alt={item.name} fill className="object-cover" />
                                    ) : item.iconUrl ? (
                                        <div className="w-full h-full flex items-center justify-center text-4xl">{item.iconUrl}</div>
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-200">
                                            <Package className="w-9 h-9" />
                                        </div>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2 mb-1">
                                        <h3 className="font-black text-slate-800 truncate">{item.name}</h3>
                                        <span className={`shrink-0 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${item.isActive ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
                                            {item.isActive ? t('shop.item.active') : t('shop.item.inactive')}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-400 mb-3 line-clamp-1">{item.description || '—'}</p>
                                    <div className="flex flex-wrap gap-2">
                                        <span className="px-2.5 py-1 bg-yellow-50 rounded-lg text-[10px] font-black text-yellow-700 border border-yellow-100/50 flex items-center gap-1">
                                            <Tag className="w-3 h-3" />{item.costCoins}
                                        </span>
                                        <span className="px-2.5 py-1 bg-blue-50 rounded-lg text-[10px] font-black text-blue-700 border border-blue-100/50 flex items-center gap-1">
                                            <Package className="w-3 h-3" />{item.stock === -1 ? '∞' : item.stock}
                                        </span>
                                        {item.deliveryDays && (
                                            <span className="px-2.5 py-1 bg-green-50 rounded-lg text-[10px] font-black text-green-700 border border-green-100/50 flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {item.deliveryDays === 1 ? t('shop.management.hours24') :
                                                    item.deliveryDays === 3 ? t('shop.management.days3') :
                                                        item.deliveryDays === 7 ? t('shop.management.days7') :
                                                            item.deliveryDays === 15 ? t('shop.management.days15') :
                                                                item.deliveryDays === 30 ? t('shop.management.days30') : `${item.deliveryDays}d`}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex flex-col gap-1.5 shrink-0">
                                    <button
                                        onClick={() => openEdit(item)}
                                        title={t('button.manage')}
                                        className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:text-yellow-500 hover:bg-yellow-50 transition-all border border-slate-100"
                                    >
                                        <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        onClick={() => toggleActive(item)}
                                        title={item.isActive ? t('shop.item.inactive') : t('shop.item.active')}
                                        className={`w-8 h-8 flex items-center justify-center rounded-xl transition-all border ${item.isActive
                                            ? 'bg-slate-50 text-slate-400 hover:text-slate-600 border-slate-100'
                                            : 'bg-green-500 text-white border-green-500 shadow-sm shadow-green-200'}`}
                                    >
                                        {item.isActive ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                    </button>
                                    <button
                                        onClick={() => setDeleteTarget(item)}
                                        title={t('button.delete')}
                                        className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-50 text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all border border-slate-100"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )
            }

            {/* ── WISHES tab ─────────────────────────────────────────────── */}
            {
                view === 'WISHES' && (
                    <div className="space-y-3">
                        {wishesLoading ? (
                            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-yellow-500" /></div>
                        ) : wishes.length === 0 ? (
                            <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-200 text-slate-400 font-bold">
                                {t('shop.wishes.noWishes')}
                            </div>
                        ) : (
                            wishes.map(wish => {
                                const isPending = wish.status === 'PENDING'
                                const isConfirmed = wish.status === 'CONFIRMED'
                                const isRejected = wish.status === 'REJECTED'
                                const isBusy = wishBusy === wish.id
                                const alreadyInShop = !!wish.addedToShopAt

                                return (
                                    <div key={wish.id} className={`bg-white rounded-xl border transition-all ${isPending ? 'border-amber-200 shadow-sm' : 'border-slate-100 opacity-70'}`}>
                                        <div className="p-5 flex items-center gap-4">
                                            {/* Wish image */}
                                            <div className="w-16 h-16 rounded-xl bg-slate-50 border border-slate-100 overflow-hidden shrink-0 flex items-center justify-center text-3xl relative">
                                                {wish.imageUrl?.startsWith('/') || wish.imageUrl?.startsWith('http') ? (
                                                    <Image src={wish.imageUrl} fill className="object-cover" alt={wish.name} />
                                                ) : wish.imageUrl ? wish.imageUrl : '🎁'}
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                                                    <h3 className="font-black text-slate-800">{wish.name}</h3>
                                                    {/* Status badge */}
                                                    {isPending && (
                                                        <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[9px] font-black rounded-full uppercase tracking-widest">{t('shop.wishes.pending')}</span>
                                                    )}
                                                    {isConfirmed && !alreadyInShop && (
                                                        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[9px] font-black rounded-full uppercase tracking-widest">{t('shop.wishes.confirmed')}</span>
                                                    )}
                                                    {isConfirmed && alreadyInShop && (
                                                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[9px] font-black rounded-full uppercase tracking-widest flex items-center gap-1">
                                                            <ShoppingBag className="w-2.5 h-2.5" />{t('shop.wishes.addedToShop')}
                                                        </span>
                                                    )}
                                                    {isRejected && (
                                                        <span className="px-2 py-0.5 bg-rose-100 text-rose-600 text-[9px] font-black rounded-full uppercase tracking-widest">{t('shop.wishes.rejected')}</span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-slate-400 mb-1.5 line-clamp-1">{wish.description || '—'}</p>
                                                <div className="flex items-center gap-2">
                                                    {wish.user.avatarUrl && (
                                                        <div className="relative w-4 h-4 rounded-full border border-slate-200 overflow-hidden">
                                                            <Image src={wish.user.avatarUrl} alt="" fill className="object-cover" />
                                                        </div>
                                                    )}
                                                    <span className="text-[10px] font-bold text-slate-400">{wish.user.name}</span>
                                                    <span className="text-[10px] text-slate-300">·</span>
                                                    <span className="text-[10px] text-slate-300">{new Date(wish.createdAt).toLocaleDateString()}</span>
                                                </div>
                                            </div>

                                            {/* Actions — only for PENDING */}
                                            {isPending && (
                                                <div className="flex items-center gap-2 shrink-0">
                                                    {/* CONFIRM (no shop) */}
                                                    <button
                                                        onClick={() => wishAction(wish.id, 'CONFIRM')}
                                                        disabled={isBusy}
                                                        className="flex items-center gap-1.5 px-3 py-2 bg-green-50 text-green-600 border border-green-100 rounded-xl text-[10px] font-black hover:bg-green-500 hover:text-white hover:border-green-500 transition-all active:scale-95 disabled:opacity-60"
                                                    >
                                                        <CheckCircle className="w-3.5 h-3.5" />
                                                        {t('shop.wishes.confirm')}
                                                    </button>

                                                    {/* ADD TO SHOP */}
                                                    <button
                                                        onClick={() => { setAddToShopWish(wish); setAddToShopCost(10) }}
                                                        disabled={isBusy || alreadyInShop}
                                                        title={alreadyInShop ? t('shop.wishes.alreadyAdded') : t('shop.wishes.addToShop')}
                                                        className="flex items-center gap-1.5 px-3 py-2 bg-yellow-500 text-white rounded-xl text-[10px] font-black hover:bg-yellow-600 transition-all active:scale-95 shadow-sm shadow-yellow-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        <ShoppingBag className="w-3.5 h-3.5" />
                                                        {t('shop.wishes.addToShop')}
                                                    </button>

                                                    {/* REJECT */}
                                                    <button
                                                        onClick={() => wishAction(wish.id, 'REJECT')}
                                                        disabled={isBusy}
                                                        title={t('shop.wishes.rejected')}
                                                        className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-50 text-slate-300 hover:text-rose-500 hover:bg-rose-50 border border-slate-100 transition-all disabled:opacity-60"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>
                )
            }

            {/* ── Item edit/add modal ─────────────────────────────────────── */}
            <AnimatePresence>
                {showItemModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setShowItemModal(false)}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white w-full max-w-xl rounded-xl shadow-2xl overflow-hidden relative max-h-[90dvh] flex flex-col"
                        >
                            <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar">
                                <div className="flex justify-between items-center mb-6">
                                    <div>
                                        <h3 className="text-xl font-black text-slate-800">
                                            {editingItem ? t('shop.management.edit') : t('shop.management.add')}
                                        </h3>
                                        <p className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-widest">{t('shop.management.productDetails')}</p>
                                    </div>
                                    <button onClick={() => setShowItemModal(false)}
                                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:bg-slate-100 transition-colors">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-5">
                                    <div className="flex gap-5 items-start">
                                        {/* Image upload */}
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="w-20 h-20 rounded-xl bg-slate-50 border-4 border-white shadow-lg overflow-hidden relative group">
                                                {uploading ? (
                                                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                                        <Loader2 className="w-6 h-6 animate-spin text-white" />
                                                    </div>
                                                ) : formData.iconUrl?.startsWith('/') || formData.iconUrl?.startsWith('http') ? (
                                                    <Image src={formData.iconUrl} fill alt="" className="object-cover" />
                                                ) : formData.iconUrl ? (
                                                    <div className="w-full h-full flex items-center justify-center text-3xl">{formData.iconUrl}</div>
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                        <Package className="w-9 h-9" />
                                                    </div>
                                                )}
                                                <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                                                    <Camera className="w-5 h-5 text-white" />
                                                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                                                </label>
                                            </div>
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t('shop.management.photo')}</span>
                                        </div>

                                        <div className="flex-1 space-y-3">
                                            <div className="space-y-1">
                                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">{t('shop.management.productName')}</label>
                                                <input
                                                    className="w-full h-10 px-4 bg-slate-50 rounded-xl border border-slate-200 focus:border-yellow-400 focus:ring-4 focus:ring-yellow-100 outline-none font-bold text-slate-800 transition-all text-sm"
                                                    value={formData.name}
                                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">{t('shop.management.unitPrice')}</label>
                                                <input
                                                    type="number" min="1"
                                                    className="w-full h-10 px-4 bg-slate-50 rounded-xl border border-slate-200 focus:border-yellow-400 focus:ring-4 focus:ring-yellow-100 outline-none font-bold text-slate-800 transition-all text-sm"
                                                    value={formData.costCoins}
                                                    onChange={e => setFormData({ ...formData, costCoins: parseInt(e.target.value) })}
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">{t('shop.management.stock')}</label>
                                            <input
                                                type="number" min="1" max="100"
                                                className="w-full h-10 px-4 bg-slate-50 rounded-xl border border-slate-200 focus:border-yellow-400 focus:ring-4 focus:ring-yellow-100 outline-none font-bold text-slate-800 transition-all text-sm"
                                                value={formData.stock}
                                                onChange={e => setFormData({ ...formData, stock: parseInt(e.target.value) })}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">{t('shop.management.delivery')}</label>
                                            <div className="relative">
                                                <select
                                                    className="w-full h-10 px-4 bg-slate-50 rounded-xl border border-slate-200 focus:border-yellow-400 focus:ring-4 focus:ring-yellow-100 outline-none font-bold text-slate-800 transition-all appearance-none cursor-pointer text-sm"
                                                    value={formData.deliveryDays}
                                                    onChange={e => setFormData({ ...formData, deliveryDays: parseInt(e.target.value) })}
                                                >
                                                    <option value={1}>{t('shop.management.hours24')}</option>
                                                    <option value={3}>{t('shop.management.days3')}</option>
                                                    <option value={7}>{t('shop.management.days7')}</option>
                                                    <option value={15}>{t('shop.management.days15')}</option>
                                                    <option value={30}>{t('shop.management.days30')}</option>
                                                </select>
                                                <Clock className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">{t('shop.management.description')}</label>
                                        <textarea
                                            className="w-full h-20 p-4 bg-slate-50 rounded-xl border border-slate-200 focus:border-yellow-400 focus:ring-4 focus:ring-yellow-100 outline-none font-bold text-slate-800 transition-all resize-none text-sm"
                                            value={formData.description}
                                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        />
                                    </div>

                                    <div className="flex gap-3 pt-2">
                                        <button type="button" onClick={() => setShowItemModal(false)}
                                            className="flex-1 h-11 bg-slate-100 rounded-xl font-black text-slate-500 hover:bg-slate-200 transition-all text-sm">
                                            {t('common.cancel')}
                                        </button>
                                        <button type="submit" disabled={saving}
                                            className="flex-[2] h-11 bg-yellow-500 text-white rounded-xl font-black text-sm hover:bg-yellow-600 shadow-lg shadow-yellow-200 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50">
                                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                            {editingItem ? t('common.confirm') : t('button.create')}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ── Delete confirm modal ────────────────────────────────────── */}
            <AnimatePresence>
                {deleteTarget && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center px-4">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setDeleteTarget(null)}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden relative"
                        >
                            <div className="p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center">
                                        <AlertCircle className="w-5 h-5 text-rose-500" />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-slate-800">{t('shop.item.deleteConfirm')}</h3>
                                        <p className="text-xs text-slate-400">{t('shop.item.deleteIrreversible')}</p>
                                    </div>
                                </div>
                                <p className="text-sm text-slate-600 mb-5">
                                    {t('shop.item.deleteDesc', { name: deleteTarget.name })}
                                </p>
                                <div className="flex gap-3">
                                    <button onClick={() => setDeleteTarget(null)}
                                        className="flex-1 h-11 bg-slate-100 rounded-xl font-black text-slate-500 hover:bg-slate-200 transition-all text-sm">
                                        {t('common.cancel')}
                                    </button>
                                    <button onClick={handleDelete} disabled={deleting}
                                        className="flex-[2] h-11 bg-rose-500 text-white rounded-xl font-black text-sm hover:bg-rose-600 shadow-lg shadow-rose-200 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-60">
                                        {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                        {t('button.delete')}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ── Add to shop modal (from wish) ──────────────────────────── */}
            <AnimatePresence>
                {addToShopWish && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center px-4">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setAddToShopWish(null)}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden relative"
                        >
                            <div className="p-6">
                                <h3 className="font-black text-slate-800 text-base mb-1">{t('shop.wishes.addToShopModal')}</h3>
                                <p className="text-sm text-slate-500 mb-5">
                                    {t('shop.wishes.addToShopDesc', { name: addToShopWish.name })}
                                </p>
                                <div className="space-y-1 mb-5">
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">{t('shop.wishes.coinCost')}</label>
                                    <input
                                        type="number" min="1"
                                        className="w-full h-12 px-5 bg-slate-50 rounded-xl border-2 border-slate-100 focus:border-yellow-400 outline-none font-black text-slate-800 text-2xl transition-all"
                                        value={addToShopCost}
                                        onChange={e => setAddToShopCost(parseInt(e.target.value))}
                                        autoFocus
                                    />
                                </div>
                                <div className="flex gap-3">
                                    <button onClick={() => setAddToShopWish(null)}
                                        className="flex-1 h-12 bg-slate-100 rounded-xl font-black text-slate-500 hover:bg-slate-200 transition-all text-sm">
                                        {t('common.cancel')}
                                    </button>
                                    <button
                                        onClick={async () => {
                                            await wishAction(addToShopWish.id, 'ADD_TO_SHOP', { costCoins: addToShopCost })
                                            setAddToShopWish(null)
                                        }}
                                        disabled={wishBusy === addToShopWish.id}
                                        className="flex-[2] h-12 bg-yellow-500 text-white rounded-xl font-black text-sm hover:bg-yellow-600 shadow-lg shadow-yellow-200 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-60">
                                        {wishBusy === addToShopWish.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShoppingBag className="w-4 h-4" />}
                                        {t('shop.wishes.confirmAdd')}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div >
    )
}
