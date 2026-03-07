'use client'

import React, { useRef, useState } from 'react'
import * as htmlToImage from 'html-to-image'
import { QRCodeSVG } from 'qrcode.react'
import { motion, AnimatePresence } from 'motion/react'
import { X, Download, Share2 } from 'lucide-react'
import { useI18n } from '@/contexts/I18nContext'

type PosterProps = {
    artwork: {
        id: string
        title: string
        imageUrl: string
        priceRMB: number
    }
    onClose: () => void
}

export default function PosterGenerator({ artwork, onClose }: PosterProps) {
    const posterRef = useRef<HTMLDivElement>(null)
    const [generating, setGenerating] = useState(false)
    const [posterImageUrl, setPosterImageUrl] = useState<string | null>(null)
    const { t } = useI18n()

    // Using window.location.origin to build the purchase link
    const purchaseUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/buy/${artwork.id}`
        : `https://dodoo.daily/buy/${artwork.id}`

    const handleGenerate = async () => {
        if (!posterRef.current) return
        setGenerating(true)
        try {
            // Need to wait slightly for images to load if they haven't
            await new Promise(r => setTimeout(r, 500))
            const dataUrl = await htmlToImage.toPng(posterRef.current, { quality: 0.95, pixelRatio: 2 })
            setPosterImageUrl(dataUrl)
        } catch (error) {
            console.error('Oops, something went wrong!', error)
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg bg-white rounded-xl overflow-hidden shadow-2xl relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 p-2 bg-black/20 hover:bg-black/40 rounded-full text-white backdrop-blur transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="p-6 md:p-8 bg-[#faf7f0] max-h-[85vh] overflow-y-auto hide-scrollbar">

                    {/* Real Poster Node (Hidden technically, or visible but un-interactive) */}
                    <div className={posterImageUrl ? "hidden" : "block"}>
                        <div
                            ref={posterRef}
                            className="bg-white rounded-2xl p-6 shadow-sm border border-[#e8dfce] flex flex-col gap-6"
                            style={{ width: '100%', minHeight: '600px', background: 'linear-gradient(to bottom right, #ffffff, #fdfbf7)' }}
                        >
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-black text-[#2c2416] tracking-tight">DoDoo Daily</h2>
                                <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded-full">{t('poster.exhibition')}</span>
                            </div>

                            <div className="w-full aspect-square rounded-xl overflow-hidden bg-[#f5f0e8] shadow-inner border-4 border-white">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={artwork.imageUrl} alt={artwork.title} className="w-full h-full object-cover" crossOrigin="anonymous" />
                            </div>

                            <div>
                                <h1 className="text-3xl font-black text-[#2c2416] mb-2">{artwork.title}</h1>
                                <p className="text-[#a89880] text-sm">{t('poster.description')}</p>
                            </div>

                            <div className="mt-auto flex items-end justify-between bg-[#f5f0e8] p-4 rounded-xl">
                                <div>
                                    <p className="text-xs font-bold text-[#a89880] uppercase tracking-wider mb-1">{t('poster.priceLabel')}</p>
                                    <p className="text-3xl font-black text-purple-600">¥ {artwork.priceRMB}</p>
                                </div>
                                <div className="bg-white p-2 rounded-lg shadow-sm border border-[#e8dfce]">
                                    <QRCodeSVG value={purchaseUrl} size={80} level={"H"} />
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleGenerate}
                            disabled={generating}
                            className="w-full mt-6 py-4 bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-bold rounded-2xl shadow-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {generating ? (
                                <span className="animate-pulse">{t('poster.generating')}</span>
                            ) : (
                                <>
                                    <Share2 className="w-5 h-5" />
                                    {t('poster.preview')}
                                </>
                            )}
                        </button>
                    </div>

                    {/* Preview Image Result */}
                    {posterImageUrl && (
                        <AnimatePresence>
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex flex-col gap-6 items-center"
                            >
                                <h3 className="text-xl font-bold text-center text-[#2c2416]">{t('poster.ready')}</h3>

                                <div className="w-full rounded-2xl overflow-hidden shadow-2xl border-4 border-white bg-white">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={posterImageUrl} alt="Generated Poster" className="w-full h-auto" />
                                </div>

                                <button
                                    onClick={handleDownload}
                                    className="w-full py-4 bg-gradient-to-r from-indigo-500 to-blue-500 text-white font-bold rounded-2xl shadow-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                                >
                                    <Download className="w-5 h-5" />
                                    {t('poster.save')}
                                </button>

                                <button
                                    onClick={() => setPosterImageUrl(null)}
                                    className="text-sm font-bold text-[#a89880] hover:text-[#2c2416] transition-colors"
                                >
                                    {t('poster.regen')}
                                </button>
                            </motion.div>
                        </AnimatePresence>
                    )}
                </div>
            </div>
        </div>
    )
}
