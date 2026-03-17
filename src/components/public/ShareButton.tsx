'use client'

import React, { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Share2, Copy, Check, X, QrCode } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'

export default function ShareButton({ url, title }: { url?: string; title?: string }) {
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
                className="p-3 bg-white/20 backdrop-blur-xl border border-white/20 rounded-2xl text-white hover:bg-white/40 transition-colors shadow-lg"
            >
                <Share2 className="w-6 h-6" />
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-xl"
                        onClick={() => setOpen(false)}
                    >
                        <motion.div 
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="w-full max-w-sm bg-white rounded-[40px] p-10 md:p-12 shadow-2xl relative overflow-hidden text-center"
                            onClick={e => e.stopPropagation()}
                        >
                            <button 
                                onClick={() => setOpen(false)}
                                className="absolute top-6 right-6 p-2 bg-slate-50 rounded-xl text-slate-400 hover:bg-slate-100 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                <QrCode className="w-8 h-8" />
                            </div>

                            <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Share this Gallery</h3>
                            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mb-8 leading-relaxed">
                                Scan the code below or copy the link to share with friends and family.
                            </p>

                            <div className="bg-white p-6 rounded-[32px] border-4 border-slate-50 flex items-center justify-center mb-8 shadow-inner">
                                <QRCodeSVG 
                                    value={finalUrl} 
                                    size={200}
                                    level="H"
                                    includeMargin={false}
                                    fgColor="#0f172a"
                                />
                            </div>

                            <button 
                                onClick={handleCopy}
                                className={`w-full py-4 rounded-2xl font-black transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-xs ${copied ? 'bg-emerald-500 text-white shadow-emerald-100' : 'bg-slate-900 text-white shadow-xl shadow-slate-200'}`}
                            >
                                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                {copied ? 'Link Copied!' : 'Copy Gallery Link'}
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}
