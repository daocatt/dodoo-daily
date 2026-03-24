'use client'

import { motion } from 'framer-motion'

export default function NatureBackground() {
    return (
        <div className="fixed inset-0 z-0 overflow-hidden bg-[#e9e7df]">
            {/* Mesh Gradient Foundation - Darkened & Muted */}
            <div className="absolute inset-0 opacity-40 bg-[radial-gradient(at_0%_0%,hsla(34,20%,80%,1)_0,transparent_50%),radial-gradient(at_50%_0%,hsla(34,25%,85%,1)_0,transparent_50%),radial-gradient(at_100%_0%,hsla(186,15%,80%,1)_0,transparent_50%),radial-gradient(at_0%_100%,hsla(43,25%,82%,1)_0,transparent_50%),radial-gradient(at_50%_100%,hsla(43,20%,82%,1)_0,transparent_50%),radial-gradient(at_100%_100%,hsla(22,30%,84%,1)_0,transparent_50%)]" />

            {/* Dynamic Organic Blobs - More Muted & Darker */}
            <motion.div
                className="absolute top-[-15%] left-[-10%] w-[70vw] h-[70vw] bg-[#dcd4c8] rounded-full mix-blend-multiply filter blur-[120px]"
                animate={{
                    x: [0, 80, 0],
                    y: [0, 40, 0],
                    scale: [1, 1.1, 1],
                    rotate: [0, 10, 0],
                }}
                transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
                className="absolute bottom-[-10%] right-[-15%] w-[65vw] h-[65vw] bg-[#e1d9c5] rounded-full mix-blend-multiply filter blur-[140px]"
                animate={{
                    x: [0, -60, 0],
                    y: [0, -40, 0],
                    scale: [1, 1.15, 1],
                }}
                transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
                className="absolute top-[20%] right-[-10%] w-[50vw] h-[50vw] bg-[#e6ded0] rounded-full mix-blend-multiply filter blur-[100px]"
                animate={{
                    x: [0, -100, 0],
                    y: [0, 50, 0],
                }}
                transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
            />
            
            {/* Golden hour accent - Darker Amber */}
            <motion.div
                className="absolute bottom-[20%] left-[10%] w-[40vw] h-[40vw] bg-[#dfd6c0] rounded-full mix-blend-soft-light filter blur-[110px]"
                animate={{
                    scale: [0.8, 1.2, 0.8],
                    opacity: [0.3, 0.6, 0.3],
                }}
                transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
            />

            <div className="absolute inset-0 shadow-[inset_0_0_150px_rgba(30,30,20,0.1)] pointer-events-none" />

            {/* Global Connected Grid Overlay - Technical Blueprint Style */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.06] bg-[linear-gradient(rgba(0,0,0,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.2)_1px,transparent_1px)] bg-[length:24px_24px]" />
            <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(0,0,0,0.3)_1.5px,transparent_1.5px),linear-gradient(90deg,rgba(0,0,0,0.3)_1.5px,transparent_1.5px)] bg-[length:120px_120px]" />
            
            {/* Dots at intersections for extra detail */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.08] bg-[radial-gradient(circle_at_center,black_1px,transparent_1px)] bg-[length:24px_24px]" />
        </div>
    )
}
