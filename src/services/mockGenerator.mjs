export function generateMockData(now = new Date()) {
  const relativeDate = (daysAgo, hoursAgo = 0, minsAgo = 0) => {
    const d = new Date(now.getTime());
    d.setDate(d.getDate() - daysAgo);
    d.setHours(d.getHours() - hoursAgo);
    d.setMinutes(d.getMinutes() - minsAgo);
    return d.toISOString();
  };

  // Staff accounts
  const DEFAULT_OUTLET_ID = 'main_outlet';
  const staff = [
    {
      id: 's1',
      name: 'Alex Johnson',
      emailOrPhone: 'alex@hauhau.com',
      username: 'staff',
      password: '1562206543da764123c21bd524674f0a8aaf49c8a89744c97352fe677f7e4006', // 'staff'
      status: 'active',
      role: 'staff',
      monthlyTokenLimit: 1000,
      outletId: DEFAULT_OUTLET_ID
    },
    {
      id: 'owner_default',
      name: 'cherukuri dakshith sai',
      emailOrPhone: 'cherukuridakshithsai@gmail.com',
      username: 'admin',
      password: '01e084a4d6bc824806aa4c473a367f0d4ad73f5baf452ab2c4c6845265900440', // 'Sai@011325'
      status: 'active',
      role: 'owner',
      outletId: DEFAULT_OUTLET_ID
    },
    {
      id: 'owner_demo_uid',
      name: 'Investor (Owner Demo)',
      emailOrPhone: 'owner-demo@hauhau.com',
      username: 'owner-demo',
      password: 'd3ad9315b7be5dd53b31a273b3b3aba5defe700808305aa16a3062b76658a791', // 'demo123'
      status: 'active',
      role: 'owner',
      outletId: DEFAULT_OUTLET_ID
    },
    {
      id: 'staff_demo_uid',
      name: 'Investor (Staff Demo)',
      emailOrPhone: 'staff-demo@hauhau.com',
      username: 'staff-demo',
      password: 'd3ad9315b7be5dd53b31a273b3b3aba5defe700808305aa16a3062b76658a791', // 'demo123'
      status: 'active',
      role: 'staff',
      monthlyTokenLimit: 5000,
      outletId: DEFAULT_OUTLET_ID
    }
  ];

  // Token accounts
  const tokens = [
    {
      id: 'tok101',
      name: 'Rahul Sharma',
      cardNo: '101',
      tokens: 75,
      balanceRupees: 15,
      createdAt: relativeDate(15),
      updatedAt: relativeDate(0, 2),
      outletId: DEFAULT_OUTLET_ID
    },
    {
      id: 'tok102',
      name: 'Priya Patel',
      cardNo: '102',
      tokens: 18,
      balanceRupees: 0,
      createdAt: relativeDate(14),
      updatedAt: relativeDate(1, 4),
      outletId: DEFAULT_OUTLET_ID
    },
    {
      id: 'tok103',
      name: 'Kabir Singh',
      cardNo: '103',
      tokens: 0,
      balanceRupees: 0,
      createdAt: relativeDate(10),
      updatedAt: relativeDate(3, 1),
      outletId: DEFAULT_OUTLET_ID
    },
    {
      id: 'tok104',
      name: 'Ananya Rao',
      cardNo: '104',
      tokens: 120,
      balanceRupees: 10,
      createdAt: relativeDate(8),
      updatedAt: relativeDate(0, 5),
      outletId: DEFAULT_OUTLET_ID
    },
    {
      id: 'tok105',
      name: 'Devendra Verma',
      cardNo: '105',
      tokens: 5,
      balanceRupees: 5,
      createdAt: relativeDate(5),
      updatedAt: relativeDate(4, 3),
      outletId: DEFAULT_OUTLET_ID
    }
  ];

  // Menu Helper
  const menuMap = {
    m1: { name: 'Veg Kurkure Momos', price: 80 },
    m2: { name: 'French Fries', price: 60 },
    m3: { name: 'Chicken Popcorn', price: 90 },
    m4: { name: 'Chicken Leg Piece', price: 100 },
    m5: { name: 'Veg Fingers', price: 80 },
    m6: { name: 'Veg Nuggets', price: 70 },
    m7: { name: 'Plane Chocolate Milk Shake', price: 79 },
    m8: { name: 'Oreo and Kitkat', price: 89 }
  };

  // Orders
  const orders = [
    // Today's orders
    {
      id: 'ord_t1',
      tableNumber: 'T2',
      items: [
        { menuItemId: 'm1', name: menuMap.m1.name, price: menuMap.m1.price, quantity: 2 },
        { menuItemId: 'm7', name: menuMap.m7.name, price: menuMap.m7.price, quantity: 1 }
      ],
      total: 239.00,
      paymentMode: 'online',
      paymentStatus: 'paid',
      orderStatus: 'completed',
      staffId: 'staff-demo',
      staffName: 'Investor (Staff Demo)',
      createdAt: relativeDate(0, 1, 15),
      completedAt: relativeDate(0, 1, 5),
      outletId: DEFAULT_OUTLET_ID
    },
    {
      id: 'ord_t2',
      tableNumber: 'T5',
      items: [
        { menuItemId: 'm3', name: menuMap.m3.name, price: menuMap.m3.price, quantity: 1 },
        { menuItemId: 'm8', name: menuMap.m8.name, price: menuMap.m8.price, quantity: 2 }
      ],
      total: 268.00,
      paymentMode: 'tokens',
      paymentStatus: 'paid',
      orderStatus: 'completed',
      staffId: 'staff-demo',
      staffName: 'Investor (Staff Demo)',
      createdAt: relativeDate(0, 2, 30),
      completedAt: relativeDate(0, 2, 20),
      tokenCardNo: '101',
      studentName: 'Rahul Sharma',
      tokensDeducted: 9, // 9 * 30 = 270 (2 rupees credit applied, card has 15 rupees balance balanceRupees)
      creditApplied: 2,
      outletId: DEFAULT_OUTLET_ID
    },
    {
      id: 'ord_t3',
      tableNumber: 'T1',
      items: [
        { menuItemId: 'm2', name: menuMap.m2.name, price: menuMap.m2.price, quantity: 3 }
      ],
      total: 180.00,
      paymentMode: 'cash',
      paymentStatus: 'paid',
      orderStatus: 'completed',
      staffId: 'staff-demo',
      staffName: 'Investor (Staff Demo)',
      createdAt: relativeDate(0, 3, 45),
      completedAt: relativeDate(0, 3, 35),
      outletId: DEFAULT_OUTLET_ID
    },
    {
      id: 'ord_t4',
      tableNumber: 'T3',
      items: [
        { menuItemId: 'm4', name: menuMap.m4.name, price: menuMap.m4.price, quantity: 2 },
        { menuItemId: 'm8', name: menuMap.m8.name, price: menuMap.m8.price, quantity: 1 }
      ],
      total: 289.00,
      paymentMode: 'online',
      paymentStatus: 'pending',
      orderStatus: 'pending',
      staffId: 'staff-demo',
      staffName: 'Investor (Staff Demo)',
      createdAt: relativeDate(0, 0, 20),
      outletId: DEFAULT_OUTLET_ID
    },
    {
      id: 'ord_t5',
      tableNumber: 'Takeaway',
      items: [
        { menuItemId: 'm6', name: menuMap.m6.name, price: menuMap.m6.price, quantity: 1 }
      ],
      total: 70.00,
      paymentMode: 'cash',
      paymentStatus: 'pending',
      orderStatus: 'pending',
      staffId: 'staff',
      staffName: 'Alex Johnson',
      createdAt: relativeDate(0, 0, 5),
      outletId: DEFAULT_OUTLET_ID
    },

    // Yesterday's orders
    {
      id: 'ord_y1',
      tableNumber: 'T4',
      items: [
        { menuItemId: 'm1', name: menuMap.m1.name, price: menuMap.m1.price, quantity: 1 },
        { menuItemId: 'm2', name: menuMap.m2.name, price: menuMap.m2.price, quantity: 1 },
        { menuItemId: 'm7', name: menuMap.m7.name, price: menuMap.m7.price, quantity: 2 }
      ],
      total: 298.00,
      paymentMode: 'online',
      paymentStatus: 'paid',
      orderStatus: 'completed',
      staffId: 'staff-demo',
      staffName: 'Investor (Staff Demo)',
      createdAt: relativeDate(1, 2, 10),
      completedAt: relativeDate(1, 2, 0),
      outletId: DEFAULT_OUTLET_ID
    },
    {
      id: 'ord_y2',
      tableNumber: 'T3',
      items: [
        { menuItemId: 'm3', name: menuMap.m3.name, price: menuMap.m3.price, quantity: 2 }
      ],
      total: 180.00,
      paymentMode: 'tokens',
      paymentStatus: 'paid',
      orderStatus: 'completed',
      staffId: 'staff-demo',
      staffName: 'Investor (Staff Demo)',
      createdAt: relativeDate(1, 4, 15),
      completedAt: relativeDate(1, 4, 5),
      tokenCardNo: '102',
      studentName: 'Priya Patel',
      tokensDeducted: 6, // 6 * 30 = 180
      creditApplied: 0,
      outletId: DEFAULT_OUTLET_ID
    },
    {
      id: 'ord_y3',
      tableNumber: 'T2',
      items: [
        { menuItemId: 'm5', name: menuMap.m5.name, price: menuMap.m5.price, quantity: 1 },
        { menuItemId: 'm8', name: menuMap.m8.name, price: menuMap.m8.price, quantity: 1 }
      ],
      total: 169.00,
      paymentMode: 'cash',
      paymentStatus: 'paid',
      orderStatus: 'completed',
      staffId: 'staff',
      staffName: 'Alex Johnson',
      createdAt: relativeDate(1, 6, 30),
      completedAt: relativeDate(1, 6, 20),
      outletId: DEFAULT_OUTLET_ID
    },
    {
      id: 'ord_y4',
      tableNumber: 'T5',
      items: [
        { menuItemId: 'm4', name: menuMap.m4.name, price: menuMap.m4.price, quantity: 3 }
      ],
      total: 300.00,
      paymentMode: 'online',
      paymentStatus: 'pending',
      orderStatus: 'cancelled',
      staffId: 'staff-demo',
      staffName: 'Investor (Staff Demo)',
      createdAt: relativeDate(1, 8, 0),
      completedAt: relativeDate(1, 7, 50),
      outletId: DEFAULT_OUTLET_ID
    },

    // Older orders (Last 7 days)
    {
      id: 'ord_o1',
      tableNumber: 'T1',
      items: [
        { menuItemId: 'm1', name: menuMap.m1.name, price: menuMap.m1.price, quantity: 3 }
      ],
      total: 240.00,
      paymentMode: 'cash',
      paymentStatus: 'paid',
      orderStatus: 'completed',
      staffId: 'staff-demo',
      staffName: 'Investor (Staff Demo)',
      createdAt: relativeDate(2, 3, 0),
      completedAt: relativeDate(2, 2, 50),
      outletId: DEFAULT_OUTLET_ID
    },
    {
      id: 'ord_o2',
      tableNumber: 'T2',
      items: [
        { menuItemId: 'm3', name: menuMap.m3.name, price: menuMap.m3.price, quantity: 2 },
        { menuItemId: 'm7', name: menuMap.m7.name, price: menuMap.m7.price, quantity: 2 }
      ],
      total: 338.00,
      paymentMode: 'online',
      paymentStatus: 'paid',
      orderStatus: 'completed',
      staffId: 'staff',
      staffName: 'Alex Johnson',
      createdAt: relativeDate(3, 1, 15),
      completedAt: relativeDate(3, 1, 5),
      outletId: DEFAULT_OUTLET_ID
    },
    {
      id: 'ord_o3',
      tableNumber: 'T5',
      items: [
        { menuItemId: 'm4', name: menuMap.m4.name, price: menuMap.m4.price, quantity: 1 },
        { menuItemId: 'm2', name: menuMap.m2.name, price: menuMap.m2.price, quantity: 2 }
      ],
      total: 220.00,
      paymentMode: 'tokens',
      paymentStatus: 'paid',
      orderStatus: 'completed',
      staffId: 'staff-demo',
      staffName: 'Investor (Staff Demo)',
      createdAt: relativeDate(3, 5, 0),
      completedAt: relativeDate(3, 4, 50),
      tokenCardNo: '104',
      studentName: 'Ananya Rao',
      tokensDeducted: 8, // 8 * 30 = 240 (20 credit applied)
      creditApplied: 20,
      outletId: DEFAULT_OUTLET_ID
    },
    {
      id: 'ord_o4',
      tableNumber: 'T3',
      items: [
        { menuItemId: 'm6', name: menuMap.m6.name, price: menuMap.m6.price, quantity: 2 }
      ],
      total: 140.00,
      paymentMode: 'cash',
      paymentStatus: 'paid',
      orderStatus: 'completed',
      staffId: 'staff-demo',
      staffName: 'Investor (Staff Demo)',
      createdAt: relativeDate(4, 2, 20),
      completedAt: relativeDate(4, 2, 10),
      outletId: DEFAULT_OUTLET_ID
    },
    {
      id: 'ord_o5',
      tableNumber: 'Takeaway',
      items: [
        { menuItemId: 'm8', name: menuMap.m8.name, price: menuMap.m8.price, quantity: 3 }
      ],
      total: 267.00,
      paymentMode: 'online',
      paymentStatus: 'paid',
      orderStatus: 'completed',
      staffId: 'staff',
      staffName: 'Alex Johnson',
      createdAt: relativeDate(4, 4, 30),
      completedAt: relativeDate(4, 4, 20),
      outletId: DEFAULT_OUTLET_ID
    },
    {
      id: 'ord_o6',
      tableNumber: 'T1',
      items: [
        { menuItemId: 'm1', name: menuMap.m1.name, price: menuMap.m1.price, quantity: 1 },
        { menuItemId: 'm3', name: menuMap.m3.name, price: menuMap.m3.price, quantity: 1 }
      ],
      total: 170.00,
      paymentMode: 'tokens',
      paymentStatus: 'paid',
      orderStatus: 'completed',
      staffId: 'staff-demo',
      staffName: 'Investor (Staff Demo)',
      createdAt: relativeDate(5, 5, 0),
      completedAt: relativeDate(5, 4, 50),
      tokenCardNo: '105',
      studentName: 'Devendra Verma',
      tokensDeducted: 6, // 6 * 30 = 180 (10 credit applied)
      creditApplied: 10,
      outletId: DEFAULT_OUTLET_ID
    },
    {
      id: 'ord_o7',
      tableNumber: 'T2',
      items: [
        { menuItemId: 'm5', name: menuMap.m5.name, price: menuMap.m5.price, quantity: 2 }
      ],
      total: 160.00,
      paymentMode: 'cash',
      paymentStatus: 'paid',
      orderStatus: 'completed',
      staffId: 'staff',
      staffName: 'Alex Johnson',
      createdAt: relativeDate(6, 2, 10),
      completedAt: relativeDate(6, 2, 0),
      outletId: DEFAULT_OUTLET_ID
    },
    {
      id: 'ord_o8',
      tableNumber: 'T4',
      items: [
        { menuItemId: 'm2', name: menuMap.m2.name, price: menuMap.m2.price, quantity: 2 },
        { menuItemId: 'm7', name: menuMap.m7.name, price: menuMap.m7.price, quantity: 1 }
      ],
      total: 199.00,
      paymentMode: 'online',
      paymentStatus: 'paid',
      orderStatus: 'completed',
      staffId: 'staff-demo',
      staffName: 'Investor (Staff Demo)',
      createdAt: relativeDate(6, 6, 40),
      completedAt: relativeDate(6, 6, 30),
      outletId: DEFAULT_OUTLET_ID
    }
  ];

  // Token Transactions
  const tokenTransactions = [
    {
      id: 'tx_recharge1',
      type: 'recharge',
      studentId: 'tok101',
      studentName: 'Rahul Sharma',
      cardNo: '101',
      tokens: 80,
      amount: 2400,
      soldBy: 'staff-demo',
      createdAt: relativeDate(0, 5, 0),
      outletId: DEFAULT_OUTLET_ID
    },
    {
      id: 'tx_recharge2',
      type: 'recharge',
      studentId: 'tok104',
      studentName: 'Ananya Rao',
      cardNo: '104',
      tokens: 150,
      amount: 4500,
      soldBy: 'staff',
      createdAt: relativeDate(0, 6, 0),
      outletId: DEFAULT_OUTLET_ID
    },
    {
      id: 'tx_deduct1',
      type: 'deduction',
      studentId: 'tok101',
      studentName: 'Rahul Sharma',
      cardNo: '101',
      tokens: 9,
      amount: 268,
      soldBy: 'staff-demo',
      orderId: 'ord_t2',
      createdAt: relativeDate(0, 2, 30),
      outletId: DEFAULT_OUTLET_ID
    },
    {
      id: 'tx_deduct2',
      type: 'deduction',
      studentId: 'tok102',
      studentName: 'Priya Patel',
      cardNo: '102',
      tokens: 6,
      amount: 180,
      soldBy: 'staff-demo',
      orderId: 'ord_y2',
      createdAt: relativeDate(1, 4, 15),
      outletId: DEFAULT_OUTLET_ID
    },
    {
      id: 'tx_deduct3',
      type: 'deduction',
      studentId: 'tok104',
      studentName: 'Ananya Rao',
      cardNo: '104',
      tokens: 8,
      amount: 220,
      soldBy: 'staff-demo',
      orderId: 'ord_o3',
      createdAt: relativeDate(3, 5, 0),
      outletId: DEFAULT_OUTLET_ID
    },
    {
      id: 'tx_deduct4',
      type: 'deduction',
      studentId: 'tok105',
      studentName: 'Devendra Verma',
      cardNo: '105',
      tokens: 6,
      amount: 170,
      soldBy: 'staff-demo',
      orderId: 'ord_o6',
      createdAt: relativeDate(5, 5, 0),
      outletId: DEFAULT_OUTLET_ID
    }
  ];

  // Audit Logs
  const auditLogs = [
    {
      id: 'log1',
      action: 'staffCreated',
      actorUid: 'owner_demo_uid',
      actorRole: 'owner',
      targetId: 'staff_demo_uid',
      timestamp: relativeDate(5),
      after: { username: 'staff-demo', name: 'Investor (Staff Demo)', role: 'staff' },
      outletId: DEFAULT_OUTLET_ID
    },
    {
      id: 'log2',
      action: 'settingsUpdated',
      actorUid: 'owner_demo_uid',
      actorRole: 'owner',
      targetId: 'settings_default',
      timestamp: relativeDate(4),
      after: { outletName: 'Hau-Hau Outlet 1', tokenValueInRupees: 30 },
      outletId: DEFAULT_OUTLET_ID
    },
    {
      id: 'log3',
      action: 'tokenRecharged',
      actorUid: 'staff_demo_uid',
      actorRole: 'staff',
      targetId: 'tok101',
      timestamp: relativeDate(0, 5, 0),
      after: { cardNo: '101', tokensRecharged: 80 },
      outletId: DEFAULT_OUTLET_ID
    },
    {
      id: 'log4',
      action: 'orderCompleted',
      actorUid: 'staff_demo_uid',
      actorRole: 'staff',
      targetId: 'ord_t1',
      timestamp: relativeDate(0, 1, 5),
      outletId: DEFAULT_OUTLET_ID
    }
  ];

  // Map and append isDemo: true to all seeded collections
  const demoStaffUsernames = ['owner-demo', 'staff-demo'];
  const markedStaff = staff.map(s => ({
    ...s,
    isDemo: demoStaffUsernames.includes(s.username)
  }));
  const markedTokens = tokens.map(t => ({ ...t, isDemo: true }));
  const markedOrders = orders.map(o => ({ ...o, isDemo: true }));
  const markedTransactions = tokenTransactions.map(tx => ({ ...tx, isDemo: true }));
  const markedAuditLogs = auditLogs.map(log => ({ ...log, isDemo: true }));

  return {
    staff: markedStaff,
    tokens: markedTokens,
    orders: markedOrders,
    tokenTransactions: markedTransactions,
    auditLogs: markedAuditLogs
  };
}
