import { NextResponse } from 'next/server';
import { dbAdmin } from '../../../../services/firebaseAdmin';
import { getSession } from '../../../../services/apiHelper';

export async function POST(req: Request) {
  try {
    const session = await getSession(req);
    // Allow active staff members or owners to complete/pending, but only owners can cancel.
    if (!session || session.status !== 'active') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!dbAdmin) {
      return NextResponse.json({ error: 'Firestore Admin is not available' }, { status: 500 });
    }

    const { orderId, status } = await req.json();
    if (!orderId || !status) {
      return NextResponse.json({ error: 'orderId and status are required' }, { status: 400 });
    }

    if (status === 'cancelled' && session.role !== 'owner') {
      return NextResponse.json({ error: 'Only owners can cancel orders.' }, { status: 403 });
    }

    console.log('[update-status] Looking up orderId:', orderId);

    // Primary lookup: by document ID (how orders are normally stored)
    let orderDocRef = dbAdmin.collection('orders').doc(orderId);
    let orderDoc = await orderDocRef.get();

    // Fallback: query by the 'id' field stored in the document (handles edge cases)
    if (!orderDoc.exists) {
      console.log('[update-status] Doc not found by key, trying query by id field...');
      const querySnap = await dbAdmin.collection('orders').where('id', '==', orderId).limit(1).get();
      if (!querySnap.empty) {
        orderDocRef = querySnap.docs[0].ref;
        orderDoc = querySnap.docs[0];
        console.log('[update-status] Found via query, doc key:', querySnap.docs[0].id);
      }
    }

    if (!orderDoc.exists) {
      console.error('[update-status] Order not found for orderId:', orderId);
      return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    }

    const order = orderDoc.data();
    if (order?.orderStatus === 'cancelled') {
      return NextResponse.json({ error: 'Cancelled orders cannot be completed or modified.' }, { status: 400 });
    }

    const completedAt = status === 'completed' ? new Date().toISOString() : null;
    const paymentStatus = status === 'completed' ? 'paid' : order?.paymentStatus;

    let operatorName = session.name || (session.role === 'owner' ? 'owner' : 'staff');
    if (dbAdmin) {
      const staffDoc = await dbAdmin.collection('staff').doc(session.uid).get();
      if (staffDoc.exists) {
        const staffData = staffDoc.data();
        operatorName = staffData?.username || staffData?.name || operatorName;
      }
    }

    if (status === 'cancelled' && order?.paymentMode === 'tokens' && order?.tokenCardId && order?.tokensDeducted) {
      const tokenDocRef = dbAdmin.collection('tokens').doc(order.tokenCardId);
      const settingsDocRef = dbAdmin.collection('settings').doc('settings_default');
      const txDocRef = dbAdmin.collection('token_transactions').doc();
      const auditDocRef = dbAdmin.collection('audit_logs').doc();

      await dbAdmin.runTransaction(async (transaction) => {
        const tokenDoc = await transaction.get(tokenDocRef);
        if (!tokenDoc.exists) {
          throw new Error('Token card not found for refund.');
        }

        const settingsDoc = await transaction.get(settingsDocRef);
        const rate = settingsDoc.exists ? (settingsDoc.data()?.tokenValueInRupees || 30) : 30;

        const currentCard = tokenDoc.data();
        const currentTokens = currentCard?.tokens || 0;
        const currentBalanceRupees = currentCard?.balanceRupees || 0;

        const tokensToRefund = order.tokensDeducted;
        const orderTotal = order.total;

        const newTokensBalance = Math.round(currentTokens + tokensToRefund);
        const newBalanceRupees = currentBalanceRupees - ((tokensToRefund * rate) - orderTotal);

        // Update Token Account Balance
        transaction.update(tokenDocRef, {
          tokens: newTokensBalance,
          balanceRupees: newBalanceRupees,
          updatedAt: new Date().toISOString()
        });

        // Update Order Status to Cancelled
        transaction.update(orderDocRef, {
          orderStatus: 'cancelled',
          paymentStatus: 'pending',
          updatedAt: new Date().toISOString()
        });

        // Write Refund Ledger Record (always positive magnitude)
        const txRecord = {
          id: txDocRef.id,
          type: 'refund',
          studentId: order.tokenCardId,
          studentName: currentCard?.name,
          cardNo: currentCard?.cardNo,
          tokens: tokensToRefund, // Magnitude (positive)
          amount: tokensToRefund * rate, // Magnitude (positive)
          soldBy: operatorName,
          orderId,
          createdAt: new Date().toISOString(),
          outletId: currentCard?.outletId || 'main_outlet',
          isDemo: currentCard?.isDemo || false,
          creditApplied: order.creditReturned || 0,
          creditReturned: order.creditApplied || 0
        };
        transaction.set(txDocRef, txRecord);

        // Write Token Refund Audit Log
        const auditLogRefund = {
          id: auditDocRef.id,
          action: 'tokenRefunded',
          actorUid: session.uid,
          actorRole: session.role,
          targetId: order.tokenCardId,
          outletId: currentCard?.outletId || 'main_outlet',
          timestamp: new Date().toISOString(),
          before: { tokens: currentTokens, balanceRupees: currentBalanceRupees, orderId },
          after: { tokens: newTokensBalance, balanceRupees: newBalanceRupees, orderId },
          isDemo: currentCard?.isDemo || false
        };
        transaction.set(auditDocRef, auditLogRefund);
      });
    } else {
      // General update (complete or pending, or cancellation without token refund)
      const updateData: any = {
        orderStatus: status,
        paymentStatus,
        updatedAt: new Date().toISOString()
      };
      if (completedAt) {
        updateData.completedAt = completedAt;
      }
      await orderDocRef.update(updateData);
    }

    // Write Order Status Audit Log
    const orderAuditRef = dbAdmin.collection('audit_logs').doc();
    await orderAuditRef.set({
      id: orderAuditRef.id,
      action: status === 'completed' ? 'orderCompleted' : status === 'cancelled' ? 'orderCancelled' : 'orderCreated',
      actorUid: session.uid,
      actorRole: session.role,
      targetId: orderId,
      outletId: order?.outletId || 'main_outlet',
      timestamp: new Date().toISOString(),
      before: { orderStatus: order?.orderStatus },
      after: { orderStatus: status }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to update order status:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
