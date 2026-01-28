import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const hostname = request.headers.get('host') || '';

    // Definir los dominios base (ajusta esto según tu configuración de Vercel/Dominio)
    const rootDomain = 'tubarrio.pe';
    const localhost = 'localhost:3000';

    let subdomain = '';

    if (hostname.includes(rootDomain)) {
        subdomain = hostname.replace(`.${rootDomain}`, '');
    } else if (hostname.includes(localhost)) {
        subdomain = hostname.replace(`.${localhost}`, '');
    }

    // Si no hay subdominio o es 'www', 'app', etc., no hacemos nada especial
    if (!subdomain || subdomain === 'www' || subdomain === hostname) {
        return NextResponse.next();
    }

    // Reescribir la ruta internamente para que Next.js maneje el subdominio
    // Por ejemplo: bodega-juanito.tubarrio.pe/pos -> /bodega-juanito/pos
    // PERO, para hacerlo transparente, usaremos una cabecera personalizada
    const response = NextResponse.next();
    response.headers.set('x-tenant-subdomain', subdomain);

    return response;
}

// Configuración para que el middleware solo corra en rutas relevantes
export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
};
