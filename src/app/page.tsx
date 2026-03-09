'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Settings, Maximize2, Trash2, Check, ListTodo, ShoppingBag, Heart, StickyNote, CheckCircle2, Trophy, Images, Layout, Sparkles } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import NatureBackground from '@/components/NatureBackground'
import { useI18n } from '@/contexts/I18nContext'
import { clsx } from 'clsx'

// Bento Widgets
import NotesWidget from '@/components/widgets/NotesWidget'
import TasksWidget from '@/components/widgets/TasksWidget'
import JournalWidget from '@/components/widgets/JournalWidget'
import PhotoWidget from '@/components/widgets/PhotoWidget'
import MilestoneWidget from '@/components/widgets/MilestoneWidget'

type WidgetSize = 'ICON' | 'SQUARE' | 'WIDE' | 'TALL' | 'GIANT'

interface Widget {
  id: string
  type: string
  size: WidgetSize
  x: number
  y: number
}

// Map sizes to grid spans (cols x rows)
const SIZE_MAP: Record<WidgetSize, { w: number; h: number }> = {
  ICON: { w: 1, h: 1 },
  SQUARE: { w: 2, h: 2 },
  WIDE: { w: 4, h: 2 },
  TALL: { w: 4, h: 4 },
  GIANT: { w: 8, h: 4 },
}

interface SystemSettings {
  systemName: string
  isClosed?: boolean
  needsSetup?: boolean
}

const SIZE_LABELS: Record<WidgetSize, string> = {
  ICON: '1×1',
  SQUARE: '2×2',
  WIDE: '4×2',
  TALL: '4×4',
  GIANT: '8×4',
}

const GAP = 12   // px between tiles
const PAD = 24   // stage inner padding (matches p-6 in main)

interface Particle {
  initRotate: number
  targetX: number
  targetY: number
  targetRotate: number
  width: number
  height: number
  color: string
}

export default function Home() {
  const router = useRouter()
  const { locale, setLocale, t } = useI18n()
  const [widgets, setWidgets] = useState<Widget[]>([])
  const [sysSettings, setSysSettings] = useState<SystemSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [sizeMenuId, setSizeMenuId] = useState<string | null>(null)
  const [confetti, setConfetti] = useState<{ x: number, y: number, particles: Particle[] } | null>(null)

  // Carousel State
  const [currentPage, setCurrentPage] = useState(0)

  // Real-time drag preview tracking
  const [dragPreview, setDragPreview] = useState<{ x: number, y: number, w: number, h: number } | null>(null)

  // Responsive Grid Configuration
  const [stageW, setStageW] = useState(1200)
  const [stageH, setStageH] = useState(800)
  const stageRef = useRef<HTMLDivElement>(null)

  // Recalculate cell size and center the grid area
  const dimensions = React.useMemo(() => {
    const isLargeScreen = stageW >= 1024
    const currentCols = isLargeScreen ? 8 : 4
    const currentMaxRows = isLargeScreen ? 4 : 6

    const availableWidth = stageW - PAD * 2
    let cw = (availableWidth - (currentCols - 1) * GAP) / currentCols

    // CAP CELL SIZE: Prevent widgets from being gigantic on super-wide screens
    const maxCw = currentCols === 8 ? 160 : 250
    if (cw > maxCw) cw = maxCw

    const safePaddingBottom = 120
    const availableHeight = stageH - PAD - safePaddingBottom
    const ch = (availableHeight - (currentMaxRows - 1) * GAP) / currentMaxRows

    let finalCellSize = Math.min(cw, ch)
    if (finalCellSize < 50) finalCellSize = 50

    return { cellW: finalCellSize, cellH: finalCellSize, gridCols: currentCols, maxRows: currentMaxRows }
  }, [stageW, stageH])

  const { cellW, cellH, gridCols, maxRows } = dimensions

  const pageCount = React.useMemo(() => {
    if (isEditing) return 2
    const hasWidgetInPage2 = widgets.some(w => w.x >= gridCols)
    return hasWidgetInPage2 ? 2 : 1
  }, [widgets, gridCols, isEditing])

  const gridWidth = gridCols * cellW + (gridCols - 1) * GAP
  const gridHeight = maxRows * cellH + (maxRows - 1) * GAP

  const pageOffsetX = Math.max(0, (stageW - gridWidth) / 2)
  const pageOffsetY = Math.max(0, (stageH - gridHeight) / 2)

  // Global Grid-to-Pixel Mapper
  const toLeft = (x: number) => {
    const pageIndex = Math.floor(x / gridCols)
    const xInPage = x % gridCols
    return (pageIndex * stageW) + pageOffsetX + (xInPage * (cellW + GAP))
  }
  const toTop = (y: number) => pageOffsetY + y * (cellH + GAP)

  // Track grab offset to ensure perfect snapping
  const [grabOffset, setGrabOffset] = useState({ x: 0, y: 0 })

  const audioRefStart = useRef<HTMLAudioElement | null>(null)
  const audioRefEnd = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    audioRefStart.current = new Audio('/sounds/drag_start.wav')
    audioRefEnd.current = new Audio('/sounds/drag_end.wav')
    audioRefStart.current.volume = 0.2
    audioRefEnd.current.volume = 0.3
  }, [])

  const fetchData = useCallback(async () => {
    console.log("Home: Fetching data...")
    try {
      const [settingsRes, widgetsRes] = await Promise.all([
        fetch('/api/system/settings'),
        fetch('/api/home-widgets'),
      ])
      const settings = await settingsRes.json()
      const widgetsData = await widgetsRes.json()
      console.log("Home: Data received:", { settings, widgetsData })
      setSysSettings(settings)
      if (Array.isArray(widgetsData)) {
        setWidgets(widgetsData)
      } else {
        console.error("Home: widgetsData is not an array", widgetsData)
        setWidgets([])
      }
    } catch (e) {
      console.error("Home: Fetch failed", e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Resizable stage tracking
  useEffect(() => {
    if (typeof window === 'undefined') return
    const el = stageRef.current
    if (!el) return

    const updateSize = () => {
      if (el) {
        setStageW(el.clientWidth)
        setStageH(el.clientHeight)
      }
    }

    updateSize()
    window.addEventListener('resize', updateSize)
    const ro = new ResizeObserver(updateSize)
    ro.observe(el)

    return () => {
      ro.disconnect()
      window.removeEventListener('resize', updateSize)
    }
  }, [])

  const saveWidgets = async (next: Widget[]) => {
    setWidgets(next)
    try {
      await fetch('/api/home-widgets', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ widgets: next }),
      })
    } catch { }
  }

  const resolveOverlap = (moved: Widget, all: Widget[]): Widget[] => {
    // 1. Initial constraint check on moved widget
    const movedSize = SIZE_MAP[moved.size] || SIZE_MAP.ICON
    if (moved.y > maxRows - movedSize.h) {
      moved.y = 0;
      moved.x = Math.max(moved.x, gridCols * (Math.floor(moved.x / gridCols) + 1));
    }
    const placed: Widget[] = [moved]

    // 2. Sort others by position (top-to-bottom, left-to-right) for consistent reflow
    const others = all
      .filter(w => w.id !== moved.id)
      .sort((a, b) => (a.y - b.y) || (a.x - b.x))

    // Helper for collision check
    const isPosOccupied = (x: number, y: number, sw: number, sh: number, currentPlaced: Widget[]) => {
      return currentPlaced.some(p => {
        const pSize = SIZE_MAP[p.size] || SIZE_MAP.ICON
        return x < p.x + pSize.w && x + sw > p.x && y < p.y + pSize.h && y + sh > p.y
      })
    }

    // 3. Process each widget
    for (const other of others) {
      const s = SIZE_MAP[other.size] || SIZE_MAP.ICON

      let startX = other.x;
      let startY = other.y;

      // Keep inside vertical bounds
      if (startY + s.h > maxRows) {
        startY = 0;
        startX = Math.max(startX, gridCols * (Math.floor(startX / gridCols) + 1));
      }

      // Try to keep it at its original position first (STABILITY)
      if (startX === other.x && startY === other.y && !isPosOccupied(other.x, other.y, s.w, s.h, placed)) {
        placed.push(other)
        continue
      }

      let found = false
      outerLoop:
      for (let page = Math.floor(startX / gridCols); page < 20; page++) {
        const baseTx = page * gridCols;
        const startYInPage = (page === Math.floor(startX / gridCols)) ? startY : 0;

        for (let ty = startYInPage; ty <= maxRows - s.h; ty++) {
          const startXInPage = (page === Math.floor(startX / gridCols) && ty === startY) ? (startX % gridCols) : 0;
          for (let xOff = startXInPage; xOff <= gridCols - s.w; xOff++) {
            const tx = baseTx + xOff;
            if (!isPosOccupied(tx, ty, s.w, s.h, placed)) {
              placed.push({ ...other, x: tx, y: ty })
              found = true
              break outerLoop;
            }
          }
        }

        if (startYInPage > 0) {
          for (let ty = 0; ty < startYInPage; ty++) {
            for (let xOff = 0; xOff <= gridCols - s.w; xOff++) {
              const tx = baseTx + xOff;
              if (!isPosOccupied(tx, ty, s.w, s.h, placed)) {
                placed.push({ ...other, x: tx, y: ty })
                found = true
                break outerLoop;
              }
            }
          }
        }
      }

      // Absolute fallback if no space found (should just place to edge safely)
      if (!found) placed.push({ ...other, x: 0, y: 0 })
    }

    return placed
  }

  const updateWidgetSize = (id: string, nextSize: WidgetSize) => {
    const w = widgets.find(x => x.id === id)
    if (!w) return

    const s = SIZE_MAP[nextSize]
    const moved = {
      ...w,
      size: nextSize,
      x: Math.min(w.x, gridCols - s.w)
    }
    const nextWidgets = resolveOverlap(moved, widgets)
    saveWidgets(nextWidgets)
    setSizeMenuId(null)
  }

  const removeWidget = (id: string) => {
    const next = widgets.filter(w => w.id !== id)
    saveWidgets(next)
    fetch(`/api/home-widgets?id=${id}`, { method: 'DELETE' }).catch(() => { })
  }

  const addWidget = async (type: string) => {
    if (widgets.some(w => w.type === type)) {
      console.warn(`[Home] Widget type ${type} already exists.`)
      return
    }

    try {
      // Helper for collision check (re-defined or passed from resolveOverlap)
      const isPosOccupied = (x: number, y: number, sw: number, sh: number, currentPlaced: Widget[]) => {
        return currentPlaced.some(p => {
          const pSize = SIZE_MAP[p.size as WidgetSize] || SIZE_MAP.ICON
          return x < p.x + pSize.w && x + sw > p.x && y < p.y + pSize.h && y + sh > p.y
        })
      }

      // Find an empty slot horizontally across pages
      let foundSlot = false;
      let nx = 0;
      let ny = 0;
      for (let page = 0; page < 10 && !foundSlot; page++) {
        for (let ty = 0; ty <= maxRows - 2 && !foundSlot; ty++) {
          for (let tx = page * gridCols; tx <= page * gridCols + gridCols - 2 && !foundSlot; tx++) {
            if (!isPosOccupied(tx, ty, 2, 2, widgets)) {
              nx = tx; ny = ty; foundSlot = true;
            }
          }
        }
      }

      const res = await fetch('/api/home-widgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, x: nx, y: ny, size: 'SQUARE' })
      })

      if (res.ok) {
        const data = await res.json()
        console.log("[Home] Widget added successfully:", data)
        setWidgets(prev => [...prev, data])
        // Trigger effect
        const px = PAD + 1 * (cellW + GAP)
        const py = PAD + ny * (cellH + GAP)
        const colors = ['#f43f5e', '#fbbf24', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899']
        const np = Array.from({ length: 24 }).map((_, i) => ({
          initRotate: Math.random() * 360,
          targetX: (Math.random() - 0.5) * 400,
          targetY: (Math.random() - 0.5) * 400 - 100,
          targetRotate: Math.random() * 720,
          width: Math.random() * 2 + 1,
          height: Math.random() * 20 + 20,
          color: colors[i % colors.length]
        }))

        setConfetti({ x: px, y: py, particles: np })
        setTimeout(() => setConfetti(null), 1000)
      } else {
        const errorText = await res.text()
        console.error("[Home] API error adding widget:", res.status, errorText)
      }
    } catch (e) {
      console.error("[Home] Network error adding widget:", e)
    }
  }

  const renderWidgetContent = (w: Widget) => {
    const handleWidgetClick = () => {
      if (isEditing) return
      const routes: Record<string, string> = {
        NOTES: '/notes', SHOP: '/shop',
        TASKS: '/tasks', JOURNAL: '/journal', PHOTOS: '/gallery',
        MILESTONE: '/journal?filter=milestone'
      }
      if (routes[w.type]) router.push(routes[w.type])
    }

    // ICON Mode: Large Icon on Solid Brand Background
    if (w.size === 'ICON') {
      const config = {
        TASKS: { Icon: CheckCircle2, color: 'bg-blue-500', shadow: 'shadow-blue-500/20', label: 'Tasks' },
        NOTES: { Icon: StickyNote, color: 'bg-orange-500', shadow: 'shadow-orange-500/20', label: 'Notes' },
        JOURNAL: { Icon: Heart, color: 'bg-rose-500', shadow: 'shadow-rose-500/20', label: 'Journal' },
        PHOTOS: { Icon: Images, color: 'bg-purple-500', shadow: 'shadow-purple-500/20', label: 'Photos' },
        SHOP: { Icon: ShoppingBag, color: 'bg-amber-400', shadow: 'shadow-amber-500/20', label: 'Shop' },
        MILESTONE: { Icon: Trophy, color: 'bg-orange-500', shadow: 'shadow-orange-500/20', label: 'Milestones' },
      }[w.type] || { Icon: ListTodo, color: 'bg-slate-500', shadow: 'shadow-slate-500/10', label: w.type }

      const { Icon, color, shadow, label } = config

      return (
        <div
          onClick={handleWidgetClick}
          className={clsx(
            "w-full h-full flex flex-col items-center justify-center p-2 rounded-3xl border-2 border-white/30 transition-all cursor-pointer active:scale-95 hover:scale-[1.02]",
            color, shadow, "shadow-xl text-white"
          )}
        >
          <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center mb-1.5 shadow-inner backdrop-blur-md transition-transform group-hover:scale-110">
            <Icon className="w-7 h-7" />
          </div>
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/90">{label}</span>
        </div>
      )
    }

    const inner = (() => {
      switch (w.type) {
        case 'TASKS': return <TasksWidget size={w.size} />
        case 'NOTES': return <NotesWidget size={w.size} />
        case 'JOURNAL': return <JournalWidget size={w.size} />
        case 'PHOTOS': return <PhotoWidget size={w.size} />
        case 'MILESTONE': return <MilestoneWidget size={w.size} />
        case 'SHOP':
          const iconSize = w.size === 'GIANT' ? "w-24 h-24" : (w.size === 'WIDE' || w.size === 'TALL') ? "w-20 h-20" : "w-14 h-14"
          return (
            <div className="w-full h-full bg-amber-400 rounded-3xl flex flex-col items-center justify-center gap-6 shadow-xl overflow-hidden relative border-none">
              <ShoppingBag className={clsx(iconSize, "text-amber-900 transition-all duration-500 group-hover:scale-110 drop-shadow-lg")} />
              <span className="font-black text-amber-900 uppercase text-[12px] tracking-[0.3em] bg-white/30 px-6 py-1.5 rounded-full backdrop-blur-sm border border-white/40 shadow-sm">Shop</span>
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/30 via-transparent to-black/5 pointer-events-none" />
            </div>
          )
        default:
          return (
            <div className="w-full h-full bg-slate-100 rounded-3xl flex items-center justify-center text-[10px] text-slate-400">
              Unknown: {w.type}
            </div>
          )
      }
    })()

    return (
      <div
        className="w-full h-full overflow-hidden rounded-3xl"
        onClick={handleWidgetClick}
      >
        {inner}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="h-dvh flex items-center justify-center bg-slate-50">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="h-dvh w-full flex flex-col relative overflow-hidden bg-[#fafaf9]">
      {console.log("[Home] Rendering. stageW:", stageW, "effectiveW:", (stageW > 100 ? stageW : (typeof window !== 'undefined' ? window.innerWidth : 1200)), "widgets:", widgets.length)}
      <NatureBackground />
      <Confetti config={confetti} />

      {/* ─── Header ─── */}
      <header className="relative z-[100] flex shrink-0 justify-between items-center h-[60px] px-6 backdrop-blur-xl bg-white/30 border-b border-black/5">
        <div className="flex items-center gap-2.5">
          <motion.img
            whileHover={{ rotate: 15 }}
            src="/dog.svg"
            alt="Logo"
            className="w-8 h-8 object-contain cursor-pointer"
            onClick={() => router.push('/')}
          />
          <div>
            <p className="font-black text-[15px] tracking-tight text-[#1c1917] leading-none uppercase">
              {sysSettings?.systemName || 'DoDoo Family'}
            </p>
            <p className="text-[8px] font-bold uppercase tracking-[0.18em] text-[#4a3728]/40 mt-0.5">
              Dashboard
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Bento Edit Toggle */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsEditing(v => !v)}
            className={clsx(
              'p-2 rounded-xl border-2 flex items-center justify-center transition-all',
              isEditing
                ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200'
                : 'bg-white/80 border-white/60 text-slate-500 shadow-sm'
            )}
            title="Edit Layout"
          >
            {isEditing ? <Check className="w-5 h-5" /> : <Layout className="w-5 h-5" />}
          </motion.button>

          {/* Settings Entry (Gear) */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => router.push('/settings')}
            className="p-2 rounded-xl bg-white/80 border-white/60 text-slate-500 shadow-sm border-2 flex items-center justify-center transition-all"
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </motion.button>

          {/* Lang toggle */}
          <button
            onClick={() => setLocale(locale === 'en' ? 'zh-CN' : 'en')}
            className="px-3 py-1.5 text-[10px] font-black rounded-xl bg-white/60 border border-black/5 text-[#2c2416] shadow-sm active:scale-95 transition-all h-9"
          >
            {locale === 'en' ? '中' : 'EN'}
          </button>
        </div>
      </header>

      {/* ─── Bento Stage ─── */}
      <main
        ref={stageRef}
        onScroll={(e) => {
          if (isEditing) return
          const scrollLeft = e.currentTarget.scrollLeft
          const page = Math.round(scrollLeft / stageW)
          if (page !== currentPage) setCurrentPage(page)
        }}
        className={clsx(
          "relative flex-1 z-10 w-full h-full overflow-y-hidden no-scrollbar scroll-smooth", // Base container
          !isEditing ? "snap-x snap-mandatory overflow-x-auto hide-scrollbar" : "overflow-x-auto overflow-y-hidden custom-scrollbar"
        )}
      >
        {/* Scrollable grid content area */}
        {cellW > 10 && (
          <div
            id="grid-stage"
            className="relative transition-all duration-700 ease-in-out"
            style={{
              width: pageCount * stageW, // Exact Page-based width
              height: '100%',
              minHeight: '100%',
            }}
          >
            {/* 0. Multiple-Screen Snap Markers & Page Visualizers */}
            {!isEditing && (
              <div className="absolute inset-y-0 left-0 pointer-events-none flex">
                {Array.from({ length: pageCount }).map((_, i) => (
                  <div
                    key={`snap-${i}`}
                    className="snap-start shrink-0 pointer-events-none"
                    style={{ width: stageW, height: 1 }}
                  />
                ))}
              </div>
            )}
            {/* 1. Unified Ghost Lines */}
            {isEditing && (
              <div className="absolute inset-0 pointer-events-none">
                {Array.from({ length: (gridCols * pageCount) * maxRows }).map((_, i) => {
                  const x = i % (gridCols * pageCount)
                  const y = Math.floor(i / (gridCols * pageCount))
                  return (
                    <div
                      key={`ghost-${i}`}
                      className="absolute border border-dashed rounded-3xl"
                      style={{
                        left: toLeft(x),
                        top: toTop(y),
                        width: cellW,
                        height: cellH,
                        borderColor: 'rgba(0, 0, 0, 0.05)'
                      }}
                    />
                  )
                })}
              </div>
            )}

            {/* 2. Drag Preview (Ghost Slot) */}
            <AnimatePresence>
              {isEditing && dragPreview && activeId && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                    left: toLeft(dragPreview.x),
                    top: toTop(dragPreview.y) + PAD,
                  }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="absolute border-2 border-dashed border-indigo-400/40 bg-indigo-500/5 rounded-[40px] z-0"
                  style={{
                    width: dragPreview.w * cellW + (dragPreview.w - 1) * GAP,
                    height: dragPreview.h * cellH + (dragPreview.h - 1) * GAP,
                  }}
                />
              )}
            </AnimatePresence>

            {/* Widgets content */}
            {widgets.length > 0 ? (
              widgets.map(w => {
                // Compatibility Fallback: Map legacy names if they still exist in DB
                const legacyMap: Record<string, WidgetSize> = {
                  'SMALL': 'ICON', 'MEDIUM': 'SQUARE', 'LARGE': 'WIDE', 'XL': 'GIANT'
                }
                const currentSize = (legacyMap[w.size] || w.size) as WidgetSize
                const sizeConfig = SIZE_MAP[currentSize] || SIZE_MAP.ICON

                const { w: spanW, h: spanH } = sizeConfig
                const pixelW = spanW * cellW + (spanW - 1) * GAP
                const pixelH = spanH * cellH + (spanH - 1) * GAP
                const pixelL = toLeft(w.x)
                const pixelT = toTop(w.y)

                return (
                  <motion.div
                    key={w.id}
                    layout
                    drag={isEditing}
                    dragMomentum={false}
                    dragElastic={1}
                    // Crucial: Use dragConstraints 0 to simulate the "anchor" effect from the example
                    dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                    animate={{
                      scale: isEditing ? (activeId === w.id ? 1.05 : 0.98) : 1,
                      zIndex: sizeMenuId === w.id ? 150 : (activeId === w.id ? 100 : (isEditing ? 50 : 10)),
                    }}
                    transition={{
                      type: 'spring',
                      stiffness: 700,
                      damping: 38
                    }}
                    onPointerDown={(e) => {
                      if (isEditing) {
                        const rect = e.currentTarget.getBoundingClientRect()
                        audioRefStart.current?.play().catch(() => { })
                        setGrabOffset({
                          x: e.clientX - rect.left,
                          y: e.clientY - rect.top
                        })
                        setActiveId(w.id)
                      }
                    }}
                    whileDrag={{
                      scale: 1.1,
                      zIndex: 200,
                      boxShadow: "0 25px 50px -12px rgb(0 0 0 / 0.5)"
                    }}
                    onDragStart={() => setActiveId(w.id)}
                    onDrag={(_, info) => {
                      if (!stageRef.current) return
                      const rect = stageRef.current.querySelector('#grid-stage')?.getBoundingClientRect()
                      if (!rect) return

                      const absoluteX = info.point.x - rect.left - grabOffset.x
                      const absoluteY = info.point.y - rect.top - grabOffset.y

                      const pageIdx = Math.max(0, Math.floor(absoluteX / stageW))
                      const xWithinPage = absoluteX - (pageIdx * stageW) - pageOffsetX
                      const nxInPage = Math.round(xWithinPage / (cellW + GAP))
                      let nx = (pageIdx * gridCols) + nxInPage

                      const yWithinPage = absoluteY - pageOffsetY
                      let ny = Math.round(yWithinPage / (cellH + GAP))

                      nx = Math.max(0, Math.min((gridCols * pageCount) - spanW, nx))
                      ny = Math.max(0, Math.min(maxRows - spanH, ny))

                      if (!dragPreview || dragPreview.x !== nx || dragPreview.y !== ny) {
                        setDragPreview({ x: nx, y: ny, w: spanW, h: spanH })
                      }
                    }}
                    onDragEnd={(_, info) => {
                      if (!isEditing || !stageRef.current) return
                      const rect = stageRef.current.querySelector('#grid-stage')?.getBoundingClientRect()
                      if (!rect) return

                      const absoluteX = info.point.x - rect.left - grabOffset.x
                      const absoluteY = info.point.y - rect.top - grabOffset.y

                      const pageIdx = Math.max(0, Math.floor(absoluteX / stageW))
                      const xWithinPage = absoluteX - (pageIdx * stageW) - pageOffsetX
                      const nxInPage = Math.round(xWithinPage / (cellW + GAP))
                      let nx = (pageIdx * gridCols) + nxInPage

                      const yWithinPage = absoluteY - pageOffsetY
                      let ny = Math.round(yWithinPage / (cellH + GAP))

                      nx = Math.max(0, Math.min((gridCols * pageCount) - spanW, nx))
                      ny = Math.max(0, Math.min(maxRows - spanH, ny))

                      const moved = { ...w, x: nx, y: ny }
                      const next = resolveOverlap(moved, widgets)

                      setWidgets([...next])
                      saveWidgets(next)
                      audioRefEnd.current?.play().catch(() => { })
                      const colors = ['#f43f5e', '#fbbf24', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899']
                      const np = Array.from({ length: 24 }).map((_, i) => ({
                        initRotate: Math.random() * 360,
                        targetX: (Math.random() - 0.5) * 400,
                        targetY: (Math.random() - 0.5) * 400 - 100,
                        targetRotate: Math.random() * 720,
                        width: Math.random() * 2 + 1,
                        height: Math.random() * 20 + 20,
                        color: colors[i % colors.length]
                      }))
                      setConfetti({ x: info.point.x, y: info.point.y, particles: np })
                      setTimeout(() => setConfetti(null), 1000)

                      setActiveId(null)
                      setDragPreview(null)
                    }}
                    className="absolute"
                    style={{
                      width: pixelW,
                      height: pixelH,
                      left: pixelL,
                      top: pixelT,
                      touchAction: 'none'
                    }}
                  >
                    <div className="relative w-full h-full select-none group">
                      {renderWidgetContent(w)}
                      <AnimatePresence>
                        {isEditing && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className={clsx(
                              "absolute inset-0 rounded-3xl border-[3px] z-20 transition-colors",
                              activeId === w.id ? "border-indigo-500 bg-indigo-500/[0.05]" : "border-indigo-500/20 bg-transparent"
                            )}
                          >
                            <div className="absolute top-2 right-2 flex flex-col gap-1.5" onPointerDown={e => e.stopPropagation()}>
                              <div className="relative">
                                <button
                                  onClick={() => setSizeMenuId(sizeMenuId === w.id ? null : w.id)}
                                  className={clsx(
                                    "p-2 rounded-xl bg-white shadow-xl border transition-all",
                                    sizeMenuId === w.id ? "text-indigo-600 border-indigo-200" : "text-slate-400 border-slate-100 hover:text-indigo-600"
                                  )}
                                  title="Change Size"
                                >
                                  <Maximize2 className="w-3.5 h-3.5" />
                                </button>

                                <AnimatePresence>
                                  {sizeMenuId === w.id && (
                                    <motion.div
                                      initial={{ opacity: 0, x: 10, scale: 0.9 }}
                                      animate={{ opacity: 1, x: 0, scale: 1 }}
                                      exit={{ opacity: 0, x: 10, scale: 0.9 }}
                                      className="absolute right-full mr-3 top-0 bg-white/90 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white p-2 flex gap-1 z-[300] min-w-max"
                                    >
                                      {(gridCols === 8 ? ['ICON', 'SQUARE', 'WIDE', 'TALL', 'GIANT'] : ['ICON', 'SQUARE', 'WIDE', 'TALL'])
                                        .map((s) => {
                                          const config = SIZE_MAP[s as WidgetSize]
                                          return (
                                            <button
                                              key={s}
                                              onClick={() => updateWidgetSize(w.id, s as WidgetSize)}
                                              className={clsx(
                                                "px-3 py-2 rounded-xl flex flex-col items-center gap-1.5 transition-all",
                                                w.size === s ? "bg-indigo-50 text-indigo-600" : "hover:bg-slate-50 text-slate-400 hover:text-slate-600"
                                              )}
                                            >
                                              <div className="flex flex-wrap gap-0.5" style={{ width: 14, height: 14 }}>
                                                {Array.from({ length: config.w * config.h }).slice(0, 4).map((_, i) => (
                                                  <div key={i} className={clsx("w-1.5 h-1.5 rounded-[1px]", w.size === s ? "bg-indigo-400" : "bg-slate-300")} />
                                                ))}
                                              </div>
                                              <span className="text-[8px] font-black">{SIZE_LABELS[s as WidgetSize]}</span>
                                            </button>
                                          )
                                        })}
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>

                              <button
                                onClick={e => { e.stopPropagation(); removeWidget(w.id) }}
                                className="p-2 rounded-xl bg-white text-rose-400 shadow-xl border border-rose-50 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                title="Remove"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>


                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                )
              })
            ) : (
              <div className="flex items-center justify-center h-[400px] text-slate-400 font-medium w-full">
                {loading ? "Initializing..." : "No widgets. Click Reset to fix."}
              </div>
            )}
          </div>
        )
        }
      </main >

      {/* ─── Pagination Dots (iOS Style) ─── */}
      {!isEditing && pageCount > 1 && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[150] flex gap-2.5 px-4 py-2 rounded-full bg-black/5 backdrop-blur-sm">
          {Array.from({ length: pageCount }).map((_, i) => (
            <button
              key={i}
              onClick={() => {
                stageRef.current?.scrollTo({ left: i * stageW, behavior: 'smooth' })
                setCurrentPage(i)
              }}
              className={clsx(
                "w-2 h-2 rounded-full transition-all duration-300",
                currentPage === i ? "bg-slate-800 scale-125 shadow-sm" : "bg-slate-800/20"
              )}
            />
          ))}
        </div>
      )}

      <AnimatePresence>
        {isEditing && (
          <motion.div
            initial={{ y: 120 }}
            animate={{ y: 0 }}
            exit={{ y: 120 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-3 bg-white/80 backdrop-blur-2xl px-6 py-4 rounded-[40px] border-2 border-white shadow-2xl"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            {['TASKS', 'NOTES', 'JOURNAL', 'PHOTOS', 'SHOP', 'MILESTONE'].map(type => {
              const isAdded = widgets.some(w => w.type === type)
              return (
                <button
                  key={type}
                  disabled={isAdded}
                  onClick={() => addWidget(type)}
                  className={clsx(
                    "px-4 py-2 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all border",
                    isAdded
                      ? "bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed opacity-50"
                      : "bg-slate-100/80 hover:bg-white hover:text-indigo-600 border-transparent hover:border-indigo-100"
                  )}
                >
                  {isAdded ? '✓ ' : '+ '} {type}
                </button>
              )
            })}
            <div className="w-[1px] h-6 bg-slate-200 mx-1" />
            <button
              onClick={async () => {
                if (!confirm('Reset layout to defaults?')) return
                await Promise.all(widgets.map(w =>
                  fetch(`/api/home-widgets?id=${w.id}`, { method: 'DELETE' })
                ))
                window.location.reload()
              }}
              className="px-4 py-2 text-[9px] font-black uppercase tracking-widest rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 transition-all"
            >
              Reset All
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="px-6 py-2 text-[9px] font-black uppercase tracking-widest rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all flex items-center gap-2"
            >
              <Check className="w-3.5 h-3.5" />
              Save
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        html, body { overflow: hidden; height: 100%; }
        /* Prevent elastic scroll on mobile so drag works better */
        body { overscroll-behavior-y: none; }
      `}</style>
    </div >
  )
}

function Confetti({ config }: { config: { x: number, y: number, particles: Particle[] } | null }) {
  if (!config) return null
  const { x, y, particles } = config

  return (
    <div
      className="fixed inset-0 pointer-events-none z-[999]"
      style={{ left: 0, top: 0 }}
    >
      {particles.map((p, i) => (
        <motion.div
          key={i}
          initial={{
            x,
            y,
            opacity: 1,
            rotate: p.initRotate,
            scale: 0.5
          }}
          animate={{
            x: x + p.targetX,
            y: y + p.targetY,
            opacity: 0,
            rotate: p.targetRotate,
            scale: [0.5, 1, 0]
          }}
          transition={{
            duration: 0.8,
            ease: "easeOut"
          }}
          className="absolute rounded-full"
          style={{
            backgroundColor: p.color,
            width: p.width,
            height: p.height,
          }}
        />
      ))}
    </div>
  )
}
