'use client'

import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Star } from 'lucide-react'
import { useI18n } from '@/contexts/I18nContext'
import Image from 'next/image'

interface TimelineEntry {
    id: string
    text: string | null
    imageUrl?: string | null
    imageUrls: string | string[] | null
    isMilestone: boolean
    milestoneDate: string | Date | null
    authorRole: string
    authorAvatar: string | null
    authorName: string | null
    createdAt: string | Date
    title?: string | null
}

interface TimelineViewProps {
    entries: TimelineEntry[]
    onImageClick: (images: string[], index: number) => void
    onEntryClick?: (entryId: string) => void
}

export default function TimelineView({ entries, onImageClick, onEntryClick }: TimelineViewProps) {
    const { t } = useI18n()

    const sortedMilestones = useMemo(() => {
        return entries
            .filter(e => e.isMilestone)
            .sort((a, b) => {
                const dateA = new Date(a.milestoneDate || a.createdAt).getTime()
                const dateB = new Date(b.milestoneDate || b.createdAt).getTime()
                return dateB - dateA // Newest first
            })
    }, [entries])

    const yearGroups = useMemo(() => {
        const groups: Record<number, { year: number, entries: TimelineEntry[] }> = {}
        sortedMilestones.forEach(entry => {
            const date = new Date(entry.milestoneDate || entry.createdAt)
            const yr = date.getFullYear()
            if (!groups[yr]) groups[yr] = { year: yr, entries: [] }
            groups[yr].entries.push(entry)
        })
        return Object.values(groups).sort((a, b) => b.year - a.year)
    }, [sortedMilestones])

    if (yearGroups.length === 0) {
        return (
            <div className="w-full flex justify-center py-20">
                <div className="baustein-panel bg-[#E2DFD2] rounded-[2.5rem] p-16 md:p-24 flex flex-col items-center justify-center text-center gap-8 border-4 border-[#C8C4B0] shadow-2xl max-w-xl w-full">
                    <div className="hardware-well w-24 h-24 rounded-full flex items-center justify-center bg-[#D1CDBC] mb-2 shadow-well relative overflow-hidden">
                        <div className="hardware-cap absolute inset-2 bg-slate-100 rounded-full flex items-center justify-center shadow-cap border border-black/5">
                            <Star className="w-10 h-10 text-slate-300 opacity-60" />
                        </div>
                    </div>
                    <div className="flex flex-col gap-3">
                        <h3 className="text-2xl md:text-3xl font-black text-slate-800 uppercase tracking-tighter italic leading-none">{t('milestones.empty')}</h3>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="relative w-full max-w-5xl mx-auto px-4 py-10">
            {/* Center Line */}
            <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-orange-200 via-amber-200 to-transparent -translate-x-1/2 hidden md:block" />

            {yearGroups.map(({ year, entries: yEntries }) => (
                <div key={year} className="mb-20">
                    {/* Year Divider */}
                    <div className="relative flex justify-center mb-16">
                        <div className="bg-orange-600 text-white px-8 py-2 rounded-full font-black text-xl shadow-xl shadow-orange-200 z-20">
                            {year}
                        </div>
                    </div>

                    <div className="space-y-12 md:space-y-0">
                        {yEntries.map((entry) => {
                            const globalIndex = sortedMilestones.findIndex(m => m.id === entry.id)
                            const isLeft = globalIndex % 2 === 0

                            let entryImages: string[] = []
                            try {
                                if (Array.isArray(entry.imageUrls)) {
                                    entryImages = entry.imageUrls
                                } else if (entry.imageUrls && typeof entry.imageUrls === 'string' && entry.imageUrls.trim().startsWith('[')) {
                                    entryImages = JSON.parse(entry.imageUrls)
                                } else if (entry.imageUrl) {
                                    entryImages = [entry.imageUrl]
                                }
                            } catch (_e) {
                                console.error("Failed to parse timeline images", _e)
                                if (entry.imageUrl) entryImages = [entry.imageUrl]
                            }

                            const date = new Date(entry.milestoneDate || entry.createdAt)
                            const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
                            const isChild = entry.authorRole === 'CHILD'

                            return (
                                <motion.div
                                    key={entry.id}
                                    initial={{ opacity: 0, x: isLeft ? -50 : 50 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    className={`relative flex flex-col md:flex-row items-center w-full ${isLeft ? 'md:flex-row-reverse' : ''} md:mb-12`}
                                >
                                    {/* Content Card */}
                                    <div className={`w-full md:w-[45%] ${isLeft ? 'md:pl-12' : 'md:pr-12'}`}>
                                        <div
                                            className="bg-white p-5 rounded-xl shadow-xl shadow-orange-900/5 hover:shadow-2xl transition-all border border-orange-50 group hover:-translate-y-1 cursor-pointer"
                                            onClick={() => onEntryClick?.(entry.id)}
                                        >
                                            <div className="flex gap-4 items-start">
                                                <div className="flex-1 min-w-0 flex flex-col gap-2">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-8 h-8 rounded-full overflow-hidden border-2 shadow-sm ${isChild ? 'border-orange-200 bg-orange-50' : 'border-indigo-200 bg-indigo-50'}`}>
                                                            {entry.authorAvatar ? (
                                                                <Image 
                                                                    src={entry.authorAvatar} 
                                                                    alt="" 
                                                                    width={32}
                                                                    height={32}
                                                                    className="w-full h-full object-cover" 
                                                                />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center">
                                                                    <Star className={`w-4 h-4 ${isChild ? 'text-orange-400' : 'text-indigo-400'}`} />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-[10px] font-black text-slate-800 leading-none mb-0.5">{entry.authorName || (isChild ? 'Child' : 'Parent')}</span>
                                                            <span className="text-[8px] font-black text-orange-400 uppercase tracking-widest leading-none">{dateStr}</span>
                                                        </div>
                                                    </div>

                                                    <h4 className="text-base font-black text-slate-800 line-clamp-2 group-hover:text-orange-600 transition-colors leading-snug">
                                                        {entry.title || entry.text || t('journal.entry.preciousMoment')}
                                                    </h4>

                                                    {entry.text && entry.text.length > 50 && (
                                                        <p className="text-xs text-slate-500 font-medium line-clamp-2 leading-relaxed">
                                                            {entry.text}
                                                        </p>
                                                    )}
                                                </div>

                                                {entryImages.length > 0 && (
                                                    <div
                                                        className="w-20 h-20 rounded-xl overflow-hidden border border-slate-50 flex-shrink-0 relative"
                                                        onClick={(_e) => {
                                                            _e.stopPropagation();
                                                            onImageClick(entryImages, 0);
                                                        }}
                                                    >
                                                        <Image 
                                                            src={entryImages[0]} 
                                                            alt="" 
                                                            width={80} 
                                                            height={80}
                                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                                                        />
                                                        {entryImages.length > 1 && (
                                                            <div className="absolute inset-0 bg-black/20 flex items-center justify-center pointer-events-none">
                                                                <span className="text-white font-black text-[10px]">+{entryImages.length - 1}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Circle Dot on Line */}
                                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white border-[6px] border-orange-600 z-10 shadow-lg hidden md:block" />

                                    {/* Spacer for MD+ */}
                                    <div className="hidden md:block w-[45%]" />
                                </motion.div>
                            )
                        })}
                    </div>
                </div>
            ))}
        </div>
    )
}
