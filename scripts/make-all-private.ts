/**
 * Makes every theme in Firestore private and assigns ownerId to OWNER_UID.
 *
 * Usage:
 *   npx ts-node scripts/make-all-private.ts
 */

import 'dotenv/config';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON ?? '{}');
initializeApp({ credential: cert(serviceAccount) });

const db = getFirestore();
const OWNER_UID = process.env.OWNER_UID;

if (!OWNER_UID) {
  console.error('OWNER_UID env var required');
  process.exit(1);
}

async function run() {
  const snap = await db.collection('themes').get();
  if (snap.empty) { console.log('No themes found.'); return; }

  const BATCH_SIZE = 499;
  const docs = snap.docs;
  let count = 0;

  for (let i = 0; i < docs.length; i += BATCH_SIZE) {
    const chunk = docs.slice(i, i + BATCH_SIZE);
    const batch = db.batch();
    for (const doc of chunk) {
      batch.update(doc.ref, { visibility: 'private', ownerId: OWNER_UID });
      count++;
    }
    await batch.commit();
    console.log(`Committed ${count}/${docs.length}…`);
  }

  console.log(`Done. ${count} theme(s) marked private, ownerId = ${OWNER_UID}`);
}

run().catch((e) => { console.error(e); process.exit(1); });
