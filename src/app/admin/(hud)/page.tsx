'use client'

import Image from 'next/image'
import versionData from '../../../../version.json'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Settings, Maximize2, Trash2, Check, ListTodo, ShoppingBag,
  StickyNote, Images, Layout, Sparkles, Wallet, WalletCards,
  Refrigerator, SquareCheckBig, Fan, SquareStar, CircleStar, User
} from 'lucide-react'
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
import LedgerWidget from '@/components/widgets/LedgerWidget'
import StorageWidget from '@/components/widgets/StorageWidget'
import BausteinAdminNavbar from '@/components/BausteinAdminNavbar'
import BausteinWidgetContainer from '@/components/BausteinWidgetContainer'
import ProfileWidget from '@/components/widgets/ProfileWidget'
import MyGalleryWidget from '@/components/widgets/MyGalleryWidget'

const JournalIconFixed = (props: React.SVGProps<SVGSVGElement>) => (
  <svg 
    {...props} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    {/* DRAW RECT FIRST SO IT'S THE BACKGROUND */}
    <rect x="3" y="3" width="18" height="18" rx="2" />
    {/* THEN DRAW THE STAR ON TOP */}
    <path d="M11.035 7.69a1 1 0 0 1 1.909.024l.737 1.452a1 1 0 0 0 .737.535l1.634.256a1 1 0 0 1 .588 1.806l-1.172 1.168a1 1 0 0 0-.282.866l.259 1.613a1 1 0 0 1-1.541 1.134l-1.465-.75a1 1 0 0 0-.912 0l-1.465.75a1 1 0 0 1-1.539-1.133l.258-1.613a1 1 0 0 0-.282-.866l-1.156-1.153a1 1 0 0 1 .572-1.822l1.633-.256a1 1 0 0 0 .737-.535z" />
  </svg>
)

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

const ICON_ONLY_WIDGETS = ['SHOP']

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
  const [userRole, setUserRole] = useState<'PARENT' | 'CHILD' | 'GRANDPARENT' | 'OTHER' | null>(null)
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
    if (stageW < 100) return { cellSize: 0, gridCols: 8, maxRows: 4, gridWidth: 0, gridHeight: 0, currentGap: 0, pageOffsetX: 0, pageOffsetY: 0, isDesktop: true, isMid: false }

    const isDesktop = stageW >= 1024
    const isMid = stageW >= 500 && stageW < 1024

    let currentCols = 4
    if (isDesktop) currentCols = 8
    else if (isMid) currentCols = 6

    const isPortrait = stageH > stageW
    const currentMaxRows = isDesktop ? 4 : (isPortrait ? 7 : 5)
    const currentGap = stageW < 600 ? 10 : 12
    const currentPad = stageW < 1024 ? (stageW * 0.04) : 60

    const availableWidth = stageW - (currentPad * 2)
    const availableHeight = stageH - 120

    const cw = (availableWidth - (currentCols - 1) * currentGap) / currentCols
    const ch = (availableHeight - (currentMaxRows - 1) * currentGap) / currentMaxRows

    let cellSize = Math.min(cw, ch)
    if (cellSize > 140) cellSize = 140
    if (cellSize < 30) cellSize = 30

    const gridWidth = currentCols * cellSize + (currentCols - 1) * currentGap
    const gridHeight = currentMaxRows * cellSize + (currentMaxRows - 1) * currentGap

    const pageOffsetX = (stageW - gridWidth) / 2
    const pageOffsetY = (stageH - 60 - gridHeight) / 2

    return { cellSize, gridCols: currentCols, maxRows: currentMaxRows, gridWidth, gridHeight, currentGap, pageOffsetX, pageOffsetY, isDesktop, isMid }
  }, [stageW, stageH])

  const { cellSize, gridCols, maxRows, currentGap, pageOffsetX, pageOffsetY, isDesktop } = dimensions

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
      const [settingsRes, widgetsRes, statsRes] = await Promise.all([
        fetch('/api/system/settings'),
        fetch('/api/home-widgets'),
        fetch('/api/stats'),
      ])

      console.log(`Home: Response status - settings: ${settingsRes.status}, widgets: ${widgetsRes.status}`)

      if (!settingsRes.ok) {
        const text = await settingsRes.text()
        console.error("Home: Settings fetch failed with status", settingsRes.status, text.substring(0, 100))
        throw new Error(`Settings fetch failed: ${settingsRes.status}`)
      }

      if (!widgetsRes.ok) {
        const text = await widgetsRes.text()
        console.error("Home: Widgets fetch failed with status", widgetsRes.status, text.substring(0, 100))
        throw new Error(`Widgets fetch failed: ${widgetsRes.status}`)
      }

      const settings = await settingsRes.json()
      const widgetsData = await widgetsRes.json()
      const statsData = statsRes.ok ? await statsRes.json() : null
      console.log("Home: Data received:", { settings, widgetsData, statsData })

      setSysSettings(settings)
      if (statsData) setUserRole(statsData.role)
      if (Array.isArray(widgetsData)) {
        setWidgets(widgetsData)
      } else {
        console.error("Home: widgetsData is not an array", widgetsData)
        setWidgets([])
      }
    } catch (_e) {
      console.error("Home: Fetching process failed", _e)
      // Redirect to login if unauthorized
      const errorMsg = _e instanceof Error ? _e.message : String(_e)
      if (errorMsg.includes('401')) {
        console.warn("Home: Unauthorized encounter, redirecting to welcoming...")
        window.location.href = '/'
      }
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
      const reqW = 1;
      const reqH = 1;
      const initialSize = 'ICON';

      let foundSlot = false;
      let nx = 0;
      let ny = 0;
      for (let page = 0; page < pageCount && !foundSlot; page++) {
        for (let ty = 0; ty <= maxRows - reqH && !foundSlot; ty++) {
          for (let tx = page * gridCols; tx <= page * gridCols + gridCols - reqW && !foundSlot; tx++) {
            if (!isPosOccupied(tx, ty, reqW, reqH, widgets)) {
              nx = tx; ny = ty; foundSlot = true;
            }
          }
        }
      }

      const res = await fetch('/api/home-widgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, x: nx, y: ny, size: initialSize })
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
    } catch (_e) {
      console.error("[Home] Network error adding widget:", _e)
    }
  }

  const renderWidgetContent = (w: Widget) => {
    const handleWidgetClick = () => {
      if (isEditing) return
      const routes: Record<string, string> = {
        NOTES: '/admin/notes', SHOP: '/admin/shop',
        TASKS: '/admin/tasks', JOURNAL: '/admin/journal', PHOTOS: '/admin/gallery',
        MILESTONE: '/admin/journal?filter=milestone',
        LEDGER: '/admin/ledger',
        STORAGE: '/admin/storage',
        PROFILE: '/admin/profile',
        MYGALLERY: '/member'
      }
      if (routes[w.type]) router.push(routes[w.type])
    }

    const config = {
      TASKS: { Icon: SquareCheckBig, bg: 'bg-blue-500', glow: 'shadow-blue-500/30', label: t('menu.tasks') },
      NOTES: { Icon: StickyNote, bg: 'bg-orange-500', glow: 'shadow-orange-500/30', label: t('pinned') || 'Pinned' },
      JOURNAL: { Icon: JournalIconFixed, bg: 'bg-rose-600', glow: 'shadow-rose-600/30', label: t('menu.journal') },
      PHOTOS: { Icon: Fan, bg: 'bg-purple-500', glow: 'shadow-purple-500/30', label: t('menu.gallery') },
      SHOP: { Icon: ShoppingBag, bg: 'bg-amber-400', glow: 'shadow-amber-500/30', label: t('menu.shop') },
      MILESTONE: { Icon: CircleStar, bg: 'bg-rose-600', glow: 'shadow-rose-600/30', label: t('parent.milestone') },
      LEDGER: { Icon: WalletCards, bg: 'bg-indigo-500', glow: 'shadow-indigo-500/30', label: t('menu.ledger') },
      STORAGE: { Icon: Refrigerator, bg: 'bg-emerald-600', glow: 'shadow-emerald-600/30', label: t('storage.title') || '物资' },
      PROFILE: { Icon: User, bg: 'bg-slate-700', glow: 'shadow-slate-700/30', label: t('menu.profile') },
      MYGALLERY: { Icon: Sparkles, bg: 'bg-indigo-600', glow: 'shadow-indigo-600/30', label: t('menu.gallery') },
    }[w.type] || { Icon: Layout, bg: 'bg-slate-500', glow: 'shadow-slate-500/20', label: w.type }

    const isIconOnly = w.size === 'ICON' || ICON_ONLY_WIDGETS.includes(w.type)

    return (
      <BausteinWidgetContainer
        onClick={handleWidgetClick}
        isEditing={isEditing}
        isIconOnly={isIconOnly}
        label={!isIconOnly ? config.label : undefined}
        icon={!isIconOnly ? (
          <config.Icon
            className="w-5 h-5 transition-transform"
            {...(w.type === 'NOTES'
              ? {
                stroke: "#f8b15eff", // 琥珀黄-600 (参考 Pin 图标的色系)
                fill: "#ffe4a0ff",   // 琥珀黄-400 (明亮填充层)
                strokeWidth: 2.2
              }
              : w.type === 'TASKS'
              ? {
                stroke: "#6ea1ffff", // 柔和生动蓝 (蓝-500级)
                fill: "#c6daffff",   // 云朵淡蓝 (蓝-100级)
                strokeWidth: 2.2
              }
              : w.type === 'LEDGER'
              ? {
                stroke: "#8a94ffff", // 活力淀蓝
                fill: "#ced3ffff",   // 柔薰衣草蓝
                strokeWidth: 2.2
              }
              : w.type === 'STORAGE'
              ? {
                stroke: "#10b981ff", // 活力翡翠 (绿-500级)
                fill: "#d1fae5ff",   // 薄荷嫩绿 (绿-100级)
                strokeWidth: 2.2
              }
              : w.type === 'MILESTONE'
              ? {
                stroke: "#be123cff", // 蔷薇红 (星标大事件)
                fill: "#ffe4e6ff",   // 樱花粉
                strokeWidth: 2.2
              }
              : w.type === 'JOURNAL'
              ? {
                stroke: "#ff2442ff", // 小红书红 (日志专色)
                fill: "#fff1f2ff",   // 极淡红
                strokeWidth: 2.2
              }
              : w.type === 'PHOTOS'
              ? {
                stroke: "#7e22ceff", // 丁香紫 (紫-700级)
                fill: "#f3e8ffff",   // 薰衣草淡紫 (紫-100级)
                strokeWidth: 2.2
              }
              : { strokeWidth: 2 })}
          />
        ) : undefined}
        accentColor={config.bg}
      >
        {isIconOnly ? (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 group/icon relative shadow-[inset_0_2px_12px_rgba(0,0,0,0.3)] transition-all active:scale-[0.98]">
            <config.Icon className="w-8 h-8 text-white drop-shadow-md transition-transform group-hover/icon:scale-110" />
            <span className="label-mono text-[11px] font-black text-white uppercase tracking-[0.15em] drop-shadow-sm select-none opacity-80 group-hover/icon:opacity-100 transition-opacity">
              {config.label}
            </span>
          </div>
        ) : (
          (() => {
            switch (w.type) {
              case 'TASKS': return <TasksWidget size={w.size} cellSize={cellSize} />
              case 'NOTES': return <NotesWidget size={w.size} cellSize={cellSize} />
              case 'JOURNAL': return <JournalWidget size={w.size} cellSize={cellSize} />
              case 'PHOTOS': return <PhotoWidget size={w.size} cellSize={cellSize} />
              case 'MILESTONE': return <MilestoneWidget size={w.size} cellSize={cellSize} />
              case 'LEDGER': return <LedgerWidget size={w.size} cellSize={cellSize} />
              case 'STORAGE': return <StorageWidget size={w.size} cellSize={cellSize} />
              case 'PROFILE': return <ProfileWidget size={w.size} cellSize={cellSize} />
              case 'MYGALLERY': return <MyGalleryWidget size={w.size} cellSize={cellSize} />
              default: return <div>Unknown {w.type}</div>
            }
          })()
        )}
      </BausteinWidgetContainer>
    )
  }

  if (loading) {
    return (
      <div className="h-dvh flex items-center justify-center bg-[#E5E5E0] relative overflow-hidden app-bg-pattern p-6">
        {/* Subtle Industrial Background Noise */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[radial-gradient(circle_at_center,black_1px,transparent_1px)] bg-[length:24px_24px]" />

        <div className="hardware-well w-full max-w-sm rounded-[32px] p-8 flex flex-col items-center gap-8 relative shadow-well bg-[#DADBD4] border border-black/5">
          {/* Corner Screws */}
          <div className="absolute top-4 left-4 w-1.5 h-1.5 rounded-full bg-black/10 border border-white/20 shadow-inner" />
          <div className="absolute top-4 right-4 w-1.5 h-1.5 rounded-full bg-black/10 border border-white/20 shadow-inner" />
          <div className="absolute bottom-4 left-4 w-1.5 h-1.5 rounded-full bg-black/10 border border-white/20 shadow-inner" />
          <div className="absolute bottom-4 right-4 w-1.5 h-1.5 rounded-full bg-black/10 border border-white/20 shadow-inner" />

          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-white shadow-cap flex items-center justify-center relative overflow-hidden group">
              <Image src="/dog.svg" alt="DoDoo" width={40} height={40} className="contrast-125 animate-pulse" />
            </div>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white animate-ping" />
          </div>

          <div className="flex flex-col items-center gap-2">
            <h1 className="label-mono text-[11px] font-black text-slate-900 tracking-[.4em] uppercase opacity-80">
              System Boot Sequence
            </h1>
            <span className="label-mono text-[8px] text-slate-400 uppercase tracking-widest leading-none">
              Dodoo Core Engine v{versionData.version}
            </span>
          </div>

          <div className="w-full space-y-3">
            {/* Progress Well */}
            <div className="h-1.5 w-full bg-black/5 rounded-full overflow-hidden p-[1px] shadow-inner border border-black/5">
              <motion.div
                className="h-full bg-indigo-500 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.5)]"
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
              />
            </div>

            <div className="flex flex-col gap-1 px-1">
              {[
                "Syncing kernel state...",
                "Calibrating HUD modules...",
                "Establishing secure link..."
              ].map((msg, i) => (
                <div key={i} className="flex items-center gap-2 overflow-hidden h-3">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                    className="w-1 h-1 bg-indigo-400 rotate-45 shrink-0"
                  />
                  <p className="label-mono text-[7px] text-slate-500 uppercase tracking-wider truncate">
                    {msg}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-dvh w-full flex flex-col relative overflow-hidden app-bg-pattern">
      {/* ─── Integrated Navbar & HUD ─── */}
      <BausteinAdminNavbar
        isEditing={isEditing}
        onToggleEdit={() => setIsEditing(!isEditing)}
      />

      <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(ellipse_at_center,var(--surface-warm)_0%,transparent_100%)] z-0" />
      <NatureBackground />
      <Confetti config={confetti} />

      {/* ─── Premium Industrial Edit Control Board ─── */}
      <AnimatePresence>
        {isEditing && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className={clsx(
              "fixed left-0 right-0 bottom-0 z-[1000] flex items-center justify-between border-t-4 border-black/20 text-slate-800 shadow-[0_-10px_40px_rgba(0,0,0,0.4)] transition-all font-sans overflow-hidden bg-[#E6E2D1] h-[84px] px-8 pb-[env(safe-area-inset-bottom)]",
            )}
          >
            {/* Panel Texture & Screws */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.05] bg-[radial-gradient(circle_at_center,black_1px,transparent_1px)] bg-[length:16px_16px]" />
            <div className="absolute top-2 left-2 w-1.5 h-1.5 rounded-full bg-black/10 border border-white/20" />
            <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-black/10 border border-white/20" />
            <div className="absolute bottom-2 left-2 w-1.5 h-1.5 rounded-full bg-black/10 border border-white/20" />
            <div className="absolute bottom-2 right-2 w-1.5 h-1.5 rounded-full bg-black/10 border border-white/20" />

            <div className="flex items-center gap-4 sm:gap-8 flex-1 overflow-hidden pr-4 relative z-10">
              <div className="flex items-center gap-3 px-4 py-2 bg-[var(--well-bg)] rounded-xl shadow-well shrink-0">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span className="text-[10px] font-black uppercase tracking-widest hidden xs:inline">{t('button.manage')}</span>
              </div>

              <div className="h-6 w-[2px] bg-black/10 hidden md:block" />

              {/* Page Switcher in Edit HUD */}
              <div className="flex items-center bg-[var(--well-bg)] rounded-xl p-1.5 gap-1.5 shrink-0 shadow-well">
                {Array.from({ length: pageCount }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i)}
                    className={clsx(
                      "px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-tighter transition-all shrink-0",
                      currentPage === i
                        ? "bg-white text-indigo-600 shadow-cap translate-y-[-1px]"
                        : "text-slate-400 hover:text-slate-600 hover:bg-white/40"
                    )}
                  >
                    {t('parent.page', { count: (i + 1).toString() })}
                  </button>
                ))}
              </div>

              <div className="h-6 w-[2px] bg-black/10 hidden md:block" />

              <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto no-scrollbar py-1 flex-1">
                {[
                  { type: 'TASKS', Icon: SquareCheckBig, color: 'text-blue-500' },
                  { type: 'NOTES', Icon: StickyNote, color: 'text-orange-500' },
                  { type: 'JOURNAL', Icon: SquareStar, color: 'text-rose-600' },
                  { type: 'PHOTOS', Icon: Fan, color: 'text-purple-500' },
                  { type: 'SHOP', Icon: ShoppingBag, color: 'text-amber-500' },
                  { type: 'MILESTONE', Icon: CircleStar, color: 'text-rose-600' },
                  { type: 'LEDGER', Icon: WalletCards, color: 'text-indigo-500' },
                  { type: 'STORAGE', Icon: Refrigerator, color: 'text-emerald-600' },
                  { type: 'PROFILE', Icon: User, color: 'text-slate-700' },
                  { type: 'MYGALLERY', Icon: Sparkles, color: 'text-indigo-600' }
                ].map(({ type, Icon, color }) => {
                  return (
                    <button
                      key={type}
                      onClick={() => addWidget(type)}
                      className={clsx(
                        "hardware-btn group shrink-0"
                      )}
                    >
                      <div className="hardware-well w-12 h-12 rounded-xl flex items-center justify-center p-1 bg-[#D9D5C4]">
                        <div className="hardware-cap w-full h-full bg-white rounded-lg flex items-center justify-center shadow-cap group-hover:bg-slate-50">
                          <Icon className={clsx("w-5 h-5", color)} />
                        </div>
                      </div>
                      <span className="absolute -bottom-12 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest rounded shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-[1100] border-2 border-white/20">
                        {t(`menu.${type.toLowerCase()}`) || type}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="flex items-center gap-4 shrink-0 relative z-10">
              <button
                onClick={async () => {
                  if (!confirm(t('parent.resetConfirm'))) return
                  await Promise.all(widgets.map(w =>
                    fetch(`/api/home-widgets?id=${w.id}`, { method: 'DELETE' })
                  ))
                  window.location.reload()
                }}
                className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-rose-500 transition-colors"
                title="Wipe everything"
              >
                {t('parent.reset')}
              </button>
              <div className="h-6 w-[2px] bg-black/10" />
              <button
                onClick={() => setIsEditing(false)}
                className="hardware-btn group shrink-0"
                title={t('parent.done')}
              >
                <div className="hardware-well w-12 h-12 rounded-xl flex items-center justify-center bg-[#D9D5C4] p-1">
                  <div className="hardware-cap w-full h-full bg-[var(--accent-moss)] rounded-lg flex items-center justify-center group-hover:brightness-110 text-white">
                    <Check className="w-5 h-5 drop-shadow-md" />
                  </div>
                </div>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Bento Stage ─── */}
      <main
        ref={stageRef}
        className={clsx(
          "relative flex-1 z-10 w-full h-full flex justify-center no-scrollbar transition-all duration-300 items-center overflow-hidden",
          isEditing && "pb-[84px]"
        )}
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
        {/* Scrolling Grid Area */}
        <div className="w-full h-full relative overflow-hidden">

          <motion.div
            id="grid-stage"
            className="absolute inset-0 flex"
            animate={{ x: -currentPage * stageW }}
            transition={{ type: 'spring', stiffness: 220, damping: 28, mass: 1 }}
            drag={!isEditing && "x"}
            dragConstraints={{ left: -(pageCount - 1) * stageW, right: 0 }}
            dragElastic={0.15}
            onDragEnd={(_, info) => {
              if (isEditing) return
              const threshold = stageW * 0.2
              if (info.offset.x < -threshold && currentPage < pageCount - 1) {
                setCurrentPage(prev => prev + 1)
              } else if (info.offset.x > threshold && currentPage > 0) {
                setCurrentPage(prev => prev - 1)
              }
            }}
          >
            {/* 1. Unified Machine Bed Grid */}
            <div className="absolute inset-0 pointer-events-none">
              {Array.from({ length: pageCount }).map((_, pIdx) => (
                <div key={`page-bed-${pIdx}`} className="absolute top-0 h-full" style={{ left: pIdx * stageW, width: stageW }}>
                  {/* Visual Center Point */}
                  <div
                    className="absolute rounded-full border border-black/[0.03]"
                    style={{
                      left: pageOffsetX - 40,
                      top: pageOffsetY - 40,
                      width: gridCols * (cellSize + currentGap) + 80,
                      height: maxRows * (cellSize + currentGap) + 80,
                    }}
                  />

                  {Array.from({ length: gridCols * maxRows }).map((_, i) => {
                    const x = i % gridCols
                    const y = Math.floor(i / gridCols)
                    return (
                      <div
                        key={`bed-slot-${pIdx}-${i}`}
                        className="absolute border border-black/[0.04] rounded-[24px]"
                        style={{
                          left: pageOffsetX + x * (cellSize + currentGap),
                          top: pageOffsetY + y * (cellSize + currentGap),
                          width: cellSize,
                          height: cellSize,
                        }}
                      />
                    )
                  })}
                </div>
              ))}
            </div>

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
                              {!ICON_ONLY_WIDGETS.includes(w.type) && (
                                <>
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
                                </>
                              )}
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
                {loading ? t('common.loading') : t('parent.reset')}
              </div>
            )}
          </motion.div>
        </div>
      </main>

      {/* ─── Pagination Dots (iOS Style) ─── */}
      {
        !isEditing && pageCount > 1 && (
          <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[150] flex gap-2.5">
            {Array.from({ length: pageCount }).map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i)}
                className={clsx(
                  "w-1.5 h-1.5 rounded-full transition-all duration-300",
                  currentPage === i ? "bg-slate-800 scale-125 shadow-sm" : "bg-slate-800/20"
                )}
              />
            ))}
          </div>
        )
      }



      <style>{`
        html, body { overflow: hidden; height: 100%; }
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
