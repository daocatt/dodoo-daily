'use client'

import React from 'react'
import { motion } from 'motion/react'
import { useI18n } from '@/contexts/I18nContext'
import Link from 'next/link'
import { ArrowLeft, Sparkles } from 'lucide-react'

const NOISE = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='0.07'/%3E%3C/svg%3E")`

export default function McpPage() {
    const { t } = useI18n()

    return (
        <div
            className="min-h-dvh flex items-center justify-center relative p-6"
            style={{
                backgroundColor: '#f5f0e8',
                backgroundImage: [
                    NOISE,
                ].join(', '),
            }}
        >
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="max-w-md w-full bg-white rounded-[32px] p-8 md:p-12 text-center shadow-[0_8px_32px_rgba(44,36,22,0.08)] border border-[#d6cdc0]"
            >
                <div className="w-16 h-16 bg-[#fdf5ed] rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-inner">
                    <Sparkles className="w-8 h-8 text-[#c8843c]" />
                </div>

                <h1 className="text-2xl font-bold text-[#2c2416] mb-4">
                    {t('mcp.title')}
                </h1>

                <p className="text-[#6b5c45] mb-10 leading-relaxed">
                    {t('mcp.desc')}
                </p>

                <Link
                    href="/"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#f5f0e8] hover:bg-[#e8e0d4] text-[#2c2416] font-medium transition-colors border border-[#d6cdc0]"
                >
                    <ArrowLeft className="w-4 h-4" />
                    {t('mcp.back')}
                </Link>
            </motion.div>
        </div>
    )
}
