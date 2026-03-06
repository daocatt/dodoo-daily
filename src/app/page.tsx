'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { Languages, CheckSquare, Smile, Store, Book, Settings, Image as ImageIcon } from 'lucide-react'
import { motion } from 'motion/react'
import AnimatedSky from '@/components/AnimatedSky'
import { useI18n } from '@/contexts/I18nContext'

export default function Home() {
  const router = useRouter()
  const { locale, setLocale } = useI18n()

  const toggleLanguage = () => {
    setLocale(locale === 'en' ? 'zh-CN' : 'en')
  }

  // Mock recent artworks (messy positions)
  const recentArtworks = [
    { id: 1, title: 'Summer Day', bg: 'bg-orange-200', rotate: -15, x: -20, y: 10 },
    { id: 2, title: 'My Pet', bg: 'bg-emerald-200', rotate: 5, x: 20, y: -15 },
    { id: 3, title: 'Dream Castle', bg: 'bg-indigo-200', rotate: 12, x: 10, y: 20 },
  ]

  // Menu items with optimized gradient colors and sizing
  const menuItems = [
    { title: locale === 'en' ? 'Tasks' : '任务', subtitle: locale === 'en' ? '任务' : 'Tasks', icon: CheckSquare, bg: 'bg-gradient-to-r from-blue-400 to-cyan-400', shadow: 'shadow-blue-400/50', href: '/tasks' },
    { title: locale === 'en' ? 'Emotions' : '情绪', subtitle: locale === 'en' ? '情绪' : 'Emotions', icon: Smile, bg: 'bg-gradient-to-r from-pink-400 to-rose-400', shadow: 'shadow-pink-400/50', href: '/emotions' },
    { title: locale === 'en' ? 'Gallery' : '画廊', subtitle: locale === 'en' ? '画廊' : 'Gallery', icon: ImageIcon, bg: 'bg-gradient-to-r from-purple-400 to-violet-400', shadow: 'shadow-purple-400/50', href: '/gallery' },
    { title: locale === 'en' ? 'Journal' : '日志', subtitle: locale === 'en' ? '日志' : 'Journal', icon: Book, bg: 'bg-gradient-to-r from-emerald-400 to-teal-400', shadow: 'shadow-emerald-400/50', href: '/journal' },
    { title: locale === 'en' ? 'Shop' : '商店', subtitle: locale === 'en' ? '商店' : 'Shop', icon: Store, bg: 'bg-gradient-to-r from-amber-400 to-orange-400', shadow: 'shadow-amber-400/50', href: '/shop' },
  ]

  return (
    <div className="h-dvh flex flex-col relative overflow-hidden text-[#2c2416]">
      {/* Animated Sky Background */}
      <AnimatedSky />

      {/* Header */}
      <header className="relative z-10 flex justify-between items-center p-4 md:p-6 md:px-12 backdrop-blur-sm bg-white/10 shrink-0">
        <div className="flex items-center gap-3">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-lg border border-white/30 overflow-hidden"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/dog.svg" alt="DoDoo Daily" className="w-full h-full object-contain p-1" />
          </motion.div>
          <span className="font-extrabold text-xl md:text-2xl tracking-tight text-white drop-shadow-md">DoDoo Daily</span>
        </div>

        <div className="flex items-center gap-3 md:gap-4">
          <button onClick={() => {
            const role = document.cookie.includes('dodoo_role=PARENT') ? 'PARENT' : 'CHILD'
            if (role === 'PARENT') router.push('/parent')
          }}
            className="flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/30 backdrop-blur-md hover:bg-white/50 border border-white/40 transition-colors shadow-sm text-white focus:outline-none"
          >
            <Settings className="w-4 h-4 md:w-5 md:h-5" />
          </button>
          <button
            onClick={toggleLanguage}
            className="flex items-center justify-center min-w-[3rem] px-3 py-1.5 md:px-4 md:py-2 rounded-full bg-white/30 backdrop-blur-md hover:bg-white/50 border border-white/40 transition-colors text-xs md:text-sm font-bold text-white shadow-sm"
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
          <div className="relative h-48 sm:h-64 md:h-96 w-full flex items-center justify-center perspective-1000">
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
                  delay: index * 0.15,
                  type: "spring",
                  stiffness: 80,
                  damping: 12
                }}
                whileHover={{ scale: 1.05, zIndex: 10, rotate: 0 }}
                className={`absolute w-36 h-48 sm:w-48 sm:h-64 md:w-64 md:h-80 rounded-[2rem] shadow-2xl ${art.bg} flex items-center justify-center border-4 md:border-[8px] border-white/80 backdrop-blur-sm cursor-pointer`}
                style={{
                  zIndex: recentArtworks.length - index,
                }}
              >
                <div className="text-sm md:text-xl font-bold text-[#2c2416]/50 bg-white/30 px-3 py-1 md:px-4 md:py-2 rounded-full backdrop-blur-md">
                  {art.title}
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
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 + 0.2, type: "spring", stiffness: 100 }}
              whileHover={{ scale: 1.02, x: -8 }}
              whileTap={{ scale: 0.98 }}
              className={`group relative flex items-center gap-4 w-full p-3 md:p-4 rounded-3xl ${item.bg} text-white ${item.shadow} shadow-lg hover:shadow-xl transition-all overflow-hidden flex-1 md:flex-initial min-h-[4rem] max-h-[6rem]`}
            >
              {/* Highlight bar indicator */}
              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-white/30 group-hover:bg-white transition-colors" />

              <div className={`w-12 h-12 md:w-14 md:h-14 shrink-0 rounded-[1.25rem] bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner group-hover:scale-110 group-hover:bg-white/30 transition-all ml-2`}>
                <item.icon className="w-6 h-6 md:w-7 md:h-7 text-white drop-shadow-sm" />
              </div>
              <div className="flex flex-col items-start ml-2">
                <span className="text-lg md:text-2xl font-extrabold tracking-wide drop-shadow-md">{item.title}</span>
                <span className="text-xs md:text-sm font-medium text-white/80">{item.subtitle}</span>
              </div>
            </motion.button>
          ))}
        </div>

      </main>

      {/* Footer */}
      <footer className="relative z-10 py-2 md:py-4 text-center text-[10px] md:text-xs font-medium text-white/70 drop-shadow-sm flex flex-col items-center justify-center shrink-0">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          &copy; {new Date().getFullYear()} DoDoo Daily. All rights reserved.
        </motion.p>
      </footer>
    </div>
  )
}

