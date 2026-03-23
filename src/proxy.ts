import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
    const hasSession = request.cookies.has('dodoo_session')
    const pathname = request.nextUrl.pathname

    // 1. Static Assets bypassing (optimized)
    const isStaticAsset = pathname.match(/\.(png|jpg|jpeg|svg|ico|json|js|css|wav|mp3|mp4|webp|woff2?)$/)
    if (isStaticAsset || pathname.startsWith('/_next')) {
        return NextResponse.next()
    }

    // 2. Setup Protection: Block /setup if system is already initialized
    // (We'll assume 'needsSetup' check happens in the layout or we can use a cookie hint if we want to be fully edge-compatible.
    // For now, let's keep it simple and rely on internal API redirects if possible, 
    // BUT we should prevent unauthenticated access to EVERYTHING ELSE if not in setup mode.)

    // 3. MCP Blocking - No longer used, prevent access
    if (pathname.startsWith('/admin/mcp')) {
        return NextResponse.redirect(new URL('/', request.url))
    }

    // 4. API Classification & Protection
    if (pathname.startsWith('/api/')) {
        // List of OPEN API paths that don't need a session
        const isOpenApi = 
            pathname.startsWith('/api/auth/') || 
            pathname.startsWith('/api/open/') || 
            pathname.startsWith('/api/public/') ||
            pathname.startsWith('/api/setup') || // Setup APIs handle their own needsSetup check
            pathname.startsWith('/api/buy/')     // Public purchase API

        if (!hasSession && !isOpenApi) {
            return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            })
        }
        return NextResponse.next()
    }

    // 5. Page Protection (UI)
    // List of OPEN UI paths
    const isOpenPage = 
        pathname === '/' ||
        pathname.startsWith('/admin/login') || 
        pathname.startsWith('/u/') || 
        pathname.startsWith('/buy/') ||
        pathname.startsWith('/visitor/') ||
        pathname.startsWith('/admin/setup') 

    if (!hasSession && !isOpenPage) {
        // Default redirect for any unauthenticated PAGE access is now /
        return NextResponse.redirect(new URL('/', request.url))
    }

    // prevent logged-in users from seeing the landing/login pages if authenticated
    if (hasSession && (pathname === '/' || pathname.startsWith('/admin/login'))) {
        return NextResponse.redirect(new URL('/admin', request.url))
    }

    return NextResponse.next()
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.png|.*\\.svg|.*\\.jpg|manifest.json|sw.js).*)'],
}
