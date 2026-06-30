import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const apps = getApps();
let app;

if (!apps.length) {
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (projectId && clientEmail && privateKey) {
    app = initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey: privateKey.replace(/\\n/g, '\n'),
      }),
    });
  } else if (process.env.NODE_ENV === 'production') {
    console.warn("Firebase Admin SDK credentials not configured in production (missing FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY). Admin features disabled — using client-side fallback.");
    app = null;
  } else {
    console.warn("Firebase Admin SDK running in development mode without server credentials. authAdmin and dbAdmin will be disabled.");
  }
} else {
  app = apps[0];
}

let dbAdmin: any = null;
let authAdmin: any = null;

try {
  dbAdmin = app ? getFirestore(app) : null;
  authAdmin = app ? getAuth(app) : null;
} catch (e) {
  console.warn("Firebase Admin service initialization failed:", e);
}

export { dbAdmin, authAdmin };
