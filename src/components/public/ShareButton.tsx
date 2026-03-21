'use client'

import React, { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Share2, Copy, Check, X, QrCode, ChevronRight } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import Image from 'next/image'

export default function ShareButton({ 
    url, 
    title, 
    avatarUrl, 
    displayName,
    className
}: { 
    url?: string; 
    title?: string;
    avatarUrl?: string;
    displayName?: string;
    className?: string;
}) {
    const [open, setOpen] = useState(false)
    const [copied, setCopied] = useState(false)

    const finalUrl = url || (typeof window !== 'undefined' ? window.location.href : '')

    const handleCopy = () => {
        navigator.clipboard.writeText(finalUrl)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const handleNativeShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: title || 'Check out this exhibition!',
                    url: finalUrl
                })
            } catch (err) {
                console.error('Error sharing', err)
            }
        } else {
            setOpen(true)
        }
    }

    return (
        <>
            <button 
                onClick={handleNativeShare}
                className={className || "p-3 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl text-white hover:bg-white/30 transition-all shadow-lg active:scale-90"}
            >
                <Share2 className="w-[1.2em] h-[1.2em]" />
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-md"
                        onClick={() => setOpen(false)}
                    >
                        <motion.div 
                            initial={{ scale: 0.9, y: 40 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 40 }}
                            className="w-full max-w-[340px] relative"
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Industrial Voucher Container */}
                            <div className="baustein-panel w-full bg-[#E2DFD2] rounded-[2rem] shadow-2xl overflow-hidden flex flex-col items-center relative border-4 border-[#C8C4B0]">
                                {/* Hardware Header */}
                                <div className="w-full flex items-center justify-between px-6 py-4 bg-[#D6D2C0] border-b-2 border-[#B8B4A0] shrink-0">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(79,70,229,0.5)] animate-pulse" />
                                        <span className="font-black text-[10px] tracking-[0.2em] uppercase text-slate-700">Digital Voucher</span>
                                    </div>
                                    <button 
                                        onClick={() => setOpen(false)}
                                        className="p-1.5 hardware-well rounded-md text-slate-400 hover:text-slate-600 transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="p-8 w-full space-y-8">
                                    {/* Decorative Identity Block */}
                                    <div className="flex flex-col items-center text-center">
                                        <div className="hardware-well w-20 h-20 rounded-2xl p-1 mb-4 shadow-well border-2 border-white/40">
                                            {avatarUrl ? (
                                                <Image src={avatarUrl} alt="Avatar" width={80} height={80} className="w-full h-full object-cover rounded-xl grayscale-[20%] contrast-110" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-slate-800 rounded-xl">
                                                    <QrCode className="w-10 h-10 text-indigo-400" />
                                                </div>
                                            )}
                                        </div>
                                        <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-none uppercase mb-2">
                                            {displayName || 'EXHIBITOR'}
                                        </h3>
                                    </div>

                                    {/* QR Code Area */}
                                    <div className="hardware-well p-6 rounded-[1.5rem] bg-[#D6D2C0] shadow-well border border-white/40 w-full flex flex-col items-center gap-4">
                                        <div className="bg-white p-4 rounded-2xl shadow-sm border-2 border-black/5">
                                            <QRCodeSVG 
                                                value={finalUrl} 
                                                size={150}
                                                level="Q"
                                                includeMargin={false}
                                                fgColor="#1e293b"
                                            />
                                        </div>
                                        <span className="label-mono text-[8px] font-black text-slate-500 uppercase tracking-[0.4em] opacity-40">Scan Access Point</span>
                                    </div>

                                    {/* Action Section */}
                                    <div className="space-y-4">
                                        <div className="hardware-well rounded-xl p-3 bg-[#C8C4B0]/40 border border-black/5 flex items-center gap-3 text-center">
                                            <div className="flex-1 truncate label-mono text-[10px] text-slate-600 font-bold opacity-60">
                                                {finalUrl.replace(/^https?:\/\//, '')}
                                            </div>
                                        </div>
                                        
                                        <button 
                                            onClick={handleCopy}
                                            className="hardware-btn group w-full block"
                                        >
                                            <div className="hardware-well h-16 w-full rounded-xl overflow-hidden relative bg-[#D1CDBC] p-1 shadow-well">
                                                <div className={`hardware-cap absolute inset-1.5 rounded-lg flex items-center px-4 justify-between transition-all shadow-sm ${
                                                    copied ? 'bg-emerald-600 text-white' : 'bg-[#F4F4F2] group-hover:bg-white'
                                                }`}>
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border shrink-0 shadow-inner transition-colors ${
                                                            copied 
                                                            ? 'bg-emerald-500/20 border-white/20' 
                                                            : 'bg-white border-slate-200 group-hover:bg-indigo-50 group-hover:border-indigo-100'
                                                        }`}>
                                                            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4 text-indigo-400" />}
                                                        </div>
                                                        <span className={`font-black tracking-[0.2em] text-[10px] uppercase ${copied ? 'text-white' : 'text-slate-800'}`}>
                                                            {copied ? 'Link Synchronized' : 'Transfer Signal'}
                                                        </span>
                                                    </div>
                                                    <ChevronRight className={`w-4 h-4 transition-colors ${copied ? 'text-white/40' : 'text-slate-300 group-hover:text-indigo-500'}`} />
                                                </div>
                                            </div>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}
