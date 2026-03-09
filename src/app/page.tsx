'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Languages, CheckSquare, Smile, Store, Book, Settings, Image as ImageIcon, ShieldAlert, ChevronRight, X, Maximize2 } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import NatureBackground from '@/components/NatureBackground'
import { useI18n } from '@/contexts/I18nContext'

interface Stats {
  isParent: boolean
}

interface SystemSettings {
  isClosed: boolean
  systemName: string
  homepageImages?: string
}

interface Artwork {
  id: number
  image: string
  bg: string
  defaultRotate: number
  rotate: number
  x: number
  y: number
  title?: string
}

export default function Home() {
  const router = useRouter()
  const { locale, setLocale, t } = useI18n()
  const [stats, setStats] = React.useState<Stats | null>(null)
  const [sysSettings, setSysSettings] = React.useState<SystemSettings | null>(null)
  const [hoveredIdx, setHoveredIdx] = React.useState<number | null>(null)
  const [zoomedArt, setZoomedArt] = useState<Artwork | null>(null)

  // Artwork Stack State with default rotations
  const [artworks, setArtworks] = useState<Artwork[]>([])

  React.useEffect(() => {
    fetch('/api/stats')
      .then(res => res.json())
      .then(data => setStats(data))

    fetch('/api/system/settings')
      .then(res => res.json())
      .then(data => {
        setSysSettings(data);
        if (data.homepageImages) {
          try {
            const urls = JSON.parse(data.homepageImages);
            const bgs = ['bg-[#ffedb3]', 'bg-[#d0f4de]', 'bg-[#ffcfd2]', 'bg-[#c9e4de]', 'bg-[#f4acb7]'];
            const rotates = [-15, 12, -25, 18, -8];
            const xs = [-90, 90, -60, 80, -30];
            const ys = [-50, -60, 70, 60, 20];

            const formatted = urls.map((url: string, i: number) => ({
              id: i,
              image: url,
              bg: bgs[i % bgs.length],
              defaultRotate: rotates[i % rotates.length],
              rotate: rotates[i % rotates.length],
              x: xs[i % xs.length],
              y: ys[i % ys.length]
            }));
            setArtworks(formatted);
          } catch (e) { }
        } else {
          // Default artworks if none configured
          setArtworks([
            { id: 1, image: '/artwork1.png', bg: 'bg-[#ffedb3]', defaultRotate: -15, rotate: -15, x: -90, y: -50 },
            { id: 2, image: '/artwork2.png', bg: 'bg-[#d0f4de]', defaultRotate: 12, rotate: 12, x: 90, y: -60 },
            { id: 3, image: '/artwork1.png', bg: 'bg-[#ffcfd2]', defaultRotate: -25, rotate: -25, x: -60, y: 70 },
          ]);
        }
      })
  }, [])

  const toggleLanguage = React.useCallback(() => {
    setLocale(locale === 'en' ? 'zh-CN' : 'en')
  }, [locale, setLocale])

  const cycleArtwork = (clickedId: number) => {
    const isTop = artworks[artworks.length - 1].id === clickedId

    if (isTop) {
      // Second click on top: Zoom in
      setZoomedArt(artworks[artworks.length - 1])
      return
    }

    // Move to front and set rotate to 0
    const newArtworks = artworks.map(art => {
      return { ...art, rotate: art.defaultRotate }
    })

    const clickedIdx = newArtworks.findIndex(a => a.id === clickedId)
    const [item] = newArtworks.splice(clickedIdx, 1)

    item.rotate = 0
    newArtworks.push(item)

    setArtworks(newArtworks)
  }

  const menuItems = React.useMemo(() => [
    { title: t('menu.tasks'), icon: CheckSquare, href: '/tasks', bg: 'bg-[#43aa8b]', shadow: 'shadow-[#43aa8b]/30', iconBg: 'bg-[#3a9679]' },
    // { title: t('menu.emotions'), icon: Smile, href: '/emotions', bg: 'bg-[#f8961e]', shadow: 'shadow-[#f8961e]/30', iconBg: 'bg-[#df841a]' },
    { title: t('menu.gallery'), icon: ImageIcon, href: '/gallery', bg: 'bg-[#e9b500]', shadow: 'shadow-[#e9b500]/30', iconBg: 'bg-[#cfa000]' },
    { title: t('menu.journal'), icon: Book, href: '/journal', bg: 'bg-[#277da1]', shadow: 'shadow-[#277da1]/30', iconBg: 'bg-[#206a89]' },
    { title: t('menu.shop'), icon: Store, href: '/shop', bg: 'bg-[#c47f5a]', shadow: 'shadow-[#c47f5a]/30', iconBg: 'bg-[#a86a48]' },
  ], [t])

  // System Closed View
  if (sysSettings?.isClosed && !stats?.isParent) {
    return (
      <div className="h-dvh flex flex-col items-center justify-center bg-rose-50 p-8 text-center space-y-8">
        <NatureBackground />
        <div className="relative z-10 w-32 h-32 bg-rose-100 rounded-xl flex items-center justify-center shadow-inner">
          <ShieldAlert className="w-16 h-16 text-rose-500" />
        </div>
        <div className="relative z-10 space-y-4">
          <h1 className="text-4xl font-black text-rose-900">{t('system.closed')}</h1>
          <p className="text-rose-700/60 max-w-md font-bold text-lg">{t('system.closedDesc')}</p>
        </div>
        <button
          onClick={() => window.location.href = '/login'}
          className="relative z-10 px-8 py-4 bg-rose-500 text-white rounded-2xl font-black shadow-xl shadow-rose-200"
        >
          {t('login.back')} / Re-login
        </button>
      </div>
    )
  }

  return (
    <div className="h-dvh flex flex-col relative overflow-hidden text-[#4a3728]">
      <NatureBackground />

      {/* Header */}
      <header className="relative z-10 flex justify-between items-center p-4 md:p-6 md:px-12 backdrop-blur-md bg-white/40 border-b border-[#4a3728]/10 shrink-0">
        <div className="flex items-center gap-4">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-12 h-12 md:w-14 md:h-14 flex items-center justify-center -ml-2"
          >
            <img src="/dog.svg" alt="DoDoo Logo" className="w-full h-full object-contain" />
          </motion.div>
          <div>
            <span className="font-black text-xl md:text-2xl tracking-tight text-[#2c2416] block leading-none">
              {sysSettings?.systemName || t('site.title')}
            </span>
            <span className="text-[10px] font-black uppercase tracking-widest text-[#4a3728]/40 mt-1 block leading-none">Family & Growth</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => stats?.isParent ? router.push('/parent') : router.push('/settings')}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-white/60 hover:bg-white/90 border border-white/80 transition-all shadow-sm text-[#2c2416] active:scale-95"
          >
            <Settings className="w-5 h-5" />
          </button>
          <button
            onClick={toggleLanguage}
            className="flex items-center justify-center min-w-[3.5rem] px-4 py-2 rounded-full bg-[#4a3728]/8 hover:bg-[#4a3728]/15 border border-[#4a3728]/15 transition-all text-xs font-black text-[#2c2416] active:scale-95"
          >
            {locale === 'en' ? '中' : 'EN'}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 w-full max-w-7xl mx-auto flex flex-col lg:flex-row gap-8 lg:gap-12 p-4 md:p-8 lg:p-12 pb-32 lg:pb-12 items-center lg:items-center overflow-y-auto lg:overflow-hidden">

        {/* Left Side: Display - Interaction Refined */}
        <div className="flex-1 w-full flex flex-col justify-center items-center py-8 lg:py-0">
          <div className="relative h-64 sm:h-80 lg:h-[32rem] w-full flex items-center justify-center perspective-2000">
            {artworks.map((art, index) => {
              const isTop = index === artworks.length - 1
              return (
                <motion.div
                  key={art.id}
                  layoutId={`artwork-${art.id}`}
                  initial={false}
                  animate={{
                    rotate: art.rotate,
                    x: art.x,
                    y: art.y,
                    zIndex: index,
                    scale: isTop ? 1.05 : 1,
                  }}
                  whileHover={{
                    y: art.y - 10,
                    scale: isTop ? 1.08 : 1.02,
                    rotate: isTop ? 0 : art.rotate,
                    transition: { duration: 0.2 }
                  }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => cycleArtwork(art.id)}
                  className={`absolute w-44 h-56 sm:w-56 sm:h-72 lg:w-72 lg:h-96 ${art.bg} rounded-xl p-4 shadow-2xl border-8 border-white overflow-hidden cursor-pointer select-none`}
                >
                  <div className="w-full h-full rounded-lg bg-white/40 overflow-hidden flex items-center justify-center border border-white/20 pointer-events-none">
                    <img src={art.image} alt={art.title} className="w-full h-full object-cover" />
                  </div>

                  {isTop && (
                    <div className="absolute bottom-6 right-6 p-2 bg-white/80 backdrop-blur-md rounded-xl shadow-lg text-[#4a3728]/40">
                      <Maximize2 className="w-4 h-4" />
                    </div>
                  )}
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* Right Side: Menu List */}
        <div className="w-full lg:w-[24rem] flex items-center justify-center lg:justify-end shrink-0 pb-12 lg:pb-0">
          <div className="flex flex-col w-full max-w-md lg:max-w-none space-y-3">
            {menuItems.map((item, idx) => (
              <motion.button
                key={item.title}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                onClick={() => router.push(item.href)}
                className={`relative group flex items-center justify-between p-3 md:p-4 transition-all duration-200 rounded-lg w-full text-left overflow-hidden ${item.bg} ${item.shadow} shadow-lg hover:shadow-xl hover:brightness-110 active:scale-[0.98]`}
              >
                {/* Bottom sweep highlight bar */}
                <AnimatePresence>
                  {hoveredIdx === idx && (
                    <motion.div
                      key="sweep"
                      className="absolute bottom-0 left-0 h-[3px] w-full origin-left"
                      style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.9) 50%, rgba(255,255,255,0.4) 100%)' }}
                      initial={{ scaleX: 0, opacity: 0 }}
                      animate={{ scaleX: 1, opacity: 1 }}
                      exit={{ scaleX: 0, opacity: 0 }}
                      transition={{ duration: 0.35, ease: 'easeOut' }}
                    />
                  )}
                </AnimatePresence>

                {/* Subtle inner glow on hover */}
                <AnimatePresence>
                  {hoveredIdx === idx && (
                    <motion.div
                      key="glow"
                      className="absolute inset-0 pointer-events-none"
                      style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.12) 0%, transparent 60%)' }}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    />
                  )}
                </AnimatePresence>

                <div className="flex items-center gap-4 relative z-10 transition-transform group-hover:translate-x-1 duration-200">
                  <div className={`w-10 h-10 rounded-md ${item.iconBg} flex items-center justify-center shadow-sm`}>
                    <item.icon className="w-5 h-5 text-white/90" />
                  </div>
                  <span className="font-black text-lg md:text-xl text-white tracking-tight drop-shadow-sm">{item.title}</span>
                </div>

                <ChevronRight className={`w-5 h-5 text-white/70 relative z-10 transition-all duration-200 ${hoveredIdx === idx ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'}`} />
              </motion.button>
            ))}
          </div>
        </div>
      </main>

      {/* LIGHTBOX ZOOM MODAL */}
      <AnimatePresence>
        {zoomedArt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setZoomedArt(null)}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xl flex items-center justify-center p-4 md:p-12 cursor-zoom-out"
          >
            <button className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors z-[110]">
              <X className="w-6 h-6" />
            </button>
            <motion.div
              layoutId={`artwork-${zoomedArt.id}`}
              className={`relative max-w-full max-h-full aspect-[3/4] ${zoomedArt.bg} rounded-xl p-4 md:p-6 shadow-2xl border-4 md:border-8 border-white overflow-hidden flex items-center justify-center`}
              style={{
                height: 'auto',
                width: 'auto',
                maxHeight: '90vh',
                maxWidth: '90vw'
              }}
            >
              <div className="w-full h-full rounded-2xl bg-white/40 overflow-hidden flex items-center justify-center border border-white/20">
                <img src={zoomedArt.image} alt={zoomedArt.title} className="max-w-full max-h-full object-contain pointer-events-none" />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  )
}
