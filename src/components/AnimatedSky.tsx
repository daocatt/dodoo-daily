'use client'

import { motion } from 'motion/react'

export default function AnimatedSky() {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden bg-[#fdfaf0]">
      {/* Fresh seasonal blobs - Yellow, Green, Orange, Blue */}
      <motion.div
        className="absolute top-[-5%] left-[-10%] w-[55%] h-[55%] bg-[#f4e285] rounded-full mix-blend-multiply filter blur-[100px] opacity-40"
        animate={{
          x: [0, 60, 0],
          y: [0, 30, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <motion.div
        className="absolute top-[20%] right-[-15%] w-[60%] h-[60%] bg-[#b8d8ba] rounded-full mix-blend-multiply filter blur-[120px] opacity-50"
        animate={{
          x: [0, -60, 0],
          y: [0, -30, 0],
          scale: [1, 1.15, 1],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <motion.div
        className="absolute bottom-[-15%] left-[15%] w-[65%] h-[65%] bg-[#f58549] rounded-full mix-blend-multiply filter blur-[140px] opacity-30"
        animate={{
          x: [0, 40, 0],
          y: [0, -60, 0],
          scale: [1, 1.05, 1],
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
    </div>
  )
}
