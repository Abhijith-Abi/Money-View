import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        // Alternative: Paste JSON content into an env var
        const serviceAccountJson = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccountJson),
        });
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        // Standard Google Cloud way - Read file explicitly to avoid webpack "Critical dependency" warning
        try {
            // We use standard require('fs') here. In Next.js edge runtime this might require adjustments,
            // but for standard Node.js runtime (admin panel) this is correct.
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const fs = require('fs');
            const path = require('path');
            
            // Resolve path relative to process.cwd() if it's relative
            let keyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
            if (!path.isAbsolute(keyPath)) {
                keyPath = path.resolve(process.cwd(), keyPath);
            }

            if (fs.existsSync(keyPath)) {
                const serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
                admin.initializeApp({
                    credential: admin.credential.cert(serviceAccount),
                });
            } else {
                console.error(`Firebase Admin: Credential file not found at ${keyPath}`);
            }
        } catch (fileErr) {
             console.error('Firebase Admin: Error reading credential file', fileErr);
        }
    } else {
       console.warn('⚠️ Firebase Admin not initialized: No credentials found. Set GOOGLE_APPLICATION_CREDENTIALS or FIREBASE_SERVICE_ACCOUNT_KEY.');
    }
  } catch (error) {
    console.error('Firebase Admin initialization error', error);
  }
}

export const adminAuth = admin.apps.length ? admin.auth() : null;
export const adminDb = admin.apps.length ? admin.firestore() : null;
