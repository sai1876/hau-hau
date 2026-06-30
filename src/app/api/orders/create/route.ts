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

    const { orderData } = await req.json();
    if (!orderData) {
      return NextResponse.json({ error: 'orderData is required' }, { status: 400 });
    }

    // Generate unique order ID using Firestore auto-id with 'HH-' prefix to prevent collisions
    const orderDocRef = dbAdmin.collection('orders').doc();
    const orderId = 'HH-' + orderDocRef.id;

    let operatorName = session.name || 'unknown';
    if (dbAdmin) {
      const staffDoc = await dbAdmin.collection('staff').doc(session.uid).get();
      if (staffDoc.exists) {
        const staffData = staffDoc.data();
        operatorName = staffData?.username || staffData?.name || operatorName;
      }
    }

    const newOrder = {
      ...orderData,
      id: orderId,
      orderStatus: 'pending',
      paymentStatus: orderData.paymentMode === 'tokens' ? 'paid' : 'pending',
      createdAt: new Date().toISOString(),
      staffId: session.uid, // Store Firebase Auth UID as staffId
      staffName: operatorName
    };

    if (orderData.paymentMode === 'tokens') {
      const { tokenCardId, total } = orderData;
      if (!tokenCardId) {
        return NextResponse.json({ error: 'tokenCardId is required for token payment' }, { status: 400 });
      }

      const tokenDocRef = dbAdmin.collection('tokens').doc(tokenCardId);
      const settingsDocRef = dbAdmin.collection('settings').doc('settings_default');
      const txDocRef = dbAdmin.collection('token_transactions').doc();
      const auditDocRef = dbAdmin.collection('audit_logs').doc();

      const result = await dbAdmin.runTransaction(async (transaction: any) => {
        const tokenDoc = await transaction.get(tokenDocRef);
        if (!tokenDoc.exists) {
          throw new Error('Token account not found.');
        }
        const currentCard = tokenDoc.data();
        
        const settingsDoc = await transaction.get(settingsDocRef);
        const rate = settingsDoc.exists ? (settingsDoc.data()?.tokenValueInRupees || 30) : 30;

        const tokens = currentCard?.tokens || 0;
        const balanceRupees = currentCard?.balanceRupees || 0;
        const amountPayable = Math.max(0, total - balanceRupees);
        const tokensToDeduct = Math.ceil(amountPayable / rate);
        const creditApplied = total - amountPayable;

        const newTokensBalance = tokens - tokensToDeduct;
        if (newTokensBalance < 0) {
          throw new Error(`Insufficient tokens! Balance is ${tokens}, required is ${tokensToDeduct}.`);
        }

        const newBalanceRupees = balanceRupees - total + (tokensToDeduct * rate);

        // Update token account balance
        transaction.update(tokenDocRef, {
          tokens: newTokensBalance,
          balanceRupees: newBalanceRupees,
          updatedAt: new Date().toISOString()
        });

        // Add detailed token details to the order doc
        newOrder.tokenCardNo = currentCard?.cardNo;
        newOrder.studentName = currentCard?.name;
        newOrder.tokensDeducted = tokensToDeduct;
        newOrder.creditApplied = creditApplied;
        newOrder.creditReturned = (tokensToDeduct * rate) - amountPayable;
        newOrder.tokenCardId = tokenCardId; // Store card ID for atomicity during cancellation

        transaction.set(orderDocRef, newOrder);

        // Create token transaction ledger (tokens and amount are always positive magnitude)
        const txRecord = {
          id: txDocRef.id,
          type: 'deduction',
          studentId: tokenCardId,
          studentName: currentCard?.name,
          cardNo: currentCard?.cardNo,
          tokens: tokensToDeduct, // Magnitude (positive)
          amount: tokensToDeduct * rate, // Magnitude (positive)
          soldBy: operatorName,
          orderId,
          createdAt: new Date().toISOString(),
          outletId: currentCard?.outletId || 'main_outlet',
          isDemo: currentCard?.isDemo || false,
          creditApplied,
          creditReturned: (tokensToDeduct * rate) - amountPayable
        };
        transaction.set(txDocRef, txRecord);

        // Audit log for token deduction
        const auditLogToken = {
          id: auditDocRef.id,
          action: 'tokenDeducted',
          actorUid: session.uid,
          actorRole: session.role,
          targetId: tokenCardId,
          outletId: currentCard?.outletId || 'main_outlet',
          timestamp: new Date().toISOString(),
          before: { tokens, balanceRupees, orderId },
          after: { tokens: newTokensBalance, balanceRupees: newBalanceRupees, orderId },
          isDemo: currentCard?.isDemo || false
        };
        transaction.set(auditDocRef, auditLogToken);

        return {
          tokensDeducted: tokensToDeduct,
          creditApplied,
          creditReturned: (tokensToDeduct * rate) - amountPayable
        };
      });

      // Write audit log for order created
      const orderAuditRef = dbAdmin.collection('audit_logs').doc();
      await orderAuditRef.set({
        id: orderAuditRef.id,
        action: 'orderCreated',
        actorUid: session.uid,
        actorRole: session.role,
        targetId: orderId,
        outletId: newOrder.outletId || 'main_outlet',
        timestamp: new Date().toISOString(),
        after: { total, paymentMode: 'tokens', tableNumber: newOrder.tableNumber }
      });

      return NextResponse.json({ success: true, order: newOrder, result });
    } else {
      // Cash or Online payment
      await orderDocRef.set(newOrder);

      const orderAuditRef = dbAdmin.collection('audit_logs').doc();
      await orderAuditRef.set({
        id: orderAuditRef.id,
        action: 'orderCreated',
        actorUid: session.uid,
        actorRole: session.role,
        targetId: orderId,
        outletId: newOrder.outletId || 'main_outlet',
        timestamp: new Date().toISOString(),
        after: { total: newOrder.total, paymentMode: newOrder.paymentMode, tableNumber: newOrder.tableNumber }
      });

      return NextResponse.json({ success: true, order: newOrder });
    }
  } catch (error: any) {
    console.error('Order creation failed:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
