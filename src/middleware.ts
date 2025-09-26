import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Set CORS headers
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Set COOP and COEP headers to prevent OpaqueResponseBlocking
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  response.headers.set('Cross-Origin-Embedder-Policy', 'require-corp');
  
  // Set Content Security Policy for iframe embedding - more permissive for deployment
  const host = request.headers.get('host') || '';
  const isPreviewDomain = host.includes('space.z.ai') || host.includes('z.ai');
  
  if (isPreviewDomain) {
    // For preview domains, allow all ancestors
    response.headers.set('Content-Security-Policy', "frame-ancestors *");
    response.headers.set('X-Frame-Options', 'ALLOWALL');
  } else {
    // For local development, be more restrictive
    response.headers.set('Content-Security-Policy', "frame-ancestors 'self' https://*.space.z.ai https://z.ai http://localhost:* http://127.0.0.1:*");
    response.headers.set('X-Frame-Options', 'ALLOWALL');
  }
  
  // Set other security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-XSS-Protection', '1; mode=block');

  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    const csp = isPreviewDomain ? "frame-ancestors *" : "frame-ancestors 'self' https://*.space.z.ai https://z.ai http://localhost:* http://127.0.0.1:*";
    
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
        'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
        'Cross-Origin-Embedder-Policy': 'require-corp',
        'Content-Security-Policy': csp,
        'X-Frame-Options': 'ALLOWALL',
      },
    });
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};