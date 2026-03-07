'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Languages, CheckSquare, Smile, Store, Book, Settings, Image as ImageIcon, ShieldAlert, ChevronRight, X, Maximize2 } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import NatureBackground from '@/components/NatureBackground'
import { useI18n } from '@/contexts/I18nContext'

export default function Home() {
  const router = useRouter()
  const { locale, setLocale, t } = useI18n()
  const [stats, setStats] = React.useState<any>(null)
  const [sysSettings, setSysSettings] = React.useState<any>(null)
  const [hoveredIdx, setHoveredIdx] = React.useState<number | null>(null)
  const [zoomedArt, setZoomedArt] = useState<any>(null)

  // Artwork Stack State with default rotations
  const [artworks, setArtworks] = useState([
    { id: 1, title: 'Summer Day', bg: 'bg-[#ffedb3]', defaultRotate: -15, rotate: -15, x: -40, y: 15, image: '/artwork1.png' },
    { id: 2, title: 'My Pet', bg: 'bg-[#d0f4de]', defaultRotate: 5, rotate: 5, x: 40, y: -25, image: '/artwork2.png' },
    { id: 3, title: 'Dream Castle', bg: 'bg-[#ffcfd2]', defaultRotate: 12, rotate: 12, x: 15, y: 40, image: '/artwork1.png' },
  ])

  React.useEffect(() => {
    fetch('/api/stats')
      .then(res => res.json())
      .then(data => setStats(data))

    fetch('/api/system/settings')
      .then(res => res.json())
      .then(data => setSysSettings(data))
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
    { title: t('menu.tasks'), icon: CheckSquare, color: 'text-[#43aa8b]', bg: 'bg-[#43aa8b]/10', href: '/tasks' },
    { title: t('menu.emotions'), icon: Smile, color: 'text-[#f8961e]', bg: 'bg-[#f8961e]/10', href: '/emotions' },
    { title: t('menu.gallery'), icon: ImageIcon, color: 'text-[#f9c74f]', bg: 'bg-[#f9c74f]/10', href: '/gallery' },
    { title: t('menu.journal'), icon: Book, color: 'text-[#277da1]', bg: 'bg-[#277da1]/10', href: '/journal' },
    { title: t('menu.shop'), icon: Store, color: 'text-[#907a67]', bg: 'bg-[#907a67]/10', href: '/shop' },
  ], [t])

  // System Closed View
  if (sysSettings?.isClosed && !stats?.isParent) {
    return (
      <div className="h-dvh flex flex-col items-center justify-center bg-rose-50 p-8 text-center space-y-8">
        <NatureBackground />
        <div className="relative z-10 w-32 h-32 bg-rose-100 rounded-[2.5rem] flex items-center justify-center shadow-inner">
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
            <span className="font-black text-xl md:text-2xl tracking-tight text-[#2c2416] block leading-none">{t('site.title')}</span>
            <span className="text-[10px] font-black uppercase tracking-widest text-[#4a3728]/40 mt-1 block leading-none">Family & Growth</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => stats?.isParent ? router.push('/parent') : router.push('/settings')}
            className="flex items-center justify-center w-10 h-10 rounded-2xl bg-white/50 backdrop-blur-md hover:bg-white/80 border border-white/80 transition-all shadow-sm text-[#2c2416] active:scale-95"
          >
            <Settings className="w-5 h-5" />
          </button>
          <button
            onClick={toggleLanguage}
            className="flex items-center justify-center min-w-[3.5rem] px-4 py-2 rounded-2xl bg-[#4a3728]/5 backdrop-blur-md hover:bg-[#4a3728]/10 border border-[#4a3728]/10 transition-all text-xs font-black text-[#2c2416] active:scale-95"
          >
            {locale === 'en' ? '中' : 'EN'}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 w-full max-w-7xl mx-auto flex flex-col md:flex-row gap-8 p-4 md:p-12 items-center md:items-stretch overflow-hidden">

        {/* Left Side: Display - Interaction Refined */}
        <div className="flex-1 w-full h-full flex flex-col justify-center gap-2 items-center">
          <div className="relative h-64 sm:h-96 md:h-[32rem] w-full flex items-center justify-center perspective-2000">
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
                  className={`absolute w-44 h-56 sm:w-64 sm:h-80 md:w-72 md:h-96 ${art.bg} rounded-[2rem] p-4 shadow-2xl border-8 border-white overflow-hidden cursor-pointer select-none`}
                >
                  <div className="w-full h-full rounded-[1.5rem] bg-white/40 overflow-hidden flex items-center justify-center border border-white/20 pointer-events-none">
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
        <div className="w-full md:w-[24rem] flex items-center justify-center md:justify-end shrink-0">
          <div className="flex flex-col w-full space-y-2">
            {menuItems.map((item, idx) => (
              <motion.button
                key={item.title}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                onClick={() => router.push(item.href)}
                className={`relative group flex items-center justify-between p-3 md:p-4 transition-all rounded-lg w-full text-left border border-white/20 ${item.bg} hover:brightness-95 hover:shadow-lg`}
              >
                <div className="flex items-center gap-4 relative z-10 transition-transform group-hover:translate-x-1.5 duration-300">
                  <div className={`w-10 h-10 rounded-md bg-white/30 backdrop-blur-sm flex items-center justify-center shadow-sm`}>
                    <item.icon className={`w-5 h-5 ${item.color}`} />
                  </div>
                  <span className="font-black text-lg md:text-xl text-[#2c2416] tracking-tight">{item.title}</span>
                </div>

                <ChevronRight className={`w-5 h-5 text-[#4a3728]/40 transition-all duration-300 ${hoveredIdx === idx ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-3'}`} />
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
              className={`relative max-w-full max-h-full aspect-[3/4] ${zoomedArt.bg} rounded-3xl p-4 md:p-6 shadow-2xl border-4 md:border-8 border-white overflow-hidden flex items-center justify-center`}
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

      <footer className="relative z-10 p-4 md:p-6 text-center text-[#4a3728]/40 text-[10px] font-bold uppercase tracking-widest shrink-0">
        {t('footer.copyright', { year: new Date().getFullYear().toString() })}
      </footer>
    </div>
  )
}
