'use client'

import React, { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Share2, Copy, Check, X, QrCode, Sparkles } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import Image from 'next/image'

export default function ShareButton({ 
    url, 
    title, 
    avatarUrl, 
    displayName 
}: { 
    url?: string; 
    title?: string;
    avatarUrl?: string;
    displayName?: string;
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
                className="p-3 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl text-white hover:bg-white/30 transition-all shadow-lg active:scale-90"
            >
                <Share2 className="w-6 h-6" />
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
                            initial={{ scale: 0.9, y: 40, rotateX: 20 }}
                            animate={{ scale: 1, y: 0, rotateX: 0 }}
                            exit={{ scale: 0.9, y: 40 }}
                            className="w-full max-w-[340px] relative"
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Postcard Container */}
                            <div className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col items-center p-8 pb-10 border-[12px] border-white relative ring-1 ring-slate-200">
                                {/* Close Button */}
                                <button 
                                    onClick={() => setOpen(false)}
                                    className="absolute top-2 right-2 p-2 text-slate-300 hover:text-slate-500 transition-colors z-20"
                                >
                                    <X className="w-5 h-5" />
                                </button>

                                {/* Decorative Header */}
                                <div className="w-full text-center mb-8 border-b-2 border-dashed border-slate-100 pb-6 relative">
                                    <div className="absolute top-0 right-0 p-1 bg-indigo-50 rounded-lg text-indigo-400 rotate-12">
                                        <Sparkles className="w-4 h-4" />
                                    </div>
                                    <div className="w-16 h-16 rounded-2xl bg-indigo-600 p-1.5 shadow-xl mb-4 mx-auto rotate-[-4deg]">
                                        {avatarUrl ? (
                                            <Image src={avatarUrl} alt="Avatar" width={64} height={64} className="w-full h-full object-cover rounded-xl" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-indigo-500 rounded-xl">
                                                <QrCode className="w-8 h-8 text-white" />
                                            </div>
                                        )}
                                    </div>
                                    <h3 className="text-xl font-black text-slate-900 tracking-tight leading-tight">
                                        {displayName ? `${displayName}'s Art World` : 'Art Exhibition'}
                                    </h3>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2">DODOO DAILY COLLECTOR</p>
                                </div>

                                {/* QR Code Area */}
                                <div className="bg-slate-50 p-6 rounded-[2rem] shadow-inner mb-8 w-full group transition-all duration-500 hover:bg-white border-2 border-transparent hover:border-indigo-100">
                                    <div className="bg-white p-4 rounded-3xl shadow-sm flex items-center justify-center">
                                        <QRCodeSVG 
                                            value={finalUrl} 
                                            size={160}
                                            level="Q"
                                            includeMargin={false}
                                            fgColor="#312e81"
                                        />
                                    </div>
                                    <p className="text-center text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-4">Scan to visit exhibition</p>
                                </div>

                                {/* Copy Link Section */}
                                <div className="w-full space-y-4">
                                    <div className="bg-slate-50 rounded-2xl p-4 flex items-center gap-3 border border-slate-100 group">
                                        <div className="flex-1 truncate text-xs font-medium text-slate-400">
                                            {finalUrl}
                                        </div>
                                    </div>
                                    
                                    <button 
                                        onClick={handleCopy}
                                        className={`w-full py-4 rounded-2xl font-black transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-[10px] shadow-lg active:scale-95 ${copied ? 'bg-emerald-500 text-white shadow-emerald-100/50' : 'bg-slate-900 text-white hover:bg-black shadow-slate-200/50'}`}
                                    >
                                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                        {copied ? 'Copied Successfully!' : 'Copy Invitation Link'}
                                    </button>
                                </div>
                            </div>

                            {/* Decorative Floating Element */}
                            <div className="absolute -bottom-4 -left-4 w-12 h-12 bg-amber-400 rounded-full flex items-center justify-center shadow-lg -rotate-12 z-20 border-4 border-white">
                                <Sparkles className="w-6 h-6 text-white" />
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}
