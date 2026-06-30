import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';

function readEnv() {
  const config = { ...process.env };
  const envLocalPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envLocalPath)) {
    const content = fs.readFileSync(envLocalPath, 'utf8');
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
  }
  return config;
}

const env = readEnv();

if (!env.FIREBASE_PROJECT_ID || !env.FIREBASE_CLIENT_EMAIL || !env.FIREBASE_PRIVATE_KEY) {
  console.error("Missing Firebase Admin credentials in .env.local");
  process.exit(1);
}

const app = initializeApp({
  credential: cert({
    projectId: env.FIREBASE_PROJECT_ID,
    clientEmail: env.FIREBASE_CLIENT_EMAIL,
    privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  }),
});

const auth = getAuth(app);
const db = getFirestore(app);

async function run() {
  console.log("Starting Firebase Auth to Firestore synchronization and cleanup...");

  // 1. Get all Firebase Auth users
  const authUsersResult = await auth.listUsers();
  const authUsers = authUsersResult.users;
  console.log(`Found ${authUsers.length} users in Firebase Authentication.`);

  // 2. Get all Firestore staff documents
  const staffSnapshot = await db.collection('staff').get();
  const staffDocs = [];
  staffSnapshot.forEach(doc => {
    staffDocs.push({ id: doc.id, ...doc.data() });
  });
  console.log(`Found ${staffDocs.length} profiles in Firestore staff collection.`);

  // We will keep track of which UIDs have been successfully mapped
  const activeUids = new Set(authUsers.map(u => u.uid));

  // 3. Delete any documents with hardcoded legacy IDs (like 'owner_default', 's1', etc.)
  // since they are client-side auto-seeding residues and cause duplicates
  for (const docData of staffDocs) {
    if (!activeUids.has(docData.id)) {
      console.log(`Deleting legacy auto-seeded/invalid profile doc: ${docData.username} (ID: ${docData.id})`);
      await db.collection('staff').doc(docData.id).delete();
    }
  }

  // 4. Ensure each Firebase Auth user has a matching document in the staff collection
  for (const user of authUsers) {
    const email = user.email;
    const uid = user.uid;
    const displayName = user.displayName || email?.split('@')[0] || 'User';
    const username = email?.split('@')[0] || 'user';

    // Check if a document already exists for this UID
    const docRef = db.collection('staff').doc(uid);
    const docSnap = await docRef.get();

    if (docSnap.exists) {
      const data = docSnap.data();
      console.log(`Profile already exists and matches UID: ${data.username} (UID: ${uid})`);
      // Update role/status custom claims to ensure they are synchronized with the document
      await auth.setCustomUserClaims(uid, {
        role: data.role || 'staff',
        status: data.status || 'active'
      });
      continue;
    }

    // Check if there is an existing profile under a legacy ID with the same email
    const matchingLegacyDoc = staffDocs.find(d => !activeUids.has(d.id) && d.emailOrPhone === email);
    
    let profileData;
    if (matchingLegacyDoc) {
      console.log(`Migrating legacy profile to correct UID: ${matchingLegacyDoc.username} (New UID: ${uid})`);
      profileData = {
        id: uid,
        name: matchingLegacyDoc.name || displayName,
        emailOrPhone: email,
        username: matchingLegacyDoc.username || username,
        role: matchingLegacyDoc.role || (email.includes('owner') || email.includes('admin') || email.includes('sai') || email.includes('tharun') ? 'owner' : 'staff'),
        status: matchingLegacyDoc.status || 'active',
        outletId: matchingLegacyDoc.outletId || 'main_outlet',
        monthlyTokenLimit: matchingLegacyDoc.monthlyTokenLimit || 1000
      };
    } else {
      console.log(`Creating missing profile document for Auth user: ${email} (UID: ${uid})`);
      const role = email.includes('owner') || email.includes('admin') || email.includes('sai') || email.includes('tharun') ? 'owner' : 'staff';
      profileData = {
        id: uid,
        name: displayName,
        emailOrPhone: email,
        username: username,
        role: role,
        status: 'active',
        outletId: 'main_outlet',
        monthlyTokenLimit: 1000
      };
    }

    // Save profile doc
    await docRef.set(profileData);

    // Set custom user claims on Firebase Auth
    await auth.setCustomUserClaims(uid, {
      role: profileData.role,
      status: profileData.status
    });
    console.log(`Synchronized claims and profile for: ${profileData.username} (Role: ${profileData.role})`);
  }

  console.log("Database synchronization and duplicate cleanup completed successfully!");
}

run().catch(console.error);
