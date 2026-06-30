import { initializeApp, cert } from 'firebase-admin/app';
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

const projectId = env.FIREBASE_PROJECT_ID;
const privateKey = env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
const clientEmail = env.FIREBASE_CLIENT_EMAIL;

// Read the firestore.rules file
const rulesPath = path.resolve(process.cwd(), 'firestore.rules');
const rulesSource = fs.readFileSync(rulesPath, 'utf8');

async function getAccessToken() {
  // Use Google Auth library via the Admin SDK's credential
  const { GoogleAuth } = await import('google-auth-library');
  const auth = new GoogleAuth({
    credentials: {
      client_email: clientEmail,
      private_key: privateKey,
    },
    scopes: ['https://www.googleapis.com/auth/firebase', 'https://www.googleapis.com/auth/cloud-platform'],
  });
  const client = await auth.getClient();
  const tokenRes = await client.getAccessToken();
  return tokenRes.token;
}

async function deployRules() {
  console.log('Deploying Firestore security rules...');
  
  const accessToken = await getAccessToken();
  
  // Step 1: Create a new ruleset
  const createUrl = `https://firebaserules.googleapis.com/v1/projects/${projectId}/rulesets`;
  const createRes = await fetch(createUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      source: {
        files: [
          {
            content: rulesSource,
            name: 'firestore.rules',
            fingerprint: Buffer.from(rulesSource).toString('base64'),
          }
        ]
      }
    }),
  });

  if (!createRes.ok) {
    const errText = await createRes.text();
    console.error('Failed to create ruleset:', errText);
    process.exit(1);
  }

  const ruleset = await createRes.json();
  const rulesetName = ruleset.name;
  console.log(`Created ruleset: ${rulesetName}`);

  // Step 2: Release the ruleset to Firestore
  const releaseUrl = `https://firebaserules.googleapis.com/v1/projects/${projectId}/releases`;
  const releaseName = `projects/${projectId}/releases/cloud.firestore`;

  // Try to update existing release first
  const updateUrl = `https://firebaserules.googleapis.com/v1/${releaseName}`;
  const updateRes = await fetch(updateUrl, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      release: {
        name: releaseName,
        rulesetName: rulesetName,
      }
    }),
  });

  if (updateRes.ok) {
    console.log('✅ Firestore rules deployed successfully!');
    return;
  }

  // If update failed, try creating a new release
  const createReleaseRes = await fetch(releaseUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: releaseName,
      rulesetName: rulesetName,
    }),
  });

  if (createReleaseRes.ok) {
    console.log('✅ Firestore rules deployed successfully!');
  } else {
    const errText = await createReleaseRes.text();
    console.error('Failed to release ruleset:', errText);
    process.exit(1);
  }
}

deployRules().catch(err => {
  console.error('Deployment failed:', err);
  process.exit(1);
});
