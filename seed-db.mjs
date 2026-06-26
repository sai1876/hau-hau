import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, collection, getDocs, deleteDoc } from 'firebase/firestore';
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
