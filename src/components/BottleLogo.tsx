'use client'

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
    // width is computed from height to preserve 63:183 aspect ratio
    const svgHeight = size
    const svgWidth = size * (63 / 183)
    return (
        <img
            src="/bottle-logo.svg"
            alt="漂流瓶"
            width={svgWidth}
            height={svgHeight}
            style={{ opacity, display: 'block', ...style }}
        />
    )
}
