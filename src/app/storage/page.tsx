'use client'

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { 
  Plus, 
  Search, 
  Package, 
  Trash, 
  Edit3, 
  ChevronLeft, 
  Camera,
  Download,
  X,
  ChevronRight,
  Filter,
  Check,
  CalendarDays
} from 'lucide-react'
import Link from 'next/link'
import AnimatedSky from '@/components/AnimatedSky'
import { useI18n } from '@/contexts/I18nContext'
import SmartDatePicker from '@/components/SmartDatePicker'

type StorageItem = {
    id: string
    name: string
    imageUrl: string
    tags: string // JSON string
    notes?: string
    purchasePrice: number
    resalePrice: number
    purchaseDate: string | null
    isForSale: boolean
    isSynced: boolean
    isTransferred?: boolean
    actualSalePrice?: number | null
    createdAt: string
    updatedAt: string
}

const PRESET_TAGS = ['家电', '玩具', '书籍', '衣物', '卫生', '工具', '杂物']

export default function StoragePage() {
    const [items, setItems] = useState<StorageItem[]>([])
    const [loading, setLoading] = useState(true)
    const [hasMore, setHasMore] = useState(true)
    const [page, setPage] = useState(1)
    const [search, setSearch] = useState('')
    const [selectedTag, setSelectedTag] = useState<string | null>(null)
    const [isParent, setIsParent] = useState(false)
    
    // UI state
    const [showItemModal, setShowItemModal] = useState(false)
    const [editingItem, setEditingItem] = useState<StorageItem | null>(null)
    const [activeLightboxIndex, setActiveLightboxIndex] = useState<number | null>(null)

    const { t } = useI18n()

    // Fetch user and stats
    useEffect(() => {
        fetch('/api/stats')
            .then(res => res.json())
            .then(data => {
                setIsParent(data.isParent)
                setUser(data)
            })
        fetchInitialItems()
    }, [])

    const fetchInitialItems = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/storage?page=1&limit=20')
            const data = await res.json()
            setItems(data)
            setHasMore(data.length === 20)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const fetchMore = async () => {
        if (!hasMore || loading) return
        setLoading(true)
        const nextPage = page + 1
        try {
            const tagParam = selectedTag ? `&tag=${selectedTag}` : ''
            const searchParam = search ? `&search=${search}` : ''
            const res = await fetch(`/api/storage?page=${nextPage}&limit=20${tagParam}${searchParam}`)
            const data = await res.json()
            if (data.length > 0) {
                setItems(prev => [...prev, ...data])
                setPage(nextPage)
                setHasMore(data.length === 20)
            } else {
                setHasMore(false)
            }
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault()
        setPage(1)
        setLoading(true)
        try {
            const tagParam = selectedTag ? `&tag=${selectedTag}` : ''
            const res = await fetch(`/api/storage?search=${search}${tagParam}&page=1&limit=20`)
            const data = await res.json()
            setItems(data)
            setHasMore(data.length === 20)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const handleToggleTag = async (tag: string) => {
        const newTag = selectedTag === tag ? null : tag
        setSelectedTag(newTag)
        setPage(1)
        setLoading(true)
        try {
            const tagParam = newTag ? `&tag=${newTag}` : ''
            const searchParam = search ? `&search=${search}` : ''
            const res = await fetch(`/api/storage?page=1&limit=20${tagParam}${searchParam}`)
            const data = await res.json()
            setItems(data)
            setHasMore(data.length === 20)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-dvh flex flex-col relative overflow-hidden bg-[#e0f2fe] text-[#2c2416]">
            <AnimatedSky />

            <header className="relative z-10 flex flex-col px-6 py-4 md:px-10 md:py-6 backdrop-blur-md bg-white/40 border-b border-white/50 shadow-sm gap-4">
                <div className="flex justify-between items-center w-full">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-2xl bg-white/40 hover:bg-white/60 transition-colors shadow-sm text-slate-800 border border-slate-200">
                            <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
                        </Link>
                        <span className="font-black text-lg md:text-2xl tracking-tight text-slate-800 flex items-center gap-2 truncate">
                            <Package className="w-5 h-5 md:w-6 md:h-6 text-amber-600 shrink-0" />
                            <span className="truncate">{t('storage.title') || 'Family Storage'}</span>
                        </span>
                    </div>

                    {isParent && (
                        <button
                            onClick={() => {
                                setEditingItem(null)
                                setShowItemModal(true)
                            }}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 transition-colors text-white shadow-lg shadow-amber-200/50 font-bold"
                        >
                            <Plus className="w-5 h-5" />
                            <span className="hidden md:inline">{t('storage.addItem')}</span>
                        </button>
                    )}
                </div>

                <div className="flex flex-col md:flex-row gap-4 w-full">
                    <form onSubmit={handleSearch} className="relative flex-1 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-amber-500 transition-colors" />
                        <input 
                            type="text" 
                            placeholder={t('storage.searchPlaceholder')} 
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-white/60 backdrop-blur rounded-2xl py-3 pl-12 pr-4 outline-none focus:ring-2 focus:ring-amber-400 transition-all border border-white/50 placeholder:text-slate-400 font-medium"
                        />
                    </form>
                    <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-1">
                        <Filter className="w-4 h-4 text-slate-400 shrink-0" />
                        {PRESET_TAGS.map(tag => (
                            <button
                                key={tag}
                                onClick={() => handleToggleTag(tag)}
                                className={`px-4 py-2 rounded-full text-xs font-bold transition-all shrink-0 border whitespace-nowrap ${selectedTag === tag ? 'bg-amber-500 text-white border-amber-400 shadow-md' : 'bg-white/40 text-slate-600 border-white/20 hover:bg-white/60'}`}
                            >
                                {tag}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            <main className="relative z-10 flex-1 overflow-y-auto p-6 md:p-12 pb-32 hide-scrollbar">
                {/* SHELF BACKGROUND DESIGN */}
                <div className="max-w-7xl mx-auto flex flex-col gap-16 relative min-h-full">
                    
                    {items.length === 0 && !loading ? (
                        <div className="flex flex-col items-center justify-center p-12 md:p-20 text-slate-400">
                            <Package className="w-16 h-16 md:w-20 md:h-20 mb-4 opacity-20" />
                            <p className="text-lg md:text-xl font-bold text-center">{t('storage.empty.title')}</p>
                            <p className="text-xs md:text-sm text-center">{t('storage.empty.subtitle')}</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-y-12 md:gap-y-16 gap-x-3 md:gap-x-8">
                            {items.map((item, idx) => (
                                <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="group relative flex flex-col items-center"
                                >
                                    {/* Item Card */}
                                    <div 
                                        onClick={() => setActiveLightboxIndex(idx)}
                                        className="relative w-full aspect-square bg-white rounded-2xl shadow-[0_10px_20px_rgba(0,0,0,0.05),0_6px_6px_rgba(0,0,0,0.05)] overflow-hidden cursor-pointer hover:-translate-y-2 transition-transform duration-300 border-b-4 border-slate-200"
                                    >
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={item.imageUrl} className="w-full h-full object-cover" alt={item.name} />
                                        
                                        {/* Transfer Status Badge */}
                                        <div className="absolute top-2 left-2 flex flex-col gap-1">
                                            {item.isTransferred ? (
                                                <span className="bg-black/60 backdrop-blur-md text-white/90 text-[10px] px-2.5 py-1 rounded-lg font-black shadow-sm uppercase tracking-tighter border border-white/5">
                                                    {t('storage.status.transferred')}
                                                </span>
                                            ) : item.isForSale ? (
                                                <span className="bg-black/60 backdrop-blur-md text-white/90 text-[10px] px-2.5 py-1 rounded-lg font-black shadow-sm uppercase tracking-tighter border border-white/5">
                                                    {t('storage.status.selling')}
                                                </span>
                                            ) : null}
                                        </div>

                                        {/* Action Buttons overlay for parent */}
                                        {isParent && (
                                            <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); setEditingItem(item); setShowItemModal(true); }}
                                                    className="p-2 bg-white/80 hover:bg-white backdrop-blur rounded-lg shadow-sm text-slate-600 transition-colors"
                                                >
                                                    <Edit3 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )}

                                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>

                                    {/* Item Title on wood beam label style */}
                                    <div className="mt-3 md:mt-4 text-center w-full">
                                        <h3 className="font-black text-slate-700 leading-tight line-clamp-2 px-1 text-sm md:text-base">{item.name}</h3>
                                        <div className="flex flex-wrap justify-center gap-1 mt-1">
                                          {JSON.parse(item.tags).map((tag: string) => (
                                            <span key={tag} className="text-[9px] md:text-[10px] bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded-md font-bold uppercase tracking-tighter shrink-0">
                                              {tag}
                                            </span>
                                          ))}
                                        </div>
                                    </div>

                                    {/* SHELF BEAM DESIGN (Horizontal stand under each item) */}
                                    <div className="absolute -bottom-5 md:-bottom-6 left-1/2 -translate-x-1/2 w-[104%] md:w-[106%] h-2.5 md:h-3 bg-gradient-to-b from-slate-300 to-slate-400 rounded-full shadow-[0_8px_10px_rgba(0,0,0,0.1)] z-[-1]" />
                                </motion.div>
                            ))}
                        </div>
                    )}

                    {loading && (
                      <div className="flex justify-center p-10">
                        <div className="animate-bounce w-3 h-3 bg-amber-500 rounded-full mx-1" />
                        <div className="animate-bounce w-3 h-3 bg-amber-500 rounded-full mx-1 [animation-delay:-0.15s]" />
                        <div className="animate-bounce w-3 h-3 bg-amber-500 rounded-full mx-1 [animation-delay:-0.3s]" />
                      </div>
                    )}

                    {!loading && hasMore && (
                        <div className="flex justify-center mt-12 pb-10">
                            <button 
                              onClick={fetchMore}
                              className="px-8 py-3 bg-white/50 backdrop-blur-md rounded-2xl hover:bg-white/80 transition-all font-bold text-slate-600 shadow-sm border border-white/50"
                            >
                              {t('storage.loadMore')}
                            </button>
                        </div>
                    )}
                </div>
            </main>

            {/* LIGHTBOX FOR PREVIEW */}
            <AnimatePresence>
                {activeLightboxIndex !== null && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-lg flex flex-col items-center justify-center p-6"
                        onClick={() => setActiveLightboxIndex(null)}
                    >
                        <button className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors text-white border border-white/5">
                            <X className="w-8 h-8" />
                        </button>

                        <div className="relative max-w-6xl w-full h-full flex flex-col lg:flex-row items-center justify-center gap-6 md:gap-12" onClick={e => e.stopPropagation()}>
                              <motion.div 
                                 layoutId={`item-${items[activeLightboxIndex].id}`}
                                 className="w-full lg:w-3/5 xl:w-2/3 max-h-[40vh] md:max-h-[60vh] lg:max-h-[80vh] flex items-center justify-center text-white"
                               >
                                   {/* eslint-disable-next-line @next/next/no-img-element */}
                                   <img src={items[activeLightboxIndex].imageUrl} alt="preview" className="max-w-full max-h-full rounded-2xl md:rounded-[2.5rem] shadow-2xl object-contain border border-white/10" />
                              </motion.div>
                           
                           <div className="w-full lg:w-2/5 xl:w-1/3 flex flex-col gap-4 md:gap-6 text-white overflow-y-auto max-h-[40vh] lg:max-h-full pr-2 md:pr-4 custom-scrollbar">
                                <div className="flex flex-col gap-2">
                                    <h2 className="text-3xl font-black leading-tight">{items[activeLightboxIndex].name}</h2>
                                    <div className="flex items-center gap-2">
                                        {items[activeLightboxIndex].isTransferred ? (
                                            <span className="bg-slate-800/50 text-slate-400 text-[10px] px-2.5 py-1 rounded-full font-black uppercase tracking-widest border border-white/5 flex items-center gap-1.5">
                                                <div className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                                                {t('storage.status.transferred')}
                                            </span>
                                        ) : items[activeLightboxIndex].isForSale ? (
                                            <span className="bg-green-500/20 text-green-400 text-[10px] px-2.5 py-1 rounded-full font-black uppercase tracking-widest border border-green-500/20 flex items-center gap-1.5 animate-pulse">
                                                <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                                                {t('storage.status.selling')}
                                            </span>
                                        ) : null}
                                    </div>
                                </div>

                                {items[activeLightboxIndex].notes && (
                                  <p className="text-slate-400 bg-white/5 p-4 rounded-xl border border-white/5 text-sm leading-relaxed">{items[activeLightboxIndex].notes}</p>
                                )}

                                <div className="grid grid-cols-2 gap-y-6 gap-x-4 py-6 border-y border-white/10">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{t('storage.price.purchase')}</span>
                                        <span className="text-2xl font-bold text-slate-100 flex items-baseline gap-1">
                                            <span className="text-sm font-medium text-slate-400">¥</span>
                                            {items[activeLightboxIndex].purchasePrice?.toLocaleString()}
                                        </span>
                                    </div>
                                    {items[activeLightboxIndex].isTransferred ? (
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[10px] font-black text-green-500 uppercase tracking-[0.2em]">{t('storage.price.sold')}</span>
                                            <span className="text-2xl font-bold text-green-400 flex items-baseline gap-1">
                                                <span className="text-sm font-medium text-green-500/50">¥</span>
                                                {items[activeLightboxIndex].actualSalePrice?.toLocaleString()}
                                            </span>
                                        </div>
                                    ) : items[activeLightboxIndex].isForSale ? (
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em]">{t('storage.price.resale')}</span>
                                            <span className="text-2xl font-bold text-amber-400 flex items-baseline gap-1">
                                                <span className="text-sm font-medium text-amber-500/50">¥</span>
                                                {items[activeLightboxIndex].resalePrice?.toLocaleString()}
                                            </span>
                                        </div>
                                    ) : <div />}

                                    {/* Date Row */}
                                    {items[activeLightboxIndex].purchaseDate && (
                                        <div className="flex flex-col gap-1 col-span-2">
                                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{t('storage.purchaseDate')}</span>
                                            <span className="text-sm font-bold text-slate-300">
                                                {new Date(items[activeLightboxIndex].purchaseDate).toLocaleDateString()}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-wrap gap-2">
                                  {JSON.parse(items[activeLightboxIndex].tags).map((tag: string) => (
                                    <span key={tag} className="px-3 py-1 bg-amber-500/20 text-amber-500 border border-amber-500/30 rounded-full text-xs font-bold uppercase tracking-widest">{tag}</span>
                                  ))}
                                </div>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-4">
                                    {t('storage.lastUpdated')}: {new Date(items[activeLightboxIndex].updatedAt).toLocaleDateString()}
                                </p>
                           </div>
                        </div>
                        
                        <div className="absolute bottom-10 flex gap-4">
                            <button 
                                onClick={(e) => { e.stopPropagation(); setActiveLightboxIndex(prev => prev! > 0 ? prev! - 1 : prev) }}
                                className="p-4 bg-white/5 hover:bg-white/10 rounded-full text-white border border-white/10"
                            >
                                <ChevronLeft className="w-8 h-8" />
                            </button>
                            <button 
                                onClick={(e) => { e.stopPropagation(); setActiveLightboxIndex(prev => prev! < items.length - 1 ? prev! + 1 : prev) }}
                                className="p-4 bg-white/5 hover:bg-white/10 rounded-full text-white border border-white/10"
                            >
                                <ChevronRight className="w-8 h-8" />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ITEM MODAL (ADD/EDIT) */}
            <AnimatePresence>
                {showItemModal && (
                    <ItemModal 
                        item={editingItem}
                        onClose={() => setShowItemModal(false)}
                        onSuccess={() => fetchInitialItems()}
                    />
                )}
            </AnimatePresence>
        </div>
    )
}

function ItemModal({ item, onClose, onSuccess }: { item: StorageItem | null, onClose: () => void, onSuccess: () => void }) {
    const [name, setName] = useState(item?.name || '')
    const [notes, setNotes] = useState(item?.notes || '')
    const [tags, setTags] = useState<string[]>(item ? JSON.parse(item.tags) : [])
    const [imageUrl, setImageUrl] = useState(item?.imageUrl || '')
    
    // Financial fields
    const [purchasePrice, setPurchasePrice] = useState(item?.purchasePrice?.toString() || '0')
    const [resalePrice, setResalePrice] = useState(item?.resalePrice?.toString() || '0')
    const [purchaseDate, setPurchaseDate] = useState(item?.purchaseDate ? new Date(item.purchaseDate).toISOString().split('T')[0] : '')
    const [isForSale, setIsForSale] = useState(item?.isForSale || false)
    const [isSynced, setIsSynced] = useState(item?.isSynced || false)
    
    // Transfer logic
    const [showTransferForm, setShowTransferForm] = useState(false)
    const [salePrice, setSalePrice] = useState(item?.resalePrice?.toString() || '0')
    const [transferDate, setTransferDate] = useState(new Date().toISOString().split('T')[0])
    const [deliveryMethod, setDeliveryMethod] = useState('express')
    const [buyerId, setBuyerId] = useState('')

    const [loading, setLoading] = useState(false)
    const [showPhotoPicker, setShowPhotoPicker] = useState(false)
    const { } = useI18n()

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!name || !imageUrl) return
        setLoading(true)

        try {
            const url = item ? `/api/storage/${item.id}` : '/api/storage'
            const method = item ? 'PUT' : 'POST'
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    name, notes, tags, imageUrl, 
                    purchasePrice, resalePrice, purchaseDate, 
                    isForSale, isSynced 
                })
            })
            if (res.ok) {
                onSuccess()
                onClose()
            }
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const handleConfirmTransfer = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!item) return
        setLoading(true)
        try {
            const res = await fetch(`/api/storage/${item.id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    transferDate, salePrice, deliveryMethod, buyerId, notes 
                })
            })
            if (res.ok) {
                onSuccess()
                onClose()
            }
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async () => {
        if (!item || !window.confirm('Delete this item?')) return
        setLoading(true)
        try {
            const res = await fetch(`/api/storage/${item.id}`, { method: 'DELETE' })
            if (res.ok) {
                onSuccess()
                onClose()
            }
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto pt-10 pb-10">
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden shadow-slate-900/40 my-auto max-h-[90vh] flex flex-col"
            >
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                        <Package className="w-6 h-6 text-amber-500" /> 
                        {showTransferForm ? 'Record Sale' : (item ? 'Manage Item' : 'New Cargo')}
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-xl transition-colors">&times;</button>
                </div>

                {!showTransferForm ? (
                    <form onSubmit={handleSave} className="p-6 flex flex-col gap-6 overflow-y-auto max-h-[75vh] hide-scrollbar">
                        {/* Image Selector Area */}
                        <div 
                            className="relative w-full aspect-video bg-slate-100 rounded-2xl flex items-center justify-center overflow-hidden border-2 border-dashed border-slate-200 group cursor-pointer shrink-0"
                            onClick={() => setShowPhotoPicker(true)}
                        >
                            {imageUrl ? (
                               // eslint-disable-next-line @next/next/no-img-element
                               <img src={imageUrl} className="w-full h-full object-cover" alt="prev" />
                            ) : (
                              <div className="flex flex-col items-center gap-2 text-slate-400">
                                 <Camera className="w-10 h-10" />
                                 <span className="text-xs font-bold uppercase tracking-widest">Snap or Pick Photo</span>
                              </div>
                            )}
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Cargo Name</label>
                                <input 
                                    type="text" 
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    className="w-full bg-slate-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-amber-400 outline-none font-bold text-slate-700"
                                    placeholder="What is this?"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Buy Price</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">¥</span>
                                        <input 
                                            type="number" 
                                            value={purchasePrice}
                                            onChange={e => setPurchasePrice(e.target.value)}
                                            className="w-full bg-slate-50 border-none rounded-2xl p-4 pl-8 focus:ring-2 focus:ring-amber-400 outline-none font-bold text-slate-700"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Purchase Date</label>
                                    <SmartDatePicker
                                        selected={purchaseDate ? new Date(purchaseDate) : undefined}
                                        onSelect={(date) => setPurchaseDate(date ? date.toISOString().split('T')[0] : '')}
                                        triggerClassName="w-full bg-slate-50 border-none rounded-2xl px-4 py-4 font-bold text-slate-700 h-[56px] flex items-center justify-between"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-center justify-between">
                            <div className="flex flex-col gap-1">
                                <span className="text-xs font-black text-amber-700 uppercase">Transfer Status</span>
                                <span className="text-[10px] text-amber-600/60 font-medium">Available for resale?</span>
                            </div>
                            <button 
                                type="button"
                                onClick={() => setIsForSale(!isForSale)}
                                className={`w-12 h-6 rounded-full transition-colors relative ${isForSale ? 'bg-amber-500' : 'bg-slate-200'}`}
                            >
                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isForSale ? 'left-7' : 'left-1'}`} />
                            </button>
                        </div>

                        {isForSale && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Listing Price (Resale)</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-500 font-bold">¥</span>
                                        <input 
                                            type="number" 
                                            value={resalePrice}
                                            onChange={e => setResalePrice(e.target.value)}
                                            className="w-full bg-amber-50/30 border-2 border-amber-100/50 rounded-2xl p-4 pl-8 focus:ring-2 focus:ring-amber-400 outline-none font-bold text-slate-700"
                                        />
                                    </div>
                                </div>
                                {item && (
                                    <button 
                                        type="button" 
                                        onClick={() => setShowTransferForm(true)}
                                        className="w-full py-3 rounded-2xl bg-white border-2 border-amber-200 text-amber-600 font-black text-xs uppercase tracking-widest hover:bg-amber-50 transition-colors"
                                    >
                                        Mark as Sold Out
                                    </button>
                                )}
                            </motion.div>
                        )}

                        <div className="flex items-center gap-3 p-4 bg-blue-50/30 rounded-2xl border border-blue-100/50">
                            <Check className={`w-5 h-5 ${isSynced ? 'text-blue-500' : 'text-slate-300'}`} />
                            <div className="flex-1">
                                <span className="block text-xs font-black text-blue-700 uppercase">Remote Sync</span>
                                <span className="text-[10px] text-blue-600/60 font-medium">Keep data backed up in cloud</span>
                            </div>
                            <button 
                                type="button"
                                onClick={() => setIsSynced(!isSynced)}
                                className={`w-12 h-6 rounded-full transition-colors relative ${isSynced ? 'bg-blue-500' : 'bg-slate-200'}`}
                            >
                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isSynced ? 'left-7' : 'left-1'}`} />
                            </button>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Remarks / Details</label>
                            <textarea 
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                                className="w-full bg-slate-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-amber-400 outline-none text-sm font-medium text-slate-600 min-h-[100px] resize-none"
                                placeholder="Add specifics like purchase location, serial number..."
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Classification Tags</label>
                            <div className="flex flex-wrap gap-2">
                               {PRESET_TAGS.map(t => {
                                 const active = tags.includes(t)
                                 return (
                                   <button 
                                      key={t}
                                      type="button"
                                      onClick={() => setTags(prev => active ? prev.filter(x => x !== t) : [...prev, t])}
                                      className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase transition-all border ${active ? 'bg-amber-500 text-white border-amber-400 shadow-md scale-105' : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'}`}
                                    >
                                     {t}
                                   </button>
                                 )
                               })}
                            </div>
                        </div>

                        <div className="flex gap-3 mt-4 shrink-0">
                            {item && (
                               <button 
                                  type="button" 
                                  onClick={handleDelete}
                                  className="px-6 py-4 rounded-2xl bg-slate-100 text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-colors"
                                >
                                  <Trash className="w-6 h-6" />
                               </button>
                            )}
                            <button 
                                type="submit" 
                                disabled={loading}
                                className={`flex-1 py-4 rounded-2xl bg-slate-800 text-white font-black tracking-widest uppercase shadow-lg shadow-slate-200 hover:bg-slate-900 transition-all ${loading ? 'grayscale' : ''}`}
                            >
                                {loading ? 'Saving...' : (item ? 'Update Shelf' : 'Add to Shelf')}
                            </button>
                        </div>
                    </form>
                ) : (
                    <form onSubmit={handleConfirmTransfer} className="p-6 flex flex-col gap-6">
                        <div className="p-4 bg-slate-50 rounded-2xl flex items-center gap-4">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={imageUrl} className="w-16 h-16 rounded-lg object-cover" alt="" />
                            <div className="flex-1">
                                <h4 className="font-bold text-slate-800">{name}</h4>
                                <p className="text-xs text-slate-400">Recording final transaction details</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Actual Sale Price</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-green-600 font-bold">¥</span>
                                    <input 
                                        type="number" 
                                        value={salePrice}
                                        onChange={e => setSalePrice(e.target.value)}
                                        className="w-full bg-slate-50 border-none rounded-2xl p-4 pl-8 focus:ring-2 focus:ring-green-400 outline-none font-black text-lg text-slate-800"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Sale Date</label>
                                    <SmartDatePicker
                                        selected={transferDate ? new Date(transferDate) : undefined}
                                        onSelect={(date) => setTransferDate(date ? date.toISOString().split('T')[0] : '')}
                                        triggerClassName="w-full bg-slate-50 border-none rounded-2xl px-4 py-4 font-bold text-slate-700 h-[56px] flex items-center justify-between"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Delivery</label>
                                    <select 
                                        value={deliveryMethod}
                                        onChange={e => setDeliveryMethod(e.target.value)}
                                        className="w-full bg-slate-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-slate-400 outline-none font-bold text-slate-700 h-[56px]"
                                    >
                                        <option value="express">Express</option>
                                        <option value="self-pickup">Self-Pickup</option>
                                        <option value="meetup">Meetup</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Buyer ID / Name</label>
                                <input 
                                    type="text" 
                                    value={buyerId}
                                    onChange={e => setBuyerId(e.target.value)}
                                    className="w-full bg-slate-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-slate-400 outline-none font-bold text-slate-700"
                                    placeholder="Buyer reference"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-4">
                            <button 
                                type="button" 
                                onClick={() => setShowTransferForm(false)}
                                className="flex-1 py-4 rounded-2xl bg-slate-100 text-slate-500 font-black uppercase text-xs tracking-widest"
                            >
                                Back
                            </button>
                            <button 
                                type="submit" 
                                disabled={loading}
                                className={`flex-[2] py-4 rounded-2xl bg-green-600 text-white font-black tracking-widest uppercase shadow-lg shadow-green-200 hover:bg-green-700 transition-all ${loading ? 'grayscale' : ''}`}
                            >
                                {loading ? 'Recording...' : 'Finalize Sale'}
                            </button>
                        </div>
                    </form>
                )}
            </motion.div>


            {/* Photo Picker integration using existing UploadModal if possible or simple one */}
            <AnimatePresence>
              {showPhotoPicker && (
                <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
                   <div className="w-full max-w-sm bg-white rounded-3xl p-8 flex flex-col gap-6">
                      <h3 className="text-2xl font-black text-slate-800 text-center uppercase tracking-tighter">Choose Photo Source</h3>
                      <div className="grid grid-cols-1 gap-4">
                        <input 
                           type="file" 
                           accept="image/*" 
                           id="file-capture" 
                           className="hidden" 
                           onChange={async (e) => {
                             const file = e.target.files?.[0]
                             if (file) {
                               // Upload logic
                               const formData = new FormData()
                               formData.append('file', file)
                               setLoading(true)
                               const res = await fetch('/api/upload/file', {
                                 method: 'POST',
                                 body: formData
                               })
                               if (res.ok) {
                                 const data = await res.json()
                                 setImageUrl(data.url)
                                 setShowPhotoPicker(false)
                               }
                               setLoading(false)
                             }
                           }}
                        />
                        <label 
                          htmlFor="file-capture"
                          className="flex items-center gap-4 p-5 rounded-2xl bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors cursor-pointer border-2 border-amber-100"
                        >
                          <Camera className="w-8 h-8" />
                          <div className="flex flex-col">
                            <span className="font-black text-lg">Take Photo</span>
                            <span className="text-xs opacity-60">Use device camera</span>
                          </div>
                        </label>
                        <button 
                          type="button"
                          onClick={() => {
                            // Link to gallery pick logic or similar
                            // For now keep it simple with file input above
                          }}
                          className="flex items-center gap-4 p-5 rounded-2xl bg-slate-50 text-slate-600 hover:bg-slate-100 transition-colors border-2 border-slate-100"
                        >
                          <Download className="w-8 h-8" />
                          <div className="flex flex-col text-left">
                            <span className="font-black text-lg">Upload File</span>
                            <span className="text-xs opacity-60">Pick from device</span>
                          </div>
                        </button>
                      </div>
                      <button onClick={() => setShowPhotoPicker(false)} className="py-4 rounded-2xl bg-slate-800 text-white font-black uppercase text-xs tracking-widest">Cancel</button>
                   </div>
                </div>
              )}
            </AnimatePresence>
        </div>
    )
}
