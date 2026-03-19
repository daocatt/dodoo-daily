import { NextRequest, NextResponse } from 'next/server'

/**
 * Proxies an external image through the server so html-to-image can capture
 * it without CORS canvas taint issues.
 */
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url)
    const imageUrl = searchParams.get('url')

    if (!imageUrl) {
        return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 })
    }

    try {
        // Handle relative URLs by making them absolute using the request's origin
        let finalUrl = imageUrl
        if (imageUrl.startsWith('/')) {
            const origin = req.nextUrl.origin
            finalUrl = `${origin}${imageUrl}`
        }

        const response = await fetch(finalUrl, {
            headers: {
                // Mimic a browser request to avoid 403 from some CDNs
                'User-Agent': 'Mozilla/5.0 (compatible; DoDoo-Daily-Bot/1.0)',
            },
        })

        if (!response.ok) {
            return NextResponse.json({ error: 'Failed to fetch image' }, { status: response.status })
        }

        const contentType = response.headers.get('content-type') || 'image/jpeg'
        const buffer = await response.arrayBuffer()

        return new NextResponse(buffer, {
            status: 200,
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=86400',
                'Access-Control-Allow-Origin': '*',
            },
        })
    } catch (e) {
        console.error('proxy-image error:', e)
        return NextResponse.json({ error: 'Proxy failed' }, { status: 500 })
    }
}
