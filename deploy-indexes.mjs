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

async function getAccessToken() {
  const { GoogleAuth } = await import('google-auth-library');
  const auth = new GoogleAuth({
    credentials: {
      client_email: env.FIREBASE_CLIENT_EMAIL,
      private_key: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  });
  const client = await auth.getClient();
  const tokenRes = await client.getAccessToken();
  return tokenRes.token;
}

async function createIndex() {
  const projectId = env.FIREBASE_PROJECT_ID;
  const accessToken = await getAccessToken();

  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/collectionGroups/token_transactions/indexes`;

  console.log('Creating composite index for token_transactions (soldBy, type, createdAt)...');

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      queryScope: 'COLLECTION',
      fields: [
        { fieldPath: 'soldBy', order: 'ASCENDING' },
        { fieldPath: 'type', order: 'ASCENDING' },
        { fieldPath: 'createdAt', order: 'ASCENDING' },
        { fieldPath: '__name__', order: 'ASCENDING' }
      ]
    })
  });

  if (res.ok) {
    const data = await res.json();
    console.log('✅ Index creation started:', data.name);
    console.log('Note: Indexes take a few minutes to build. The 500 error on /api/tokens/create will resolve once the index is ready.');
  } else {
    const errText = await res.text();
    if (errText.includes('already exists')) {
      console.log('✅ Index already exists or is being built.');
    } else {
      console.error('Failed to create index:', errText);
    }
  }
}

createIndex().catch(console.error);
