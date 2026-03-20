import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
    const hasSession = request.cookies.has('dodoo_session')

    const isStaticAsset = request.nextUrl.pathname.match(/\.(png|jpg|jpeg|svg|ico|json|js)$/)

    if (
        !hasSession &&
        !request.nextUrl.pathname.startsWith('/login') &&
        !request.nextUrl.pathname.startsWith('/api') &&
        !request.nextUrl.pathname.startsWith('/_next') &&
        !isStaticAsset
    ) {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    // Also prevent logged-in users from seeing the login page
    if (hasSession && request.nextUrl.pathname.startsWith('/login')) {
        return NextResponse.redirect(new URL('/', request.url))
    }

    return NextResponse.next()
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.png|.*\\.svg|.*\\.jpg|manifest.json|sw.js).*)'],
}
