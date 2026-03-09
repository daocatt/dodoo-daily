'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Settings, Maximize2, Trash2, Check, Layout, Store, Sparkles, Smile, CheckSquare } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import NatureBackground from '@/components/NatureBackground'
import { useI18n } from '@/contexts/I18nContext'
import { clsx } from 'clsx'

// Bento Widgets
import NotesWidget from '@/components/widgets/NotesWidget'
import TasksWidget from '@/components/widgets/TasksWidget'
import JournalWidget from '@/components/widgets/JournalWidget'
import PhotoWidget from '@/components/widgets/PhotoWidget'

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

export default function Home() {
  const router = useRouter()
  const { locale, setLocale, t } = useI18n()
  const [widgets, setWidgets] = useState<Widget[]>([])
  const [sysSettings, setSysSettings] = useState<SystemSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [sizeMenuId, setSizeMenuId] = useState<string | null>(null)

  // Real-time drag preview tracking
  const [dragPreview, setDragPreview] = useState<{ x: number, y: number, w: number, h: number } | null>(null)

  // Responsive Grid Configuration
  const [stageW, setStageW] = useState(1200)
  const [stageH, setStageH] = useState(800)
  const stageRef = useRef<HTMLDivElement>(null)

  // Recalculate cell size and center the grid area
  const dimensions = React.useMemo(() => {
    // Determine column count based on width
    const currentCols = stageW >= 1024 ? 8 : 4

    // Calculate cell width to fit exactly in stage width (minus paddings)
    const availableWidth = stageW - PAD * 2
    let cw = (availableWidth - (currentCols - 1) * GAP) / currentCols

    // CAP CELL SIZE: Prevent widgets from being gigantic on super-wide screens
    // Max 180px for 8 columns = ~1500px total grid width
    const maxCw = currentCols === 8 ? 180 : 300
    if (cw > maxCw) cw = maxCw

    // ENFORCE SQUARE: cellH = cellW
    const ch = cw

    return { cellW: cw, cellH: ch, gridCols: currentCols }
  }, [stageW])

  const { cellW, cellH, gridCols } = dimensions

  // Global Grid-to-Pixel Mapper
  // These now return coordinates relative to the centered grid area
  const toLeft = (x: number) => x * (cellW + GAP)
  const toTop = (y: number) => y * (cellH + GAP)

  // Track grab offset to ensure perfect snapping
  const [grabOffset, setGrabOffset] = useState({ x: 0, y: 0 })

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

    const ro = new ResizeObserver(() => {
      window.requestAnimationFrame(updateSize)
    })
    ro.observe(el)
    updateSize()

    // Also listen to window resize for col changes
    window.addEventListener('resize', updateSize)
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
    // 1. Start with the moved widget as priority
    const placed: Widget[] = [moved]

    // 2. Sort others by position (top-to-bottom, left-to-right) for consistent reflow
    const others = all
      .filter(w => w.id !== moved.id)
      .sort((a, b) => (a.y - b.y) || (a.x - b.x))

    // Helper for collision check
    const isPosOccupied = (x: number, y: number, sw: number, sh: number, currentPlaced: Widget[]) => {
      return currentPlaced.some(p => {
        const pSize = SIZE_MAP[p.size as WidgetSize] || SIZE_MAP.ICON
        return x < p.x + pSize.w && x + sw > p.x && y < p.y + pSize.h && y + sh > p.y
      })
    }

    // 3. Process each widget
    for (const other of others) {
      const s = SIZE_MAP[other.size as WidgetSize] || SIZE_MAP.ICON

      // Try to keep it at its original position first (STABILITY)
      if (!isPosOccupied(other.x, other.y, s.w, s.h, placed)) {
        placed.push(other)
        continue
      }

      // If occupied, find the nearest available slot (REFLOW)
      let found = false
      for (let ty = other.y; !found; ty++) {
        // Search path:
        // On the same row: try right side first, then left side
        // On subsequent rows: standard left-to-right
        const xSearchOrder: number[] = []
        if (ty === other.y) {
          for (let tx = other.x + 1; tx <= gridCols - s.w; tx++) xSearchOrder.push(tx)
          for (let tx = 0; tx < other.x; tx++) xSearchOrder.push(tx)
        } else {
          for (let tx = 0; tx <= gridCols - s.w; tx++) xSearchOrder.push(tx)
        }

        for (const tx of xSearchOrder) {
          if (!isPosOccupied(tx, ty, s.w, s.h, placed)) {
            placed.push({ ...other, x: tx, y: ty })
            found = true
            break
          }
        }

        if (ty > other.y + 30) break // Safety break
      }

      // Absolute fallback if no space found (should not happen with dynamic height)
      if (!found) {
        let ty = other.y + 1
        while (isPosOccupied(0, ty, s.w, s.h, placed)) ty++
        placed.push({ ...other, x: 0, y: ty })
      }
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

    console.log("[Home] Requesting addition of widget:", type)

    // Simple logic to place new widget below the lowest existing one
    const maxY = widgets.reduce((acc, w) => {
      const s = SIZE_MAP[w.size] || SIZE_MAP.ICON
      return Math.max(acc, w.y + s.h)
    }, 0)

    try {
      const res = await fetch('/api/home-widgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, size: 'ICON', x: 0, y: maxY }),
      })

      if (res.ok) {
        const data = await res.json()
        console.log("[Home] Widget added successfully:", data)
        setWidgets(prev => [...prev, data])
      } else {
        const errorText = await res.text()
        console.error("[Home] API error adding widget:", res.status, errorText)
      }
    } catch (e) {
      console.error("[Home] Network error adding widget:", e)
    }
  }

  const renderWidgetContent = (w: Widget) => {
    // ICON Mode: Minimalist Icon + Title
    if (w.size === 'ICON') {
      const config = {
        TASKS: { Icon: CheckSquare, color: 'bg-emerald-100 text-emerald-600', label: 'Tasks' },
        NOTES: { Icon: Smile, color: 'bg-amber-100 text-amber-600', label: 'Notes' },
        JOURNAL: { Icon: Sparkles, color: 'bg-indigo-100 text-indigo-600', label: 'Journal' },
        PHOTOS: { Icon: Layout, color: 'bg-rose-100 text-rose-600', label: 'Photos' },
        SHOP: { Icon: Store, color: 'bg-amber-400 text-amber-900', label: 'Shop' },
      }[w.type] || { Icon: Layout, color: 'bg-slate-100 text-slate-600', label: w.type }

      const { Icon, color, label } = config

      return (
        <div className="w-full h-full bg-white/60 backdrop-blur-xl flex flex-col items-center justify-center p-2 rounded-[2rem] border border-white/80 transition-colors group-hover:bg-white/80">
          <div className={clsx("w-9 h-9 rounded-2xl flex items-center justify-center mb-1.5 shadow-sm", color)}>
            <Icon className="w-4.5 h-4.5" />
          </div>
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{label}</span>
        </div>
      )
    }

    const inner = (() => {
      switch (w.type) {
        case 'TASKS': return <TasksWidget size={w.size} />
        case 'NOTES': return <NotesWidget size={w.size} />
        case 'JOURNAL': return <JournalWidget size={w.size} />
        case 'PHOTOS': return <PhotoWidget size={w.size} />
        case 'SHOP':
          return (
            <div className="w-full h-full bg-amber-400 rounded-[2rem] flex flex-col items-center justify-center gap-2 border-4 border-white shadow-xl">
              <Store className="w-10 h-10 text-amber-900" />
              <span className="font-black text-amber-900">Shop</span>
            </div>
          )
        default:
          return (
            <div className="w-full h-full bg-slate-100 rounded-[2rem] flex items-center justify-center text-[10px] text-slate-400">
              Unknown: {w.type}
            </div>
          )
      }
    })()

    return (
      <div
        className="w-full h-full overflow-hidden rounded-[2rem]"
        onClick={() => {
          if (isEditing) return
          const routes: Record<string, string> = {
            NOTES: '/notes', SHOP: '/shop',
            TASKS: '/tasks', JOURNAL: '/journal', PHOTOS: '/gallery',
          }
          if (routes[w.type]) router.push(routes[w.type])
        }}
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
      <main ref={stageRef} className="relative flex-1 z-10 overflow-x-hidden overflow-y-auto w-full h-full pb-32">
        {/* Scrollable grid content area */}
        {cellW > 10 && (
          <div
            className="relative mx-auto"
            style={{
              width: gridCols * cellW + (gridCols - 1) * GAP,
              height: toTop(Math.max(6, (Array.isArray(widgets) ? widgets : []).reduce((max, w) => {
                const s = SIZE_MAP[w.size as WidgetSize] || SIZE_MAP.ICON
                return Math.max(max, (w.y || 0) + s.h)
              }, 4))) + PAD * 2,
              minHeight: '100%',
              paddingTop: PAD,
              paddingBottom: PAD,
            }}
          >
            {/* 1. Unified Ghost Lines */}
            {isEditing && (
              <div className="absolute inset-0 pointer-events-none" style={{ top: PAD }}>
                {Array.from({ length: gridCols * 12 }).map((_, i) => {
                  const x = i % gridCols
                  const y = Math.floor(i / gridCols)
                  return (
                    <div
                      key={`ghost-${i}`}
                      className="absolute border-2 border-indigo-500/5 rounded-[2.5rem]"
                      style={{
                        left: toLeft(x),
                        top: toTop(y),
                        width: cellW,
                        height: cellH
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
                  className="absolute border-2 border-dashed border-indigo-400/40 bg-indigo-500/5 rounded-[2.5rem] z-0"
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
                      zIndex: activeId === w.id ? 100 : (isEditing ? 50 : 10),
                    }}
                    transition={{
                      type: 'spring',
                      stiffness: 700,
                      damping: 38
                    }}
                    onPointerDown={(e) => {
                      if (isEditing) {
                        const rect = e.currentTarget.getBoundingClientRect()
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
                      const rect = stageRef.current.querySelector('.relative.mx-auto')?.getBoundingClientRect()
                      if (!rect) return

                      // Calculate position relative to the centered grid area
                      const currentX = info.point.x - rect.left - grabOffset.x
                      const currentY = info.point.y - rect.top - PAD - grabOffset.y

                      const nx = Math.max(0, Math.min(gridCols - spanW, Math.round(currentX / (cellW + GAP))))
                      const ny = Math.max(0, Math.round(currentY / (cellH + GAP)))

                      if (!dragPreview || dragPreview.x !== nx || dragPreview.y !== ny) {
                        setDragPreview({ x: nx, y: ny, w: spanW, h: spanH })
                      }
                    }}
                    onDragEnd={(_, info) => {
                      if (!isEditing || !stageRef.current) return
                      const rect = stageRef.current.querySelector('.relative.mx-auto')?.getBoundingClientRect()
                      if (!rect) return

                      const currentX = info.point.x - rect.left - grabOffset.x
                      const currentY = info.point.y - rect.top - PAD - grabOffset.y

                      const nx = Math.max(0, Math.min(gridCols - spanW, Math.round(currentX / (cellW + GAP))))
                      const ny = Math.max(0, Math.round(currentY / (cellH + GAP)))

                      const moved = { ...w, x: nx, y: ny }
                      const next = resolveOverlap(moved, widgets)

                      setWidgets([...next])
                      saveWidgets(next)
                      setActiveId(null)
                      setDragPreview(null)
                    }}
                    className="absolute"
                    style={{
                      width: pixelW,
                      height: pixelH,
                      left: pixelL,
                      top: pixelT + PAD,
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
                              "absolute inset-0 rounded-[2rem] border-[3px] z-20 transition-colors",
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
                                      className="absolute right-full mr-3 top-0 bg-white/90 backdrop-blur-2xl rounded-[1.5rem] shadow-2xl border border-white p-2 flex gap-1 z-[300] min-w-max"
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
        )}
      </main>

      <AnimatePresence>
        {isEditing && (
          <motion.div
            initial={{ y: 120 }}
            animate={{ y: 0 }}
            exit={{ y: 120 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-3 bg-white/80 backdrop-blur-2xl px-6 py-4 rounded-[2.5rem] border-2 border-white shadow-2xl"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            {['TASKS', 'NOTES', 'JOURNAL', 'PHOTOS', 'SHOP'].map(type => {
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
    </div>
  )
}
