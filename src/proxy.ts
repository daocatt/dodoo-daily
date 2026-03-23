import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || 'dodoo-daily-default-secret-change-me-in-production'
)

async function verifyToken(token: string | undefined) {
    if (!token) return null
    try {
        const { payload } = await jwtVerify(token, JWT_SECRET)
        return payload
    } catch (_e) {
        return null
    }
}

export async function proxy(request: NextRequest) {
    const pathname = request.nextUrl.pathname
    
    // 1. Static Assets bypassing
    const isStaticAsset = pathname.match(/\.(png|jpg|jpeg|svg|ico|json|js|css|wav|mp3|mp4|webp|woff2?)$/)
    if (isStaticAsset || pathname.startsWith('/_next')) {
        return NextResponse.next()
    }

    // 2. Auth Tokens Extraction & Verification
    const familyToken = request.cookies.get('dodoo_session')?.value
    const visitorToken = request.cookies.get('dodoo_visitor_session')?.value
    
    const familySession = await verifyToken(familyToken)
    const visitorSession = await verifyToken(visitorToken)

    const hasFamily = !!familySession && familySession.type === 'FAMILY'
    const hasVisitor = !!visitorSession && visitorSession.type === 'VISITOR'

    // 3. MCP/Reserved Paths protection
    if (pathname.startsWith('/admin/mcp')) {
        return NextResponse.redirect(new URL('/', request.url))
    }

    // 4. API Protection
    if (pathname.startsWith('/api/')) {
        const isOpenApi = 
            pathname.startsWith('/api/auth/') || 
            pathname.startsWith('/api/open/') || 
            pathname.startsWith('/api/public/') ||
            pathname.startsWith('/api/setup') ||
            pathname.startsWith('/api/buy/') ||
            pathname.startsWith('/api/visitor/login') ||
            pathname.startsWith('/api/visitor/register')

        // If it's a family API (under /api/parent/ or similar), require family session
        if (pathname.startsWith('/api/parent/') && !hasFamily) {
            return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
        }

        // If it's a visitor API, either family or visitor can access normally, 
        // but we'll enforce specific rules in the routes themselves.
        // General unprotected APIs go through
        if (isOpenApi) return NextResponse.next()

        // Everything else requires at least one session
        if (!hasFamily && !hasVisitor) {
            return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
        }
        
        return NextResponse.next()
    }

    // 5. Page Protection (UI)
    const isOpenPage = 
        pathname === '/' ||
        pathname.startsWith('/admin/login') || 
        pathname.startsWith('/u/') || 
        pathname.startsWith('/buy/') ||
        pathname.startsWith('/visitor/login') ||
        pathname.startsWith('/visitor/register') ||
        pathname.startsWith('/admin/setup') 

    // Redirect to / if NOT authenticated and trying to access private page
    // Note: /visitor (hub) requires visitor or family session
    if (!hasFamily && !hasVisitor && !isOpenPage) {
        return NextResponse.redirect(new URL('/', request.url))
    }

    // Allow visitors to access /visitor paths
    if (pathname.startsWith('/visitor') && (hasFamily || hasVisitor)) {
        return NextResponse.next()
    }

    // Logic for auth pages: if already logged in, redirect to appropriate hub
    if (hasFamily && (pathname === '/' || pathname.startsWith('/admin/login'))) {
        return NextResponse.redirect(new URL('/admin', request.url))
    }

    if (hasVisitor && (pathname === '/' || pathname.startsWith('/visitor/login'))) {
        return NextResponse.redirect(new URL('/visitor', request.url))
    }

    return NextResponse.next()
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.png|.*\\.svg|.*\\.jpg|manifest.json|sw.js).*)'],
}
