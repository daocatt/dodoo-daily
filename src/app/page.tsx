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

interface SystemSettings {
  systemName: string
  timezone: string
}

interface Widget {
  id: string
  type: string
  size: WidgetSize
  x: number
  y: number
}

interface ProjectedWidget extends Widget {
  dx: number
  dy: number
  dw: number
  dh: number
}

// Map sizes to grid spans (cols x rows)
const SIZE_MAP: Record<WidgetSize, { w: number; h: number }> = {
  ICON: { w: 1, h: 1 },
  SQUARE: { w: 2, h: 2 },
  WIDE: { w: 4, h: 2 },
  TALL: { w: 4, h: 4 },
  GIANT: { w: 8, h: 4 },
}

const getWidgetSpan = (size: string, currentCols: number = 8) => {
  const legacyMap: Record<string, WidgetSize> = {
    'SMALL': 'ICON',
    'MEDIUM': 'SQUARE',
    'LARGE': 'WIDE',
    'XL': 'GIANT'
  }
  const standardized = (legacyMap[size] || size) as WidgetSize
  const span = SIZE_MAP[standardized] || SIZE_MAP.ICON

  // Refined transition logic (8 -> 6 -> 4) to maintain visual identity
  if (currentCols === 6) {
    if (standardized === 'GIANT') return { w: 6, h: 3 }
    if (standardized === 'WIDE') return { w: 3, h: 2 }
    if (standardized === 'TALL') return { w: 3, h: 4 }
  } else if (currentCols === 4) {
    if (standardized === 'GIANT') return { w: 4, h: 4 } // Full grid block on mobile
    if (standardized === 'WIDE') return { w: 4, h: 2 }  // Full width banner on mobile (as requested)
    if (standardized === 'TALL') return { w: 2, h: 4 }  // Half width, extra tall
  }

  // Fallback / Clamping
  return {
    w: Math.min(span.w, currentCols),
    h: span.h
  }
}

const SIZE_LABELS: Record<WidgetSize, string> = {
  ICON: '1×1',
  SQUARE: '2×2',
  WIDE: '4×2',
  TALL: '4×4',
  GIANT: '8×4',
}

const GAP = 12   // px between tiles
const NAV_H = 60 // header height

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
  const [stageW, setStageW] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200)
  const [stageH, setStageH] = useState(typeof window !== 'undefined' ? window.innerHeight : 800)
  const stageRef = useRef<HTMLDivElement>(null)

  // Recalculate cell size and center the grid area
  const dimensions = React.useMemo(() => {
    if (stageW < 100) return { cellSize: 0, gridCols: 8, maxRows: 4, gridWidth: 0, gridHeight: 0, currentGap: 0, pageOffsetX: 0, pageOffsetY: 0 }

    // REFINED Breakpoints for better device mapping:
    // < 600px: 4 cols (Modern Phones)
    // 600px - 1024px: 6 cols (iPads, Mini, Small Portables)
    // > 1024px: 8 cols (Laptops & Monitors)
    const isDesktop = stageW >= 1024
    const isMid = stageW >= 500 && stageW < 1024

    let currentCols = 4
    if (isDesktop) currentCols = 8
    else if (isMid) currentCols = 6

    // Adaptive rows: Very tall screens (like iPad Portrait) get more rows
    const isPortrait = stageH > stageW
    // For mobile, we might want more rows, but for desktop we fix it at 4 as per spec
    const currentMaxRows = isDesktop ? 4 : (isPortrait ? 7 : 5)

    // Gap responsive
    const currentGap = stageW < 600 ? 10 : 12

    // Progressive Padding (留白)
    const currentPad = stageW < 1024 ? (stageW * 0.04) : 60

    const availableWidth = stageW - (currentPad * 2)
    const availableHeight = stageH - 120 // Header + Padding

    const cw = (availableWidth - (currentCols - 1) * currentGap) / currentCols
    const ch = (availableHeight - (currentMaxRows - 1) * currentGap) / currentMaxRows

    // CRITICAL: Take the minimum to ensure no overflow
    let cellSize = Math.min(cw, ch)

    // Limits
    if (cellSize > 140) cellSize = 140
    if (cellSize < 30) cellSize = 30

    const gridWidth = currentCols * cellSize + (currentCols - 1) * currentGap
    const gridHeight = currentMaxRows * cellSize + (currentMaxRows - 1) * currentGap

    // Page offsets for absolute centering
    const pageOffsetX = (stageW - gridWidth) / 2
    const pageOffsetY = (stageH - 60 - gridHeight) / 2 // 60 is NAV_H

    return { cellSize, gridCols: currentCols, maxRows: currentMaxRows, gridWidth, gridHeight, currentGap, pageOffsetX, pageOffsetY }
  }, [stageW, stageH])

  const { cellSize, gridCols, maxRows, gridWidth, gridHeight, currentGap, pageOffsetX, pageOffsetY } = dimensions

  // Carousel Configuration
  const pageCount = 3

  // Global Grid-to-Pixel Mapper (Relative to grid-stage)
  const toLeft = (x: number) => {
    const page = Math.floor(x / gridCols)
    const localX = x % gridCols
    return page * stageW + pageOffsetX + localX * (cellSize + currentGap)
  }
  const toTop = (y: number) => pageOffsetY + y * (cellSize + currentGap)

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

  // ─── Collision-Free Display Layout (for non-8-col) ───
  // This ensures no widgets overlap when the grid is compressed.
  const displayWidgets = React.useMemo(() => {
    if (gridCols === 8) return widgets

    const sorted = [...widgets].sort((a, b) => (a.y - b.y) || (a.x - b.x))
    // Multi-page safe grid for projection
    const grid: boolean[][] = Array.from({ length: 20 }, () => Array(gridCols * pageCount).fill(false))

    return sorted.map(w => {
      const { w: spanW, h: spanH } = getWidgetSpan(w.size, gridCols)

      // Projection maintaining page boundary
      const originalPage = Math.floor(w.x / 8)
      const localX = w.x % 8
      const projLocalX = Math.floor(localX * gridCols / 8)
      const projX = originalPage * gridCols + projLocalX
      const projY = w.y

      // Simple search for next available slot TO PRESERVE PAGE
      let found = false
      // Priority 1: Search within the same page
      for (let y = projY; y < maxRows && !found; y++) {
        for (let x = (y === projY ? projX : originalPage * gridCols); x <= (originalPage + 1) * gridCols - spanW; x++) {
          let conflict = false
          for (let dy = 0; dy < spanH; dy++) {
            for (let dx = 0; dx < spanW; dx++) {
              if (y + dy >= 20 || grid[y + dy][x + dx]) { conflict = true; break; }
            }
            if (conflict) break
          }

          if (!conflict) {
            for (let dy = 0; dy < spanH; dy++) {
              for (let dx = 0; dx < spanW; dx++) {
                grid[y + dy][x + dx] = true
              }
            }
            found = true
            return { ...w, dx: x, dy: y, dw: spanW, dh: spanH }
          }
        }
      }

      // Priority 2: Full scan (only if page is full)
      for (let y = 0; y < maxRows && !found; y++) {
        for (let x = 0; x <= gridCols * pageCount - spanW; x++) {
          let conflict = false
          for (let dy = 0; dy < spanH; dy++) {
            for (let dx = 0; dx < spanW; dx++) {
              if (y + dy >= 20 || grid[y + dy][x + dx]) { conflict = true; break; }
            }
            if (conflict) break
          }
          if (!conflict) {
            for (let dy = 0; dy < spanH; dy++) {
              for (let dx = 0; dx < spanW; dx++) {
                grid[y + dy][x + dx] = true
              }
            }
            found = true
            return { ...w, dx: x, dy: y, dw: spanW, dh: spanH }
          }
        }
      }

      return { ...w, dx: projX, dy: projY, dw: spanW, dh: spanH }
    })
  }, [widgets, gridCols, maxRows, pageCount])

  // Resizable stage tracking
  useEffect(() => {
    if (typeof window === 'undefined') return

    const updateSize = () => {
      setStageW(window.innerWidth)
      setStageH(window.innerHeight)
    }

    updateSize()
    window.addEventListener('resize', updateSize)
    window.addEventListener('orientationchange', updateSize)

    const el = stageRef.current
    let ro: ResizeObserver | null = null
    if (el) {
      ro = new ResizeObserver(updateSize)
      ro.observe(el)
    }

    return () => {
      if (ro) ro.disconnect()
      window.removeEventListener('resize', updateSize)
      window.removeEventListener('orientationchange', updateSize)
    }
  }, [loading])

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
    const sMoved = getWidgetSpan(moved.size, gridCols)
    // Clamp within the multi-page grid boundary
    moved.x = Math.max(0, Math.min(gridCols * pageCount - sMoved.w, moved.x))
    moved.y = Math.max(0, Math.min(maxRows - sMoved.h, moved.y))

    const placed: Widget[] = [moved]
    const others = all
      .filter(w => w.id !== moved.id)
      .sort((a, b) => (a.y - b.y) || (a.x - b.x))

    const isPosOccupied = (x: number, y: number, sw: number, sh: number, currentPlaced: Widget[]) => {
      return currentPlaced.some(p => {
        const pSize = getWidgetSpan(p.size, gridCols)
        return x < p.x + pSize.w && x + sw > p.x && y < p.y + pSize.h && y + sh > p.y
      })
    }

    for (const other of others) {
      const s = getWidgetSpan(other.size, gridCols)

      // 1. Try its current position
      if (!isPosOccupied(other.x, other.y, s.w, s.h, placed) &&
        other.x + s.w <= gridCols * pageCount &&
        other.y + s.h <= maxRows) {
        placed.push(other)
        continue
      }

      // 2. Try to find a slot ON THE SAME PAGE as its original position
      const originalPage = Math.floor(other.x / gridCols)
      let foundOnSamePage = false
      for (let ty = 0; ty <= maxRows - s.h && !foundOnSamePage; ty++) {
        for (let tx = originalPage * gridCols; tx <= (originalPage + 1) * gridCols - s.w && !foundOnSamePage; tx++) {
          if (!isPosOccupied(tx, ty, s.w, s.h, placed)) {
            placed.push({ ...other, x: tx, y: ty })
            foundOnSamePage = true
          }
        }
      }

      if (foundOnSamePage) continue

      // 3. Absolute Search across ALL pages (fallback)
      let foundAnything = false
      for (let ty = 0; ty <= maxRows - s.h && !foundAnything; ty++) {
        for (let tx = 0; tx <= gridCols * pageCount - s.w && !foundAnything; tx++) {
          if (!isPosOccupied(tx, ty, s.w, s.h, placed)) {
            placed.push({ ...other, x: tx, y: ty })
            foundAnything = true
          }
        }
      }

      if (!foundAnything) {
        placed.push({ ...other, x: gridCols * pageCount - s.w, y: maxRows - s.h })
      }
    }
    return placed
  }

  const updateWidgetSize = (id: string, nextSize: WidgetSize) => {
    const w = widgets.find(x => x.id === id)
    if (!w) return

    const s = getWidgetSpan(nextSize, gridCols)
    const moved = {
      ...w,
      size: nextSize,
      x: Math.min(w.x, gridCols * pageCount - s.w)
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
    // Repeated widgets are now allowed
    try {
      const isPosOccupied = (x: number, y: number, sw: number, sh: number, currentPlaced: Widget[]) => {
        return currentPlaced.some(p => {
          const pSize = getWidgetSpan(p.size as WidgetSize, gridCols)
          return x < p.x + pSize.w && x + sw > p.x && y < p.y + pSize.h && y + sh > p.y
        })
      }

      // Find an empty slot horizontally across pages
      let foundSlot = false;
      let nx = 0;
      let ny = 0;
      for (let page = 0; page < pageCount && !foundSlot; page++) {
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
        const px = toLeft(nx) + cellSize / 2
        const py = toTop(ny) + cellSize / 2
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
      const iconSize = Math.max(20, Math.floor(cellSize * 0.45))

      return (
        <div
          onClick={handleWidgetClick}
          className={clsx(
            "w-full h-full flex flex-col items-center justify-center p-2 rounded-3xl border-2 border-white/30 transition-all cursor-pointer active:scale-95 hover:scale-[1.02]",
            color, shadow, "shadow-xl text-white overflow-hidden"
          )}
        >
          <div
            className="rounded-full bg-white/20 flex items-center justify-center mb-1.5 shadow-inner backdrop-blur-md transition-transform group-hover:scale-110"
            style={{ width: iconSize * 1.8, height: iconSize * 1.8 }}
          >
            <Icon style={{ width: iconSize, height: iconSize }} />
          </div>
          <span className="font-black uppercase tracking-[0.2em] text-white/90" style={{ fontSize: Math.max(7, cellSize * 0.08) }}>
            {label}
          </span>
        </div>
      )
    }

    const inner = (() => {
      switch (w.type) {
        case 'TASKS': return <TasksWidget size={w.size} cellSize={cellSize} />
        case 'NOTES': return <NotesWidget size={w.size} cellSize={cellSize} />
        case 'JOURNAL': return <JournalWidget size={w.size} cellSize={cellSize} />
        case 'PHOTOS': return <PhotoWidget size={w.size} cellSize={cellSize} />
        case 'MILESTONE': return <MilestoneWidget size={w.size} cellSize={cellSize} />
        case 'SHOP':
          const baseIconSize = Math.floor(cellSize * 0.5)
          return (
            <div className="w-full h-full bg-amber-400 rounded-3xl flex flex-col items-center justify-center gap-4 shadow-xl overflow-hidden relative border-none">
              <ShoppingBag
                style={{ width: baseIconSize * 1.5, height: baseIconSize * 1.5 }}
                className="text-amber-900 transition-all duration-500 group-hover:scale-110 drop-shadow-lg"
              />
              <span
                className="font-black text-amber-900 uppercase tracking-[0.3em] bg-white/30 px-6 py-1.5 rounded-full backdrop-blur-sm border border-white/40 shadow-sm"
                style={{ fontSize: Math.max(8, cellSize * 0.09) }}
              >
                Shop
              </span>
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/30 via-transparent to-black/5 pointer-events-none" />
            </div>
          )
        default:
          return (
            <div className="w-full h-full bg-slate-100 rounded-3xl flex items-center justify-center text-slate-400" style={{ fontSize: cellSize * 0.1 }}>
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
      <NatureBackground />
      <Confetti config={confetti} />

      {/* ─── Header HUD ─── */}
      <header className="relative z-[90] flex shrink-0 items-center h-[60px] px-6 backdrop-blur-xl bg-white/40 border-b border-black/5">
        <div className="flex items-center justify-between w-full">
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
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsEditing(true)}
              className="p-2 rounded-xl bg-white border-2 border-slate-100 text-slate-500 shadow-sm flex items-center justify-center transition-all hover:border-indigo-200 hover:text-indigo-600"
              title="Edit Layout"
            >
              <Layout className="w-5 h-5" />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => router.push('/settings')}
              className="p-2 rounded-xl bg-white border-2 border-slate-100 text-slate-500 shadow-sm flex items-center justify-center transition-all hover:border-indigo-200 hover:text-indigo-600"
              title="Settings"
            >
              <Settings className="w-5 h-5" />
            </motion.button>
            <button
              onClick={() => setLocale(locale === 'en' ? 'zh-CN' : 'en')}
              className="px-3 py-1.5 text-[10px] font-black rounded-xl bg-white/60 border border-black/5 text-[#2c2416] shadow-sm active:scale-95 transition-all h-9"
            >
              {locale === 'en' ? '中' : 'EN'}
            </button>
          </div>
        </div>
      </header>

      {/* ─── Premium Full-Width Edit HUD ─── */}
      <AnimatePresence>
        {isEditing && (
          <motion.div
            initial={{ y: gridCols < 8 ? 80 : -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: gridCols < 8 ? 80 : -60, opacity: 0 }}
            className={clsx(
              "fixed left-0 right-0 z-[1000] flex items-center justify-between bg-[#1a1c1e] text-white shadow-2xl transition-all font-sans",
              gridCols < 8
                ? "bottom-0 h-[72px] px-4 pb-safe border-t border-white/10"
                : "top-0 h-[60px] px-6"
            )}
          >
            <div className="flex items-center gap-3 sm:gap-6 flex-1 overflow-hidden pr-2">
              <div className="flex items-center gap-2 px-3 py-1 bg-indigo-500 rounded-full shadow-lg shadow-indigo-500/30 shrink-0">
                <Sparkles className="w-3 h-3" />
                <span className="text-[9px] font-black uppercase tracking-widest hidden xs:inline">Edit</span>
              </div>

              <div className="h-4 w-[1px] bg-white/10 hidden md:block" />

              {/* Page Switcher in Edit HUD */}
              <div className="flex items-center bg-white/5 rounded-full p-1 gap-1 shrink-0">
                {Array.from({ length: pageCount }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i)}
                    className={clsx(
                      "px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-tighter transition-all shrink-0",
                      currentPage === i ? "bg-white text-black" : "text-white/40 hover:text-white"
                    )}
                  >
                    Page {i + 1}
                  </button>
                ))}
              </div>

              <div className="h-4 w-[1px] bg-white/10 hidden md:block" />

              <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar py-1 flex-1">
                {[
                  { type: 'TASKS', Icon: CheckCircle2 },
                  { type: 'NOTES', Icon: StickyNote },
                  { type: 'JOURNAL', Icon: Heart },
                  { type: 'PHOTOS', Icon: Images },
                  { type: 'SHOP', Icon: ShoppingBag },
                  { type: 'MILESTONE', Icon: Trophy }
                ].map(({ type, Icon }) => {
                  return (
                    <button
                      key={type}
                      onClick={() => addWidget(type)}
                      className={clsx(
                        "w-10 h-10 rounded-full flex items-center justify-center transition-all group relative shrink-0",
                        "text-white/50 hover:text-white hover:bg-white/10"
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 px-2.5 py-1 bg-black text-white text-[9px] font-black uppercase tracking-widest rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-[210] border border-white/10">
                        {type}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={async () => {
                  if (!confirm('Reset layout to defaults?')) return
                  await Promise.all(widgets.map(w =>
                    fetch(`/api/home-widgets?id=${w.id}`, { method: 'DELETE' })
                  ))
                  window.location.reload()
                }}
                className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-[#ffffff20] hover:text-rose-400/60 transition-colors"
                title="Wipe everything"
              >
                Reset
              </button>
              <div className="h-4 w-[1px] bg-white/10" />
              <button
                onClick={() => setIsEditing(false)}
                className="px-6 h-10 text-[10px] font-black uppercase tracking-widest rounded-full bg-white text-black hover:bg-gray-100 transition-all flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                Done
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Bento Stage ─── */}
      <main
        ref={stageRef}
        className="relative flex-1 z-10 w-full h-full flex justify-center no-scrollbar transition-all duration-300 items-center overflow-hidden"
        style={{
          // @ts-expect-error custom property
          '--cell-size': `${cellSize}px`
        }}
      >
        {/* Adds a bit of breathing room from the fixed header if grid is at top */}
        <div
          className={clsx(
            "absolute inset-x-0 top-0 pointer-events-none transition-all",
            isEditing || gridCols < 8 ? "h-0" : "h-10"
          )}
        />
        {/* Scrollable grid content area */}
        {cellSize > 10 && (
          <div className="w-full h-full relative">
            <motion.div
              id="grid-stage"
              className="absolute inset-0 flex"
              animate={{ x: -currentPage * stageW }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              drag={!isEditing && "x"}
              dragConstraints={{ left: -(pageCount - 1) * stageW, right: 0 }}
              onDragEnd={(_, info) => {
                if (isEditing) return
                if (info.offset.x < -100 && currentPage < pageCount - 1) {
                  setCurrentPage(prev => prev + 1)
                } else if (info.offset.x > 100 && currentPage > 0) {
                  setCurrentPage(prev => prev - 1)
                }
              }}
            >
              {/* 1. Unified Ghost Lines */}
              {isEditing && (
                <div className="absolute inset-0 pointer-events-none">
                  {Array.from({ length: pageCount }).map((_, pIdx) => (
                    <div key={`page-ghosts-${pIdx}`} className="absolute top-0" style={{ left: pIdx * stageW }}>
                      {Array.from({ length: gridCols * maxRows }).map((_, i) => {
                        const x = i % gridCols
                        const y = Math.floor(i / gridCols)
                        return (
                          <div
                            key={`ghost-${pIdx}-${i}`}
                            className="absolute border border-dashed rounded-3xl"
                            style={{
                              left: pageOffsetX + x * (cellSize + currentGap),
                              top: pageOffsetY + y * (cellSize + currentGap),
                              width: cellSize,
                              height: cellSize,
                              borderColor: 'rgba(0, 0, 0, 0.05)'
                            }}
                          />
                        )
                      })}
                    </div>
                  ))}
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
                      top: toTop(dragPreview.y),
                      width: dragPreview.w * cellSize + (dragPreview.w - 1) * currentGap,
                      height: dragPreview.h * cellSize + (dragPreview.h - 1) * currentGap
                    }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="absolute rounded-3xl bg-indigo-500/10 border-2 border-dashed border-indigo-500/30 z-20"
                  />
                )}
              </AnimatePresence>

            {displayWidgets.length > 0 ? (
              displayWidgets.map(w => {
                // If it's a display widget, it has dx, dy, dw, dh
                // Otherwise it's from widgets (8-col)
                const packed = w as unknown as ProjectedWidget
                const isPacked = 'dx' in w
                const spanW = isPacked ? packed.dw : getWidgetSpan(w.size, gridCols).w
                const spanH = isPacked ? packed.dh : getWidgetSpan(w.size, gridCols).h
                const finalX = isPacked ? packed.dx : w.x
                const finalY = isPacked ? packed.dy : w.y

                const pixelW = spanW * cellSize + (spanW - 1) * currentGap
                const pixelH = spanH * cellSize + (spanH - 1) * currentGap
                const pixelL = toLeft(finalX)
                const pixelT = toTop(finalY)

                return (
                  <motion.div
                    key={w.id}
                    layout
                    drag={isEditing}
                    dragMomentum={false}
                    dragElastic={1}
                    dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                    animate={{
                      scale: isEditing ? (activeId === w.id ? 1.05 : 0.98) : 1,
                      zIndex: sizeMenuId === w.id ? 150 : (activeId === w.id ? 100 : (isEditing ? 50 : 10)),
                      left: pixelL,
                      top: pixelT,
                      width: pixelW,
                      height: pixelH
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
                      boxShadow: "0 25px 50px -12px rgb(0 0 0 / 0.5)",
                      borderRadius: "24px"
                    }}
                    onDragStart={() => setActiveId(w.id)}
                    onDrag={(_, info) => {
                      if (!stageRef.current) return
                      const rect = stageRef.current.querySelector('#grid-stage')?.getBoundingClientRect()
                      if (!rect) return

                      const absoluteX = info.point.x - rect.left - grabOffset.x + (currentPage * stageW)
                      const absoluteY = info.point.y - rect.top - grabOffset.y

                      // Adjust based on pageOffsetX and pageOffsetY
                      const nx = Math.round((absoluteX - pageOffsetX) / (cellSize + currentGap))
                      const ny = Math.round((absoluteY - pageOffsetY) / (cellSize + currentGap))

                      const finalNx = Math.max(0, Math.min(gridCols * pageCount - spanW, nx))
                      const finalNy = Math.max(0, Math.min(maxRows - spanH, ny))

                      if (!dragPreview || dragPreview.x !== finalNx || dragPreview.y !== finalNy) {
                        setDragPreview({ x: finalNx, y: finalNy, w: spanW, h: spanH })
                      }
                    }}
                    onDragEnd={(_, info) => {
                      if (!isEditing || !stageRef.current) return
                      const rect = stageRef.current.querySelector('#grid-stage')?.getBoundingClientRect()
                      if (!rect) return

                      const absoluteX = info.point.x - rect.left - grabOffset.x + (currentPage * stageW)
                      const absoluteY = info.point.y - rect.top - grabOffset.y

                      const nx = Math.round((absoluteX - pageOffsetX) / (cellSize + currentGap))
                      const ny = Math.round((absoluteY - pageOffsetY) / (cellSize + currentGap))

                      const finalNx = Math.max(0, Math.min(gridCols * pageCount - spanW, nx))
                      const finalNy = Math.max(0, Math.min(maxRows - spanH, ny))

                      const moved = { ...w, x: finalNx, y: finalNy }
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
                    className="absolute rounded-3xl"
                    style={{ touchAction: 'none' }}
                  >
                    <div className="relative w-full h-full select-none group rounded-3xl overflow-hidden">
                      {renderWidgetContent(w)}
                    </div>
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
                  </motion.div>
                )
              })
            ) : (
              <div className="flex items-center justify-center h-[400px] text-slate-400 font-medium w-full">
                {loading ? "Initializing..." : "No widgets. Click Reset to fix."}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </main>

      {/* ─── Pagination Dots (iOS Style) ─── */}
      {
        !isEditing && pageCount > 1 && (
          <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[150] flex gap-2.5 px-4 py-2 rounded-full bg-black/5 backdrop-blur-sm">
            {Array.from({ length: pageCount }).map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i)}
                className={clsx(
                  "w-2 h-2 rounded-full transition-all duration-300",
                  currentPage === i ? "bg-slate-800 scale-125 shadow-sm" : "bg-slate-800/20"
                )}
              />
            ))}
          </div>
        )
      }



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
