import { NextResponse } from 'next/server';
import { dbAdmin } from '../../../../services/firebaseAdmin';
import { getSession } from '../../../../services/apiHelper';

export async function POST(req: Request) {
  try {
    const session = await getSession(req);
    if (!session || session.status !== 'active') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!dbAdmin) {
      return NextResponse.json({ error: 'Firestore Admin is not available' }, { status: 500 });
    }

    const { studentId, tokens, amount } = await req.json();
    if (!studentId || tokens === undefined || amount === undefined) {
      return NextResponse.json({ error: 'studentId, tokens, and amount are required' }, { status: 400 });
    }

    // Look up caller staff profile to get username and limit
    const staffDoc = await dbAdmin.collection('staff').doc(session.uid).get();
    if (!staffDoc.exists) {
      return NextResponse.json({ error: 'Staff account not found.' }, { status: 404 });
    }
    const staffData = staffDoc.data();
    const callerUsername = staffData?.username || 'unknown';
    const limit = staffData?.monthlyTokenLimit ?? 1000;

    // Enforce monthly limit for staff roles
    if (session.role === 'staff') {
      try {
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

        const txsQuery = dbAdmin.collection('token_transactions')
          .where('soldBy', '==', callerUsername)
          .where('type', '==', 'recharge')
          .where('createdAt', '>=', monthStart);

        const txsSnap = await txsQuery.get();
        let totalRechargedThisMonth = 0;
        txsSnap.forEach(doc => {
          totalRechargedThisMonth += doc.data().tokens || 0;
        });

        if (totalRechargedThisMonth + tokens > limit) {
          return NextResponse.json({
            error: `Monthly limit exceeded! Limit is ${limit}. You have sold ${totalRechargedThisMonth} tokens this month, leaving ${Math.max(0, limit - totalRechargedThisMonth)} remaining.`
          }, { status: 400 });
        }
      } catch (indexErr: any) {
        console.warn('Monthly limit check skipped (composite index may be pending):', indexErr.message || indexErr);
      }
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

      const newTokens = currentTokens + tokens;

      // Update Token Account
      transaction.update(tokenDocRef, {
        tokens: newTokens,
        updatedAt: new Date().toISOString()
      });

      // Write recharge transaction (positive magnitudes)
      const txRecord = {
        id: txDocRef.id,
        type: 'recharge',
        studentId,
        studentName: currentCard?.name,
        cardNo: currentCard?.cardNo,
        tokens,
        amount,
        soldBy: callerUsername,
        createdAt: new Date().toISOString(),
        outletId: currentCard?.outletId || 'main_outlet',
        isDemo: currentCard?.isDemo || false
      };
      transaction.set(txDocRef, txRecord);

      // Write audit log
      const auditLog = {
        id: auditDocRef.id,
        action: 'tokenRecharged',
        actorUid: session.uid,
        actorRole: session.role,
        targetId: studentId,
        outletId: currentCard?.outletId || 'main_outlet',
        timestamp: new Date().toISOString(),
        before: { tokens: currentTokens, balanceRupees: currentBalanceRupees },
        after: { tokens: newTokens, balanceRupees: currentBalanceRupees },
        isDemo: currentCard?.isDemo || false
      };
      transaction.set(auditDocRef, auditLog);
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to recharge tokens:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
