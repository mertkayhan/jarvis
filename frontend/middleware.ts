import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'
import { withMiddlewareAuthRequired, getSession } from '@auth0/nextjs-auth0/edge';


export default withMiddlewareAuthRequired(middleware);




async function middleware(req: NextRequest) {
    const resp = NextResponse.next();
    const session = await getSession(req, resp);

    if (!session) {
        return NextResponse.redirect(new URL('/api/auth/login', req.url));
    }
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