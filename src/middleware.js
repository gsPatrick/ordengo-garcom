import { NextResponse } from 'next/server';

export function middleware(request) {
    const token = request.cookies.get('ordengo_token')?.value;
    const isLoginPage = request.nextUrl.pathname === '/login';
    const isRootPage = request.nextUrl.pathname === '/';

    // Se não tem token e não está no login, redireciona para login
    if (!token && !isLoginPage) {
        // Permite arquivos estáticos (images, sw.js, etc.)
        if (request.nextUrl.pathname.includes('.') || request.nextUrl.pathname.startsWith('/api')) {
            return NextResponse.next();
        }
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // Se tem token e está no login ou na raiz, vai para mesas
    if (token && (isLoginPage || isRootPage)) {
        return NextResponse.redirect(new URL('/mesas', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
