import { NextResponse } from 'next/server';
import { dbAdmin } from '../../../../services/firebaseAdmin';
import { getSession } from '../../../../services/apiHelper';

export async function POST(req: Request) {
  try {
    const session = await getSession(req);
    if (!session || session.role !== 'owner' || session.status !== 'active') {
      return NextResponse.json({ error: 'Unauthorized. Owner privileges required.' }, { status: 403 });
    }

    if (!dbAdmin) {
      return NextResponse.json({ error: 'Firestore Admin is not available' }, { status: 500 });
    }

    const { staffId, limit } = await req.json();
    if (!staffId || limit === undefined) {
      return NextResponse.json({ error: 'staffId and limit are required' }, { status: 400 });
    }

    const staffDocRef = dbAdmin.collection('staff').doc(staffId);
    const auditDocRef = dbAdmin.collection('audit_logs').doc();

    await dbAdmin.runTransaction(async (transaction) => {
      const staffDoc = await transaction.get(staffDocRef);
      if (!staffDoc.exists) {
        throw new Error('Staff account not found.');
      }
      const currentStaff = staffDoc.data();

      transaction.update(staffDocRef, {
        monthlyTokenLimit: limit,
        updatedAt: new Date().toISOString()
      });

      // Write audit log
      const auditLog = {
        id: auditDocRef.id,
        action: 'monthlyLimitChanged',
        actorUid: session.uid,
        actorRole: session.role,
        targetId: staffId,
        outletId: currentStaff?.outletId || 'main_outlet',
        timestamp: new Date().toISOString(),
        before: { monthlyTokenLimit: currentStaff?.monthlyTokenLimit ?? 1000 },
        after: { monthlyTokenLimit: limit },
        isDemo: currentStaff?.isDemo || false
      };
      transaction.set(auditDocRef, auditLog);
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to update staff limit:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
