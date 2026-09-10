/**
 * Seeds the fresh public theme catalog (scripts/data/newThemes.ts) into the
 * `themes` Firestore collection — 10 themes each for truth-or-dare,
 * this-or-that, and ranking, all public and playable by anyone.
 *
 * Usage:
 *   FIREBASE_SERVICE_ACCOUNT_JSON='...' npx ts-node --project packages/backend/tsconfig.json -r tsconfig-paths/register scripts/seedThemes.ts
 */

import 'dotenv/config';
import * as admin from 'firebase-admin';
import { truthOrDareThemes, thisOrThatThemes, rankingThemes } from './data/newThemes';

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON ?? '{}');
if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
const db = admin.firestore();

async function writeTheme(data: admin.firestore.DocumentData): Promise<void> {
  const ref = db.collection('themes').doc();
  await ref.set(data);
  console.log(`  ✓ ${data.gameId} | ${data.name}`);
}

async function seedTruthOrDare(): Promise<void> {
  console.log('\n── Truth or Dare ────────────────────────────────────────');
  for (const t of truthOrDareThemes) {
    await writeTheme({
      gameId: 'truth-or-dare',
      name: t.name,
      description: t.description,
      tags: t.tags,
      visibility: 'public',
      ownerId: null,
      isLLMGenerated: false,
      content: { truth: t.truth, dare: t.dare },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }
}

async function seedThisOrThat(): Promise<void> {
  console.log('\n── This or That ─────────────────────────────────────────');
  for (const t of thisOrThatThemes) {
    await writeTheme({
      gameId: 'this-or-that',
      name: t.name,
      description: t.description,
      tags: t.tags,
      visibility: 'public',
      ownerId: null,
      isLLMGenerated: false,
      content: { pairs: t.pairs.map(([a, b]) => ({ a, b })) },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }
}

async function seedRanking(): Promise<void> {
  console.log('\n── Ranking ──────────────────────────────────────────────');
  for (const t of rankingThemes) {
    await writeTheme({
      gameId: 'ranking',
      name: t.name,
      description: t.description,
      tags: t.tags,
      visibility: 'public',
      ownerId: null,
      isLLMGenerated: false,
      content: { items: t.items },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }
}

async function main(): Promise<void> {
  console.log('Seeding fresh public theme catalog…');

  await seedTruthOrDare();
  await seedThisOrThat();
  await seedRanking();

  console.log('\n✅ Seed complete — 30 public themes written to `themes` collection');
  process.exit(0);
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
