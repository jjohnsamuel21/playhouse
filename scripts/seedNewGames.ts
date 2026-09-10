/**
 * Seeds content for the 3 new games (scripts/data/newGameThemes.ts) into the
 * `themes` Firestore collection — 5 themes each for trivia, most-likely-to,
 * and story-builder, all public and playable by anyone.
 *
 * Usage:
 *   FIREBASE_SERVICE_ACCOUNT_JSON='...' npx ts-node --project packages/backend/tsconfig.json -r tsconfig-paths/register scripts/seedNewGames.ts
 */

import 'dotenv/config';
import * as admin from 'firebase-admin';
import { triviaThemes, mostLikelyToThemes, storyBuilderThemes } from './data/newGameThemes';

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

async function seedTrivia(): Promise<void> {
  console.log('\n── Trivia Night ─────────────────────────────────────────');
  for (const t of triviaThemes) {
    await writeTheme({
      gameId: 'trivia',
      name: t.name,
      description: t.description,
      tags: t.tags,
      visibility: 'public',
      ownerId: null,
      isLLMGenerated: false,
      content: { questions: t.questions },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }
}

async function seedMostLikelyTo(): Promise<void> {
  console.log('\n── Most Likely To ───────────────────────────────────────');
  for (const t of mostLikelyToThemes) {
    await writeTheme({
      gameId: 'most-likely-to',
      name: t.name,
      description: t.description,
      tags: t.tags,
      visibility: 'public',
      ownerId: null,
      isLLMGenerated: false,
      content: { prompts: t.prompts },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }
}

async function seedStoryBuilder(): Promise<void> {
  console.log('\n── Story Builder ────────────────────────────────────────');
  for (const t of storyBuilderThemes) {
    await writeTheme({
      gameId: 'story-builder',
      name: t.name,
      description: t.description,
      tags: t.tags,
      visibility: 'public',
      ownerId: null,
      isLLMGenerated: false,
      content: { starter: t.starter },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }
}

async function main(): Promise<void> {
  console.log('Seeding content for the 3 new games…');

  await seedTrivia();
  await seedMostLikelyTo();
  await seedStoryBuilder();

  console.log('\n✅ Seed complete — 15 public themes written to `themes` collection');
  process.exit(0);
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
