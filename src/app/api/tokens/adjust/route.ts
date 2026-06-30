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

    const { studentId, targetTokens, reason } = await req.json();
    if (!studentId || targetTokens === undefined || !reason) {
      return NextResponse.json({ error: 'studentId, targetTokens, and reason are required' }, { status: 400 });
    }

    const tokenDocRef = dbAdmin.collection('tokens').doc(studentId);
    const txDocRef = dbAdmin.collection('token_transactions').doc();
    const auditDocRef = dbAdmin.collection('audit_logs').doc();

    await dbAdmin.runTransaction(async (transaction) => {
      const tokenDoc = await transaction.get(tokenDocRef);
      if (!tokenDoc.exists) {
        throw new Error('Token account not found.');
      }
      const currentCard = tokenDoc.data();
      const currentTokens = currentCard?.tokens || 0;
      const currentBalanceRupees = currentCard?.balanceRupees || 0;

      const diff = targetTokens - currentTokens;

      // Update Token Account balance
      transaction.update(tokenDocRef, {
        tokens: targetTokens,
        updatedAt: new Date().toISOString()
      });

      // Write adjustment transaction
      const txRecord = {
        id: txDocRef.id,
        type: 'adjustment',
        studentId,
        studentName: currentCard?.name,
        cardNo: currentCard?.cardNo,
        tokens: diff, // Positive or negative manual correction
        amount: 0,
        soldBy: 'owner',
        createdAt: new Date().toISOString(),
        outletId: currentCard?.outletId || 'main_outlet',
        isDemo: currentCard?.isDemo || false,
        reason
      };
      transaction.set(txDocRef, txRecord);

      // Write audit log
      const auditLog = {
        id: auditDocRef.id,
        action: 'tokenAdjusted',
        actorUid: session.uid,
        actorRole: session.role,
        targetId: studentId,
        outletId: currentCard?.outletId || 'main_outlet',
        timestamp: new Date().toISOString(),
        before: { tokens: currentTokens, balanceRupees: currentBalanceRupees, reason },
        after: { tokens: targetTokens, balanceRupees: currentBalanceRupees, reason },
        isDemo: currentCard?.isDemo || false
      };
      transaction.set(auditDocRef, auditLog);
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to adjust tokens:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
