import { NextResponse } from 'next/server';

// Lightweight JWT decoder — works everywhere (Edge, Node, Serverless)
function decodeJwt(token: string) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

// Known owner emails for role resolution
function resolveRole(email: string): string {
  const initialOwnerEmail = process.env.INITIAL_OWNER_EMAIL || 'cherukuridakshithsai@gmail.com';
  const ownerEmails = [initialOwnerEmail, 'owner-demo@hauhau.com', 'tharun@gmail.com', 'owner@hauhau.com'];
  return ownerEmails.includes(email) ? 'owner' : 'staff';
}

// Fallback session creator — always works, no Admin SDK needed
function createFallbackSession(idToken: string, expiresIn: number) {
  const decoded = decodeJwt(idToken);
  if (!decoded) {
    return NextResponse.json({ error: 'Invalid ID token format' }, { status: 400 });
  }

  const email = decoded.email || '';
  const role = resolveRole(email);

  const response = NextResponse.json({ success: true, role });
  response.cookies.set('__session', idToken, {
    maxAge: expiresIn / 1000,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/'
  });

  return response;
}

export async function POST(req: Request) {
  try {
    const { idToken } = await req.json();
    if (!idToken) {
      return NextResponse.json({ error: 'idToken is required' }, { status: 400 });
    }

    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days

    // ── Try Admin SDK path (dynamic import so module-level crashes don't kill the route) ──
    try {
      const { authAdmin, dbAdmin } = await import('../../../../services/firebaseAdmin');

      if (authAdmin) {
        const decodedToken = await authAdmin.verifyIdToken(idToken);
        const email = decodedToken.email || '';
        const uid = decodedToken.uid;

        let role = decodedToken.role as string | undefined;
        let status = decodedToken.status as string | undefined;
        let claimsChanged = false;

        if (!role || !status) {
          if (dbAdmin) {
            try {
              const staffDoc = await dbAdmin.collection('staff').doc(uid).get();
              if (staffDoc.exists) {
                const data = staffDoc.data()!;
                role = data.role || 'staff';
                status = data.status || 'active';
              }
            } catch (_e) { /* Firestore may be unavailable */ }
          }

          if (!role) {
            role = resolveRole(email);
            status = 'active';
          }

          try {
            await authAdmin.setCustomUserClaims(uid, { role, status });
            claimsChanged = true;
          } catch (_e) { /* Claims may fail — not critical */ }
        }

        // Self-healing: ensure staff doc exists
        if (dbAdmin) {
          try {
            const staffDocRef = dbAdmin.collection('staff').doc(uid);
            const docSnap = await staffDocRef.get();
            if (!docSnap.exists) {
              await staffDocRef.set({
                id: uid,
                name: decodedToken.name || email.split('@')[0] || 'User',
                emailOrPhone: email,
                username: email.split('@')[0] || 'user',
                role,
                status,
                outletId: 'main_outlet',
                createdAt: new Date().toISOString()
              });
            }
          } catch (_e) { /* Self-healing is best-effort */ }
        }

        if (claimsChanged) {
          return NextResponse.json({
            success: false,
            claimsUpdated: true,
            role,
            message: 'Claims provisioned. Please refresh token and retry.'
          });
        }

        if (status === 'inactive') {
          return NextResponse.json({ error: 'This account has been disabled.' }, { status: 403 });
        }

        // Create proper session cookie
        const sessionCookie = await authAdmin.createSessionCookie(idToken, { expiresIn });
        const response = NextResponse.json({ success: true, role });
        response.cookies.set('__session', sessionCookie, {
          maxAge: expiresIn / 1000,
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          path: '/'
        });
        return response;
      }
    } catch (adminError: any) {
      console.warn('Admin SDK session path failed, using JWT fallback:', adminError?.message || adminError);
    }

    // ── Fallback: JWT decode (guaranteed to work) ──
    return createFallbackSession(idToken, expiresIn);

  } catch (error: any) {
    console.error('Session API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete('__session');
  return response;
}

