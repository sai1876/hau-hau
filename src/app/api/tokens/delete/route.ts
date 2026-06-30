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

    const { tokenId } = await req.json();
    if (!tokenId) {
      return NextResponse.json({ error: 'tokenId is required' }, { status: 400 });
    }

    const tokenDocRef = dbAdmin.collection('tokens').doc(tokenId);
    const auditDocRef = dbAdmin.collection('audit_logs').doc();

    await dbAdmin.runTransaction(async (transaction: any) => {
      const tokenDoc = await transaction.get(tokenDocRef);
      if (!tokenDoc.exists) {
        throw new Error('Token account not found.');
      }
      const currentCard = tokenDoc.data();

      transaction.delete(tokenDocRef);

      // Write audit log
      const auditLog = {
        id: auditDocRef.id,
        action: 'tokenRemoved',
        actorUid: session.uid,
        actorRole: session.role,
        targetId: tokenId,
        outletId: currentCard?.outletId || 'main_outlet',
        timestamp: new Date().toISOString(),
        before: { tokens: currentCard?.tokens, cardNo: currentCard?.cardNo, name: currentCard?.name },
        after: null,
        isDemo: currentCard?.isDemo || false
      };
      transaction.set(auditDocRef, auditLog);
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to delete token account:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
