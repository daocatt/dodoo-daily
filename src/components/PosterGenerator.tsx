'use client'

import React, { useRef, useState } from 'react'
import * as htmlToImage from 'html-to-image'
import { QRCodeSVG } from 'qrcode.react'
import { motion, AnimatePresence } from 'motion/react'
import { X, Download, Image as ImageIcon, Sparkles, RefreshCw } from 'lucide-react'
import Image from 'next/image'
import { useI18n } from '@/contexts/I18nContext'

type PosterProps = {
    artwork: {
        id: string
        title: string
        imageUrl: string
        thumbnailMedium?: string | null
        priceRMB: number
        priceCoins: number
        creatorNickname?: string | null
        creatorName?: string | null
    }
    onClose: () => void
}

export default function PosterGenerator({ artwork, onClose }: PosterProps) {
    const posterRef = useRef<HTMLDivElement>(null)
    const [generating, setGenerating] = useState(false)
    const [posterImageUrl, setPosterImageUrl] = useState<string | null>(null)
    const [imgLoaded, setImgLoaded] = useState(false)
    const { t } = useI18n()

    const purchaseUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/buy/${artwork.id}`
        : `https://dodoo.daily/buy/${artwork.id}`

    const creatorLabel = artwork.creatorNickname || artwork.creatorName || 'DoDoo Daily'
    // Use medium thumbnail for poster (prevents exposing original URL) — will use original only if thumbnail not available
    const posterImageSource = artwork.thumbnailMedium || artwork.imageUrl
    const proxiedImageUrl = `/api/proxy-image?url=${encodeURIComponent(posterImageSource)}`

    const handleGenerate = async () => {
        if (!posterRef.current || !imgLoaded) return
        setGenerating(true)
        try {
            await new Promise(r => setTimeout(r, 500))
            const dataUrl = await htmlToImage.toPng(posterRef.current, {
                quality: 1,
                pixelRatio: 2,
                cacheBust: true,
                fontEmbedCSS: '', // Preventing the 'font is undefined' crash on some browsers
            })
            setPosterImageUrl(dataUrl)
        } catch (_error) {
            console.error('Poster generation failed:', _error)
        } finally {
            setGenerating(false)
        }
    }

    const handleDownload = () => {
        if (!posterImageUrl) return
        const link = document.createElement('a')
        link.download = `DoDoo-Daily-${artwork.title}.png`
        link.href = posterImageUrl
        link.click()
    }

    return (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 pt-16">
            <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 12 }}
                transition={{ type: 'spring', damping: 24, stiffness: 300 }}
                className="w-full max-w-sm bg-[#faf7f0] rounded-3xl shadow-2xl flex flex-col overflow-hidden"
                style={{ maxHeight: 'calc(100dvh - 2rem)' }}
            >
                {/* ── Header ── */}
                <div className="flex items-center justify-between px-5 py-3.5 bg-white/80 backdrop-blur border-b border-[#ede8df] shrink-0">
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-3.5 h-3.5 text-purple-500 fill-purple-200" />
                        <span className="font-black text-[#2c2416] text-sm">{t('gallery.detail.genPoster')}</span>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-7 h-7 flex items-center justify-center rounded-full bg-black/5 hover:bg-black/10 text-slate-500 transition-colors"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                </div>

                {/* ── Body (no scroll) ── */}
                <div className="p-4 flex flex-col gap-3 flex-1 min-h-0">
                    <AnimatePresence mode="wait">
                        {!posterImageUrl ? (
                            <motion.div
                                key="template"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex flex-col gap-3 flex-1 min-h-0"
                            >
                                {/* Poster template — compact, no scroll */}
                                <div
                                    ref={posterRef}
                                    className="rounded-2xl overflow-hidden border border-[#e8dfce] bg-white shrink-0 antialiased"
                                    style={{ 
                                        font: "normal normal 900 14px 'Inter', system-ui, sans-serif",
                                        fontFamily: "'Inter', 'Noto Sans SC', system-ui, -apple-system, sans-serif",
                                        fontWeight: 900
                                    }}
                                >
                                    {/* Top bar */}
                                    <div className="flex items-center justify-between px-4 py-3">
                                        <div>
                                            <p className="text-[9px] font-black text-purple-400 uppercase tracking-widest">{t('poster.exhibition')}</p>
                                            <p className="text-xs font-black text-[#2c2416] mt-0.5 truncate max-w-[140px]">{creatorLabel}</p>
                                        </div>
                                        <p className="text-[10px] font-bold text-[#a89880]">DoDoo Daily</p>
                                    </div>

                                    <div className="mx-4 rounded-xl overflow-hidden bg-[#f5f0e8] aspect-square relative">
                                        <Image
                                            src={proxiedImageUrl}
                                            alt={artwork.title}
                                            fill
                                            className="object-cover"
                                            onLoad={() => setImgLoaded(true)}
                                            unoptimized // Poster generation often requires unoptimized to avoid proxy/CORS issues
                                        />
                                    </div>

                                    {/* Info */}
                                    <div className="px-4 pt-3 pb-1">
                                        <h1 className="text-base font-black text-[#2c2416] truncate">{artwork.title}</h1>
                                    </div>

                                    {/* Bottom: price + QR */}
                                    <div className="mx-4 mb-4 mt-2 flex items-center justify-between gap-2 bg-[#f5f0e8] px-4 py-3 rounded-xl">
                                        <div className="min-w-0 flex-1">
                                            <p className="text-[9px] font-black text-[#a89880] uppercase tracking-wider mb-0.5">{t('poster.priceLabel')}</p>
                                            <p className="text-lg font-black text-purple-600 whitespace-nowrap">
                                                {artwork.priceCoins} <span className="text-xs font-bold">{t('hud.coins')}</span>
                                            </p>
                                            {artwork.priceRMB > 0 && (
                                                <p className="text-[10px] text-[#a89880] font-bold whitespace-nowrap">¥ {artwork.priceRMB}</p>
                                            )}
                                        </div>
                                        <div className="bg-white p-1.5 rounded-xl shadow-sm border border-[#e8dfce] shrink-0">
                                            <QRCodeSVG value={purchaseUrl} size={56} level="H" />
                                        </div>
                                    </div>
                                </div>

                                {/* Generate button */}
                                <button
                                    onClick={handleGenerate}
                                    disabled={generating || !imgLoaded}
                                    className="w-full py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.97] disabled:opacity-50 shrink-0"
                                    style={{
                                        background: 'linear-gradient(135deg, #7c3aed, #a855f7, #ec4899)',
                                        color: 'white',
                                        boxShadow: '0 6px 20px -4px rgba(124,58,237,0.45)'
                                    }}
                                >
                                    {generating ? (
                                        <><RefreshCw className="w-4 h-4 animate-spin" />{t('poster.generating')}</>
                                    ) : (
                                        <><ImageIcon className="w-4 h-4" />{t('poster.preview')}</>
                                    )}
                                </button>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="result"
                                initial={{ opacity: 0, scale: 0.96 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex flex-col gap-3 flex-1 min-h-0"
                            >
                                <p className="text-center font-black text-[#2c2416] text-sm shrink-0">{t('poster.ready')} 🎉</p>

                                <div className="flex-1 min-h-0 rounded-2xl overflow-hidden shadow-xl border-2 border-white relative">
                                    <Image 
                                        src={posterImageUrl} 
                                        alt="Generated Poster" 
                                        fill
                                        className="object-contain" 
                                        unoptimized
                                    />
                                </div>

                                <button
                                    onClick={handleDownload}
                                    className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-blue-500 text-white font-black rounded-2xl shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 text-sm active:scale-[0.97] transition-all shrink-0"
                                >
                                    <Download className="w-4 h-4" />
                                    {t('poster.save')}
                                </button>

                                <button
                                    onClick={() => setPosterImageUrl(null)}
                                    className="w-full py-2 text-xs font-bold text-[#a89880] hover:text-[#2c2416] transition-colors flex items-center justify-center gap-1.5 shrink-0"
                                >
                                    <RefreshCw className="w-3 h-3" />
                                    {t('poster.regen')}
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    )
}
