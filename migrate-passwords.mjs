import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

function readEnvLocal() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) {
    console.error('Error: .env.local file not found! Unable to run migration script.');
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

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

async function migrate() {
  try {
    const env = readEnvLocal();
    const firebaseConfig = {
      apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: env.NEXT_PUBLIC_FIREBASE_APP_ID
    };

    console.log('Initializing Firebase App for database migration...');
    const app = initializeApp(firebaseConfig);
    const firestore = getFirestore(app);

    console.log('Fetching staff collection...');
    const staffCol = collection(firestore, 'staff');
    const snapshot = await getDocs(staffCol);

    console.log(`Found ${snapshot.size} staff/user documents. Reviewing password hash states...`);
    let migratedCount = 0;
    
    for (const d of snapshot.docs) {
      const data = d.data();
      const id = d.id;
      const username = data.username || 'unknown';
      const rawPassword = data.password;

      if (!rawPassword) {
        console.log(`- Document "${username}" (${id}) has no password field. Skipping.`);
        continue;
      }

      // Check if the password is already a 64-character SHA-256 hash
      const isAlreadyHashed = /^[a-f0-9]{64}$/i.test(rawPassword);
      if (isAlreadyHashed) {
        console.log(`- Document "${username}" (${id}) is already hashed (SHA-256). Skipping.`);
      } else {
        console.log(`[MIGRATING] Document "${username}" (${id}) has plaintext password: "${rawPassword}"`);
        const hashed = hashPassword(rawPassword);
        
        // Update document in Firestore
        await updateDoc(doc(firestore, 'staff', id), {
          password: hashed
        });
        
        console.log(`  └─ Successfully migrated and saved hash: ${hashed}`);
        migratedCount++;
      }
    }

    console.log('\n======================================================');
    console.log(`Migration complete! Successfully hashed and migrated ${migratedCount} plaintext passwords.`);
    console.log('======================================================');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed with error:', err);
    process.exit(1);
  }
}

migrate();
