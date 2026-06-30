import { NextResponse } from 'next/server';
import { authAdmin, dbAdmin } from '../../../../services/firebaseAdmin';

// Lightweight, Edge-compatible base64url JWT decoder
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

export async function POST(req: Request) {
  try {
    const { idToken } = await req.json();
    if (!idToken) {
      return NextResponse.json({ error: 'idToken is required' }, { status: 400 });
    }

    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days

    // Fallback: If Firebase Admin SDK is not configured, authenticate using client-secured JWT cookies
    if (!authAdmin) {
      const decoded = decodeJwt(idToken);
      if (!decoded) {
        return NextResponse.json({ error: 'Invalid ID token format' }, { status: 400 });
      }

      const email = decoded.email || '';
      const uid = decoded.sub || decoded.uid || '';
      const initialOwnerEmail = process.env.INITIAL_OWNER_EMAIL || 'cherukuridakshithsai@gmail.com';
      const ownerEmails = [initialOwnerEmail, 'owner-demo@hauhau.com', 'tharun@gmail.com', 'owner@hauhau.com'];
      const role = ownerEmails.includes(email) ? 'owner' : 'staff';

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

    // Verify the ID token
    const decodedToken = await authAdmin.verifyIdToken(idToken);
    const email = decodedToken.email || '';
    const uid = decodedToken.uid;

    // Determine if claims need to be provisioned
    let role = decodedToken.role as string | undefined;
    let status = decodedToken.status as string | undefined;
    let claimsChanged = false;

    if (!role || !status) {
      // Look up the staff document to get the role
      if (dbAdmin) {
        const staffDoc = await dbAdmin.collection('staff').doc(uid).get();
        if (staffDoc.exists) {
          const data = staffDoc.data()!;
          role = data.role || 'staff';
          status = data.status || 'active';
        }
      }

      // Fallback: check known owner emails
      if (!role) {
        const initialOwnerEmail = process.env.INITIAL_OWNER_EMAIL || 'cherukuridakshithsai@gmail.com';
        const ownerEmails = [initialOwnerEmail, 'owner-demo@hauhau.com', 'tharun@gmail.com', 'owner@hauhau.com'];
        role = ownerEmails.includes(email) ? 'owner' : 'staff';
        status = 'active';
      }

      // Set custom claims so future logins are instant
      await authAdmin.setCustomUserClaims(uid, { role, status });
      claimsChanged = true;
    }

    // Ensure the staff document exists (self-healing)
    if (dbAdmin) {
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
    }

    // If claims changed, we need a fresh token to create the session cookie
    // The client will need to call getIdToken(true) and POST again
    if (claimsChanged) {
      return NextResponse.json({ 
        success: false, 
        claimsUpdated: true,
        role,
        message: 'Claims provisioned. Please refresh token and retry.'
      });
    }

    // Check account status
    if (status === 'inactive') {
      return NextResponse.json({ error: 'This account has been disabled.' }, { status: 403 });
    }

    // Create session cookie from the verified token
    const sessionCookie = await authAdmin.createSessionCookie(idToken, { expiresIn });

    const response = NextResponse.json({ success: true, role });

    // Set secure __session cookie
    response.cookies.set('__session', sessionCookie, {
      maxAge: expiresIn / 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/'
    });

    return response;
  } catch (error: any) {
    console.error('Session API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 401 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete('__session');
  return response;
}
