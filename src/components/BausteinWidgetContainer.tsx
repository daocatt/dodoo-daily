'use client'

import React from 'react'
import { motion } from 'motion/react'
import { clsx } from 'clsx'

interface BausteinWidgetContainerProps {
  children: React.ReactNode
  onClick?: () => void
  isEditing?: boolean
  label?: string
  icon?: React.ReactNode
  accentColor?: string
  className?: string
  isIconOnly?: boolean
}

export default function BausteinWidgetContainer({
  children,
  onClick,
  isEditing = false,
  label,
  icon,
  accentColor = 'bg-slate-500',
  className,
  isIconOnly = false
}: BausteinWidgetContainerProps) {
  return (
    <div className={clsx(
      "relative w-full h-full p-2.5 bg-[#D1CDBC] rounded-[24px] shadow-well group/widget transition-all border-2 border-black/5",
      isEditing ? "opacity-90" : "hover:shadow-well transition-transform",
      className
    )}>
      {/* Texture Overlay for the Well */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[radial-gradient(circle_at_center,black_0.5px,transparent_0.5px)] bg-[length:10px_10px]" />
      
      {/* Industrial Screws (Top Left, Top Right, Bottom Left, Bottom Right) */}
      <div className="absolute top-1.5 left-1.5 w-1.5 h-1.5 rounded-full bg-black/10 border border-white/20 shadow-inner" />
      <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-black/10 border border-white/20 shadow-inner" />
      <div className="absolute bottom-1.5 left-1.5 w-1.5 h-1.5 rounded-full bg-black/10 border border-white/20 shadow-inner" />
      <div className="absolute bottom-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-black/10 border border-white/20 shadow-inner" />

      {/* The Visual 'Cap' — where the content lives */}
      <motion.div
        whileTap={!isEditing ? { scale: 0.98, y: 3 } : undefined}
        onClick={onClick}
        className={clsx(
          "w-full h-full overflow-hidden transition-all relative rounded-xl border-2 border-black/5 shadow-cap",
          isIconOnly ? accentColor : "bg-[#F4F4F2]",
          !isEditing && "cursor-pointer active:translate-y-1 hover:brightness-[1.02] hover:shadow-lg"
        )}
      >
        {/* Dynamic Label Header (Industrial Style) */}
        {label && (
          <div className="absolute top-3 left-4 flex items-center gap-2.5 z-10 pointer-events-none pr-4">
            {icon && <div className={clsx("w-3 h-3 rounded-sm rotate-45 flex items-center justify-center border border-black/5", accentColor)} />}
            <span className="label-mono text-[9px] font-black text-slate-800 opacity-30 uppercase tracking-[0.2em] leading-none">{label}</span>
          </div>
        )}

        {/* Content */}
        <div className="w-full h-full">
          {children}
        </div>



        {/* Edit HUD Toggle / Indicator Overlay */}
        {isEditing && (
            <div className="absolute inset-0 bg-indigo-500/[0.03] backdrop-blur-[1px] flex items-center justify-center pointer-events-none">
                <div className="w-6 h-6 bg-indigo-500/10 rounded-full animate-pulse border-2 border-indigo-500/20" />
            </div>
        )}
      </motion.div>
    </div>
  )
}
