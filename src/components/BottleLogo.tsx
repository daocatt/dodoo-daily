'use client'

import React from 'react'
import { useI18n } from '@/contexts/I18nContext'

/**
 * Drift Bottle Logo — renders the bottle-logo.svg at the given size.
 * Uses <img> so the SVG is treated as a static image (no CSS clash risk).
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
        <img
            src="/bottle-logo.svg"
            alt={t('common.logo')}
            width={svgWidth}
            height={svgHeight}
            style={{ opacity, display: 'block', ...style }}
        />
    )
}
