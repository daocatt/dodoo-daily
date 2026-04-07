'use client'

import React, { useState, useEffect } from 'react'
import { ShoppingBag, Star, Plus, Package, Clock, Tag, Edit2, Trash2, Eye, EyeOff, CheckCircle, X, Loader2, Camera, User, Filter } from 'lucide-react'
import { clsx } from 'clsx'
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

export interface ShopManagementHandle {
    openAdd: () => void
    view: View
}

const ShopManagement = React.forwardRef<ShopManagementHandle, { 
    initialView?: View,
    hideTabs?: boolean,
    onOrdersClick?: () => void, 
    onViewChange?: (view: View) => void 
}>(({ initialView, hideTabs, _onOrdersClick, onViewChange }, ref) => {
    const { t } = useI18n()
    const [items, setItems] = useState<ShopItem[]>([])
    const [loading, setLoading] = useState(true)
    const [wishes, setWishes] = useState<Wish[]>([])
    const [wishesLoading, setWishesLoading] = useState(false)
    const [view, setView] = useState<View>(initialView || 'ITEMS')
    const [wishStatusFilter, setWishStatusFilter] = useState<'ALL' | 'PENDING' | 'CONFIRMED' | 'REJECTED'>('PENDING')

    React.useImperativeHandle(ref, () => ({
        openAdd,
        view
    }))

    useEffect(() => {
        onViewChange?.(view)
    }, [view, onViewChange])

    // Item form modal
    const [showItemModal, setShowItemModal] = useState(false)
    const [editingItem, setEditingItem] = useState<ShopItem | null>(null)
    const [_saving, setSaving] = useState(false)
    const [_uploading, setUploading] = useState(false)
    const [formData, setFormData] = useState({
        name: '', description: '', costCoins: 10, iconUrl: '', stock: 1, deliveryDays: 1, isActive: true
    })

    // Delete confirm modal
    const [deleteTarget, setDeleteTarget] = useState<ShopItem | null>(null)
    const [_deleting, setDeleting] = useState(false)

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
            deliveryDays: item.deliveryDays || 1,
            isActive: item.isActive
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
            {/* ── Baustein Logic Sector ───────────────────────────────────────── */}
            {!hideTabs && (
                <div className="flex flex-col md:flex-row items-center gap-4 justify-between w-full">
                    {/* View Toggles - Center/Left */}
                    <div className="flex items-center gap-2 bg-[#DADBD4] p-1 rounded-xl shadow-well hardware-well shrink-0 w-full md:w-auto">
                        <button
                            onClick={() => setView('ITEMS')}
                            className={clsx(
                                "relative px-6 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-[0.2em] transition-all flex-1 md:flex-initial flex items-center justify-center gap-2",
                                view === 'ITEMS'
                                    ? "bg-white text-slate-800 shadow-cap translate-y-[-1px]"
                                    : "text-slate-500 hover:text-slate-700 opacity-60"
                            )}
                        >
                            <ShoppingBag className="w-3.5 h-3.5" />
                            {t('shop.management.title')}
                        </button>
                        <button
                            onClick={() => setView('WISHES')}
                            className={clsx(
                                "relative px-6 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-[0.2em] transition-all flex-1 md:flex-initial flex items-center justify-center gap-2",
                                view === 'WISHES'
                                    ? "bg-white text-slate-800 shadow-cap translate-y-[-1px]"
                                    : "text-slate-500 hover:text-slate-700 opacity-60"
                            )}
                        >
                            <Star className="w-3.5 h-3.5" />
                            {t('shop.wishes.title')}
                            {pendingWishes.length > 0 && (
                                <span className="w-4 h-4 bg-rose-500 text-white text-[8px] rounded-full flex items-center justify-center font-black animate-pulse">
                                    {pendingWishes.length}
                                </span>
                            )}
                        </button>
                    </div>

                    {/* Left empty as buttons are now in Navbar actions */}
                    <div className="hidden md:flex items-center gap-3 md:w-auto" />
                </div>
            )}

            {/* ── ITEMS tab ──────────────────────────────────────────────── */}
            {view === 'ITEMS' && (
                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 md:gap-10">
                    {items.length === 0 && (
                        <div className="col-span-full py-24 hardware-well rounded-2xl bg-[#DADBD4] shadow-well flex flex-col items-center justify-center gap-3">
                            <ShoppingBag className="w-12 h-12 opacity-10" />
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] label-mono opacity-40">{t('parent.noOrders')}</span>
                        </div>
                    )}
                    {items.map(item => (
                        <motion.div
                            layout
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            key={item.id}
                            className={clsx(
                                "flex flex-col gap-4",
                                !item.isActive && "opacity-60 saturate-50"
                            )}
                        >
                            {/* Reward Housing */}
                            <div className="hardware-well p-2 rounded-2xl bg-[#DADBD4] shadow-well relative group">
                                <div className="aspect-square bg-slate-100 rounded-2xl overflow-hidden relative border-2 border-white/40 shadow-sm transition-all group-hover:scale-[0.98]">
                                    {item.iconUrl?.startsWith('/') || item.iconUrl?.startsWith('http') ? (
                                        <Image src={item.iconUrl} alt={item.name} fill className="object-cover transition-transform duration-1000 group-hover:scale-110" />
                                    ) : item.iconUrl ? (
                                        <div className="w-full h-full flex items-center justify-center text-5xl bg-slate-50 transition-transform duration-700 group-hover:scale-125">{item.iconUrl}</div>
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-200 bg-slate-50">
                                            <Package className="w-12 h-12" />
                                        </div>
                                    )}

                                    {/* Status Badge - Industrial Overlay */}
                                    <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/40 backdrop-blur-md rounded-md px-2 py-1 border border-white/10 shadow-lg">
                                        <div className={clsx("w-1.5 h-1.5 rounded-full animate-pulse shadow-[0_0_8px_rgba(255,255,255,0.5)]", item.isActive ? 'bg-emerald-400' : 'bg-slate-400')} />
                                        <span className="text-[7px] font-black text-white uppercase tracking-[0.2em] label-mono">{item.isActive ? t('shop.item.active') : t('shop.item.inactive')}</span>
                                    </div>

                                    {/* Unit Telemetry Overlay */}
                                    <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                                        <div className="flex items-center gap-1.5 bg-white shadow-soft rounded-lg px-2 py-1 border border-black/5">
                                            <Tag className="w-2.5 h-2.5 text-amber-500" />
                                            <span className="text-[9px] font-black text-slate-800 label-mono">{item.costCoins}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 bg-slate-900 text-white shadow-soft rounded-lg px-2 py-1 border border-white/10">
                                            <Package className="w-2.5 h-2.5 text-blue-400" />
                                            <span className="text-[9px] font-black label-mono">{item.stock === -1 ? '∞' : item.stock}</span>
                                        </div>
                                    </div>
                                </div>
                                {/* Physical Stand Decoration */}
                                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-[80%] h-3 bg-gradient-to-b from-[#C8C4B0] to-[#A09D8B] rounded-full z-[-1] shadow-lg opacity-60" />
                            </div>

                            {/* Information Matrix */}
                            <div className="flex flex-col gap-1 px-1">
                                <div className="flex items-start justify-between gap-1 group-item">
                                    <h3 className="text-[11px] font-black text-slate-800 uppercase italic tracking-tight line-clamp-1 break-all flex-1 label-mono py-0.5">{item.name}</h3>
                                </div>

                                <div className="flex items-center justify-between mt-1 pb-1 border-t border-black/[0.03] pt-1.5">
                                    <div className="flex items-center gap-1.5 min-w-0">
                                        <Clock className="w-2.5 h-2.5 text-slate-400" />
                                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest label-mono truncate">
                                            {item.deliveryDays === 1 ? t('shop.management.hours24') : `${item.deliveryDays}d Delivery`}
                                        </span>
                                    </div>
                                </div>

                                {/* Action Module - Consolidated High Density Triggers */}
                                <div className="flex gap-1.5">
                                    <button
                                        onClick={() => openEdit(item)}
                                        className="hardware-btn group flex-1"
                                    >
                                        <div className="hardware-well h-9 rounded-xl bg-[#DADBD4] shadow-well flex items-center justify-center active:translate-y-0.5 transition-all relative overflow-hidden">
                                            <div className="hardware-cap absolute inset-0.5 bg-white lg:group-hover:bg-amber-500 rounded-lg shadow-cap transition-colors flex items-center justify-center gap-1.5">
                                                <Edit2 className="w-3.5 h-3.5 text-slate-600 lg:group-hover:text-white transition-colors" />
                                                <span className="text-[8px] font-black uppercase tracking-tighter text-slate-400 lg:group-hover:text-white label-mono transition-colors">{t('button.edit')}</span>
                                            </div>
                                        </div>
                                    </button>
                                    <button
                                        onClick={() => toggleActive(item)}
                                        className="hardware-btn group flex-1"
                                    >
                                        <div className="hardware-well h-9 rounded-xl bg-[#DADBD4] shadow-well flex items-center justify-center active:translate-y-0.5 transition-all relative overflow-hidden">
                                            <div className="hardware-cap absolute inset-0.5 bg-white lg:group-hover:bg-slate-900 rounded-lg shadow-cap transition-colors flex items-center justify-center gap-1.5">
                                                {item.isActive ? <EyeOff className="w-3.5 h-3.5 text-slate-600 lg:group-hover:text-white transition-colors" /> : <Eye className="w-3.5 h-3.5 text-slate-600 lg:group-hover:text-white transition-colors" />}
                                                <span className="text-[8px] font-black uppercase tracking-tighter text-slate-400 lg:group-hover:text-white label-mono transition-colors">{item.isActive ? 'Hide' : 'Show'}</span>
                                            </div>
                                        </div>
                                    </button>
                                    <button
                                        onClick={() => setDeleteTarget(item)}
                                        className="hardware-btn group flex-1"
                                    >
                                        <div className="hardware-well h-9 rounded-xl bg-[#DADBD4] shadow-well flex items-center justify-center active:translate-y-0.5 transition-all relative overflow-hidden">
                                            <div className="hardware-cap absolute inset-0.5 bg-white lg:group-hover:bg-rose-500 rounded-lg shadow-cap transition-colors flex items-center justify-center gap-1.5">
                                                <Trash2 className="w-3.5 h-3.5 text-slate-600 lg:group-hover:text-white transition-colors" />
                                                <span className="text-[8px] font-black uppercase tracking-tighter text-slate-400 lg:group-hover:text-white label-mono transition-colors">{t('button.delete')}</span>
                                            </div>
                                        </div>
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* ── WISHES tab ─────────────────────────────────────────────── */}
            {view === 'WISHES' && (
                <div className="space-y-6">
                    {/* Status Filter HUD */}
                    <div className="flex flex-col md:flex-row items-center gap-4 justify-between w-full">
                        <div className="flex items-center gap-2 bg-[#DADBD4] p-1 rounded-xl shadow-well hardware-well shrink-0 w-full md:w-auto">
                            {[
                                { id: 'ALL', label: t('common.all') },
                                { id: 'PENDING', label: t('shop.wishes.pending') },
                                { id: 'CONFIRMED', label: t('shop.wishes.confirmed') },
                                { id: 'REJECTED', label: t('shop.wishes.rejected') }
                            ].map(filter => (
                                <button
                                    key={filter.id}
                                    onClick={() => setWishStatusFilter(filter.id as 'ALL' | 'PENDING' | 'CONFIRMED' | 'REJECTED')}
                                    className={clsx(
                                        "relative px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-[0.1em] transition-all flex-1 md:flex-initial flex items-center justify-center gap-2",
                                        wishStatusFilter === filter.id
                                            ? "bg-white text-slate-800 shadow-cap translate-y-[-1px]"
                                            : "text-slate-500 hover:text-slate-700 opacity-60"
                                    )}
                                >
                                    {filter.label}
                                    {filter.id === 'PENDING' && pendingWishes.length > 0 && (
                                        <span className="w-4 h-4 bg-rose-500 text-white text-[8px] rounded-full flex items-center justify-center font-black">
                                            {pendingWishes.length}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 bg-white/40 rounded-xl border border-white/60 shadow-inner-warm">
                            <Filter className="w-3.5 h-3.5 text-slate-400" />
                            <span className="text-[10px] font-black text-slate-500 label-mono uppercase tracking-widest">{t('parent.wishes')} Count: {wishes.filter(w => wishStatusFilter === 'ALL' || w.status === wishStatusFilter).length}</span>
                        </div>
                    </div>

                    {wishesLoading ? (
                        <div className="flex justify-center py-24 hardware-well rounded-2xl bg-[#DADBD4] shadow-well">
                            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
                        </div>
                    ) : wishes.filter(w => wishStatusFilter === 'ALL' || w.status === wishStatusFilter).length === 0 ? (
                        <div className="py-24 hardware-well rounded-2xl bg-[#B8B9B0]/20 shadow-well flex flex-col items-center justify-center gap-3">
                            <Star className="w-12 h-12 opacity-10" />
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] label-mono opacity-40">{t('shop.wishes.noWishes')}</span>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {wishes
                                .filter(w => wishStatusFilter === 'ALL' || w.status === wishStatusFilter)
                                .map(wish => {
                                const isPending = wish.status === 'PENDING'
                                const isConfirmed = wish.status === 'CONFIRMED'
                                const isRejected = wish.status === 'REJECTED'
                                const isBusy = wishBusy === wish.id
                                const alreadyInShop = !!wish.addedToShopAt

                                return (
                                    <div key={wish.id} className={clsx(
                                        "relative flex flex-col transition-all duration-300 overflow-hidden",
                                        "bg-[#FEFBEA] rounded-[24px] shadow-cap border border-white/60 p-0.5",
                                        !isPending && "opacity-80 grayscale-[0.3] bg-slate-50/50"
                                    )}>
                                        <div className="absolute inset-x-0 top-0 h-px bg-white/40 z-10" />
                                        
                                        {/* TOP CAP - Applicant Header - Clean Flat Style */}
                                        <div className="px-5 py-3 bg-black/[0.02] border-b border-black/[0.03] flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-7 h-7 rounded-full overflow-hidden border-2 border-white shadow-soft bg-white flex items-center justify-center relative">
                                                    {wish.user.avatarUrl ? (
                                                        <Image src={wish.user.avatarUrl} alt="" width={28} height={28} className="object-cover" />
                                                    ) : <User className="w-4 h-4 text-slate-300" />}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-black text-indigo-700 uppercase tracking-[0.1em] label-mono italic leading-none drop-shadow-sm">
                                                        {wish.user.nickname || wish.user.name}
                                                    </span>
                                                    <span className="text-[7px] font-bold text-slate-400 label-mono uppercase tracking-widest mt-0.5 opacity-60">Applicant ID: #{wish.user.id.slice(-4)}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 py-1 px-2.5 rounded-lg bg-white/60 border border-white/80 shadow-inner-warm">
                                                <Clock className="w-2.5 h-2.5 text-slate-400" />
                                                <span className="text-[8px] font-black text-slate-500 label-mono uppercase tracking-[0.2em]">{new Date(wish.createdAt).toLocaleDateString()}</span>
                                            </div>
                                        </div>

                                        <div className="p-5 flex gap-6">
                                            {/* Wish image - Natural Display */}
                                            <div className="w-24 h-24 rounded-2xl bg-white shadow-modular shrink-0 flex items-center justify-center relative overflow-hidden group ring-4 ring-black/[0.02]">
                                                {wish.imageUrl?.startsWith('/') || wish.imageUrl?.startsWith('http') ? (
                                                    <Image src={wish.imageUrl} fill className="object-cover group-hover:scale-105 transition-transform duration-700" alt={wish.name} />
                                                ) : <span className="text-4xl drop-shadow-sm">{wish.imageUrl ? wish.imageUrl : '🎁'}</span>}
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </div>

                                            {/* Info Matrix - Premium Typography */}
                                            <div className="flex-1 min-w-0 flex flex-col justify-center gap-2">
                                                <div className="flex items-center gap-2.5 flex-wrap">
                                                    <h3 className="text-sm font-black text-slate-800 uppercase italic tracking-tight label-mono leading-none border-b-2 border-amber-400/20 pb-0.5">{wish.name}</h3>
                                                    {/* Status badge - Elevated Pill */}
                                                    {isPending && (
                                                        <span className="px-3 py-1 bg-amber-400 text-white shadow-soft text-[7px] font-black rounded-full uppercase tracking-widest">{t('shop.wishes.pending')}</span>
                                                    )}
                                                    {isConfirmed && (
                                                        <span className={clsx(
                                                            "px-3 py-1 text-[7px] font-black rounded-full uppercase tracking-widest shadow-soft",
                                                            alreadyInShop ? "bg-indigo-500 text-white" : "bg-emerald-500 text-white"
                                                        )}>
                                                            {alreadyInShop ? t('shop.wishes.addedToShop') : t('shop.wishes.confirmed')}
                                                        </span>
                                                    )}
                                                    {isRejected && (
                                                        <span className="px-3 py-1 bg-rose-500 text-white shadow-soft text-[7px] font-black rounded-full uppercase tracking-widest">{t('shop.wishes.rejected')}</span>
                                                    )}
                                                </div>
                                                
                                                {wish.description ? (
                                                    <p className="text-[11px] text-slate-500 font-bold uppercase tracking-tight line-clamp-2 opacity-80 leading-relaxed pr-6 italic">
                                                    &quot;{wish.description}&quot;
                                                    </p>
                                                ) : (
                                                    <p className="text-[10px] text-slate-300 font-bold uppercase label-mono italic">No description provided...</p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Action Module — Floating Toolbelt */}
                                        {isPending && (
                                            <div className="flex gap-3 p-5 pt-0">
                                                {/* CONFIRM */}
                                                <button
                                                    onClick={() => wishAction(wish.id, 'CONFIRM')}
                                                    disabled={isBusy}
                                                    className="hardware-btn group flex-1"
                                                >
                                                    <div className="hardware-well h-10 rounded-xl bg-[#EBE7D9] shadow-well flex items-center justify-center active:translate-y-0.5 transition-all relative overflow-hidden">
                                                        <div className="hardware-cap absolute inset-0.5 bg-white lg:group-hover:bg-emerald-500 rounded-lg shadow-cap transition-all flex items-center justify-center gap-2">
                                                            <CheckCircle className="w-4 h-4 text-emerald-500 lg:group-hover:text-white transition-colors" />
                                                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-600 lg:group-hover:text-white label-mono transition-colors">{t('shop.wishes.confirm')}</span>
                                                        </div>
                                                    </div>
                                                </button>

                                                {/* ADD TO SHOP */}
                                                <button
                                                    onClick={() => { setAddToShopWish(wish); setAddToShopCost(10) }}
                                                    disabled={isBusy || alreadyInShop}
                                                    className="hardware-btn group flex-1"
                                                >
                                                    <div className="hardware-well h-10 rounded-xl bg-[#EBE7D9] shadow-well flex items-center justify-center active:translate-y-0.5 transition-all relative overflow-hidden">
                                                        <div className="hardware-cap absolute inset-0.5 bg-amber-500 rounded-lg shadow-cap flex items-center justify-center gap-2">
                                                            <Plus className="w-4 h-4 text-white" />
                                                            <span className="text-[9px] font-black uppercase tracking-widest text-white label-mono">{t('shop.wishes.addToShop')}</span>
                                                        </div>
                                                    </div>
                                                </button>

                                                {/* REJECT */}
                                                <button
                                                    onClick={() => wishAction(wish.id, 'REJECT')}
                                                    disabled={isBusy}
                                                    className="hardware-btn group"
                                                >
                                                    <div className="hardware-well w-10 h-10 rounded-xl bg-[#EBE7D9] shadow-well flex items-center justify-center active:translate-y-0.5 transition-all relative overflow-hidden">
                                                        <div className="hardware-cap absolute inset-0.5 bg-white lg:group-hover:bg-rose-500 rounded-lg shadow-cap transition-all flex items-center justify-center">
                                                            <X className="w-4 h-4 text-rose-500 lg:group-hover:text-white transition-colors" />
                                                        </div>
                                                    </div>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* ── Item edit/add modal ─────────────────────────────────────── */}
            <AnimatePresence>
                {showItemModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            className="w-full max-w-sm baustein-panel shadow-2xl relative overflow-hidden bg-[#E6E2D1] border-4 border-white/20 flex flex-col max-h-[95dvh]"
                        >
                            {/* Panel Texture & Screws */}
                            <div className="absolute top-3 left-3 w-2 h-2 rounded-full bg-slate-900/10 shadow-inner" />
                            <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-slate-900/10 shadow-inner" />
                            <div className="absolute bottom-3 left-3 w-2 h-2 rounded-full bg-slate-900/10 shadow-inner" />
                            <div className="absolute bottom-3 right-3 w-2 h-2 rounded-full bg-slate-900/10 shadow-inner" />

                            <div className="p-6 md:p-8 flex flex-col h-full">
                                <div className="flex justify-between items-center mb-3 border-b-2 border-black/5 pb-2">
                                    <h3 className="text-sm font-black text-slate-900 tracking-tight uppercase flex items-center gap-2">
                                        <div className="hardware-well w-6 h-6 rounded-md bg-[#DADBD4] shadow-well relative overflow-hidden">
                                            <div className="hardware-cap absolute inset-0.5 bg-amber-500 rounded-sm flex items-center justify-center shadow-cap">
                                                {editingItem ? <Edit2 className="w-2.5 h-2.5 text-white" /> : <Plus className="w-2.5 h-2.5 text-white" />}
                                            </div>
                                        </div>
                                        <span className="leading-none">{editingItem ? t('shop.management.editHud') : t('shop.management.addHud')}</span>
                                    </h3>
                                    <button 
                                        type="button" 
                                        onClick={() => setShowItemModal(false)} 
                                        className="hardware-btn group"
                                    >
                                        <div className="hardware-well w-8 h-8 rounded-lg bg-[#DADBD4] shadow-well active:translate-y-0.5 flex items-center justify-center relative overflow-hidden">
                                            <div className="hardware-cap absolute inset-0.5 bg-white rounded-md flex items-center justify-center transition-all group-hover:bg-slate-50 active:translate-y-0.5">
                                                <X className="w-4 h-4 text-slate-400" />
                                            </div>
                                        </div>
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto custom-scrollbar -mr-2 pr-2">
                                    <form id="reward-form" onSubmit={handleSubmit} className="space-y-2">
                                        <div className="flex flex-col gap-2">
                                            {/* Minimal Image Asset Row - Image Left side */}
                                            <div className="flex items-center gap-3 px-1 py-1">
                                                <div className="hardware-well p-1 rounded-lg bg-[#D4D6CB] shadow-well w-14 h-14 relative flex-shrink-0">
                                                    <div className="w-full h-full bg-white rounded-md overflow-hidden relative group border border-white shadow-soft">
                                                        {uploading ? (
                                                            <div className="absolute inset-0 bg-black/5 flex items-center justify-center z-10">
                                                                <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                                                            </div>
                                                        ) : formData.iconUrl?.startsWith('/') || formData.iconUrl?.startsWith('http') ? (
                                                            <Image src={formData.iconUrl} fill alt="" className="object-cover" />
                                                        ) : formData.iconUrl ? (
                                                            <div className="w-full h-full flex items-center justify-center text-xl bg-slate-50">{formData.iconUrl}</div>
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-slate-200 bg-slate-50 italic font-black text-[7px] label-mono">EMPTY</div>
                                                        )}
                                                        <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity backdrop-blur-[2px]">
                                                            <Camera className="w-3.5 h-3.5 text-white" />
                                                            <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                                                        </label>
                                                    </div>
                                                </div>
                                                <label className="text-[10px] font-black text-slate-700 uppercase tracking-tight label-mono">{t('shop.management.photo')}</label>
                                            </div>

                                            {/* Name Row */}
                                            <div className="space-y-0.5">
                                                <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest label-mono px-1">{t('shop.management.productName')}</label>
                                                <div className="hardware-well rounded-md bg-[#D4D6CB]/30 shadow-well border border-black/5 p-0.5">
                                                    <input
                                                        className="w-full bg-white rounded-sm p-1.5 px-2 font-bold text-slate-800 text-xs outline-none shadow-cap"
                                                        value={formData.name}
                                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                                        placeholder={t('shop.management.inputValueHere')}
                                                        required
                                                    />
                                                </div>
                                            </div>
                                            
                                            {/* Compact Metrics Row [Price | Stock] */}
                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="space-y-0.5">
                                                    <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest label-mono px-1">{t('shop.management.unitPrice')} (CC)</label>
                                                    <div className="hardware-well rounded-md bg-[#D4D6CB]/30 shadow-well border border-black/5 p-0.5">
                                                        <input
                                                            type="number" min="0"
                                                            className="w-full bg-white rounded-sm p-1.5 px-2 font-bold text-slate-800 text-xs outline-none shadow-cap"
                                                            value={formData.costCoins}
                                                            onChange={e => setFormData({ ...formData, costCoins: parseInt(e.target.value) })}
                                                            required
                                                        />
                                                    </div>
                                                </div>
                                                <div className="space-y-0.5">
                                                    <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest label-mono px-1">{t('shop.management.stock')}</label>
                                                    <div className="hardware-well rounded-md bg-[#D4D6CB]/30 shadow-well border border-black/5 p-0.5">
                                                        <input
                                                            type="number" min="0" max="999"
                                                            className="w-full bg-white rounded-sm p-1.5 px-2 font-bold text-slate-800 text-xs outline-none shadow-cap"
                                                            value={formData.stock}
                                                            onChange={e => setFormData({ ...formData, stock: parseInt(e.target.value) })}
                                                            required
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Row - [Delivery | Status] */}
                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="space-y-0.5">
                                                    <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest label-mono px-1">{t('shop.management.delivery')}</label>
                                                    <div className="hardware-well rounded-md bg-[#D4D6CB]/30 shadow-well border border-black/5 p-0.5">
                                                        <select
                                                            className="w-full bg-white rounded-sm p-1.5 px-2 font-bold text-slate-800 text-xs outline-none shadow-cap appearance-none cursor-pointer"
                                                            value={formData.deliveryDays}
                                                            onChange={e => setFormData({ ...formData, deliveryDays: parseInt(e.target.value) })}
                                                        >
                                                            <option value={1}>{t('shop.management.hours24')}</option>
                                                            <option value={3}>{t('shop.management.days3')}</option>
                                                            <option value={7}>{t('shop.management.days7')}</option>
                                                            <option value={15}>{t('shop.management.days15')}</option>
                                                            <option value={30}>{t('shop.management.days30')}</option>
                                                        </select>
                                                    </div>
                                                </div>
                                                <div className="space-y-0.5 flex flex-col justify-end">
                                                    <div 
                                                        onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                                                        className="h-8 rounded-md p-0.5 cursor-pointer flex items-center px-1"
                                                    >
                                                        <div className={clsx(
                                                            "w-8 h-4 rounded-full transition-all relative border border-black/10",
                                                            formData.isActive ? "bg-emerald-500 shadow-inner shadow-black/20" : "bg-slate-300"
                                                        )}>
                                                            <div className={clsx(
                                                                "absolute top-0.5 bottom-0.5 w-3 rounded-full bg-white shadow-sm transition-all",
                                                                formData.isActive ? "left-[16px]" : "left-0.5"
                                                            )} />
                                                        </div>
                                                        <span className="text-[9px] font-black ml-2 text-slate-600 label-mono uppercase">{t('shop.item.active')}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Description Row (Simplified Height) */}
                                            <div className="space-y-0.5">
                                                <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest label-mono px-1">{t('shop.management.description')}</label>
                                                <div className="hardware-well rounded-md bg-[#D4D6CB]/30 shadow-well border border-black/5 p-0.5">
                                                    <textarea
                                                        className="w-full bg-white rounded-sm p-2 min-h-[50px] font-bold text-slate-800 text-[10px] outline-none shadow-cap resize-none"
                                                        value={formData.description}
                                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                                        placeholder={t('shop.management.enterProdDescHere')}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </form>
                                </div>

                                <div className="mt-2">
                                    <button
                                        type="submit"
                                        form="reward-form"
                                        disabled={loading}
                                        className="hardware-btn group w-full"
                                    >
                                        <div className="hardware-well h-11 rounded-lg bg-[#D4D6CB] shadow-well active:translate-y-0.5 flex items-center justify-center transition-all relative overflow-hidden">
                                            <div className="hardware-cap absolute inset-0.5 bg-amber-500 rounded-md shadow-cap" />
                                            <div className="relative z-10 flex items-center gap-2">
                                                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin text-white" /> : <CheckCircle className="w-3.5 h-3.5 text-white" />}
                                                <span className="text-[10px] font-black uppercase tracking-widest text-white leading-none">
                                                    {loading ? t('shop.management.processingData') : t('shop.management.executeSave')}
                                                </span>
                                            </div>
                                        </div>
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
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
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="hardware-well p-1 rounded-3xl bg-[#DADBD4] shadow-well relative w-full max-w-sm"
                        >
                            <div className="bg-white rounded-[1.4rem] shadow-cap p-8 flex flex-col items-center text-center">
                                <div className="hardware-well w-16 h-16 rounded-2xl bg-[#DADBD4] shadow-well flex items-center justify-center mb-6">
                                    <div className="hardware-cap absolute inset-1 bg-rose-50 rounded-xl shadow-cap flex items-center justify-center">
                                        <Trash2 className="w-8 h-8 text-rose-500 animate-pulse" />
                                    </div>
                                </div>
                                <h3 className="text-sm font-black text-slate-800 uppercase italic tracking-tighter label-mono mb-2">{t('common.deleteConfirm')}</h3>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest label-mono mb-8 opacity-60">
                                    {deleteTarget.name}
                                </p>
                                <div className="flex gap-4 w-full">
                                    <button onClick={() => setDeleteTarget(null)}
                                        className="hardware-btn group flex-1"
                                    >
                                        <div className="hardware-well h-12 rounded-xl bg-[#DADBD4] shadow-well flex items-center justify-center active:translate-y-0.5 transition-all">
                                            <div className="hardware-cap absolute inset-1 bg-white lg:group-hover:bg-slate-100 rounded-lg shadow-cap flex items-center justify-center">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 label-mono">{t('common.cancel')}</span>
                                            </div>
                                        </div>
                                    </button>
                                    <button
                                        onClick={handleDelete}
                                        disabled={loading}
                                        className="hardware-btn group flex-1"
                                    >
                                        <div className="hardware-well h-12 rounded-xl bg-[#DADBD4] shadow-well flex items-center justify-center active:translate-y-0.5 transition-all">
                                            <div className="hardware-cap absolute inset-1 bg-rose-500 rounded-lg shadow-cap flex items-center justify-center gap-2">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-white label-mono">{t('button.delete')}</span>
                                            </div>
                                        </div>
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
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="hardware-well p-1 rounded-3xl bg-[#DADBD4] shadow-well relative w-full max-w-md"
                        >
                            <div className="bg-white rounded-[1.4rem] shadow-cap p-8">
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="hardware-well p-1 rounded-xl bg-[#DADBD4] shadow-well w-16 h-16 shrink-0">
                                        <div className="w-full h-full bg-slate-50 rounded-lg overflow-hidden flex items-center justify-center text-3xl border border-black/5 relative">
                                            {addToShopWish.imageUrl?.startsWith('/') || addToShopWish.imageUrl?.startsWith('http') ? (
                                                <Image src={addToShopWish.imageUrl} fill className="object-cover" alt="" />
                                            ) : addToShopWish.imageUrl ? addToShopWish.imageUrl : '🎁'}
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-black text-slate-800 uppercase italic tracking-tighter label-mono">{t('shop.wishes.addToShop')}</h3>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest label-mono opacity-60 truncate max-w-[200px]">{addToShopWish.name}</p>
                                    </div>
                                </div>

                                <div className="space-y-4 mb-8">
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] label-mono px-1">{t('shop.management.unitPrice')}</label>
                                        <div className="hardware-well p-0.5 rounded-xl shadow-well bg-[#DADBD4] relative">
                                            <input
                                                type="number" min="1"
                                                className="w-full h-12 px-4 bg-white rounded-lg border-2 border-transparent focus:border-yellow-400 outline-none font-black text-slate-800 transition-all text-sm label-mono"
                                                value={addToShopCost}
                                                onChange={e => setAddToShopCost(parseInt(e.target.value))}
                                                autoFocus
                                            />
                                            <Tag className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500" />
                                        </div>
                                    </div>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase italic px-1 opacity-60">{t('shop.management.productDetails')}: 1x {addToShopWish.name} will be added to reward store inventory.</p>
                                </div>

                                <div className="flex gap-4">
                                    <button onClick={() => setAddToShopWish(null)}
                                        className="hardware-btn group flex-1"
                                    >
                                        <div className="hardware-well h-12 rounded-xl bg-[#DADBD4] shadow-well flex items-center justify-center active:translate-y-0.5 transition-all">
                                            <div className="hardware-cap absolute inset-1 bg-white lg:group-hover:bg-slate-100 rounded-lg shadow-cap flex items-center justify-center">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 label-mono">{t('common.cancel')}</span>
                                            </div>
                                        </div>
                                    </button>
                                    <button
                                        onClick={async () => {
                                            await wishAction(addToShopWish.id, 'ADD_TO_SHOP', { costCoins: addToShopCost })
                                            setAddToShopWish(null)
                                        }}
                                        disabled={wishBusy === addToShopWish.id}
                                        className="hardware-btn group flex-[2]"
                                    >
                                        <div className="hardware-well h-12 rounded-xl bg-[#DADBD4] shadow-well flex items-center justify-center active:translate-y-0.5 transition-all">
                                            <div className="hardware-cap absolute inset-1 bg-yellow-500 rounded-lg shadow-cap flex items-center justify-center gap-2">
                                                {wishBusy === addToShopWish.id ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <CheckCircle className="w-4 h-4 text-white" />}
                                                <span className="text-[10px] font-black uppercase tracking-widest text-white label-mono">{t('shop.wishes.confirmAdd')}</span>
                                            </div>
                                        </div>
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
})

ShopManagement.displayName = 'ShopManagement'

export default ShopManagement
