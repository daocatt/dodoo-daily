'use client'

import React from 'react'
import { useI18n } from '@/contexts/I18nContext'
import Image from 'next/image'

/**
 * Drift Bottle Logo — renders the bottle-logo.svg at the given size.
 * Optimized with Next.js Image component.
 */
export default function BottleLogo({
    size = 40,
    opacity = 1,
    style,
}: {
    size?: number
    opacity?: number
    style?: React.CSSProperties
}) {
    const { t } = useI18n()
    // width is computed from height to preserve 63:183 aspect ratio
    const svgHeight = size
    const svgWidth = size * (63 / 183)
    return (
        <div style={{ width: svgWidth, height: svgHeight, opacity, display: 'block', ...style, position: 'relative' }}>
            <Image
                src="/bottle-logo.svg"
                alt={t('common.logo')}
                fill
            />
        </div>
    )
}
