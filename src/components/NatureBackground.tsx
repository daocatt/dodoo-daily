'use client'

import { motion } from 'framer-motion'

export default function NatureBackground() {
    return (
        <div className="fixed inset-0 z-0 overflow-hidden bg-[#fdfcf7]">
            {/* Mesh Gradient Foundation */}
            <div className="absolute inset-0 opacity-40 bg-[radial-gradient(at_0%_0%,hsla(143,30%,85%,1)_0,transparent_50%),radial-gradient(at_50%_0%,hsla(34,50%,95%,1)_0,transparent_50%),radial-gradient(at_100%_0%,hsla(186,40%,90%,1)_0,transparent_50%),radial-gradient(at_0%_100%,hsla(43,60%,92%,1)_0,transparent_50%),radial-gradient(at_50%_100%,hsla(143,40%,88%,1)_0,transparent_50%),radial-gradient(at_100%_100%,hsla(22,70%,94%,1)_0,transparent_50%)]" />

            {/* Dynamic Organic Blobs */}
            <motion.div
                className="absolute top-[-15%] left-[-10%] w-[70vw] h-[70vw] bg-[#e8f5e9] rounded-full mix-blend-multiply filter blur-[120px]"
                animate={{
                    x: [0, 80, 0],
                    y: [0, 40, 0],
                    scale: [1, 1.1, 1],
                    rotate: [0, 10, 0],
                }}
                transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
                className="absolute bottom-[-10%] right-[-15%] w-[65vw] h-[65vw] bg-[#fff3e0] rounded-full mix-blend-multiply filter blur-[140px]"
                animate={{
                    x: [0, -60, 0],
                    y: [0, -40, 0],
                    scale: [1, 1.15, 1],
                }}
                transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
                className="absolute top-[20%] right-[-10%] w-[50vw] h-[50vw] bg-[#f1f8e9] rounded-full mix-blend-multiply filter blur-[100px]"
                animate={{
                    x: [0, -100, 0],
                    y: [0, 50, 0],
                }}
                transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
            />
            
            {/* Golden hour accent */}
            <motion.div
                className="absolute bottom-[20%] left-[10%] w-[40vw] h-[40vw] bg-[#fff8e1] rounded-full mix-blend-soft-light filter blur-[110px]"
                animate={{
                    scale: [0.8, 1.2, 0.8],
                    opacity: [0.3, 0.6, 0.3],
                }}
                transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* Premium Grain & Overlay */}
            <div className="absolute inset-0 bg-[#fdfcf7]/10 backdrop-blur-[2px]" />
            <div className="absolute inset-0 opacity-[0.15] mix-blend-overlay pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
            
            {/* Soft vignette */}
            <div className="absolute inset-0 shadow-[inset_0_0_150px_rgba(253,252,247,0.8)] pointer-events-none" />
        </div>
    )
}
