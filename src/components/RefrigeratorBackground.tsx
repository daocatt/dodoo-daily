'use client'

import React from 'react'
import { motion } from 'motion/react'

export function RefrigeratorBackground() {
    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
            {/* Fridge Body Outline */}
            <svg 
                className="absolute left-1/2 -translate-x-1/2 top-2 md:top-4 w-[92%] md:w-full max-w-7xl h-[1200px] opacity-100 drop-shadow-2xl"
                viewBox="0 0 1000 1000"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                preserveAspectRatio="xMidYMin slice"
            >
                {/* Fridge Door Surface Fill (Milk White) */}
                <path 
                    d="M50,1000 V110 A60,60 0 0 1 110,50 H890 A60,60 0 0 1 950,110 V1000 Z" 
                    fill="#FFFBF5" 
                    fillOpacity="1.0" 
                />

                {/* Texture/Reflections */}
                <linearGradient id="fridge-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="white" stopOpacity="0.6" />
                    <stop offset="50%" stopColor="white" stopOpacity="0.1" />
                    <stop offset="100%" stopColor="white" stopOpacity="0.3" />
                </linearGradient>
                <path 
                    d="M50,1000 V110 A60,60 0 0 1 110,50 H890 A60,60 0 0 1 950,110 V1000 Z" 
                    fill="url(#fridge-grad)" 
                />

                {/* Main Body Stroke (Outline) - Now layered on top and continuous */}
                <motion.path
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 2, ease: "easeInOut" }}
                    d="M50,1000 V110 A60,60 0 0 1 110,50 H890 A60,60 0 0 1 950,110 V1000"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeLinecap="round"
                    className="text-white"
                />

                {/* Freezer/Fridge Divider */}
                <motion.path
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.5, delay: 0.5, ease: "easeInOut" }}
                    d="M50,450 H950"
                    stroke="currentColor"
                    strokeWidth="3"
                    className="text-white/60"
                />

                {/* Door Handles - Enhanced Industrial Tactile Design */}
                {/* Top Handle Well */}
                <rect x="880" y="200" width="28" height="158" rx="14" fill="#C8C4B0" fillOpacity="0.4" className="shadow-well" />
                <rect x="882" y="202" width="24" height="154" rx="12" fill="#DADBD4" fillOpacity="1" className="shadow-well" />
                {/* Top Handle Cap */}
                <motion.rect
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, delay: 1 }}
                    x="884" y="204" width="20" height="150" rx="10"
                    fill="white"
                    className="shadow-cap"
                />

                {/* Bottom Handle Well */}
                <rect x="880" y="500" width="28" height="308" rx="14" fill="#C8C4B0" fillOpacity="0.4" className="shadow-well" />
                <rect x="882" y="502" width="24" height="304" rx="12" fill="#DADBD4" fillOpacity="1" className="shadow-well" />
                {/* Bottom Handle Cap */}
                <motion.rect
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, delay: 1.2 }}
                    x="884" y="504" width="20" height="300" rx="10"
                    fill="white"
                    className="shadow-cap"
                />
            </svg>

            {/* Subtle Metallic Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/5 via-transparent to-white/10" />
        </div>
    )
}
