'use client'

import { motion } from 'motion/react'

export default function AnimatedSky() {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden bg-[#e0f2fe]">
      {/* Blurred moving clouds / sky elements */}
      <motion.div
        className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#bae6fd] rounded-full mix-blend-multiply filter blur-[100px] opacity-70"
        animate={{
          x: [0, 100, 0],
          y: [0, 50, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <motion.div
        className="absolute top-[20%] right-[-10%] w-[60%] h-[60%] bg-[#7dd3fc] rounded-full mix-blend-multiply filter blur-[120px] opacity-60"
        animate={{
          x: [0, -100, 0],
          y: [0, -50, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <motion.div
        className="absolute bottom-[-20%] left-[20%] w-[70%] h-[70%] bg-[#38bdf8] rounded-full mix-blend-multiply filter blur-[150px] opacity-40"
        animate={{
          x: [0, 50, 0],
          y: [0, -100, 0],
          scale: [1, 1.05, 1],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
    </div>
  )
}
