import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, collection, getDocs, deleteDoc } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

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

async function getOrCreateUser(email, password) {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    console.log(`Successfully created new user: ${email} (UID: ${cred.user.uid})`);
    return cred.user.uid;
  } catch (err) {
    const firebaseError = err;
    if (firebaseError.code === 'auth/email-already-in-use') {
      console.log(`User ${email} already exists. Authenticating to fetch UID...`);
      const cred = await signInWithEmailAndPassword(auth, email, password);
      console.log(`Successfully authenticated user: ${email} (UID: ${cred.user.uid})`);
      return cred.user.uid;
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
    const ownerPassword = env.PRODUCTION_OWNER_PASSWORD || 'owner123';
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

    // 1. Create Owner User
    const ownerUid = await getOrCreateUser(ownerEmail, ownerPassword);

    // 2. Create Staff User
    const staffUid = await getOrCreateUser(staffEmail, staffPassword);

    // 3. Seed Owner Profile in Firestore
    console.log('Seeding Owner profile in Firestore...');
    const ownerDoc = {
      id: ownerUid,
      name: 'Sarah (Owner)',
      emailOrPhone: ownerEmail,
      username: 'owner',
      role: 'owner',
      status: 'active',
    };
    if (!isProduction) {
      ownerDoc.password = hashPassword(ownerPassword);
    }
    await setDoc(doc(firestore, 'staff', ownerUid), ownerDoc);

    // 4. Seed Staff Profile in Firestore
    console.log('Seeding Staff profile in Firestore...');
    const staffDoc = {
      id: staffUid,
      name: 'Alex Johnson',
      emailOrPhone: staffEmail,
      username: 'staff',
      role: 'staff',
      status: 'active',
      monthlyTokenLimit: 1000
    };
    if (!isProduction) {
      staffDoc.password = hashPassword(staffPassword);
    }
    await setDoc(doc(firestore, 'staff', staffUid), staffDoc);

    // 5. Seed Menu Items
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

    console.log('Clearing existing menu items...');
    const menuCol = collection(firestore, 'menu');
    const menuSnapshot = await getDocs(menuCol);
    for (const d of menuSnapshot.docs) {
      await deleteDoc(doc(firestore, 'menu', d.id));
      console.log(`Deleted menu item: ${d.id}`);
    }

    console.log('Seeding default menu items...');
    for (const item of DEFAULT_MENU) {
      await setDoc(doc(firestore, 'menu', item.id), item);
      console.log(`Added menu item: ${item.name} (${item.id})`);
    }

    console.log('Seeding complete! Owner and Staff accounts created in Auth and Firestore.');
    console.log('Login credentials configured:');
    console.log(`  Owner: ${ownerEmail} / ${isProduction ? '(configured password)' : ownerPassword}`);
    console.log(`  Staff: ${staffEmail} / ${isProduction ? '(configured password)' : staffPassword}`);
    if (isProduction) {
      console.log('Production mode detected: plain text passwords successfully excluded from Firestore documents.');
    } else {
      console.warn('⚠ SECURITY REMINDER: Delete the password field from all Firestore staff documents before going live.');
    }
    console.warn('  See SECURITY.md for the full production hardening checklist.');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
}

seed();
