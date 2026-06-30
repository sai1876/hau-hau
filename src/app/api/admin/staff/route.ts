import { NextResponse } from 'next/server';
import { authAdmin, dbAdmin } from '../../../../services/firebaseAdmin';

// Helper to verify that the request caller is an owner
async function verifyOwner(req: Request): Promise<boolean> {
  const sessionCookie = req.headers.get('cookie')
    ?.split('; ')
    .find(c => c.startsWith('__session='))
    ?.split('=')[1];

  if (!sessionCookie || !authAdmin) return false;

  try {
    const decodedClaims = await authAdmin.verifySessionCookie(sessionCookie, true);
    return decodedClaims.role === 'owner' && decodedClaims.status === 'active';
  } catch (e) {
    return false;
  }
}

export async function POST(req: Request) {
  try {
    const isOwner = await verifyOwner(req);
    if (!isOwner) {
      return NextResponse.json({ error: 'Unauthorized. Owner privileges required.' }, { status: 403 });
    }

    if (!dbAdmin || !authAdmin) {
      return NextResponse.json({ error: 'Firestore/Auth Admin is not available' }, { status: 500 });
    }

    const body = await req.json();
    const { action, data } = body;

    if (!action || !data) {
      return NextResponse.json({ error: 'Action and data are required' }, { status: 400 });
    }

    switch (action) {
      case 'create': {
        const { name, emailOrPhone, username, password, monthlyTokenLimit, outletId } = data;
        if (!name || !emailOrPhone || !username || !password) {
          return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Create Firebase Auth user
        const userRecord = await authAdmin.createUser({
          email: emailOrPhone,
          password,
          displayName: name
        });

        // Set custom user claims
        await authAdmin.setCustomUserClaims(userRecord.uid, {
          role: 'staff',
          status: 'active'
        });

        // Write staff document in Firestore (no password stored!)
        const staffDocData = {
          id: userRecord.uid,
          name,
          emailOrPhone,
          username: username.trim().toLowerCase(),
          role: 'staff',
          status: 'active',
          monthlyTokenLimit: monthlyTokenLimit || 1000,
          outletId: outletId || 'main_outlet',
          createdAt: new Date().toISOString()
        };

        await dbAdmin.collection('staff').doc(userRecord.uid).set(staffDocData);

        return NextResponse.json({ success: true, staff: staffDocData });
      }

      case 'toggleStatus': {
        const { uid } = data;
        if (!uid) {
          return NextResponse.json({ error: 'UID is required' }, { status: 400 });
        }

        const staffDocRef = dbAdmin.collection('staff').doc(uid);
        const docSnap = await staffDocRef.get();
        if (!docSnap.exists) {
          return NextResponse.json({ error: 'Staff account not found' }, { status: 404 });
        }

        const staffData = docSnap.data();
        const newStatus = staffData?.status === 'active' ? 'inactive' : 'active';

        // Update custom user claims
        await authAdmin.setCustomUserClaims(uid, {
          role: staffData?.role || 'staff',
          status: newStatus
        });

        // Update document
        await staffDocRef.update({
          status: newStatus,
          updatedAt: new Date().toISOString()
        });

        // If inactive, revoke refresh tokens to instantly sign them out
        if (newStatus === 'inactive') {
          await authAdmin.revokeRefreshTokens(uid);
        }

        return NextResponse.json({ success: true, status: newStatus });
      }

      case 'delete': {
        const { uid } = data;
        if (!uid) {
          return NextResponse.json({ error: 'UID is required' }, { status: 400 });
        }

        // Delete from Firebase Auth
        await authAdmin.deleteUser(uid);

        // Delete from Firestore
        await dbAdmin.collection('staff').doc(uid).delete();

        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Staff admin API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
