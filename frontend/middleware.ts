import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'
import { auth0 } from './lib/auth0';




export async function middleware(request: NextRequest) {
    const authRes = await auth0.middleware(request);

    if (request.nextUrl.pathname.startsWith("/auth")) {
        return authRes;
    }

    const session = await auth0.getSession(request);

    if (!session) {
        // user is not authenticated, redirect to login page
        return NextResponse.redirect(new URL("/auth/login", request.nextUrl.origin));
    }

    // the headers from the auth middleware should always be returned
    return authRes;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        {
            source: '/((?!api|_next/static|_next/image|favicon.ico).*)',
            missing: [
                { type: 'header', key: 'next-router-prefetch' },
                { type: 'header', key: 'purpose', value: 'prefetch' },
            ],
        },
    ],
}