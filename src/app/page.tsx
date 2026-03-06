'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { Languages, CheckSquare, Smile, Store, Book, Settings, Image as ImageIcon } from 'lucide-react'
import { motion } from 'motion/react'
import AnimatedSky from '@/components/AnimatedSky'

export default function Home() {
  const router = useRouter()
  const [locale, setLocale] = React.useState('en')

  const toggleLanguage = () => {
    setLocale(locale === 'en' ? 'zh-CN' : 'en')
  }

  // Mock recent artworks (messy positions)
  const recentArtworks = [
    { id: 1, title: 'Summer Day', bg: 'bg-orange-200', rotate: -15, x: -20, y: 10 },
    { id: 2, title: 'My Pet', bg: 'bg-emerald-200', rotate: 5, x: 20, y: -15 },
    { id: 3, title: 'Dream Castle', bg: 'bg-indigo-200', rotate: 12, x: 10, y: 20 },
  ]

  // Menu items
  const menuItems = [
    { title: 'Tasks (任务)', icon: CheckSquare, color: 'text-blue-500', bg: 'bg-blue-50', href: '/tasks' },
    { title: 'Emotions (情绪)', icon: Smile, color: 'text-pink-500', bg: 'bg-pink-50', href: '/emotions' },
    { title: 'Gallery (画廊)', icon: ImageIcon, color: 'text-purple-500', bg: 'bg-purple-50', href: '/gallery' },
    { title: 'Journal (日志)', icon: Book, color: 'text-green-500', bg: 'bg-green-50', href: '/journal' },
    { title: 'Shop (商店)', icon: Store, color: 'text-amber-500', bg: 'bg-amber-50', href: '/shop' },
  ]

  return (
    <div className="h-dvh flex flex-col relative overflow-hidden text-[#2c2416]">
      {/* Animated Sky Background */}
      <AnimatedSky />

      {/* Header */}
      <header className="relative z-10 flex justify-between items-center p-6 md:px-12 backdrop-blur-sm bg-white/10">
        <div className="flex items-center gap-3">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-lg border border-white/30 overflow-hidden"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/dog.svg" alt="DoDoo Daily" className="w-full h-full object-contain p-1" />
          </motion.div>
          <span className="font-extrabold text-2xl tracking-tight text-white drop-shadow-md">DoDoo Daily</span>
        </div>

        <div className="flex items-center gap-4">
          <button className="flex items-center justify-center w-10 h-10 rounded-full bg-white/30 backdrop-blur-md hover:bg-white/50 border border-white/40 transition-colors shadow-sm text-white">
            <Settings className="w-5 h-5" />
          </button>
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/30 backdrop-blur-md hover:bg-white/50 border border-white/40 transition-colors text-sm font-bold text-white shadow-sm"
          >
            <Languages className="w-4 h-4" />
            {locale === 'en' ? '中' : 'EN'}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 w-full max-w-7xl mx-auto flex flex-col md:flex-row gap-8 p-6 md:p-12 items-center md:items-stretch">

        {/* Left Side: Recent Artworks (Carousel / Overlapping style) */}
        <div className="flex-1 w-full flex flex-col justify-center gap-6">
          <motion.h2
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl font-bold text-white drop-shadow-sm flex items-center gap-2"
          >
            <ImageIcon className="w-6 h-6" />
            Recent Art (最近的作品)
          </motion.h2>

          <div className="relative h-64 md:h-96 w-full flex items-center justify-center perspective-1000 mt-8">
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
                className={`absolute w-40 h-56 md:w-56 md:h-72 rounded-3xl shadow-2xl ${art.bg} flex items-center justify-center border-[6px] border-white/80 backdrop-blur-sm cursor-pointer`}
                style={{
                  zIndex: recentArtworks.length - index,
                }}
              >
                <div className="text-xl font-bold text-[#2c2416]/50 bg-white/30 px-4 py-2 rounded-full backdrop-blur-md">
                  {art.title}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Right Side: Navigation Menu (Nintendo Switch Style Vertical List) */}
        <div className="w-full md:w-[400px] flex flex-col justify-center gap-4">
          {menuItems.map((item, index) => (
            <motion.button
              key={item.title}
              onClick={() => router.push(item.href)}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 + 0.2, type: "spring", stiffness: 100 }}
              whileHover={{ scale: 1.03, x: -10 }}
              whileTap={{ scale: 0.97 }}
              className="group relative flex items-center gap-6 w-full p-4 md:p-6 rounded-3xl bg-white/70 backdrop-blur-xl border border-white/60 shadow-lg hover:shadow-xl transition-all overflow-hidden"
            >
              {/* Highlight bar indicator */}
              <div className="absolute left-0 top-0 bottom-0 w-2 bg-transparent group-hover:bg-white transition-colors" />

              <div className={`w-14 h-14 rounded-2xl ${item.bg} ${item.color} flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform`}>
                <item.icon className="w-7 h-7" />
              </div>
              <span className="text-xl font-bold text-[#2c2416] group-hover:text-[#000] transition-colors">{item.title}</span>
            </motion.button>
          ))}
        </div>

      </main>

      {/* Footer */}
      <footer className="relative z-10 py-6 text-center text-xs font-medium text-white/70 drop-shadow-sm flex flex-col items-center justify-center">
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
