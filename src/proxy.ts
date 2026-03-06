import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
    const userId = request.cookies.get('dodoo_user_id')?.value

    if (
        !userId &&
        !request.nextUrl.pathname.startsWith('/login') &&
        !request.nextUrl.pathname.startsWith('/api') &&
        !request.nextUrl.pathname.startsWith('/_next') &&
        !request.nextUrl.pathname.startsWith('/dog.svg') &&
        !request.nextUrl.pathname.startsWith('/buy') &&
        request.nextUrl.pathname !== '/manifest.json' &&
        request.nextUrl.pathname !== '/sw.js'
    ) {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    // Also prevent logged-in users from seeing the login page
    if (userId && request.nextUrl.pathname.startsWith('/login')) {
        return NextResponse.redirect(new URL('/', request.url))
    }

    return NextResponse.next()
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico|dog.svg|manifest.json|sw.js|buy).*)'],
}
