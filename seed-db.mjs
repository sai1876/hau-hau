import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

function readEnvLocal() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) {
    console.error('.env.local file not found!');
    process.exit(1);
  }
  const content = fs.readFileSync(envPath, 'utf8');
  const config = {};
  content.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const parts = trimmed.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const val = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
      config[key] = val;
    }
  });
  return config;
}

const env = readEnvLocal();

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

    // 1. Create Owner User
    const ownerUid = await getOrCreateUser('owner@hauhau.com', 'owner123');

    // 2. Create Staff User
    const staffUid = await getOrCreateUser('staff@hauhau.com', 'staff123');

    // 3. Seed Owner Profile in Firestore
    console.log('Seeding Owner profile in Firestore...');
    await setDoc(doc(firestore, 'staff', ownerUid), {
      id: ownerUid,
      name: 'Sarah (Owner)',
      emailOrPhone: 'owner@hauhau.com',
      username: 'owner',
      role: 'owner',
      status: 'active',
      password: 'owner123'
    });

    // 4. Seed Staff Profile in Firestore
    console.log('Seeding Staff profile in Firestore...');
    await setDoc(doc(firestore, 'staff', staffUid), {
      id: staffUid,
      name: 'Alex Johnson',
      emailOrPhone: 'staff@hauhau.com',
      username: 'staff',
      role: 'staff',
      status: 'active',
      password: 'staff123'
    });

    // 5. Seed Menu Items
    const DEFAULT_MENU = [
      { 
        id: 'm1', 
        name: 'Burger', 
        category: 'Burgers', 
        price: 8.00, 
        available: true,
        description: 'Classic flame-grilled beef patty, lettuce, tomato, house sauce',
        prepTime: '6-8 mins',
        tags: ['popular']
      },
      { 
        id: 'm2', 
        name: 'Cheese Burger', 
        category: 'Burgers', 
        price: 9.50, 
        available: true,
        description: 'Juicy beef patty, melted double cheddar, pickles, mustard, glaze',
        prepTime: '6-8 mins',
        tags: ['popular']
      },
      { 
        id: 'm3', 
        name: 'Veg Burger', 
        category: 'Burgers', 
        price: 7.50, 
        available: true,
        description: 'Handcrafted spiced lentil & veggie patty, avocado spread, arugula',
        prepTime: '8-10 mins',
        tags: ['veg']
      },
      { 
        id: 'm4', 
        name: 'Fries', 
        category: 'Sides', 
        price: 3.00, 
        available: true,
        description: 'Crispy golden sea-salted skin-on potatoes',
        prepTime: '4-5 mins',
        tags: ['veg']
      },
      { 
        id: 'm5', 
        name: 'Masala Fries', 
        category: 'Sides', 
        price: 4.00, 
        available: true,
        description: 'Golden fries tossed in a spicy dry rub of aromatic Indian spices',
        prepTime: '4-5 mins',
        tags: ['spicy', 'veg']
      },
      { 
        id: 'm6', 
        name: 'Cold Coffee', 
        category: 'Drinks', 
        price: 4.50, 
        available: true,
        description: 'Chilled robust espresso blend whipped with creamy whole milk',
        prepTime: '2-3 mins',
        tags: []
      },
      { 
        id: 'm7', 
        name: 'Water Bottle', 
        category: 'Drinks', 
        price: 1.50, 
        available: true,
        description: 'Purified mineral spring water, chilled',
        prepTime: '1 min',
        tags: ['veg']
      },
      { 
        id: 'm8', 
        name: 'Combo Meal', 
        category: 'Combo', 
        price: 12.00, 
        available: true,
        description: 'Classic Burger, salted fries, and a chilled drink of choice',
        prepTime: '8-10 mins',
        tags: ['popular']
      }
    ];

    console.log('Seeding default menu items...');
    for (const item of DEFAULT_MENU) {
      await setDoc(doc(firestore, 'menu', item.id), item);
    }

    console.log('Seeding complete! Owner and Staff accounts created in Auth and Firestore.');
    console.log('Login credentials:');
    console.log('  Owner: username "owner" (owner@hauhau.com) / password "owner123"');
    console.log('  Staff: username "staff" (staff@hauhau.com) / password "staff123"');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
}

seed();
