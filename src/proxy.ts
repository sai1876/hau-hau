import { NextRequest, NextResponse } from 'next/server';
import { authAdmin } from './services/firebaseAdmin';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Exclude public auth endpoints from session checks
  if (pathname.startsWith('/api/auth/')) {
    return NextResponse.next();
  }

  // 2. Check if Firebase is configured. If not, bypass proxy for local dev
  const hasFirebase = !!(
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  );
  
  if (!hasFirebase || !authAdmin) {
    return NextResponse.next();
  }

  // 3. Extract secure session cookie
  const sessionCookie = request.cookies.get('__session')?.value;

  if (!sessionCookie) {
    if (!pathname.startsWith('/api')) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 4. Verify session cookie
    const decodedClaims = await authAdmin.verifySessionCookie(sessionCookie, true);

    // 5. Check if user is active (owners bypass deactivation checks)
    if (decodedClaims.status !== 'active' && decodedClaims.role !== 'owner') {
      const response = pathname.startsWith('/api')
        ? NextResponse.json({ error: 'Unauthorized. Account inactive.' }, { status: 401 })
        : NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('__session');
      return response;
    }

    // 6. Enforce route access privileges
    if (pathname.startsWith('/owner') && decodedClaims.role !== 'owner') {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    if (pathname.startsWith('/staff') && decodedClaims.role !== 'staff' && decodedClaims.role !== 'owner') {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // 7. Enforce role for admin API routes
    if (pathname.startsWith('/api/admin') && decodedClaims.role !== 'owner') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.next();
  } catch (error) {
    console.error('Proxy session verification failed:', error);
    const response = pathname.startsWith('/api')
      ? NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      : NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('__session');
    return response;
  }
}

export const config = {
  matcher: ['/owner/:path*', '/staff/:path*', '/api/:path*'],
};
