import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, collection, getDocs, deleteDoc } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { generateMockData } from './src/services/mockGenerator.mjs';

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function readEnv() {
  const config = { ...process.env };
  
  const envProductionPath = path.resolve(process.cwd(), '.env.production');
  const envLocalPath = path.resolve(process.cwd(), '.env.local');
  
  let envPath = null;
  if (fs.existsSync(envProductionPath)) {
    envPath = envProductionPath;
  } else if (fs.existsSync(envLocalPath)) {
    envPath = envLocalPath;
  }
  
  if (envPath) {
    console.log(`Loading env variables from: ${path.basename(envPath)}`);
    const content = fs.readFileSync(envPath, 'utf8');
    content.split(/\r?\n/).forEach(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const parts = trimmed.split('=');
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const val = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
        if (config[key] === undefined) {
          config[key] = val;
        }
      }
    });
  } else {
    console.warn('No .env.local or .env.production found. Using existing process.env variables.');
  }
  return config;
}

const env = readEnv();

const firebaseConfig = {
  apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const firestore = getFirestore(app);

async function getUidFromFirestore(email) {
  try {
    const staffCol = collection(firestore, 'staff');
    const snapshot = await getDocs(staffCol);
    for (const doc of snapshot.docs) {
      if (doc.data().emailOrPhone === email) {
        return doc.id;
      }
    }
  } catch (err) {
    console.log(`Could not query Firestore for ${email}:`, err);
  }
  return null;
}

async function getOrCreateUser(email, password) {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    console.log(`Successfully created new user: ${email} (UID: ${cred.user.uid})`);
    return cred.user.uid;
  } catch (err) {
    const firebaseError = err;
    if (firebaseError.code === 'auth/email-already-in-use') {
      console.log(`User ${email} already exists. Trying to find UID in Firestore...`);
      const existingUid = await getUidFromFirestore(email);
      if (existingUid) {
        console.log(`Found UID in Firestore for ${email}: ${existingUid}`);
        return existingUid;
      }
      
      console.log(`UID not found in Firestore. Authenticating to fetch UID...`);
      try {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        console.log(`Successfully authenticated user: ${email} (UID: ${cred.user.uid})`);
        return cred.user.uid;
      } catch (authErr) {
        console.warn(`Authentication failed for existing user ${email}:`, authErr.code || authErr.message);
        // Generates a predictable fallback UID to prevent script crash if we can't get it
        const fallbackUid = crypto.createHash('md5').update(email).digest('hex');
        console.log(`Using deterministic fallback UID for ${email}: ${fallbackUid}`);
        return fallbackUid;
      }
    } else {
      throw err;
    }
  }
}

async function seed() {
  try {
    console.log('Starting Firebase DB & Auth seeding...');

    // Read production values with safe defaults
    const ownerEmail = env.PRODUCTION_OWNER_EMAIL || 'cherukuridakshithsai@gmail.com';
    const ownerPassword = env.PRODUCTION_OWNER_PASSWORD || 'Sai@011325';
    const staffEmail = env.PRODUCTION_STAFF_EMAIL || 'staff@hauhau.com';
    const staffPassword = env.PRODUCTION_STAFF_PASSWORD || 'staff123';
    
    // Automatically treat as production if it uses a custom email or if NODE_ENV/PRODUCTION is set
    const isProduction = env.NODE_ENV === 'production' || 
                         process.argv.includes('--production') || 
                         env.PRODUCTION === 'true' || 
                         ownerEmail !== 'owner@hauhau.com';

    if (isProduction) {
      console.log('--- RUNNING IN PRODUCTION MODE ---');
      console.log('Plaintext passwords will NOT be saved in Firestore.');
    }

    // 1. Create or get Auth UIDs (Sign in/up as staff first to allow querying existing staff documents)
    try {
      console.log('Authenticating as staff to read existing database states...');
      await signInWithEmailAndPassword(auth, staffEmail, staffPassword);
    } catch (e) {
      console.log('Pre-authentication as staff skipped or failed.');
    }

    const ownerUid = await getOrCreateUser(ownerEmail, ownerPassword);
    const staffUid = await getOrCreateUser(staffEmail, staffPassword);
    const ownerDemoUid = await getOrCreateUser('owner-demo@hauhau.com', 'demo123');
    const staffDemoUid = await getOrCreateUser('staff-demo@hauhau.com', 'demo123');

    // 2. Generate dynamic mock data
    const mock = generateMockData(new Date());

    // Map the mock ids to the actual Firebase Auth UIDs
    const uidMap = {
      'owner_default': ownerUid,
      's1': staffUid,
      'owner_demo_uid': ownerDemoUid,
      'staff_demo_uid': staffDemoUid
    };

    // 3. Authenticate as owner to perform writes
    console.log('Authenticating as owner to perform database updates...');
    let ownerAuthenticated = false;
    try {
      await signInWithEmailAndPassword(auth, ownerEmail, ownerPassword);
      console.log(`Successfully authenticated as owner: ${ownerEmail}`);
      ownerAuthenticated = true;
    } catch (authErr) {
      console.warn(`Could not authenticate as owner (${ownerEmail}). Trying fallback owner-demo account...`);
      try {
        await signInWithEmailAndPassword(auth, 'owner-demo@hauhau.com', 'demo123');
        console.log('Successfully authenticated as fallback owner-demo@hauhau.com.');
        ownerAuthenticated = true;
      } catch (fallbackAuthErr) {
        console.error('⚠ ERROR: Could not authenticate as any Owner account.');
        console.error('  Please ensure you have deployed firestore.rules containing owner-demo@hauhau.com,');
        console.error('  or set PRODUCTION_OWNER_PASSWORD in .env.local to the correct owner password.');
      }
    }

    // 4. Clear existing Firestore collections to ensure a fresh, consistent seed state
    const collectionsToClear = ['staff', 'menu', 'orders', 'tokens', 'token_transactions', 'audit_logs', 'settings'];
    for (const colName of collectionsToClear) {
      console.log(`Clearing collection: ${colName}...`);
      try {
        const colRef = collection(firestore, colName);
        const snapshot = await getDocs(colRef);
        for (const d of snapshot.docs) {
          try {
            await deleteDoc(doc(firestore, colName, d.id));
          } catch (delErr) {
            console.log(`  └─ Skipping deletion of document ${d.id} (might be immutable or permission restricted)`);
          }
        }
      } catch (colErr) {
        console.warn(`  └─ Could not access or clear collection ${colName}:`, colErr.message || colErr);
      }
    }

    // 5. Seed Settings
    console.log('Seeding settings...');
    const settingsDoc = {
      id: 'settings_default',
      outletId: 'main_outlet',
      outletName: 'Hau-Hau Outlet 1',
      tokenValueInRupees: 30,
      manualUpiEnabled: true,
      taxEnabled: false,
      currency: 'INR',
      receiptFooter: 'Thank you for dining with Hau-Hau!',
      monthlyTokenLimitDefaults: 1000,
      orderStatusFlow: ['pending', 'completed', 'cancelled']
    };
    try {
      await setDoc(doc(firestore, 'settings', 'settings_default'), settingsDoc);
      console.log('  Settings seeded.');
    } catch (err) {
      console.warn('  Could not seed settings:', err.message || err);
    }

    // 6. Seed Staff Accounts
    console.log('Seeding staff profiles...');
    for (const member of mock.staff) {
      const realUid = uidMap[member.id] || member.id;
      const profile = {
        id: realUid,
        name: member.name,
        emailOrPhone: member.emailOrPhone,
        username: member.username,
        role: member.role,
        status: member.status,
        outletId: member.outletId
      };
      if (member.monthlyTokenLimit !== undefined) {
        profile.monthlyTokenLimit = member.monthlyTokenLimit;
      }
      if (!isProduction && member.password) {
        profile.password = member.password; // already SHA-256 hashed
      }
      try {
        await setDoc(doc(firestore, 'staff', realUid), profile);
        console.log(`  Added staff profile: ${profile.username} (UID: ${realUid})`);
      } catch (err) {
        console.warn(`  Could not add staff profile ${profile.username}:`, err.message || err);
      }
    }

    // 7. Seed Menu Items
    console.log('Seeding default menu items...');
    const DEFAULT_MENU = [
      { 
        id: 'm1', 
        name: 'Veg Kurkure Momos', 
        category: 'Momos', 
        price: 80.00, 
        available: true,
        description: 'Crispy crunchy momos stuffed with spiced vegetables, coated in Kurkure crumbs',
        prepTime: '8-10 mins',
        tags: ['veg', 'popular']
      },
      { 
        id: 'm2', 
        name: 'French Fries', 
        category: 'Sides', 
        price: 60.00, 
        available: true,
        description: 'Crispy golden salted potato fries served with dip',
        prepTime: '4-5 mins',
        tags: ['veg']
      },
      { 
        id: 'm3', 
        name: 'Chicken Popcorn', 
        category: 'Snacks', 
        price: 90.00, 
        available: true,
        description: 'Bite-sized tender chicken pieces, marinated and deep fried to golden perfection',
        prepTime: '6-8 mins',
        tags: ['popular']
      },
      { 
        id: 'm4', 
        name: 'Chicken Leg Piece', 
        category: 'Snacks', 
        price: 100.00, 
        available: true,
        description: 'Juicy chicken drumsticks seasoned with Indian spices and deep fried',
        prepTime: '10-12 mins',
        tags: ['popular']
      },
      { 
        id: 'm5', 
        name: 'Veg Fingers', 
        category: 'Snacks', 
        price: 80.00, 
        available: true,
        description: 'Crispy crumb-coated vegetable fingers made with carrots, peas, and potatoes',
        prepTime: '5-6 mins',
        tags: ['veg']
      },
      { 
        id: 'm6', 
        name: 'Veg Nuggets', 
        category: 'Snacks', 
        price: 70.00, 
        available: true,
        description: 'Bite-sized crispy vegetable nuggets seasoned with herbs and spices',
        prepTime: '5-6 mins',
        tags: ['veg']
      },
      { 
        id: 'm7', 
        name: 'Plane Chocolate Milk Shake', 
        category: 'Drinks', 
        price: 79.00, 
        available: true,
        description: 'Classic thick and creamy milkshake blended with rich chocolate syrup',
        prepTime: '3-4 mins',
        tags: []
      },
      { 
        id: 'm8', 
        name: 'Oreo and Kitkat', 
        category: 'Drinks', 
        price: 89.00, 
        available: true,
        description: 'Indulgent thick shake loaded with crushed Oreo cookies and KitKat bars',
        prepTime: '4-5 mins',
        tags: ['popular']
      }
    ];
    for (const item of DEFAULT_MENU) {
      try {
        await setDoc(doc(firestore, 'menu', item.id), item);
        console.log(`  Added menu item: ${item.name}`);
      } catch (err) {
        console.warn(`  Could not add menu item ${item.name}:`, err.message || err);
      }
    }

    // 8. Seed Token Accounts (Students)
    console.log('Seeding token accounts...');
    for (const tok of mock.tokens) {
      try {
        await setDoc(doc(firestore, 'tokens', tok.id), tok);
        console.log(`  Added token account: card ${tok.cardNo} for ${tok.name}`);
      } catch (err) {
        console.warn(`  Could not add token account for card ${tok.cardNo}:`, err.message || err);
      }
    }

    // 9. Seed Orders
    console.log('Seeding orders...');
    let seededOrdersCount = 0;
    for (const order of mock.orders) {
      try {
        await setDoc(doc(firestore, 'orders', order.id), order);
        seededOrdersCount++;
      } catch (err) {
        console.warn(`  Could not add order ${order.id}:`, err.message || err);
      }
    }
    console.log(`  Added ${seededOrdersCount}/${mock.orders.length} orders.`);

    // 10. Seed Token Transactions
    console.log('Seeding token transactions...');
    let seededTxsCount = 0;
    for (const tx of mock.tokenTransactions) {
      try {
        await setDoc(doc(firestore, 'token_transactions', tx.id), tx);
        seededTxsCount++;
      } catch (err) {
        console.warn(`  Could not add transaction ${tx.id}:`, err.message || err);
      }
    }
    console.log(`  Added ${seededTxsCount}/${mock.tokenTransactions.length} transactions.`);

    // 11. Seed Audit Logs
    console.log('Seeding audit logs...');
    let seededLogsCount = 0;
    for (const log of mock.auditLogs) {
      const realActorUid = uidMap[log.actorUid] || log.actorUid;
      const updatedLog = {
        ...log,
        actorUid: realActorUid
      };
      try {
        await setDoc(doc(firestore, 'audit_logs', log.id), updatedLog);
        seededLogsCount++;
      } catch (err) {
        console.warn(`  Could not add audit log ${log.id}:`, err.message || err);
      }
    }
    console.log(`  Added ${seededLogsCount}/${mock.auditLogs.length} audit logs.`);

    console.log('\n======================================================');
    console.log('Firebase Seeding successfully completed!');
    console.log('Investor Demo Accounts configuration:');
    console.log(`  Owner dashboard: owner-demo / demo123 (email: owner-demo@hauhau.com)`);
    console.log(`  Staff dashboard: staff-demo / demo123 (email: staff-demo@hauhau.com)`);
    if (!ownerAuthenticated) {
      console.warn('\n⚠ IMPORTANT WARNING: Firestore write access was restricted because Owner login failed.');
      console.warn('  To finalize live database seeding, please copy the rules in "firestore.rules"');
      console.warn('  to your Firebase Web Console first, then run this seeding script again.');
    }
    console.log('======================================================');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
}

seed();
