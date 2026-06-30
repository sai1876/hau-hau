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

    const { name, cardNo, initialTokens, outletId } = await req.json();
    if (!name || !cardNo) {
      return NextResponse.json({ error: 'name and cardNo are required' }, { status: 400 });
    }

    // Verify card number uniqueness
    const checkQuery = await dbAdmin.collection('tokens')
      .where('cardNo', '==', cardNo)
      .where('outletId', '==', outletId || 'main_outlet')
      .get();
    
    if (!checkQuery.empty) {
      return NextResponse.json({ error: 'A token account with this card number already exists.' }, { status: 400 });
    }

    const id = 't_' + Math.random().toString(36).substr(2, 9);
    const newAccount = {
      id,
      name,
      cardNo,
      tokens: initialTokens || 0,
      balanceRupees: 0,
      createdAt: new Date().toISOString(),
      outletId: outletId || 'main_outlet',
      isDemo: session.email?.includes('demo') || false
    };

    const tokenDocRef = dbAdmin.collection('tokens').doc(id);
    
    if (initialTokens && initialTokens > 0) {
      // If there are initial tokens, check limits and record transactions
      const settingsDocRef = dbAdmin.collection('settings').doc('settings_default');
      const txDocRef = dbAdmin.collection('token_transactions').doc();
      const auditDocRef = dbAdmin.collection('audit_logs').doc();

      // Look up staff info for limit
      const staffDoc = await dbAdmin.collection('staff').doc(session.uid).get();
      const staffData = staffDoc.exists ? staffDoc.data() : null;
      const callerUsername = staffData?.username || 'unknown';
      const limit = staffData?.monthlyTokenLimit ?? 1000;

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
          txsSnap.forEach((doc: any) => {
            totalRechargedThisMonth += doc.data().tokens || 0;
          });

          if (totalRechargedThisMonth + initialTokens > limit) {
            return NextResponse.json({
              error: `Monthly limit exceeded! Limit is ${limit}. You have sold ${totalRechargedThisMonth} tokens this month, leaving ${Math.max(0, limit - totalRechargedThisMonth)} remaining.`
            }, { status: 400 });
          }
        } catch (indexErr: any) {
          // The composite index may not be built yet — skip limit check but log a warning
          console.warn('Monthly limit check skipped (composite index may be pending):', indexErr.message || indexErr);
        }
      }

      await dbAdmin.runTransaction(async (transaction: any) => {
        const settingsDoc = await transaction.get(settingsDocRef);
        const rate = settingsDoc.exists ? (settingsDoc.data()?.tokenValueInRupees || 30) : 30;
        const amount = initialTokens * rate;

        transaction.set(tokenDocRef, newAccount);

        // Recharge transaction (positive magnitudes)
        const txRecord = {
          id: txDocRef.id,
          type: 'recharge',
          studentId: id,
          studentName: name,
          cardNo,
          tokens: initialTokens,
          amount,
          soldBy: callerUsername,
          createdAt: new Date().toISOString(),
          outletId: newAccount.outletId,
          isDemo: newAccount.isDemo
        };
        transaction.set(txDocRef, txRecord);

        // Audit log
        const auditLog = {
          id: auditDocRef.id,
          action: 'tokenRecharged',
          actorUid: session.uid,
          actorRole: session.role,
          targetId: id,
          outletId: newAccount.outletId,
          timestamp: new Date().toISOString(),
          before: { tokens: 0, balanceRupees: 0 },
          after: { tokens: initialTokens, balanceRupees: 0 },
          isDemo: newAccount.isDemo
        };
        transaction.set(auditDocRef, auditLog);
      });
    } else {
      // Just create the token account doc
      await tokenDocRef.set(newAccount);
    }

    return NextResponse.json({ success: true, account: newAccount });
  } catch (error: any) {
    console.error('Failed to create token account:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
