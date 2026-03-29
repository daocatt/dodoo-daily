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
  Camera,
  Download,
  X,
  ChevronRight,
  Filter,
  Check,
  Box,
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

    useEffect(() => {
        setActivePhotoInLightboxIdx(0)
    }, [activeLightboxIndex])

    const { t } = useI18n()

    // Drag-to-scroll logic for category area
    const scrollRef = React.useRef<HTMLDivElement>(null)
    const [isDragging, setIsDragging] = useState(false)
    const [startX, setStartX] = useState(0)
    const [scrollLeft, setScrollLeft] = useState(0)
    const [hasMoved, setHasMoved] = useState(false)

    const handleMouseDown = (e: React.MouseEvent) => {
        if (!scrollRef.current) return
        setIsDragging(true)
        setStartX(e.pageX - scrollRef.current.offsetLeft)
        setScrollLeft(scrollRef.current.scrollLeft)
        setHasMoved(false)
    }

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging || !scrollRef.current) return
        e.preventDefault()
        const x = e.pageX - scrollRef.current.offsetLeft
        const walk = (x - startX) * 2
        if (Math.abs(walk) > 5) setHasMoved(true)
        scrollRef.current.scrollLeft = scrollLeft - walk
    }

    const handleMouseUpOrLeave = () => {
        setIsDragging(false)
    }

    const handleTagClick = (tag: string | null) => {
        if (hasMoved) return // Prevent click if we were dragging
        if (tag === null) {
            setSelectedTag(null)
            fetchInitialItems()
        } else {
            handleToggleTag(tag)
        }
    }


    const fetchInitialItems = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/storage?page=1&limit=20')
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
                
                {/* Header Filter Section - System Baustein 3.0ized */}
                <div className="w-[calc(100%-4px)] mx-auto baustein-panel bg-[#E6E2D1] rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] md:shadow-[0_40px_120px_-30px_rgba(0,0,0,0.2)] border-4 border-[#C8C4B0] relative overflow-hidden flex flex-col lg:flex-row p-6 md:p-10 gap-8 lg:gap-12 transition-all">
                    {/* Decorative Hardware Elements */}
                    <div className="absolute top-4 left-4 w-1.5 h-1.5 rounded-full bg-black/10 shadow-inner" />
                    <div className="absolute top-4 right-4 w-1.5 h-1.5 rounded-full bg-black/10 shadow-inner" />
                    <div className="absolute bottom-4 left-4 w-1.5 h-1.5 rounded-full bg-black/10 shadow-inner" />
                    <div className="absolute bottom-4 right-4 w-1.5 h-1.5 rounded-full bg-black/10 shadow-inner" />

                    {/* Search Matrix Column */}
                    <div className="flex-1 flex flex-col gap-4 relative">
                        <div className="flex items-center justify-between px-1">
                            <div className="flex items-center gap-2.5">
                                <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.6)] animate-pulse" />
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] label-mono">Search Matrix & Scope</span>
                            </div>
                            <div className="hidden sm:flex items-center gap-2">
                                <div className="h-0.5 w-12 bg-black/5 rounded-full" />
                                <span className="text-[8px] font-bold text-slate-300 uppercase label-mono">Query: {search ? 'Active' : 'Standby'}</span>
                            </div>
                        </div>

                        <form onSubmit={handleSearch} className="relative group w-full">
                            <div className="hardware-well rounded-2xl p-2 bg-[#D1CDBC] shadow-well transition-all group-focus-within:bg-[#C8C4B0]">
                                <div className="relative flex items-center bg-white/95 rounded-xl border-2 border-black/5 overflow-hidden shadow-inner">
                                    <div className="absolute left-4 w-8 h-8 flex items-center justify-center opacity-40 group-focus-within:opacity-100 transition-opacity">
                                        <Search className="w-5 h-5 text-slate-900 group-focus-within:text-amber-500 transition-colors" />
                                    </div>
                                    <input 
                                        type="text" 
                                        placeholder={t('storage.searchPlaceholder')} 
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="w-full bg-transparent py-5 pl-14 pr-12 outline-none font-black text-slate-800 text-sm md:text-base placeholder:text-slate-300 transition-all uppercase tracking-tight"
                                    />
                                    {search && (
                                        <button 
                                            type="button" 
                                            onClick={() => { setSearch(''); fetchInitialItems(); }}
                                            className="absolute right-4 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-black/5 text-slate-300 hover:text-rose-500 transition-all"
                                        >
                                            <XCircle className="w-5 h-5" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </form>
                    </div>

                    {/* Integrated Divider (Desktop) */}
                    <div className="hidden lg:block w-px self-stretch bg-gradient-to-b from-transparent via-black/5 to-transparent mx-2" />

                    {/* Category Filter Column */}
                    <div className="flex flex-col gap-4 lg:w-[480px]">
                        <div className="flex items-center justify-between px-1">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 hardware-well rounded-lg flex items-center justify-center bg-white/50">
                                    <Filter className="w-4 h-4 text-slate-500" />
                                </div>
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] label-mono">Categorical Node</span>
                            </div>
                            {selectedTag && (
                                <button 
                                    onClick={() => handleToggleTag(selectedTag)}
                                    className="text-[9px] font-black text-rose-500 uppercase tracking-widest hover:underline label-mono"
                                >
                                    Reset
                                </button>
                            )}
                        </div>

                        <div className="hardware-well rounded-2xl p-2 bg-[#D1CDBC] shadow-well">
                            <div 
                                ref={scrollRef}
                                onMouseDown={handleMouseDown}
                                onMouseMove={handleMouseMove}
                                onMouseUp={handleMouseUpOrLeave}
                                onMouseLeave={handleMouseUpOrLeave}
                                className={clsx(
                                    "flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth p-0.5 select-none",
                                    isDragging ? "cursor-grabbing" : "cursor-grab"
                                )}
                            >
                                <button
                                    onClick={() => handleTagClick(null)}
                                    className={clsx(
                                        "px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest label-mono transition-all shrink-0 border-2 flex items-center gap-2",
                                        !selectedTag 
                                            ? "bg-slate-900 text-white border-white/20 shadow-lg scale-[1.02]" 
                                            : "bg-white/90 text-slate-500 border-transparent hover:bg-white"
                                    )}
                                >
                                    <LayoutGrid className="w-3.5 h-3.5" />
                                    ALL
                                </button>

                                <div className="w-px h-6 bg-black/5 mx-1 shrink-0" />

                                {PRESET_TAGS.map(tag => {
                                    const TagIcon = TAG_ICONS[tag] || Hash
                                    return (
                                        <button
                                            key={tag}
                                            onClick={() => handleTagClick(tag)}
                                            className={clsx(
                                                "px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest label-mono transition-all shrink-0 border-2 flex items-center gap-2.5",
                                                selectedTag === tag 
                                                    ? "bg-amber-500 text-white border-white/20 shadow-lg scale-[1.02] translate-y-0.5" 
                                                    : "bg-white/90 text-slate-500 border-transparent hover:bg-white"
                                            )}
                                        >
                                            <TagIcon className={clsx("w-3.5 h-3.5 transition-transform", selectedTag === tag ? "scale-110" : "opacity-40")} />
                                            {tag}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
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
                                    <div className="hardware-well p-2.5 rounded-[2.2rem] bg-[#DADBD4] shadow-well relative">
                                        <div 
                                            onClick={() => setActiveLightboxIndex(idx)}
                                            className="relative aspect-square rounded-[1.8rem] overflow-hidden cursor-pointer border-2 border-white/40 shadow-sm transition-all bg-slate-100"
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
                                        {t('parent.exhibition.exhibitsDetail')}
                                    </h3>
                                </div>
                                <button onClick={() => setActiveLightboxIndex(null)} className="hardware-btn group z-50">
                                    <div className="hardware-well w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-[#DADBD4] shadow-well flex items-center justify-center relative overflow-hidden active:translate-y-0.5 transition-all">
                                        <div className="hardware-cap absolute inset-1.5 bg-white group-hover:bg-rose-50 rounded-lg shadow-cap transition-all flex items-center justify-center border border-black/5">
                                            <X className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 group-hover:text-rose-500 transition-colors" />
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
                                                <div className="bg-white/40 p-4 sm:p-5 rounded-[1.25rem] border border-black/5 flex flex-col gap-3">
                                                    <h2 className="text-2xl sm:text-3xl font-black text-[#2A2A2A] uppercase italic leading-tight tracking-tighter">
                                                        {items[activeLightboxIndex].name}
                                                    </h2>
                                                    <div className="flex items-center gap-3">
                                                        {items[activeLightboxIndex].isTransferred ? (
                                                            <div className="flex items-center gap-2 bg-slate-400/20 border border-slate-400/30 px-3 py-1.5 rounded-full">
                                                                <div className="w-2 h-2 rounded-full bg-slate-500 shadow-[0_0_8px_rgba(100,116,139,0.5)]" />
                                                                <span className="text-[8px] font-black text-slate-600 uppercase label-mono tracking-widest">{t('storage.status.transferred')}</span>
                                                            </div>
                                                        ) : items[activeLightboxIndex].isForSale ? (
                                                            <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-full">
                                                                <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.6)] animate-pulse" />
                                                                <span className="text-[8px] font-black text-amber-600 uppercase label-mono tracking-widest">{t('storage.status.selling')}</span>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full">
                                                                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.6)]" />
                                                                <span className="text-[8px] font-black text-emerald-600 uppercase label-mono tracking-widest">{t('storage.status.activeStock')}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="bg-white/40 p-5 rounded-2xl border border-black/5 group transition-all">
                                                    <span className="text-[10px] font-bold text-black/40 label-mono block mb-2">{t('storage.price.purchaseVal')}</span>
                                                    <span className="text-2xl font-black text-[#2A2A2A] font-number italic">
                                                        <span className="text-xs opacity-30 mr-1.5">{currencySymbol}</span>
                                                        {items[activeLightboxIndex].purchasePrice?.toLocaleString()}
                                                    </span>
                                                </div>
                                                <div className="bg-white/40 p-5 rounded-2xl border border-black/5 group transition-all">
                                                    <span className="text-[10px] font-bold text-black/40 label-mono block mb-2">{t('storage.price.marketTarget')}</span>
                                                    <span className={clsx(
                                                        "text-2xl font-black font-number italic",
                                                        items[activeLightboxIndex].isTransferred ? "text-emerald-600" : "text-amber-600"
                                                    )}>
                                                        <span className="text-xs opacity-30 mr-1.5">{currencySymbol}</span>
                                                        {(items[activeLightboxIndex].actualSalePrice || items[activeLightboxIndex].resalePrice)?.toLocaleString()}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Simplified Data Log - Description Section */}
                                            <div className="flex flex-col gap-2">
                                                <div className="flex items-center gap-2 px-1">
                                                    <Terminal className="w-3 h-3 text-black/20" />
                                                    <span className="text-[9px] font-black uppercase text-black/30 tracking-[0.2em] label-mono">{t('storage.internalLog')}</span>
                                                </div>
                                                <div className="bg-white/40 p-4 rounded-xl border border-black/5 relative overflow-y-auto min-h-[60px] max-h-[140px] no-scrollbar">
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
                        onClose={() => setShowItemModal(false)}
                        onSuccess={() => fetchInitialItems()}
                    />
                )}
            </AnimatePresence>
        </div>
    )
}

function ItemModal({ 
    item, 
    currencySymbol, 
    onClose, 
    onSuccess 
}: { 
    item: StorageItem | null, 
    currencySymbol: string, 
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

    const _handleDelete = async () => {
        if (!item || !window.confirm('Delete this item?')) return
        setLoading(true)
        try {
            const res = await fetch(`/api/storage/${item.id}`, { method: 'DELETE' })
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
        <div className="fixed inset-0 z-[2100] flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-md overflow-y-auto pt-4 sm:pt-10 pb-4 sm:pb-10">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="w-full max-w-5xl relative"
            >
                <div className="baustein-panel w-full bg-[#E2DFD2] rounded-[1.5rem] sm:rounded-[2.5rem] shadow-2xl relative overflow-hidden border-4 border-[#C8C4B0] flex flex-col max-h-[98vh] sm:max-h-[96vh]">
                    <div className="px-6 py-4 sm:py-5 border-b-2 border-black/5 flex justify-between items-center bg-[#DADBD4]/60 shrink-0 relative">
                        <div className="flex flex-col">
                            <h3 className="text-sm sm:text-lg font-black italic tracking-tighter uppercase text-slate-800 flex items-center gap-2">
                                <Box className="w-5 h-5 text-amber-500" /> 
                                {showTransferForm ? t('storage.executeDeployment') : (item ? t('storage.editItem') : t('storage.initializeShipment'))}
                            </h3>
                        </div>
                        <button onClick={onClose} className="hardware-btn group absolute top-3 sm:top-4 right-3 sm:right-5 z-50">
                            <div className="hardware-well w-10 h-10 rounded-xl bg-[#DADBD4] shadow-well flex items-center justify-center relative overflow-hidden active:translate-y-0.5 transition-all">
                                <div className="hardware-cap absolute inset-1.5 bg-white group-hover:bg-rose-50 rounded-lg shadow-cap transition-all flex items-center justify-center border border-black/5">
                                    <X className="w-5 h-5 text-slate-400 group-hover:text-rose-500 transition-colors" />
                                </div>
                            </div>
                        </button>
                    </div>

                    {!showTransferForm ? (
                        <form onSubmit={handleSave} className="p-4 sm:p-6 flex flex-col gap-4 overflow-y-auto hide-scrollbar flex-1 min-h-0">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8 h-full">
                                {/* LEFT COLUMN: VISUAL ASSETS */}
                                <div className="flex flex-col gap-4">
                                    <div className="flex flex-col gap-2 shrink-0">
                                        <div className="flex items-center justify-between px-2">
                                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] label-mono leading-none">{t('storage.visualConfirmation')}</span>
                                            <span className="text-[8px] font-bold text-slate-400 label-mono uppercase">{imageUrls.length} / 20</span>
                                        </div>
                                        <div className="flex flex-col gap-3">
                                            <div className="relative w-full h-32 sm:h-[240px] md:h-[280px] hardware-well bg-[#D1CDBC] rounded-2xl flex items-center justify-center overflow-hidden border border-black/5 p-2">
                                                <div className="relative w-full h-full rounded-xl overflow-hidden bg-[#E2DFD2] flex items-center justify-center shadow-inner">
                                                    {imageUrls[activePhotoIdx] ? (
                                                        <>
                                                            <Image src={imageUrls[activePhotoIdx]} fill className="object-contain" alt="Main preview" />
                                                            <button type="button" onClick={() => {
                                                                const next = imageUrls.filter((_, i) => i !== activePhotoIdx)
                                                                setImageUrls(next)
                                                                setActivePhotoIdx(Math.max(0, activePhotoIdx - 1))
                                                            }} className="hardware-btn group absolute top-2 right-2 z-20">
                                                                <div className="hardware-well w-8 h-8 rounded-lg bg-black/10 shadow-well flex items-center justify-center relative overflow-hidden active:translate-y-0.5 transition-all">
                                                                    <div className="hardware-cap absolute inset-1 bg-rose-500 group-hover:bg-rose-600 rounded-md shadow-cap transition-all flex items-center justify-center">
                                                                        <Trash className="w-3.5 h-3.5 text-white" />
                                                                    </div>
                                                                </div>
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <div className="flex flex-col items-center gap-2 text-slate-400 cursor-pointer" onClick={() => setShowPhotoPicker(true)}>
                                                            <Camera className="w-8 h-8 animate-pulse" />
                                                            <span className="text-[9px] font-black uppercase tracking-widest label-mono">{t('storage.establishLink')}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="hardware-well rounded-xl p-2 bg-[#D1CDBC] flex items-center gap-2 overflow-x-auto hide-scrollbar scroll-smooth">
                                                {imageUrls.map((url, idx) => (
                                                    <button key={idx} type="button" onClick={() => setActivePhotoIdx(idx)} className={clsx(
                                                        "w-12 h-12 shrink-0 rounded-lg overflow-hidden border-2 transition-all relative",
                                                        activePhotoIdx === idx ? "border-amber-500 scale-105" : "border-transparent opacity-60 grayscale hover:opacity-100 hover:grayscale-0"
                                                    )}>
                                                        <Image src={url} fill className="object-cover" alt="thumb" />
                                                    </button>
                                                ))}
                                                {imageUrls.length < 20 && (
                                                    <button type="button" onClick={() => setShowPhotoPicker(true)} className="w-12 h-12 shrink-0 rounded-lg border border-dashed border-slate-400 bg-black/5 flex items-center justify-center text-slate-400">
                                                        <Plus className="w-5 h-5" />
                                                    </button>
                                                )}
                                            </div>

                                            <div className="flex flex-col gap-1.5 shrink-0 mt-1">
                                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2 leading-none label-mono">{t('storage.technicalAnnotations')}</span>
                                                <div className="hardware-well rounded-xl p-1.5 bg-[#D1CDBC] shadow-well focus-within:ring-2 focus-within:ring-amber-500/20 transition-all">
                                                    <textarea value={notes} onChange={e => setNotes(e.target.value)} className="w-full bg-white px-4 py-3 rounded-lg border border-black/5 outline-none font-medium text-slate-800 text-[11px] shadow-cap h-16 sm:h-20 md:h-[100px] resize-none italic transition-all" placeholder="SYSTEM NOTES..." />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* RIGHT COLUMN: METADATA & SPECS */}
                                <div className="flex flex-col gap-3 h-full overflow-hidden">
                                    {/* CATEGORY (TAGS) - TOP */}
                                    <div className="flex flex-col gap-1.5 shrink-0">
                                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] label-mono pl-2 leading-none">{t('storage.cargoVectors')}</span>
                                        <div className="hardware-well rounded-xl p-1.5 bg-[#D1CDBC]">
                                            <div className="flex flex-wrap gap-1.5">
                                                {PRESET_TAGS.map(tag => (
                                                    <button key={tag} type="button" onClick={() => setTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])}
                                                        className={clsx("px-2.5 py-1 rounded-md text-[8px] font-black uppercase tracking-widest label-mono transition-all border-2",
                                                            tags.includes(tag) ? "bg-amber-500 text-white border-white/20 shadow-sm" : "bg-white/80 text-slate-400 border-transparent hover:bg-white")}>
                                                        {tag}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* TITLE */}
                                    <div className="flex flex-col gap-2 shrink-0">
                                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2 leading-none label-mono">{t('storage.nomenclature')}</label>
                                        <div className="hardware-well rounded-xl p-1.5 bg-[#D1CDBC] shadow-well focus-within:ring-2 focus-within:ring-amber-500/20 transition-all">
                                            <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-white px-4 h-11 rounded-lg border border-black/5 outline-none font-black text-slate-800 text-sm shadow-cap uppercase transition-all" required />
                                        </div>
                                    </div>

                                    {/* CLUSTER: PRICE & DATE */}
                                    <div className="flex flex-col gap-2 shrink-0">
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2 leading-none label-mono">{t('storage.acquisitionCost')}</span>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 pl-2 leading-none label-mono">{t('storage.price.purchaseVal')}</label>
                                                <div className="hardware-well rounded-xl p-1.5 bg-[#D1CDBC] shadow-well focus-within:ring-2 focus-within:ring-amber-500/20 transition-all">
                                                    <div className="relative w-full h-11 bg-white rounded-lg shadow-cap border border-black/5 overflow-hidden">
                                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-black italic text-[11px] z-10">{currencySymbol}</span>
                                                        <input type="number" value={purchasePrice} onChange={e => setPurchasePrice(e.target.value)} className="w-full h-full bg-transparent pl-8 pr-3 outline-none font-black text-slate-800 text-xs uppercase" />
                                                    </div>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 pl-2 leading-none label-mono">{t('storage.purchaseDate')}</label>
                                                <div className="hardware-well rounded-xl p-1.5 bg-[#D1CDBC] shadow-well">
                                                    <SmartDatePicker 
                                                        value={purchaseDate ? new Date(purchaseDate) : undefined} 
                                                        onSelect={(date) => setPurchaseDate(date ? date.toISOString().split('T')[0] : '')} 
                                                        className="w-full" 
                                                        triggerClassName="!bg-white !border-black/5 !rounded-lg !h-11 !py-0 !px-4 !shadow-cap !font-black !text-xs !text-slate-800"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>


                                    {/* MARKET OPTIONS */}
                                    <div className="flex flex-col gap-2 shrink-0">
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2 leading-none label-mono">{t('storage.marketAvailability')}</span>
                                        <div className="flex flex-col gap-4">
                                            <div className="flex items-center gap-6 px-2">
                                                <button type="button" onClick={() => setIsForSale(!isForSale)} className="hardware-btn group flex items-center gap-3 cursor-pointer">
                                                    <div className={clsx("hardware-well w-8 h-8 rounded-lg shadow-well flex items-center justify-center transition-all shrink-0", isForSale ? "bg-emerald-500" : "bg-white")}>
                                                        {isForSale && <Check className="w-4 h-4 text-white" />}
                                                    </div>
                                                    <span className={clsx("text-[10px] font-black uppercase tracking-widest label-mono transition-colors", isForSale ? "text-emerald-700" : "text-slate-400")}>{t('storage.itemListing')}</span>
                                                </button>
                                                
                                                <button type="button" onClick={() => setIsSynced(!isSynced)} className="hardware-btn group flex items-center gap-3 cursor-pointer">
                                                    <div className={clsx("hardware-well w-8 h-8 rounded-lg shadow-well flex items-center justify-center transition-all shrink-0", isSynced ? "bg-blue-500" : "bg-white")}>
                                                        {isSynced && <Cloud className="w-4 h-4 text-white" />}
                                                    </div>
                                                    <span className={clsx("text-[10px] font-black uppercase tracking-widest label-mono transition-colors", isSynced ? "text-blue-700" : "text-slate-400")}>{t('storage.dodooExchangeSync')}</span>
                                                </button>
                                            </div>

                                            {isForSale && (
                                                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                                                    <div className="flex flex-col gap-2.5">
                                                        <div className="flex items-center gap-2 px-3">
                                                            <div className={clsx(
                                                                "w-1.5 h-1.5 rounded-full animate-pulse",
                                                                item?.isTransferred ? "bg-slate-400" : "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                                                            )} />
                                                            <span className="text-[9px] font-black uppercase tracking-[0.15em] label-mono text-slate-500">
                                                                {item?.isTransferred ? t('storage.status.transferred') : t('storage.status.onSale')}
                                                            </span>
                                                        </div>

                                                        <div className="hardware-well rounded-xl p-1.5 bg-[#D1CDBC] shadow-well focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all">
                                                            <div className="relative w-full h-11 bg-white rounded-lg shadow-cap border border-black/5 overflow-hidden">
                                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-600 font-black italic text-[11px] z-10">{currencySymbol}</span>
                                                                <input type="number" value={resalePrice} onChange={e => setResalePrice(e.target.value)} className="w-full h-full bg-transparent pl-8 pr-3 outline-none font-black text-emerald-900 text-xs" placeholder="ENTER_LISTING_VAL..." />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </div>
                                    </div>

                                    {/* ACTIONS */}
                                    <div className="mt-auto flex gap-4 pt-4">
                                        {item && (
                                            <button type="button" onClick={() => setShowTransferForm(true)} className="hardware-btn group w-24 sm:w-32">
                                                <div className="hardware-well h-14 bg-[#DADBD4] rounded-xl flex items-center justify-center shadow-well active:translate-y-1 transition-all text-[11px] font-black uppercase italic text-slate-600">Offload</div>
                                            </button>
                                        )}
                                        <button type="submit" disabled={loading} className="hardware-btn group flex-1">
                                            <div className="hardware-well h-14 bg-amber-500 rounded-xl flex items-center justify-center shadow-well active:translate-y-1 transition-all relative overflow-hidden">
                                                <span className="text-[12px] font-black text-white uppercase tracking-[0.2em] label-mono italic relative z-10">{loading ? t('common.processing') : (item ? t('common.save') : t('common.submit'))}</span>
                                            </div>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </form>
                    ) : ( 
                        <form onSubmit={handleConfirmTransfer} className="p-4 sm:p-6 flex flex-col gap-6 overflow-y-auto hide-scrollbar flex-1 min-h-0">
                            <div className="hardware-well p-4 bg-[#DADBD4]/60 rounded-xl flex items-center gap-4 border border-black/5 shadow-inner">
                                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden border-2 border-white shadow-sm relative shrink-0">
                                    <Image src={imageUrls[0] || ''} fill className="object-cover" alt="" />
                                </div>
                                <div className="flex-1 leading-none">
                                    <span className="text-[10px] font-black text-amber-600 uppercase tracking-[0.2em]">Asset_Disposition</span>
                                    <h4 className="font-black text-slate-800 text-lg sm:text-2xl tracking-tight uppercase italic">{name}</h4>
                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block">Final_Deployment_Stage</span>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2 mb-1.5 leading-none label-mono">{t('storage.settlementValue')}</label>
                                    <div className="hardware-well rounded-2xl p-2 bg-emerald-500/10 border-2 border-emerald-500/20 h-20 flex items-center shadow-well">
                                        <div className="relative w-full h-full flex items-center bg-[#F4F4F2] rounded-xl shadow-inner border border-black/5 px-2">
                                            <span className="text-emerald-500 font-black italic text-2xl ml-2">{currencySymbol}</span>
                                            <input type="number" value={salePrice} onChange={e => setSalePrice(e.target.value)} className="w-full bg-transparent px-3 py-4 outline-none font-black text-2xl text-slate-800 italic" required />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2 mb-1.5 leading-none label-mono">Log Date</label>
                                        <div className="hardware-well rounded-2xl p-1.5 bg-[#D1CDBC] h-14 flex items-center shadow-well overflow-hidden">
                                            <div className="w-full h-full bg-[#F4F4F2] rounded-xl flex items-center px-1 shadow-inner border border-black/5">
                                                <SmartDatePicker value={transferDate ? new Date(transferDate) : undefined} onSelect={(date) => setTransferDate(date ? date.toISOString().split('T')[0] : '')} className="w-full scale-90" />
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2 mb-1.5 leading-none label-mono">{t('storage.logisticsVector')}</label>
                                        <div className="hardware-well rounded-2xl p-1.5 bg-[#D1CDBC] h-14 flex items-center shadow-well">
                                            <div className="w-full h-full bg-[#F4F4F2] rounded-xl shadow-inner border border-black/5 flex items-center px-1">
                                                <select value={deliveryMethod} onChange={e => setDeliveryMethod(e.target.value)} className="w-full bg-transparent px-3 outline-none font-black text-slate-800 text-[10px] uppercase appearance-none">
                                                    <option value="express">EXPRESS</option>
                                                    <option value="self-pickup">LOCAL</option>
                                                    <option value="meetup">HANDOVER</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2 mb-1.5 leading-none label-mono">{t('storage.consigneeRef')}</label>
                                    <div className="hardware-well rounded-2xl p-1.5 bg-[#D1CDBC] h-14 flex items-center shadow-well">
                                        <input type="text" value={buyerId} onChange={e => setBuyerId(e.target.value)} className="w-full bg-[#F4F4F2] px-4 h-11 rounded-xl border border-black/5 focus:border-amber-500 outline-none font-black text-slate-800 text-xs shadow-inner uppercase" placeholder="RECIPIENT_ID..." />
                                    </div>
                                </div>
                            </div>

                            <div className="mt-auto flex gap-3 h-14 pt-2">
                                <button type="button" onClick={() => setShowTransferForm(false)} className="hardware-btn group w-24">
                                    <div className="hardware-well h-full bg-[#DADBD4] rounded-xl flex items-center justify-center shadow-well active:translate-y-1 transition-all">
                                        <span className="text-[10px] font-black uppercase text-slate-600 italic">Back</span>
                                    </div>
                                </button>
                                <button type="submit" disabled={loading} className="hardware-btn group flex-1">
                                    <div className="hardware-well h-full bg-emerald-500 rounded-xl flex items-center justify-center shadow-well active:translate-y-1 transition-all relative overflow-hidden">
                                        <span className="text-[12px] font-black text-white uppercase tracking-[0.2em] label-mono italic relative z-10">{loading ? t('common.processing') : t('storage.executeDeployment')}</span>
                                    </div>
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </motion.div>

            <AnimatePresence>
                {showPhotoPicker && (
                    <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="baustein-panel w-full max-w-sm bg-[#E2DFD2] rounded-[2rem] p-8 flex flex-col gap-8 shadow-2xl border-4 border-[#C8C4B0]">
                            <div className="flex flex-col items-center gap-2">
                                <Camera className="w-10 h-10 text-amber-500" />
                                <h3 className="text-xl font-black italic text-slate-800 uppercase tracking-tighter">Capture & Asset Link</h3>
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Select Input Vector</span>
                            </div>
                            <div className="flex flex-col gap-4">
                                <label className="hardware-btn group cursor-pointer inline-block w-full">
                                    <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                                        const file = e.target.files?.[0]
                                        if (file) {
                                            const formData = new FormData()
                                            formData.append('file', file)
                                            try {
                                                setLoading(true)
                                                const res = await fetch('/api/upload', { method: 'POST', body: formData })
                                                const data = await res.json()
                                                if (data.url) {
                                                    setImageUrls(prev => {
                                                        const next = [...prev, data.url].slice(0, 20)
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
                                            <span className="text-xs font-black uppercase text-slate-800 italic">Direct Camera Link</span>
                                        </div>
                                    </div>
                                </label>
                                <label className="hardware-btn group cursor-pointer inline-block w-full">
                                    <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                                        const file = e.target.files?.[0]
                                        if (file) {
                                            const formData = new FormData()
                                            formData.append('file', file)
                                            try {
                                                setLoading(true)
                                                const res = await fetch('/api/upload', { method: 'POST', body: formData })
                                                const data = await res.json()
                                                if (data.url) {
                                                    setImageUrls(prev => {
                                                        const next = [...prev, data.url].slice(0, 20)
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
                                            <Download className="w-5 h-5 text-slate-400" />
                                            <span className="text-xs font-black uppercase text-slate-800 italic">Local Data Repository</span>
                                        </div>
                                    </div>
                                </label>
                            </div>
                            <button onClick={() => setShowPhotoPicker(false)} className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-rose-500 transition-colors pt-4 border-t border-black/5">Cancel Protocol</button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}
