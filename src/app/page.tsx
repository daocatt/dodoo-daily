'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { Languages, CheckSquare, Smile, Store, Book, Settings, Image as ImageIcon } from 'lucide-react'
import { motion } from 'motion/react'
import NatureBackground from '@/components/NatureBackground'
import { useI18n } from '@/contexts/I18nContext'

export default function Home() {
  const router = useRouter()
  const { locale, setLocale, t } = useI18n()
  const [stats, setStats] = React.useState<any>(null)

  React.useEffect(() => {
    fetch('/api/stats')
      .then(res => res.json())
      .then(data => setStats(data))
  }, [])

  const toggleLanguage = React.useCallback(() => {
    setLocale(locale === 'en' ? 'zh-CN' : 'en')
  }, [locale, setLocale])

  // Mock recent artworks (messy positions)
  const recentArtworks = [
    { id: 1, title: 'Summer Day', bg: 'bg-[#ffedb3]', rotate: -15, x: -40, y: 15, image: '/artwork1.png' },
    { id: 2, title: 'My Pet', bg: 'bg-[#d0f4de]', rotate: 5, x: 40, y: -25, image: '/artwork2.png' },
    { id: 3, title: 'Dream Castle', bg: 'bg-[#ffcfd2]', rotate: 12, x: 15, y: 40, image: '/artwork1.png' },
  ]

  // Stable references for translations and locale
  const menuItems = React.useMemo(() => [
    { title: t('menu.tasks'), icon: CheckSquare, bg: 'bg-[#43aa8b]', shadow: 'shadow-emerald-900/10', href: '/tasks' },    // Bold Green
    { title: t('menu.emotions'), icon: Smile, bg: 'bg-[#f8961e]', shadow: 'shadow-orange-900/10', href: '/emotions' },  // Vibrant Orange
    { title: t('menu.gallery'), icon: ImageIcon, bg: 'bg-[#f9c74f]', shadow: 'shadow-yellow-900/10', href: '/gallery' }, // Sunny Yellow
    { title: t('menu.journal'), icon: Book, bg: 'bg-[#277da1]', shadow: 'shadow-blue-900/10', href: '/journal' },      // Sky Blue
    { title: t('menu.shop'), icon: Store, bg: 'bg-[#907a67]', shadow: 'shadow-stone-900/10', href: '/shop' },        // Wood/Brown
  ], [t])

  return (
    <div className="h-dvh flex flex-col relative overflow-hidden text-[#4a3728]">
      <NatureBackground />

      {/* Header */}
      <header className="relative z-10 flex justify-between items-center p-4 md:p-6 md:px-12 backdrop-blur-md bg-white/30 border-b border-[#4a3728]/5 shrink-0">
        <div className="flex items-center gap-3">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-white/40 backdrop-blur-md flex items-center justify-center shadow-md border border-white/50 overflow-hidden"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`${stats?.avatarUrl || "/dog.svg"}?v=4`}
              alt="DoDoo Daily"
              className={`w-full h-full object-cover ${!stats?.avatarUrl ? 'p-1.5' : ''}`}
              onError={(e) => { e.currentTarget.src = "/dog.svg"; e.currentTarget.className = "w-full h-full object-contain p-1.5"; }}
            />
          </motion.div>
          <span className="font-extrabold text-xl md:text-2xl tracking-tight text-[#2c2416] drop-shadow-sm">{t('site.title')}</span>
        </div>

        <div className="flex items-center gap-3 md:gap-4">
          <button onClick={() => router.push('/settings')}
            className="flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/40 backdrop-blur-md hover:bg-white/60 border border-white/50 transition-colors shadow-sm text-[#2c2416] focus:outline-none"
          >
            <Settings className="w-4 h-4 md:w-5 md:h-5" />
          </button>
          <button
            onClick={toggleLanguage}
            className="flex items-center justify-center min-w-[3rem] px-3 py-1.5 md:px-4 md:py-2 rounded-full bg-white/40 backdrop-blur-md hover:bg-white/60 border border-white/50 transition-colors text-xs md:text-sm font-bold text-[#2c2416] shadow-sm"
          >
            <Languages className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
            {locale === 'en' ? '中' : 'EN'}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 w-full max-w-7xl mx-auto flex flex-col md:flex-row gap-4 p-4 md:p-8 items-center md:items-stretch overflow-hidden">

        {/* Left Side: Recent Artworks (Carousel / Overlapping style) */}
        <div className="flex-1 w-full flex flex-col justify-center gap-2 items-center">
          <div className="relative h-64 sm:h-96 md:h-[32rem] w-full flex items-center justify-center perspective-2000">
            {recentArtworks.map((art, index) => (
              <motion.div
                key={art.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  rotate: art.rotate,
                  x: art.x,
                  y: art.y,
                }}
                transition={{
                  delay: index * 0.1,
                  type: "spring",
                  stiffness: 260,
                  damping: 20
                }}
                whileHover={{ scale: 1.05, zIndex: 10, rotate: 0 }}
                className={`absolute w-44 h-60 sm:w-64 sm:h-80 md:w-80 md:h-[28rem] rounded-2xl shadow-xl ${art.bg} overflow-hidden border-4 md:border-[10px] border-white backdrop-blur-sm cursor-pointer group`}
                style={{
                  zIndex: recentArtworks.length - index,
                }}
              >
                {art.image && <img src={art.image} alt={art.title} className="w-full h-full object-cover" />}
                <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute bottom-4 left-4 right-4 text-center">
                  <div className="inline-block text-[10px] md:text-sm font-bold text-[#2d3a2d] bg-white/90 px-3 py-1 rounded-xl backdrop-blur-md shadow-sm">
                    {art.title}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Right Side: Navigation Menu (Nintendo Switch Style Vertical List) */}
        <div className="w-full md:w-[360px] flex flex-col justify-center gap-3 shrink-0 my-auto h-full max-h-[85vh]">
          {menuItems.map((item, index) => (
            <motion.button
              key={item.href}
              onClick={() => router.push(item.href)}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                delay: index * 0.05,
                type: "spring",
                stiffness: 450,
                damping: 30,
                mass: 0.5
              }}
              whileHover={{
                scale: 1.02,
                x: -24,
                transition: { duration: 0.1, ease: "easeOut" }
              }}
              whileTap={{ scale: 0.98 }}
              className={`group relative flex items-center gap-4 w-full p-3 md:p-4 rounded-xl ${item.bg} text-white ${item.shadow} shadow-md overflow-hidden flex-1 md:flex-initial min-h-[4rem] max-h-[6rem] transition-none`}
            >
              <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors duration-200" />
              <div className="relative z-10 flex items-center gap-4 w-full">
                <div className={`w-12 h-12 md:w-14 md:h-14 shrink-0 rounded-lg bg-white/10 backdrop-blur-md flex items-center justify-center shadow-inner group-hover:scale-110 group-hover:bg-white/20 transition-transform duration-100`}>
                  <item.icon className="w-6 h-6 md:w-7 md:h-7 text-white drop-shadow-sm" />
                </div>
                <div className="flex flex-col items-start ml-2">
                  <span className="text-lg md:text-xl font-bold tracking-tight drop-shadow-sm">{item.title}</span>
                </div>
              </div>
            </motion.button>
          ))}
        </div>

      </main>

      {/* Footer */}
      <footer className="relative z-10 py-2 md:py-4 text-center text-[10px] md:text-xs font-medium text-[#4a3728]/60 drop-shadow-sm flex flex-col items-center justify-center shrink-0">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          {t('footer.copyright', { year: new Date().getFullYear().toString() })}
        </motion.p>
      </footer>
    </div>
  )
}

