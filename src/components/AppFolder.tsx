'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
    motion,
    AnimatePresence,
    useMotionValue,
    useTransform,
    animate,
} from 'motion/react'
import { useI18n } from '@/contexts/I18nContext'
import Image from 'next/image'

interface AppItem {
    id: string
    titleKey: string
    icon: string
    url: string
    isInternal?: boolean
}

const apps: AppItem[] = [
    { id: 'mcp', titleKey: 'app.mcp', icon: '/mcp-logo.svg', url: '/mcp', isInternal: true }
]

const SPRING = { stiffness: 340, damping: 32, mass: 0.75 }

function lerp(a: number, b: number, t: number) { return a + (b - a) * t }

const CLOSED_W = 120
const CLOSED_H = 120
const OPEN_W = 480
const OPEN_H = 420

export default function AppFolder() {
    const { t } = useI18n()
    const router = useRouter()
    const [phase, setPhase] = useState<'closed' | 'opening' | 'open' | 'closing'>('closed')
    const [isFullyOpen, setIsFullyOpen] = useState(false)

    const folderRef = useRef<HTMLDivElement>(null)
    const progress = useMotionValue(0)

    const folderW = useTransform(progress, p => lerp(CLOSED_W, OPEN_W, p))
    const folderH = useTransform(progress, p => lerp(CLOSED_H, OPEN_H, p))
    const folderRadius = useTransform(progress, p => lerp(28, 36, p))
    const backdropOp = useTransform(progress, [0, 0.5], [0, 1])
    const titleOp = useTransform(progress, [0.4, 0.8], [0, 1])
    const titleY = useTransform(progress, [0.4, 0.8], [-14, 0])
    // closed content fades out fast as folder opens
    const closedOp = useTransform(progress, [0, 0.3], [1, 0])
    // open content fades in after folder is mostly expanded
    const openOp = useTransform(progress, [0.5, 1.0], [0, 1])
    const openScale = useTransform(progress, [0.5, 1.0], [0.85, 1])

    const isOpen = phase === 'open' || phase === 'opening' || phase === 'closing'

    const handleOpen = useCallback(() => {
        if (phase !== 'closed') return
        setPhase('opening')
        setIsFullyOpen(false)
        animate(progress, 1, {
            type: 'spring', ...SPRING,
            onComplete: () => {
                setPhase('open')
                setIsFullyOpen(true)
            },
        })
    }, [phase, progress])

    const handleClose = useCallback(() => {
        if (phase !== 'open') return
        setPhase('closing')
        setIsFullyOpen(false)
        animate(progress, 0, {
            type: 'spring', ...SPRING,
            onComplete: () => setPhase('closed'),
        })
    }, [phase, progress])

    useEffect(() => {
        const onOutside = (e: MouseEvent) => {
            if (phase === 'open' && folderRef.current && !folderRef.current.contains(e.target as Node)) {
                handleClose()
            }
        }
        document.addEventListener('mousedown', onOutside)
        return () => document.removeEventListener('mousedown', onOutside)
    }, [phase, handleClose])

    const handleAppClick = (e: React.MouseEvent, app: AppItem) => {
        if (!isFullyOpen) {
            e.preventDefault()
            if (phase === 'closed') handleOpen()
            else e.stopPropagation()
            return
        }
        if (app.isInternal) router.push(app.url)
        else window.open(app.url, '_blank', 'noopener,noreferrer')
    }

    return (
        <>
            {/* Frosted backdrop */}
            <motion.div
                className="fixed inset-0 z-40"
                style={{
                    opacity: backdropOp,
                    background: 'rgba(245,240,232,0.88)',
                    backdropFilter: 'blur(24px)',
                    pointerEvents: isOpen ? 'auto' : 'none',
                }}
                onClick={() => phase === 'open' && handleClose()}
            />

            {/* Title */}
            <motion.div
                className="fixed top-24 left-0 right-0 z-50 text-center pointer-events-none"
                style={{ opacity: titleOp, y: titleY }}
            >
                <h1 className="text-3xl md:text-4xl font-extrabold text-[#2c2416] tracking-tight">
                    {t('folder.title')}
                </h1>
            </motion.div>

            <div className="relative z-50 flex flex-col items-center">
                {/* Folder shell — only animated outer container */}
                <motion.div
                    ref={folderRef}
                    onClick={() => phase === 'closed' && handleOpen()}
                    style={{
                        width: folderW,
                        height: folderH,
                        borderRadius: folderRadius,
                        position: 'relative',
                        overflow: 'hidden',
                        cursor: phase === 'closed' ? 'pointer' : 'default',
                        background: isOpen ? 'transparent' : 'rgba(245,240,232,0.6)',
                        backdropFilter: isOpen ? 'none' : 'blur(20px)',
                        boxShadow: isOpen
                            ? 'none'
                            : 'inset 0 0 0 1px rgba(255,255,255,0.6), 0 8px 32px rgba(44,36,22,0.12)',
                    }}
                >
                    {/*
                     * CLOSED VIEW: 2×2 static mini icons, fades out as folder opens.
                     * No animation on the icons themselves — they're just still.
                     */}
                    <motion.div
                        style={{
                            opacity: closedOp,
                            position: 'absolute',
                            inset: 0,
                            display: 'grid',
                            gridTemplateColumns: 'repeat(2, 1fr)',
                            gap: 8,
                            padding: 12,
                            pointerEvents: 'none',
                        }}
                    >
                        {apps.slice(0, 4).map(app => (
                            <div
                                key={app.id}
                                style={{
                                    position: 'relative',
                                    borderRadius: 10,
                                    overflow: 'hidden',
                                    background: 'white',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                                    aspectRatio: '1/1',
                                }}
                            >
                                <Image src={app.icon} alt={t(app.titleKey)} fill style={{ objectFit: 'cover' }} unoptimized />
                            </div>
                        ))}
                    </motion.div>

                    {/*
                     * OPEN VIEW: all 6 icons in 4-col grid, fades+scales in.
                     * Just opacity/scale — no grid reflow during animation.
                     */}
                    <motion.div
                        style={{
                            opacity: openOp,
                            scale: openScale,
                            position: 'absolute',
                            inset: 0,
                            display: 'grid',
                            gridTemplateColumns: 'repeat(4, 1fr)',
                            gap: '36px 20px',
                            padding: '48px 32px 36px',
                            alignContent: 'start',
                            pointerEvents: isFullyOpen ? 'auto' : 'none',
                        }}
                    >
                        {apps.map((app, i) => (
                            <motion.div
                                key={app.id}
                                className="flex flex-col items-center"
                                onClick={(e) => handleAppClick(e, app)}
                                style={{ cursor: isFullyOpen ? 'pointer' : 'default' }}
                                initial={{ opacity: 0, y: 12 }}
                                animate={phase === 'open' || phase === 'opening'
                                    ? { opacity: 1, y: 0 }
                                    : { opacity: 0, y: 12 }}
                                transition={{ type: 'spring', ...SPRING, delay: i * 0.04 }}
                            >
                                <motion.div
                                    style={{
                                        position: 'relative',
                                        width: 88,
                                        height: 88,
                                        overflow: 'hidden',
                                        background: 'white',
                                        borderRadius: 20,
                                        boxShadow: '0 2px 12px rgba(0,0,0,0.09)',
                                        flexShrink: 0,
                                    }}
                                    whileHover={isFullyOpen ? {
                                        boxShadow: '0 6px 22px rgba(0,0,0,0.16)',
                                        filter: 'brightness(1.06)',
                                    } : {}}
                                    whileTap={isFullyOpen ? { filter: 'brightness(0.93)' } : {}}
                                    transition={{ duration: 0.16 }}
                                >
                                    <Image src={app.icon} alt={t(app.titleKey)} fill style={{ objectFit: 'cover' }} unoptimized />
                                </motion.div>

                                <motion.span
                                    initial={{ opacity: 0 }}
                                    animate={phase === 'open' ? { opacity: 1 } : { opacity: 0 }}
                                    transition={{ duration: 0.2, delay: 0.1 + i * 0.03 }}
                                    style={{
                                        marginTop: 7,
                                        fontSize: 12,
                                        fontWeight: 600,
                                        color: '#2c2416',
                                        textAlign: 'center',
                                        width: '100%',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                        lineHeight: 1.3,
                                    }}
                                >
                                    {t(app.titleKey)}
                                </motion.span>
                            </motion.div>
                        ))}
                    </motion.div>
                </motion.div>

                {/* Folder name below when closed */}
                <AnimatePresence>
                    {!isOpen && (
                        <motion.p
                            key="folder-label"
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 4 }}
                            transition={{ duration: 0.2 }}
                            className="mt-4 text-sm font-semibold text-[#2c2416] tracking-wide"
                        >
                            {t('folder.title')}
                        </motion.p>
                    )}
                </AnimatePresence>
            </div>
        </>
    )
}
