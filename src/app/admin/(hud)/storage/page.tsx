'use client'
// Storage Protocol Modernization v3.1 - Currency & I18n fix

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useI18n } from '@/contexts/I18nContext'
import { 
  Plus, 
  Search, 
  Package, 
  Trash, 
  Edit3, 
  ChevronLeft, 
  ChevronDown,
  ShieldCheck,
  Camera,
  Download,
  X,
  ChevronRight,
  Settings2,
  Check,
  Box,
  Upload,
  LayoutGrid,
  XCircle,
  Hash,
  Monitor,
  Gamepad2,
  BookOpen,
  Shirt,
  Sparkles,
  Wrench,
  Layers,
  Terminal,
  Lock,
  Cloud
} from 'lucide-react'
import SmartDatePicker from '@/components/SmartDatePicker'
import Image from 'next/image'
import { BausteinAdminNavbar } from '@/components/BausteinAdminNavbar'
import clsx from 'clsx'

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

interface StorageCategory {
    id: string
    name: string
    emoji?: string | null
}

const getItemPhotos = (imageUrl: string): string[] => {
    if (!imageUrl) return []
    try {
        if (imageUrl.startsWith('[')) {
            return JSON.parse(imageUrl)
        }
        return [imageUrl]
    } catch {
        return [imageUrl]
    }
}

const formatDateToZh = (dateStr: string | null): string => {
    if (!dateStr) return 'NULL'
    try {
        // Robust handling for YYYY-MM-DD or ISO strings
        const clean = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr
        const p = clean.split('-')
        if (p.length === 3) {
            const y = p[0]
            const m = parseInt(p[1], 10)
            const d = parseInt(p[2], 10)
            return `${y}年${m}月${d}日`
        }
        return dateStr
    } catch {
        return dateStr
    }
}

const PRESET_TAGS = ['家电', '玩具', '书籍', '衣物', '卫生', '工具', '杂物']

const TAG_ICONS: Record<string, React.ElementType> = {
  '家电': Monitor,
  '玩具': Gamepad2,
  '书籍': BookOpen,
  '衣物': Shirt,
  '卫生': Sparkles,
  '工具': Wrench,
  '杂物': Layers,
}

export default function StoragePage() {
    const [items, setItems] = useState<StorageItem[]>([])
    const [loading, setLoading] = useState(true)
    const [hasMore, setHasMore] = useState(true)
    const [page, setPage] = useState(1)
    const [search, setSearch] = useState('')
    const [selectedTag, setSelectedTag] = useState<string | null>(null)
    const [isAdmin, setIsAdmin] = useState(false)
    
    // UI state
    const [showItemModal, setShowItemModal] = useState(false)
    const [editingItem, setEditingItem] = useState<StorageItem | null>(null)
    const [activeLightboxIndex, setActiveLightboxIndex] = useState<number | null>(null)
    const [activePhotoInLightboxIdx, setActivePhotoInLightboxIdx] = useState(0)
    const [currencySymbol, setCurrencySymbol] = useState('¥')
    const [categories, setCategories] = useState<{id: string, name: string, emoji?: string | null}[]>([])
    const [showTagSettings, setShowTagSettings] = useState(false)
    const [showAllCategories, setShowAllCategories] = useState(false)

    useEffect(() => {
        setActivePhotoInLightboxIdx(0)
    }, [activeLightboxIndex])

    const { t } = useI18n()

    // Body Scroll Lock when any modal is active
    useEffect(() => {
        const isAnyModalOpen = showItemModal || activeLightboxIndex !== null || showTagSettings || showAllCategories;
        if (isAnyModalOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [showItemModal, activeLightboxIndex, showTagSettings, showAllCategories]);

    const fetchCategories = async () => {
        try {
            const res = await fetch('/api/storage/categories')
            const data = await res.json()
            if (Array.isArray(data) && data.length > 0) {
                setCategories(data)
            } else if (Array.isArray(data) && data.length === 0) {
                // Seed defaults if empty
                for (const name of PRESET_TAGS) {
                    await fetch('/api/storage/categories', {
                        method: 'POST',
                        body: JSON.stringify({ name })
                    })
                }
                const refreshed = await fetch('/api/storage/categories')
                const refreshedData = await refreshed.json()
                setCategories(refreshedData)
            }
        } catch (err) {
            console.error('Failed to fetch categories:', err)
        }
    }

    useEffect(() => {
        fetchCategories()
    }, [])

    const handleTagClick = (tag: string | null) => {
        if (tag === null) {
            setSelectedTag(null)
            fetchInitialItems()
        } else {
            handleToggleTag(tag)
        }
    }


    const fetchInitialItems = async () => {
        setLoading(true)
        setPage(1)
        try {
            const searchParam = search ? `&search=${search}` : ''
            const res = await fetch(`/api/storage?page=1&limit=20${searchParam}`)
            const data = await res.json()
            setItems(data)
            setHasMore(data.length === 20)
        } catch (_err) {
            console.error(_err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetch('/api/stats')
            .then(res => res.json())
            .then(data => {
                setIsAdmin(data.isAdmin)
            })
        fetch('/api/system/settings')
            .then(res => res.json())
            .then(data => {
                if (data.currencySymbol) setCurrencySymbol(data.currencySymbol)
            })
        fetchInitialItems()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

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
        } catch (_err) {
            console.error(_err)
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
        } catch (_err) {
            console.error(_err)
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
        } catch (_err) {
            console.error(_err)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-[#D1CDBC] relative flex flex-col font-sans selection:bg-amber-100 selection:text-amber-900">
            <BausteinAdminNavbar 
                actions={
                    isAdmin && (
                        <button 
                            onClick={() => {
                                setEditingItem(null)
                                setShowItemModal(true)
                            }}
                            className="hardware-btn group"
                        >
                            <div className="hardware-well relative w-32 h-11 rounded-lg bg-[#DADBD4] shadow-well active:translate-y-0.5 transition-all flex items-center justify-center p-0.5">
                                <div className="hardware-cap absolute inset-0.5 bg-amber-500 rounded-[6px] flex items-center justify-center gap-2 transition-all shadow-cap group-hover:bg-amber-600">
                                    <Plus className="w-4 h-4 text-white" />
                                    <span className="text-[10px] font-black uppercase tracking-widest label-mono text-white whitespace-nowrap">{t('storage.addItem')}</span>
                                </div>
                            </div>
                        </button>
                    )
                }
            />

            <main className="flex-1 flex flex-col items-center px-6 md:px-10 pt-6 pb-32 md:pt-10 max-w-7xl mx-auto w-full gap-8 md:gap-14 relative overflow-y-auto hide-scrollbar scroll-smooth">
                
                {/* Simplified Header - Industrial Taxonomy Matrix */}
                <div className="w-full flex flex-col lg:flex-row items-center justify-between gap-6 px-4 md:px-2">
                    {/* LEFT: CATEGORY VECTORS */}
                    <div className="flex items-center gap-2 overflow-hidden w-full lg:w-auto">
                        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                            <button
                                onClick={() => handleTagClick(null)}
                                className={clsx(
                                    "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border-2 flex-shrink-0 label-mono",
                                    !selectedTag 
                                        ? "bg-slate-900 text-white border-slate-800 shadow-md" 
                                        : "bg-white/80 text-slate-400 border-white/40 hover:bg-white"
                                )}
                            >
                                {t('common.all')}
                            </button>
                            {categories.slice(0, 4).map((cat) => (
                                <button
                                    key={cat.id}
                                    onClick={() => handleTagClick(cat.name)}
                                    className={clsx(
                                        "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border-2 whitespace-nowrap flex items-center gap-2 flex-shrink-0 label-mono shadow-sm",
                                        selectedTag === cat.name
                                            ? "bg-slate-900 text-white border-slate-800 shadow-md" 
                                            : "bg-white/80 text-slate-400 border-white/40 hover:bg-white"
                                    )}
                                >
                                    {cat.emoji && <span className="text-xs">{cat.emoji}</span>}
                                    {cat.name}
                                </button>
                            ))}
                            
                            {categories.length > 4 && (
                                <button
                                    onClick={() => setShowAllCategories(true)}
                                    className="px-3 h-10 rounded-xl text-[9px] font-black uppercase tracking-tighter bg-white/40 text-slate-400 border-[1.5px] border-dashed border-slate-200 hover:bg-white hover:border-amber-500/30 hover:text-amber-700 transition-all flex items-center justify-center flex-shrink-0 label-mono"
                                >
                                    + MORE_LOGS
                                </button>
                            )}
                        </div>

                        <div className="h-6 w-px bg-black/5 mx-1 flex-shrink-0" />

                        <button
                            onClick={() => setShowTagSettings(true)}
                            className="hardware-btn group flex-shrink-0"
                        >
                            <div className="hardware-well h-10 min-w-[90px] px-1 rounded-xl bg-[#DADBD4] shadow-well active:translate-y-0.5 transition-all flex items-center justify-center relative overflow-hidden">
                                <div className="hardware-cap w-full h-[32px] bg-white group-hover:bg-amber-50 rounded-lg shadow-cap flex items-center gap-2 px-3 border border-black/5 transition-all">
                                    <Settings2 className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-600 transition-colors shrink-0" />
                                    <span className="text-[9px] font-black text-slate-400 group-hover:text-amber-900 uppercase italic tracking-tighter label-mono transition-colors whitespace-nowrap">Manage</span>
                                </div>
                            </div>
                        </button>
                    </div>

                    {/* RIGHT: SEARCH MATRIX */}
                    <div className="w-full lg:w-80 group">
                        <form onSubmit={handleSearch} className="relative group w-full">
                            <div className="hardware-well rounded-2xl p-1 bg-[#D1CDBC] shadow-well transition-all group-focus-within:bg-[#C8C4B0]">
                                <div className="relative flex items-center bg-white/95 rounded-xl border border-black/5 overflow-hidden shadow-inner">
                                    <div className="absolute left-3 w-6 h-6 flex items-center justify-center opacity-30 group-focus-within:opacity-100 transition-opacity">
                                        <Search className="w-4 h-4 text-slate-900 group-focus-within:text-amber-500 transition-colors" />
                                    </div>
                                    <input 
                                        type="text" 
                                        placeholder={t('storage.searchPlaceholder')} 
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="w-full bg-transparent py-2.5 pl-10 pr-10 outline-none font-black text-slate-800 text-[11px] placeholder:text-slate-200 transition-all uppercase tracking-tight label-mono"
                                    />
                                    {search && (
                                        <button 
                                            type="button" 
                                            onClick={() => { setSearch(''); fetchInitialItems(); }}
                                            className="absolute right-3 w-6 h-6 flex items-center justify-center rounded-lg hover:bg-black/5 text-slate-300 hover:text-rose-500 transition-all"
                                        >
                                            <XCircle className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Main Content: Shelf Grid */}
                <div className="w-full flex flex-col gap-10">
                    {items.length === 0 && !loading ? (
                        <div className="w-full baustein-panel bg-[#E6E2D1] rounded-[2.5rem] p-16 md:p-32 flex flex-col items-center justify-center text-center gap-6 border-4 border-[#C8C4B0]">
                            <div className="hardware-well w-24 h-24 rounded-full flex items-center justify-center bg-[#D1CDBC] mb-2">
                                <Package className="w-12 h-12 text-slate-400" />
                            </div>
                            <div className="flex flex-col gap-2">
                                <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter italic">{t('storage.empty.title')}</h3>
                                <p className="text-sm font-bold text-slate-400 max-w-xs">{t('storage.empty.subtitle')}</p>
                            </div>
                            {isAdmin && (
                                <button 
                                    onClick={() => { setEditingItem(null); setShowItemModal(true); }}
                                    className="px-8 py-3 bg-amber-500 hover:bg-amber-600 rounded-xl text-white font-black text-xs uppercase tracking-[0.2em] shadow-lg transition-transform active:scale-95"
                                >
                                    Initialize Inventory
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8 md:gap-12 w-full px-2">
                            {items.map((item, idx) => (
                                <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                                    className="group relative flex flex-col gap-4"
                                >
                                    {/* Item Housing - The Industrial Casting */}
                                    <div className="hardware-well p-2 rounded-2xl bg-[#DADBD4] shadow-well relative">
                                        <div 
                                            onClick={() => setActiveLightboxIndex(idx)}
                                            className="relative aspect-square rounded-2xl overflow-hidden cursor-pointer border-2 border-white/40 shadow-sm transition-all bg-slate-100"
                                        >
                                            <Image 
                                                src={getItemPhotos(item.imageUrl)[0] || ''} 
                                                fill
                                                className="object-cover" 
                                                alt={item.name} 
                                            />
                                            
                                            {/* Status Labels */}
                                            <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                                                {item.isTransferred ? (
                                                    <div className="bg-slate-900/80 backdrop-blur-md text-white text-[8px] font-black uppercase tracking-[0.2em] px-2.5 py-1 rounded-md border border-white/10 shadow-lg label-mono">
                                                        {t('storage.status.transferred')}
                                                    </div>
                                                ) : item.isForSale ? (
                                                    <div className="bg-emerald-500/90 backdrop-blur-md text-white text-[8px] font-black uppercase tracking-[0.2em] px-2.5 py-1 rounded-md border border-white/20 shadow-lg label-mono flex items-center gap-1">
                                                        <div className="w-1 h-1 rounded-full bg-white animate-pulse" />
                                                        {t('storage.status.selling')}
                                                    </div>
                                                ) : null}
                                            </div>

                                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-60" />
                                        </div>

                                        {/* Physical Stand Decoration - Metal Plate Style */}
                                        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-[85%] h-5 bg-gradient-to-b from-[#C8C4B0] to-[#A09D8B] rounded-full z-[-1] shadow-[0_8px_15px_rgba(0,0,0,0.15)] opacity-80" />
                                    </div>

                                    {/* Data Tagging Section */}
                                    <div className="flex flex-col items-center text-center gap-1.5 px-2">
                                        <h3 className="font-black text-slate-800 leading-tight line-clamp-2 text-sm uppercase tracking-tight label-mono">{item.name}</h3>
                                        <div className="flex flex-wrap justify-center gap-1.5">
                                            {JSON.parse(item.tags).map((tag: string) => (
                                                <span key={tag} className="px-2 py-0.5 bg-slate-900/5 text-slate-500 rounded-md text-[8px] font-black uppercase tracking-widest label-mono border border-black/5">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}

                    {loading && (
                      <div className="py-20 flex flex-col items-center gap-4">
                        <div className="flex gap-1.5">
                            <div className="animate-bounce w-2 h-2 bg-amber-500 rounded-full" />
                            <div className="animate-bounce w-2 h-2 bg-amber-500 rounded-full [animation-delay:-0.15s]" />
                            <div className="animate-bounce w-2 h-2 bg-amber-500 rounded-full [animation-delay:-0.3s]" />
                        </div>
                        <span className="label-mono text-[10px] font-black text-slate-400 uppercase tracking-widest">Scanning inventory data_</span>
                      </div>
                    )}

                    {!loading && hasMore && (
                        <div className="flex justify-center mt-12 pb-20">
                            <button 
                                onClick={fetchMore}
                                className="hardware-btn group"
                            >
                                <div className="hardware-well relative px-10 py-4 rounded-2xl bg-white shadow-well active:translate-y-1 transition-all flex items-center justify-center border border-black/5 hover:border-black/10">
                                    <span className="text-[10px] font-black uppercase tracking-[0.25em] label-mono text-slate-500">
                                        {t('storage.loadMore')}
                                    </span>
                                </div>
                            </button>
                        </div>
                    )}
                </div>
            </main>

            <AnimatePresence mode="wait">
                {activeLightboxIndex !== null && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[2000] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 sm:p-6"
                        onClick={() => setActiveLightboxIndex(null)}
                    >
                        <motion.div 
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="w-full max-w-5xl baustein-panel bg-[#E2DFD2] border-4 border-[#C8C4B0] shadow-2xl relative overflow-hidden flex flex-col max-h-[95vh]"
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Panel Texture & Screws */}
                            <div className="absolute top-3 left-3 w-2 h-2 rounded-full bg-slate-900/10 shadow-inner" />
                            <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-slate-900/10 shadow-inner" />
                            <div className="absolute bottom-3 left-3 w-2 h-2 rounded-full bg-slate-900/10 shadow-inner" />
                            <div className="absolute bottom-3 right-3 w-2 h-2 rounded-full bg-slate-900/10 shadow-inner" />

                            {/* Header Row */}
                            <div className="px-6 py-4 sm:py-5 border-b-2 border-black/5 flex justify-between items-center bg-[#DADBD4]/60 shrink-0 relative">
                                <div className="flex flex-col">
                                    <h3 className="text-sm sm:text-lg font-black italic tracking-tighter uppercase text-slate-800 flex items-center gap-2">
                                        <div className="hardware-well w-8 h-8 rounded-lg bg-[#DADBD4] shadow-well relative overflow-hidden flex-shrink-0">
                                            <div className="hardware-cap absolute inset-1 bg-amber-500 rounded-md flex items-center justify-center">
                                                <Box className="w-3.5 h-3.5 text-white" />
                                            </div>
                                        </div>
                                        物品详情
                                    </h3>
                                </div>
                                <button onClick={() => setActiveLightboxIndex(null)} className="hardware-btn group z-50">
                                    <div className="hardware-well w-10 h-10 rounded-full bg-[#DADBD4] shadow-well flex items-center justify-center relative overflow-hidden active:translate-y-0.5 transition-all">
                                        <div className="hardware-cap absolute inset-1 bg-white group-hover:bg-rose-50 rounded-full shadow-cap transition-all flex items-center justify-center border border-black/5">
                                            <X className="w-5 h-5 text-slate-400 group-hover:text-rose-500 transition-colors" />
                                        </div>
                                    </div>
                                </button>
                            </div>

                            {/* Content */}
                            <div className="p-4 md:p-6 lg:p-8 flex-1 flex flex-col min-h-0">

                                <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 pt-0 lg:h-[60vh] lg:max-h-[600px]">
                                    {/* VISUAL MODULE - Left Section */}
                                    <div className="w-full lg:w-[50%] flex flex-col gap-4 lg:h-full">
                                        {/* Flat Screen Casing */}
                                        <div className="flex-1 min-h-[250px] sm:min-h-[350px] lg:min-h-0 bg-white/40 rounded-[1.5rem] lg:rounded-[2.5rem] p-4 relative overflow-hidden border border-black/5 flex flex-col">


                                                <div className="relative w-full h-full flex flex-col gap-4">
                                                    <div className="flex-1 relative">
                                                        <Image 
                                                            src={getItemPhotos(items[activeLightboxIndex].imageUrl)[activePhotoInLightboxIdx] || ''} 
                                                            alt="preview" 
                                                            fill
                                                            className="object-contain rounded-2xl z-10 transition-all duration-700 grayscale-[0.1] group-hover:grayscale-0 relative shadow-2xl" 
                                                        />
                                                    </div>
                                                    
                                                    {/* Internal Thumbnail Map */}
                                                    {getItemPhotos(items[activeLightboxIndex].imageUrl).length > 1 && (
                                                        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2 px-1">
                                                            {getItemPhotos(items[activeLightboxIndex].imageUrl).map((url, idx) => (
                                                                <button
                                                                    key={idx}
                                                                    onClick={(e) => { e.stopPropagation(); setActivePhotoInLightboxIdx(idx) }}
                                                                    className={clsx(
                                                                        "w-10 h-10 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0",
                                                                        activePhotoInLightboxIdx === idx ? "border-amber-500 scale-105" : "border-white/10 opacity-40 hover:opacity-100"
                                                                    )}
                                                                >
                                                                    <Image src={url} width={48} height={48} className="object-cover w-full h-full" alt="thumb" />
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>


                                                

                                        </div>

                                        {/* Integrated Local Controls - Putty Buttons */}
                                        <div className="flex items-center justify-between px-2">
                                            <div className="flex gap-4">
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); setActiveLightboxIndex(prev => prev! > 0 ? prev! - 1 : prev) }}
                                                    disabled={activeLightboxIndex === 0}
                                                    className="hardware-btn group"
                                                >
                                                    <div className={clsx(
                                                        "hardware-well w-12 h-12 rounded-xl flex items-center justify-center transition-all shadow-well",
                                                        activeLightboxIndex === 0 ? "opacity-30 bg-[#C8C4B0]" : "bg-[#B8B5A0] hover:bg-[#A09D8B] active:translate-y-1"
                                                    )}>
                                                        <ChevronLeft className="w-6 h-6 text-black/60" />
                                                    </div>
                                                </button>
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); setActiveLightboxIndex(prev => prev! < items.length - 1 ? prev! + 1 : prev) }}
                                                    disabled={activeLightboxIndex === items.length - 1}
                                                    className="hardware-btn group"
                                                >
                                                    <div className={clsx(
                                                        "hardware-well w-12 h-12 rounded-xl flex items-center justify-center transition-all shadow-well",
                                                        activeLightboxIndex === items.length - 1 ? "opacity-30 bg-[#C8C4B0]" : "bg-[#B8B5A0] hover:bg-[#A09D8B] active:translate-y-1"
                                                    )}>
                                                        <ChevronRight className="w-6 h-6 text-black/60" />
                                                    </div>
                                                </button>
                                            </div>

                                            <div className="flex flex-col items-end gap-1.5 py-2">
                                                <div className="flex items-baseline gap-2">
                                                    <span className="text-2xl font-black text-black/70 label-mono font-number italic">{activeLightboxIndex + 1}</span>
                                                    <span className="text-[10px] font-black text-black/20 label-mono">/ {items.length}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* DATA MODULE - Right Section */}
                                    <div className="w-full lg:w-[50%] flex flex-col gap-4 lg:h-full lg:overflow-y-auto no-scrollbar pb-4 pr-2">
                                        <div className="flex flex-col gap-4">
                                            {/* Manifest Plate */}
                                            <div className="flex flex-col gap-2 relative">

                                                
                                                {/* Manifest Plate - Flat */}
                                                <div className="bg-white/40 p-4 sm:p-5 rounded-[1.25rem] border border-black/5 flex flex-col gap-3.5">
                                                    <h2 className="text-sm sm:text-base font-black text-[#2A2A2A] uppercase italic leading-tight tracking-tight">
                                                        {items[activeLightboxIndex].name}
                                                    </h2>
                                                    <div className="flex flex-wrap items-center gap-3">
                                                        {items[activeLightboxIndex].isTransferred ? (
                                                            <div className="flex items-center gap-2 bg-slate-400/20 border border-slate-400/30 px-3 py-1.5 rounded-full shrink-0">
                                                                <div className="w-2 h-2 rounded-full bg-slate-500 shadow-[0_0_8px_rgba(100,116,139,0.5)]" />
                                                                <span className="text-[8px] font-black text-slate-600 uppercase label-mono tracking-widest">{t('storage.status.transferred')}</span>
                                                            </div>
                                                        ) : items[activeLightboxIndex].isForSale ? (
                                                            <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-full shrink-0">
                                                                <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.6)] animate-pulse" />
                                                                <span className="text-[8px] font-black text-amber-600 uppercase label-mono tracking-widest">{t('storage.status.selling')}</span>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full shrink-0">
                                                                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.6)]" />
                                                                <span className="text-[8px] font-black text-emerald-600 uppercase label-mono tracking-widest">{t('storage.status.activeStock')}</span>
                                                            </div>
                                                        )}

                                                        <div className="hardware-well px-3 py-1.5 rounded-full bg-black/5 flex items-center gap-2 shrink-0">
                                                            <span className="text-[8px] font-black text-black/30 uppercase label-mono tracking-widest">{t('storage.price.purchase')}</span>
                                                            <span className="text-[10px] font-black text-slate-700 italic font-number">
                                                                <span className="text-[8px] opacity-30 mr-0.5">{currencySymbol}</span>
                                                                {items[activeLightboxIndex].purchasePrice?.toLocaleString()}
                                                            </span>
                                                            {items[activeLightboxIndex].purchaseDate && (
                                                                <>
                                                                    <div className="w-px h-2.5 bg-black/10 mx-0.5" />
                                                                    <span className="text-[8px] font-bold text-black/40 label-mono italic opacity-90">{formatDateToZh(items[activeLightboxIndex].purchaseDate)}</span>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {items[activeLightboxIndex].isForSale && !items[activeLightboxIndex].isTransferred && (
                                                        <div className="w-full h-px bg-black/5" />
                                                    )}

                                                    {items[activeLightboxIndex].isForSale && !items[activeLightboxIndex].isTransferred && (
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                                                            <span className="text-[10px] font-black italic text-rose-500 uppercase tracking-tight">
                                                                正在二手转让，转让价格 {currencySymbol}{(items[activeLightboxIndex].resalePrice)?.toLocaleString()}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>


                                            {/* Simplified Data Log - Description Section */}
                                            <div className="flex flex-col gap-2">
                                                <div className="flex items-center gap-2 px-1">
                                                    <Terminal className="w-3 h-3 text-black/20" />
                                                    <span className="text-[9px] font-black uppercase text-black/30 tracking-[0.2em] label-mono">{t('storage.internalLog')}</span>
                                                </div>
                                                <div className="bg-white/40 p-4 rounded-xl border border-black/5 relative overflow-hidden min-h-[60px] max-h-[140px]">
                                                    <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                                                        <Box className="w-12 h-12 text-black/20" />
                                                    </div>
                                                    <p className="text-[#4A4A4A] text-[13px] leading-relaxed font-medium italic opacity-90 whitespace-pre-wrap">
                                                        {items[activeLightboxIndex].notes || t('parent.exhibition.noDescription')}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action Module - Fixed to Chassis */}
                                        <div className="mt-auto pt-6 border-t-2 border-black/5">
                                            {isAdmin ? (
                                                <button 
                                                    onClick={() => {
                                                        const itemToEdit = items[activeLightboxIndex]
                                                        setActiveLightboxIndex(null)
                                                        setEditingItem(itemToEdit)
                                                        setShowItemModal(true)
                                                    }}
                                                    className="hardware-btn group w-full"
                                                >
                                                    <div className="hardware-well relative w-full h-[56px] rounded-xl bg-[#DADBD4] shadow-well active:translate-y-1 transition-all flex items-center justify-center p-1.5">
                                                        <div className="hardware-cap absolute inset-1 bg-amber-500 rounded-lg flex items-center justify-center gap-3 transition-all shadow-cap group-hover:bg-amber-400">
                                                            <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center shadow-inner">
                                                                <Edit3 className="w-4 h-4 text-white" />
                                                            </div>
                                                            <div className="flex flex-col items-start gap-0.5">
                                                                <span className="text-[10px] font-black uppercase tracking-[0.2em] label-mono text-white leading-none">{t('storage.editItem')}</span>
                                                                <span className="text-[6px] font-bold uppercase tracking-[0.1em] text-white/50 label-mono leading-none">Admin_Control_Mode</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </button>
                                            ) : (
                                                <div className="hardware-well bg-black/5 p-6 rounded-2xl border-2 border-black/5 flex flex-col items-center gap-2 opacity-40 grayscale">
                                                    <Lock className="w-6 h-6 text-black" />
                                                    <span className="text-[8px] font-black uppercase tracking-widest label-mono italic text-black">Read_Only_Access_Restriction</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ITEM MODAL (ADD/EDIT) */}
            <AnimatePresence>
                {showItemModal && (
                    <ItemModal 
                        item={editingItem}
                        currencySymbol={currencySymbol}
                        categories={categories}
                        onClose={() => setShowItemModal(false)}
                        onSuccess={() => fetchInitialItems()}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showTagSettings && (
                    <TagSettingsModal 
                        onClose={() => setShowTagSettings(false)} 
                        onRefresh={() => fetchCategories()}
                        categories={categories}
                        items={items}
                    />
                )}
            </AnimatePresence>

            {/* CATEGORY MORE MODAL */}
            <AnimatePresence>
                {showAllCategories && (
                    <CategoryPickerModal 
                        categories={categories}
                        selectedTag={selectedTag}
                        onSelect={(tag) => {
                            handleTagClick(tag)
                            setShowAllCategories(false)
                        }}
                        onClose={() => setShowAllCategories(false)}
                    />
                )}
            </AnimatePresence>
        </div>
    )
}

function ItemModal({ 
    item, 
    currencySymbol, 
    categories,
    onClose, 
    onSuccess 
}: { 
    item: StorageItem | null, 
    currencySymbol: string, 
    categories: {id: string, name: string, emoji?: string | null}[],
    onClose: () => void, 
    onSuccess: () => void 
}) {
    const { t } = useI18n()
    const [name, setName] = useState(item?.name || '')
    const [notes, setNotes] = useState(item?.notes || '')
    const [tags, setTags] = useState<string[]>(item ? JSON.parse(item.tags) : [])
    
    // Multi-image handling
    const [imageUrls, setImageUrls] = useState<string[]>(() => {
        if (!item?.imageUrl) return []
        try {
            if (item.imageUrl.startsWith('[')) {
                return JSON.parse(item.imageUrl)
            }
            return [item.imageUrl]
        } catch {
            return [item.imageUrl]
        }
    })
    
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
    const [activePhotoIdx, setActivePhotoIdx] = useState(0)

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!name || imageUrls.length === 0) return
        setLoading(true)

        try {
            const url = item ? `/api/storage/${item.id}` : '/api/storage'
            const method = item ? 'PUT' : 'POST'
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    name, notes, tags, 
                    imageUrl: JSON.stringify(imageUrls), // Store array as JSON string
                    purchasePrice, resalePrice, purchaseDate, 
                    isForSale, isSynced 
                })
            })
            if (res.ok) {
                onSuccess()
                onClose()
            }
        } catch (_err) {
            console.error(_err)
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
        } catch (_err) {
            console.error(_err)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-[2100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <motion.div
                initial={{ opacity: 0, scale: 0.98, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: 10 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="w-full max-w-5xl relative"
            >
                <div className="baustein-panel w-full bg-[#E2DFD2] rounded-[2.5rem] shadow-2xl relative overflow-hidden border-4 border-[#C8C4B0] flex flex-col max-h-[92vh]">
                    {/* Panel Texture & Screws */}
                    <div className="absolute top-4 left-4 w-1.5 h-1.5 rounded-full bg-slate-900/10 shadow-inner" />
                    <div className="absolute top-4 right-4 w-1.5 h-1.5 rounded-full bg-slate-900/10 shadow-inner" />
                    <div className="absolute bottom-4 left-4 w-1.5 h-1.5 rounded-full bg-slate-900/10 shadow-inner" />
                    <div className="absolute bottom-4 right-4 w-1.5 h-1.5 rounded-full bg-slate-900/10 shadow-inner" />

                    <div className="px-5 py-3 lg:py-4 border-b-2 border-black/5 flex justify-between items-center bg-[#DADBD4]/60 shrink-0 relative">
                        <div className="flex flex-col">
                            <h3 className="text-sm lg:text-base font-black italic tracking-tighter uppercase text-slate-800 flex items-center gap-2">
                                <div className="hardware-well w-7 h-7 lg:w-8 lg:h-8 rounded-lg bg-[#DADBD4] shadow-well relative overflow-hidden">
                                     <div className="hardware-cap absolute inset-1 bg-amber-500 rounded-md flex items-center justify-center">
                                        <Box className="w-3.5 h-3.5 text-white" /> 
                                    </div>
                                </div>
                                {showTransferForm ? t('storage.executeDeployment') : (item ? '物品详情' : t('storage.addItem'))}
                            </h3>
                        </div>
                        <button onClick={onClose} className="hardware-btn group z-50">
                            <div className="hardware-well w-10 h-10 rounded-full bg-[#DADBD4] shadow-well flex items-center justify-center relative overflow-hidden active:translate-y-0.5 transition-all">
                                <div className="hardware-cap absolute inset-1 bg-white group-hover:bg-rose-50 rounded-full shadow-cap transition-all flex items-center justify-center border border-black/5">
                                    <X className="w-5 h-5 text-slate-400 group-hover:text-rose-500 transition-colors" />
                                </div>
                            </div>
                        </button>
                    </div>

                    {!showTransferForm ? (
                        <form onSubmit={handleSave} className="p-5 lg:p-7 flex flex-col gap-4 lg:gap-6 overflow-y-auto lg:overflow-hidden no-scrollbar flex-1 min-h-0">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 h-full">
                                {/* LEFT COLUMN: VISUAL ASSETS */}
                                <div className="flex flex-col gap-4 lg:gap-6 lg:min-h-0">
                                    <div className="flex flex-col gap-2 shrink-0">
                                        <div className="flex items-center justify-between px-2">
                                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] label-mono leading-none">{t('storage.visualConfirmation')}</span>
                                            <div className="h-px flex-1 mx-4 bg-black/5" />
                                            <span className="text-[8px] font-bold text-slate-400 label-mono uppercase">{imageUrls.length} / 20</span>
                                        </div>
                                        <div className="flex flex-col gap-2.5 lg:gap-3">
                                            <div className="relative w-full aspect-[4/3] lg:h-[180px] xl:h-[220px] hardware-well bg-[#D1CDBC] rounded-[2rem] flex items-center justify-center overflow-hidden border-2 border-black/5 p-2">
                                                <div className="relative w-full h-full rounded-[1.5rem] overflow-hidden bg-[#E2DFD2] flex items-center justify-center shadow-inner">
                                                    {imageUrls[activePhotoIdx] ? (
                                                        <>
                                                            <Image src={imageUrls[activePhotoIdx]} fill className="object-contain" alt="Main preview" />
                                                            <button type="button" onClick={() => {
                                                                const next = imageUrls.filter((_, i) => i !== activePhotoIdx)
                                                                setImageUrls(next)
                                                                setActivePhotoIdx(Math.max(0, activePhotoIdx - 1))
                                                            }} className="hardware-btn group absolute top-2 right-2 z-20">
                                                                <div className="hardware-well w-7 h-7 rounded-lg bg-black/10 shadow-well flex items-center justify-center relative overflow-hidden active:translate-y-0.5 transition-all">
                                                                    <div className="hardware-cap absolute inset-0.5 bg-rose-500 group-hover:bg-rose-600 rounded-md shadow-cap transition-all flex items-center justify-center">
                                                                        <Trash className="w-3 h-3 text-white" />
                                                                    </div>
                                                                </div>
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <div className="flex flex-col items-center gap-2 text-slate-400 cursor-pointer group" onClick={() => setShowPhotoPicker(true)}>
                                                            <div className="w-10 h-10 rounded-full bg-[#DADBD4] shadow-well flex items-center justify-center group-hover:scale-110 transition-transform">
                                                                <Camera className="w-5 h-5 opacity-40" />
                                                            </div>
                                                            <span className="text-[8px] font-black uppercase tracking-widest label-mono">{t('storage.establishLink')}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="hardware-well rounded-2xl p-1.5 bg-[#D1CDBC] flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth">
                                                {imageUrls.map((url, idx) => (
                                                    <button key={idx} type="button" onClick={() => setActivePhotoIdx(idx)} className={clsx(
                                                        "w-10 h-10 shrink-0 rounded-lg overflow-hidden border-2 transition-all relative",
                                                        activePhotoIdx === idx ? "border-amber-500 scale-105 shadow-md" : "border-transparent opacity-40 grayscale hover:opacity-100 hover:grayscale-0"
                                                    )}>
                                                        <Image src={url} fill className="object-cover" alt="thumb" />
                                                    </button>
                                                ))}
                                                {imageUrls.length < 20 && (
                                                    <button type="button" onClick={() => setShowPhotoPicker(true)} className="w-10 h-10 shrink-0 rounded-lg border-2 border-dashed border-slate-400/30 bg-black/5 flex items-center justify-center text-slate-400 hover:bg-black/10 transition-colors">
                                                        <Plus className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>

                                            <div className="flex flex-col gap-2 shrink-0 mt-1">
                                                <div className="flex items-center gap-2 px-2">
                                                    <Terminal className="w-3 h-3 text-slate-400" />
                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none label-mono">{t('storage.technicalAnnotations')}</span>
                                                </div>
                                                <div className="hardware-well rounded-2xl p-1.5 bg-[#D1CDBC] shadow-well focus-within:ring-2 focus-within:ring-amber-500/20 transition-all">
                                                    <textarea value={notes} onChange={e => setNotes(e.target.value)} className="w-full bg-white px-4 py-2.5 rounded-xl border border-black/5 outline-none font-medium text-slate-800 text-xs shadow-inner h-20 lg:h-24 resize-none italic transition-all" placeholder="Enter technical notes..." />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* RIGHT COLUMN: METADATA & SPECS */}
                                <div className="flex flex-col lg:min-h-0">
                                    <div className="flex flex-col gap-4 lg:gap-5 flex-1 lg:min-h-0">
                                        {/* TITLE */}
                                        <div className="flex flex-col gap-2 shrink-0">
                                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2 leading-none label-mono">{t('storage.nomenclature')}</label>
                                            <div className="hardware-well rounded-xl p-1 bg-[#D1CDBC] shadow-well focus-within:ring-2 focus-within:ring-amber-500/20 transition-all">
                                                <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-white px-3 h-9 lg:h-10 rounded-lg border border-black/5 outline-none font-black text-slate-800 text-[11px] shadow-inner uppercase tracking-widest transition-all" placeholder="ID_FIELD..." required />
                                            </div>
                                        </div>

                                        {/* CATEGORY (TAGS) */}
                                        <div className="flex flex-col gap-2 shrink-0">
                                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] label-mono pl-2 leading-none">{t('storage.cargoVectors')}</span>
                                            <div className="hardware-well rounded-2xl p-2 bg-[#D1CDBC]">
                                                <div className="flex flex-wrap gap-1.5">
                                                    {categories.map(cat => (
                                                        <button key={cat.id} type="button" onClick={() => setTags(prev => prev.includes(cat.name) ? prev.filter(t => t !== cat.name) : [...prev, cat.name])}
                                                            className={clsx("px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest label-mono transition-all border-2 flex items-center gap-1.5",
                                                                tags.includes(cat.name) ? "bg-slate-900 text-white border-white/10 shadow-md" : "bg-white/90 text-slate-400 border-transparent hover:bg-white")}>
                                                            {cat.emoji && <span className="text-[10px]">{cat.emoji}</span>}
                                                            {cat.name}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        {/* CLUSTER: PRICE & DATE */}
                                        <div className="flex flex-col gap-2 shrink-0">
                                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2 leading-none label-mono">{t('storage.acquisitionCost')}</span>
                                            <div className="grid grid-cols-2 gap-3 xl:gap-4">
                                                <div>
                                                    <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2 pl-2 leading-none label-mono">{t('storage.price.purchaseVal')}</label>
                                                    <div className="hardware-well rounded-2xl p-1.5 bg-[#D1CDBC] shadow-well focus-within:ring-2 focus-within:ring-amber-500/20 transition-all">
                                                        <div className="relative w-full h-11 bg-white rounded-xl shadow-inner border border-black/5 overflow-hidden">
                                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-black italic text-xs z-10">{currencySymbol}</span>
                                                            <input type="number" value={purchasePrice} onChange={e => setPurchasePrice(e.target.value)} className="w-full h-full bg-transparent pl-8 pr-3 outline-none font-black text-slate-800 text-xs uppercase" />
                                                        </div>
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2 pl-2 leading-none label-mono">{t('storage.purchaseDate')}</label>
                                                    <div className="hardware-well rounded-2xl p-1.5 bg-[#D1CDBC] shadow-well">
                                                        <SmartDatePicker 
                                                            value={purchaseDate ? new Date(purchaseDate) : undefined} 
                                                            onSelect={(date) => setPurchaseDate(date ? date.toISOString().split('T')[0] : '')} 
                                                            className="w-full" 
                                                            triggerClassName="!bg-white !border-black/5 !rounded-xl !h-11 !py-0 !px-4 !shadow-inner !font-black !text-xs !text-slate-800"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* MARKET OPTIONS */}
                                        <div className="flex flex-col gap-2 shrink-0 lg:min-h-0">
                                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2 leading-none label-mono">{t('storage.marketAvailability')}</span>
                                            <div className={clsx("hardware-well rounded-2xl p-3.5 bg-[#DADBD4]/40 border border-black/5 space-y-4", isForSale ? "mb-0" : "flex-1")}>
                                                <div className="flex items-center gap-6">
                                                    <button type="button" onClick={() => setIsForSale(!isForSale)} className="hardware-btn group flex items-center gap-3 cursor-pointer">
                                                        <div className={clsx("hardware-well w-8 h-8 rounded-xl shadow-well flex items-center justify-center transition-all shrink-0", isForSale ? "bg-emerald-500" : "bg-white")}>
                                                            {isForSale && <Check className="w-4 h-4 text-white" />}
                                                        </div>
                                                        <div className="flex flex-col items-start leading-none">
                                                            <span className={clsx("text-[9px] font-black uppercase tracking-widest label-mono transition-colors", isForSale ? "text-emerald-700" : "text-slate-400")}>{t('storage.itemListing')}</span>
                                                            <span className="text-[6px] font-bold text-slate-400 uppercase label-mono tracking-tighter mt-0.5">PUB_LIST</span>
                                                        </div>
                                                    </button>
                                                    
                                                    <button type="button" onClick={() => setIsSynced(!isSynced)} className="hardware-btn group flex items-center gap-3 cursor-pointer">
                                                        <div className={clsx("hardware-well w-8 h-8 rounded-xl shadow-well flex items-center justify-center transition-all shrink-0", isSynced ? "bg-blue-500" : "bg-white")}>
                                                            {isSynced && <Cloud className="w-4 h-4 text-white" />}
                                                        </div>
                                                        <div className="flex flex-col items-start leading-none">
                                                            <span className={clsx("text-[9px] font-black uppercase tracking-widest label-mono transition-colors", isSynced ? "text-blue-700" : "text-slate-400")}>{t('storage.dodooExchangeSync')}</span>
                                                            <span className="text-[6px] font-bold text-slate-400 uppercase label-mono tracking-tighter mt-0.5">GLOB_REG</span>
                                                        </div>
                                                    </button>
                                                </div>

                                                {isForSale && (
                                                    <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="pt-2 border-t border-black/5">
                                                        <div className="flex flex-col gap-2.5">
                                                            <div className="flex items-center justify-between px-1">
                                                                <div className="flex items-center gap-2">
                                                                    <div className={clsx(
                                                                        "w-1.5 h-1.5 rounded-full animate-pulse shadow-lg",
                                                                        item?.isTransferred ? "bg-slate-400" : "bg-amber-500"
                                                                    )} />
                                                                    <span className="text-[8px] font-black uppercase tracking-[0.15em] label-mono text-slate-500">
                                                                        {item?.isTransferred ? t('storage.status.transferred') : t('storage.status.onSale')}
                                                                    </span>
                                                                </div>
                                                                <span className="text-[7px] font-black text-rose-500 uppercase label-mono">Target_Val</span>
                                                            </div>

                                                            <div className="hardware-well rounded-xl p-1 bg-[#D1CDBC] shadow-well focus-within:ring-2 focus-within:ring-amber-500/20 transition-all">
                                                                <div className="relative w-full h-11 bg-white rounded-lg shadow-inner border border-black/5 overflow-hidden">
                                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-rose-500 font-black italic text-xs z-10">{currencySymbol}</span>
                                                                    <input type="number" value={resalePrice} onChange={e => setResalePrice(e.target.value)} className="w-full h-full bg-transparent pl-8 pr-3 outline-none font-black text-slate-800 text-lg italic" placeholder="0.00" />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* ACTIONS - AT BOTTOM OF RIGHT COLUMN */}
                                    <div className="mt-4 flex gap-3 lg:gap-4 shrink-0 pt-4 border-t border-black/5">
                                        {item && isForSale && (
                                            <button type="button" onClick={() => setShowTransferForm(true)} className="hardware-btn group w-28 lg:w-32">
                                                <div className="hardware-well h-14 bg-slate-200 rounded-xl flex items-center justify-center shadow-well active:translate-y-1 transition-all relative overflow-hidden">
                                                    <div className="hardware-cap absolute inset-1 bg-slate-50 rounded-lg group-hover:bg-white transition-colors shadow-cap flex flex-col items-center justify-center gap-0.5">
                                                        <span className="text-[10px] font-black uppercase italic text-slate-600">确认转出</span>
                                                        <span className="text-[5px] font-bold uppercase text-slate-400 label-mono">ASSET_OFFLOAD</span>
                                                    </div>
                                                </div>
                                            </button>
                                        )}
                                        <button type="submit" disabled={loading} className="hardware-btn group flex-1">
                                            <div className="hardware-well h-14 bg-amber-500 rounded-xl flex items-center justify-center shadow-well active:translate-y-1 transition-all relative overflow-hidden group-hover:bg-amber-600">
                                                <div className="hardware-cap absolute inset-1 bg-amber-400 rounded-lg group-hover:bg-amber-300 transition-colors shadow-cap flex items-center justify-center gap-2">
                                                    {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Package className="w-4 h-4 text-white" />}
                                                    <span className="text-[12px] font-black text-white uppercase tracking-[0.15em] label-mono italic drop-shadow-sm">{loading ? t('common.processing') : (item ? t('common.save') : t('common.submit'))}</span>
                                                </div>
                                            </div>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </form>
                    ) : ( 
                        <form onSubmit={handleConfirmTransfer} className="p-5 lg:p-7 flex flex-col gap-5 lg:gap-6 lg:overflow-hidden no-scrollbar flex-1 min-h-0">
                            <div className="hardware-well p-4 bg-[#DADBD4]/60 rounded-[2rem] flex items-center gap-5 border border-black/5 shadow-inner shrink-0">
                                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 border-white shadow-md relative shrink-0">
                                    <Image src={imageUrls[0] || ''} fill className="object-cover" alt="" />
                                </div>
                                <div className="flex-1 leading-none">
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                        <span className="text-[10px] font-black text-emerald-700 uppercase tracking-[0.2em] label-mono">Asset_Disposition</span>
                                    </div>
                                    <h4 className="font-black text-slate-800 text-sm sm:text-base tracking-tight uppercase italic">{name}</h4>
                                    <span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest block mt-1 label-mono">Final_Deployment_Stage</span>
                                </div>
                            </div>

                            <div className="flex flex-col gap-4 lg:gap-5 flex-1 lg:min-h-0">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2 mb-1.5 leading-none label-mono">{t('storage.settlementValue')}</label>
                                    <div className="hardware-well rounded-2xl p-1.5 bg-[#D1CDBC] h-16 lg:h-20 flex items-center shadow-well focus-within:ring-2 focus-within:ring-emerald-500/20">
                                        <div className="relative w-full h-full flex items-center bg-white rounded-xl shadow-inner border border-black/5 px-4 overflow-hidden">
                                            <span className="text-emerald-500 font-black italic text-2xl lg:text-3xl mr-1">{currencySymbol}</span>
                                            <input type="number" value={salePrice} onChange={e => setSalePrice(e.target.value)} className="w-full bg-transparent outline-none font-black text-3xl lg:text-4xl text-slate-800 italic tracking-tighter" required placeholder="0.00" />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 lg:gap-5">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2 mb-1.5 leading-none label-mono">Log Date</label>
                                        <div className="hardware-well rounded-2xl p-1.5 bg-[#D1CDBC] h-12 lg:h-14 flex items-center shadow-well">
                                            <SmartDatePicker 
                                                value={transferDate ? new Date(transferDate) : undefined} 
                                                onSelect={(date) => setTransferDate(date ? date.toISOString().split('T')[0] : '')} 
                                                className="w-full" 
                                                triggerClassName="!bg-white !border-black/5 !rounded-xl !h-9 lg:!h-11 !py-0 !px-4 !shadow-inner !font-black !text-xs !text-slate-800"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2 mb-1.5 leading-none label-mono">{t('storage.logisticsVector')}</label>
                                        <div className="hardware-well rounded-2xl p-1.5 bg-[#D1CDBC] h-12 lg:h-14 flex items-center shadow-well">
                                            <div className="w-full h-full bg-white rounded-xl shadow-inner border border-black/5 flex items-center px-3">
                                                <select value={deliveryMethod} onChange={e => setDeliveryMethod(e.target.value)} className="w-full bg-transparent outline-none font-black text-slate-800 text-[9px] lg:text-[10px] uppercase appearance-none cursor-pointer">
                                                    <option value="express">快递物流</option>
                                                    <option value="self-pickup">上门自提</option>
                                                    <option value="meetup">同城面交</option>
                                                </select>
                                                <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2 mb-1.5 leading-none label-mono">{t('storage.consigneeRef')}</label>
                                    <div className="hardware-well rounded-2xl p-1.5 bg-[#D1CDBC] h-12 lg:h-14 flex items-center shadow-well focus-within:ring-2 focus-within:ring-amber-500/20">
                                        <input type="text" value={buyerId} onChange={e => setBuyerId(e.target.value)} className="w-full bg-white px-4 h-9 lg:h-11 rounded-xl border border-black/5 outline-none font-black text-slate-800 text-xs shadow-inner uppercase tracking-widest placeholder:text-slate-200" placeholder="RECIPIENT_ID..." />
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 flex gap-3 h-12 lg:h-14 shrink-0 pt-4 border-t border-black/5">
                                <button type="button" onClick={() => setShowTransferForm(false)} className="hardware-btn group w-24 lg:w-28">
                                    <div className="hardware-well h-full bg-[#DADBD4] rounded-xl flex items-center justify-center shadow-well active:translate-y-1 transition-all">
                                        <span className="text-[10px] font-black uppercase text-slate-500 italic">Back</span>
                                    </div>
                                </button>
                                <button type="submit" disabled={loading} className="hardware-btn group flex-1">
                                    <div className="hardware-well h-full bg-emerald-500 rounded-xl flex items-center justify-center shadow-well active:translate-y-1 transition-all relative overflow-hidden group-hover:bg-emerald-600">
                                         <div className="hardware-cap absolute inset-1 bg-emerald-400 rounded-lg group-hover:bg-emerald-300 transition-colors shadow-cap flex items-center justify-center gap-2">
                                            {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <ShieldCheck className="w-4 h-4 text-white" />}
                                            <span className="text-[12px] font-black text-white uppercase tracking-[0.15em] label-mono italic drop-shadow-sm">{loading ? t('common.processing') : t('storage.executeDeployment')}</span>
                                        </div>
                                    </div>
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </motion.div>

            <AnimatePresence>
                {showPhotoPicker && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="w-full max-w-sm baustein-panel bg-[#E2DFD2] border-4 border-[#C8C4B0] p-6 lg:p-8 flex flex-col gap-6 relative shadow-2xl"
                        >
                            {/* Panel Screws */}
                            <div className="absolute top-2 left-2 w-1.5 h-1.5 rounded-full bg-black/10" />
                            <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-black/10" />
                            <div className="absolute bottom-2 left-2 w-1.5 h-1.5 rounded-full bg-black/10" />
                            <div className="absolute bottom-2 right-2 w-1.5 h-1.5 rounded-full bg-black/10" />

                            <button onClick={() => setShowPhotoPicker(false)} className="absolute top-4 right-4 hardware-btn group z-50">
                                <div className="hardware-well w-8 h-8 rounded-full bg-[#DADBD4] shadow-well flex items-center justify-center relative overflow-hidden active:translate-y-0.5 transition-all">
                                    <div className="hardware-cap absolute inset-0.5 bg-white group-hover:bg-rose-50 rounded-full shadow-cap transition-all flex items-center justify-center border border-black/5">
                                        <X className="w-4 h-4 text-slate-400 group-hover:text-rose-500 transition-colors" />
                                    </div>
                                </div>
                            </button>

                            <div className="flex flex-col gap-1 text-center">
                                <h3 className="text-xl font-black italic text-slate-800 uppercase tracking-tighter">图片上传</h3>
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Select Input Vector</span>
                            </div>
                            <div className="flex flex-col gap-4">
                                <label className="hardware-btn group cursor-pointer inline-block w-full">
                                    <input type="file" accept="image/*" capture="environment" className="hidden" onChange={async (e) => {
                                        const file = e.target.files?.[0]
                                        if (file) {
                                            const formData = new FormData()
                                            formData.append('file', file)
                                            formData.append('type', 'IMAGE')
                                            try {
                                                setLoading(true)
                                                const res = await fetch('/api/media/upload', { method: 'POST', body: formData })
                                                const data = await res.json()
                                                if (data.path) {
                                                    setImageUrls(prev => {
                                                        const next = [...prev, data.path].slice(0, 20)
                                                        setActivePhotoIdx(next.length - 1)
                                                        return next
                                                    })
                                                    setShowPhotoPicker(false)
                                                }
                                            } catch (err) { console.error(err) }
                                            finally { setLoading(false) }
                                        }
                                    }} />
                                    <div className="hardware-well h-16 bg-[#DADBD4] rounded-xl flex items-center justify-center p-1.5 shadow-well">
                                        <div className="w-full h-full bg-white hover:bg-slate-50 flex items-center justify-center gap-3 rounded-lg transition-colors">
                                            <Camera className="w-5 h-5 text-slate-400" />
                                            <span className="text-xs font-black uppercase text-slate-800 italic">拍摄图片</span>
                                        </div>
                                    </div>
                                </label>
                                <label className="hardware-btn group cursor-pointer inline-block w-full">
                                    <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                                        const file = e.target.files?.[0]
                                        if (file) {
                                            const formData = new FormData()
                                            formData.append('file', file)
                                            formData.append('type', 'IMAGE')
                                            try {
                                                setLoading(true)
                                                const res = await fetch('/api/media/upload', { method: 'POST', body: formData })
                                                const data = await res.json()
                                                if (data.path) {
                                                    setImageUrls(prev => {
                                                        const next = [...prev, data.path].slice(0, 20)
                                                        setActivePhotoIdx(next.length - 1)
                                                        return next
                                                    })
                                                    setShowPhotoPicker(false)
                                                }
                                            } catch (err) { console.error(err) }
                                            finally { setLoading(false) }
                                        }
                                    }} />
                                    <div className="hardware-well h-16 bg-[#DADBD4] rounded-xl flex items-center justify-center p-1.5 shadow-well">
                                        <div className="w-full h-full bg-white hover:bg-slate-50 flex items-center justify-center gap-3 rounded-lg transition-colors">
                                            <Upload className="w-5 h-5 text-slate-400" />
                                            <span className="text-xs font-black uppercase text-slate-800 italic">本地相册</span>
                                        </div>
                                    </div>
                                </label>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}

const COMMON_EMOJIS = ["📦", "🛠️", "🧼", "👕", "📚", "🍽️", "🧸", "🔌", "🎨", "💊", "👟", "🗝️", "👜", "📎", "📁"]

function TagSettingsModal({ onClose, categories, onRefresh, items }: { 
    onClose: () => void, 
    categories: StorageCategory[], 
    items: StorageItem[],
    onRefresh: () => void 
}) {
    const [newTagName, setNewTagName] = useState('')
    const [newEmoji, setNewEmoji] = useState('📦')
    const [loading, setLoading] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editName, setEditName] = useState('')
    const [editEmoji, setEditEmoji] = useState('')
    const [showEmojiPicker, setShowEmojiPicker] = useState(false)

    // Derive tag counts from items
    const getTagCount = (name: string) => {
        return items.filter(item => {
            try {
                const tags = JSON.parse(item.tags || '[]')
                return Array.isArray(tags) && tags.includes(name)
            } catch { return false }
        }).length
    }

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newTagName.trim()) return
        setLoading(true)
        try {
            const res = await fetch('/api/storage/categories', {
                method: 'POST',
                body: JSON.stringify({ 
                    name: newTagName.trim(),
                    emoji: newEmoji
                })
            })
            if (res.ok) {
                setNewTagName('')
                setNewEmoji('📦')
                onRefresh() // Refresh the list but keep modal open
            }
        } finally {
            setLoading(false)
        }
    }

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!editName.trim() || !editingId) return
        setLoading(true)
        try {
            const res = await fetch('/api/storage/categories', {
                method: 'PUT',
                body: JSON.stringify({ id: editingId, name: editName.trim(), emoji: editEmoji })
            })
            if (res.ok) {
                setEditingId(null)
                onRefresh()
            }
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('确定要删除这个分类吗？这不会删除物品，但物品将失去该标签。')) return
        setLoading(true)
        try {
            const res = await fetch(`/api/storage/categories?id=${id}`, { method: 'DELETE' })
            if (!res.ok) {
                const data = await res.json()
                alert(data.error || '删除失败')
            } else {
                onRefresh() // Refresh instead of close
            }
        } finally {
            setLoading(false)
        }
    }

    const startEdit = (cat: StorageCategory) => {
        setEditingId(cat.id)
        setEditName(cat.name)
        setEditEmoji(cat.emoji || '📦')
    }

    return (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="w-full max-w-xl baustein-panel bg-[#E2DFD2] border-4 border-[#C8C4B0] p-6 lg:p-8 flex flex-col gap-6 relative shadow-2xl"
                onClick={e => e.stopPropagation()}
            >
                <button onClick={onClose} className="absolute top-4 right-4 hardware-btn group">
                    <div className="hardware-well w-10 h-10 rounded-full bg-[#DADBD4] shadow-well flex items-center justify-center relative overflow-hidden active:translate-y-0.5 transition-all">
                        <div className="hardware-cap absolute inset-1 bg-white group-hover:bg-rose-50 rounded-full shadow-cap transition-all flex items-center justify-center border border-black/5">
                            <X className="w-5 h-5 text-slate-400 group-hover:text-rose-500 transition-colors" />
                        </div>
                    </div>
                </button>

                <div className="flex flex-col gap-1">
                    <h3 className="text-xl font-black italic text-slate-800 uppercase tracking-tighter">分类目录管理</h3>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Master Taxonomy Matrix</span>
                </div>

                <form onSubmit={editingId ? handleUpdate : handleAdd} className="bg-black/5 p-3 rounded-2xl flex flex-col gap-3 border border-black/5 relative">
                    <div className="flex gap-2 items-center">
                        {/* Emoji Picker Trigger */}
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                className="w-14 hardware-btn group"
                            >
                                <div className="hardware-well h-11 rounded-xl p-1 bg-[#D1CDBC] shadow-well flex items-center justify-center active:translate-y-0.5 transition-all">
                                    <div className="hardware-cap absolute inset-0.5 bg-white group-hover:bg-amber-50 rounded-lg shadow-cap flex items-center justify-center text-xl">
                                        {editingId ? editEmoji : newEmoji}
                                    </div>
                                </div>
                            </button>

                            {showEmojiPicker && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="absolute top-full left-0 mt-2 p-3 bg-white rounded-xl shadow-2xl border-2 border-slate-100 z-[1000] grid grid-cols-5 gap-1.5 min-w-[180px]"
                                >
                                    {COMMON_EMOJIS.map(emoji => (
                                        <button
                                            key={emoji}
                                            type="button"
                                            onClick={() => {
                                                if (editingId) setEditEmoji(emoji)
                                                else setNewEmoji(emoji)
                                                setShowEmojiPicker(false)
                                            }}
                                            className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-amber-50 hover:scale-110 transition-all text-lg"
                                        >
                                            {emoji}
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </div>

                        {/* Name Input */}
                        <div className="hardware-well flex-1 rounded-xl p-1 bg-[#D1CDBC] shadow-well">
                            <input 
                                type="text" 
                                value={editingId ? editName : newTagName}
                                onChange={e => editingId ? setEditName(e.target.value) : setNewTagName(e.target.value)}
                                placeholder="名称 (Name)..."
                                className="w-full bg-white px-4 h-9 rounded-lg border border-black/5 outline-none font-black text-slate-800 text-xs uppercase shadow-inner italic tracking-tight"
                            />
                        </div>

                        {/* Submit Button */}
                        <button type="submit" disabled={loading} className="hardware-btn group w-32 shrink-0">
                            <div className={clsx(
                                "hardware-well h-11 px-6 rounded-xl flex items-center justify-center shadow-well active:translate-y-1 transition-all relative overflow-hidden",
                                editingId ? "bg-amber-500 hover:bg-amber-600" : "bg-slate-900 lg:bg-slate-800"
                            )}>
                                <div className={clsx(
                                    "hardware-cap absolute inset-0.5 rounded-lg shadow-cap flex items-center justify-center gap-2 px-4 border border-white/10",
                                    editingId ? "bg-amber-400" : "bg-slate-800 group-hover:bg-slate-900"
                                )}>
                                    <Check className="w-3.5 h-3.5 text-white" />
                                    <span className="text-[10px] font-black text-white uppercase italic tracking-tighter shrink-0">
                                        {editingId ? "确认修改" : "新增分类"}
                                    </span>
                                </div>
                            </div>
                        </button>
                    </div>
                    
                    {editingId && (
                        <div className="flex justify-start px-2">
                            <button 
                                type="button" 
                                onClick={() => setEditingId(null)}
                                className="text-[9px] font-black uppercase text-rose-400 hover:text-rose-600 hover:underline transition-all italic underline-offset-4"
                            >
                                取消编辑 (Cancel Edit)
                            </button>
                        </div>
                    )}
                </form>

                <div className="hardware-well bg-white/60 p-5 rounded-2xl border border-black/5 max-h-[400px] overflow-y-auto no-scrollbar shadow-inner relative">
                    <div className="flex flex-wrap gap-2.5">
                        {categories.length === 0 ? (
                            <div className="w-full text-center py-12 text-slate-400 text-[10px] font-black uppercase tracking-widest italic opacity-40">Zero Classifications Found</div>
                        ) : (
                            categories.map(cat => (
                                <div 
                                    key={cat.id} 
                                    className={clsx(
                                        "flex items-center gap-0.5 rounded-[10px] border-2 transition-all group overflow-hidden",
                                        editingId === cat.id ? "border-amber-400 shadow-md scale-[1.02]" : "border-slate-200 bg-white shadow-sm hover:border-slate-300"
                                    )}
                                >
                                    <div className="flex items-center gap-2 pl-3 pr-2 py-2 border-r border-slate-100 bg-slate-50/50">
                                        <span className="text-sm">{cat.emoji || '📦'}</span>
                                        <div className="flex flex-col">
                                            <span className="text-[11px] font-black text-slate-800 uppercase italic leading-none">{cat.name}</span>
                                            <span className="text-[8px] font-black text-slate-300 uppercase italic tracking-widest mt-1 opacity-70">
                                                {getTagCount(cat.name)} Items
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-0.5 px-1.5 py-1">
                                        <button 
                                            onClick={() => startEdit(cat)} 
                                            className="p-1.5 text-slate-300 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-all"
                                            title="Edit"
                                        >
                                            <Edit3 className="w-3.5 h-3.5" />
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(cat.id)} 
                                            className="p-1.5 text-slate-200 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                            title="Delete"
                                        >
                                            <Trash className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    )
}

function CategoryPickerModal({ categories, selectedTag, onSelect, onClose }: { 
    categories: StorageCategory[], 
    selectedTag: string | null, 
    onSelect: (tag: string | null) => void, 
    onClose: () => void 
}) {
    return (
        <div className="fixed inset-0 z-[4000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md" onClick={onClose}>
            <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="w-full max-w-lg baustein-panel bg-[#E2DFD2] border-4 border-[#C8C4B0] p-6 lg:p-8 flex flex-col gap-6 relative shadow-2xl"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center">
                    <div className="flex flex-col">
                        <h3 className="text-xl font-black italic text-slate-800 uppercase tracking-tighter">分类目录</h3>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Global Taxonomy Explorer</span>
                    </div>
                    <button onClick={onClose} className="hardware-btn group">
                        <div className="hardware-well w-10 h-10 rounded-full bg-[#DADBD4] shadow-well flex items-center justify-center relative overflow-hidden active:translate-y-0.5 transition-all">
                            <div className="hardware-cap absolute inset-1 bg-white group-hover:bg-rose-50 rounded-full shadow-cap transition-all flex items-center justify-center border border-black/5">
                                <X className="w-5 h-5 text-slate-400 group-hover:text-rose-500 transition-colors" />
                            </div>
                        </div>
                    </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[60vh] overflow-y-auto no-scrollbar pb-2">
                    <button
                        onClick={() => onSelect(null)}
                        className={clsx(
                            "px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border-2 text-center",
                            !selectedTag 
                                ? "bg-slate-900 text-white border-slate-800 shadow-md" 
                                : "bg-white/80 text-slate-400 border-white/40 hover:bg-white"
                        )}
                    >
                        全部物品
                    </button>
                    {categories.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => onSelect(cat.name)}
                            className={clsx(
                                "px-4 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all border-2 flex items-center justify-center gap-2 shadow-sm min-w-0",
                                selectedTag === cat.name
                                    ? "bg-slate-900 text-white border-slate-800 shadow-md scale-[1.02]" 
                                    : "bg-white/80 text-slate-400 border-white/40 hover:bg-white hover:border-white/60"
                            )}
                        >
                            {cat.emoji && <span className="text-sm shrink-0">{cat.emoji}</span>}
                            <span className="truncate w-full">{cat.name}</span>
                        </button>
                    ))}
                </div>
            </motion.div>
        </div>
    )
}
