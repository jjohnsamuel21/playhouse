/**
 * One-time migration: reads existing JSON/JS game data and writes to Firestore.
 *
 * Usage:
 *   FIREBASE_SERVICE_ACCOUNT_JSON='...' OWNER_UID='your-uid' npx ts-node scripts/migrate.ts
 *
 * Set OWNER_UID to your Firebase user uid so private themes get assigned to you.
 */

import 'dotenv/config';
import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

// ── Firebase init ─────────────────────────────────────────────────────────────

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON ?? '{}');
if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
const db = admin.firestore();

const OWNER_UID = process.env.OWNER_UID ?? null;

// ── Helpers ───────────────────────────────────────────────────────────────────

async function writeTheme(data: admin.firestore.DocumentData): Promise<void> {
  const ref = db.collection('themes').doc();
  await ref.set(data);
  console.log(`  ✓ ${data.gameId} | ${data.name} [${data.visibility}]`);
}

function resolveFromRoot(...segments: string[]): string {
  return path.resolve(__dirname, '..', '..', ...segments);
}

// ── Truth or Dare ─────────────────────────────────────────────────────────────

async function migrateTruthOrDare(): Promise<void> {
  console.log('\n── Truth or Dare ────────────────────────────────────────');
  const themesDir = resolveFromRoot('truth-or-dare', 'truth-or-dare-backend', 'assets', 'game-theme');
  const files = fs.readdirSync(themesDir).filter((f) => f.endsWith('.json'));

  for (const file of files) {
    const name = path.basename(file, '.json');
    const raw = JSON.parse(fs.readFileSync(path.join(themesDir, file), 'utf-8'));
    await writeTheme({
      gameId: 'truth-or-dare',
      name: name.charAt(0).toUpperCase() + name.slice(1),
      description: `${name} truth or dare questions`,
      tags: [name],
      visibility: 'public',
      ownerId: null,
      isLLMGenerated: false,
      content: { truth: raw.truth ?? [], dare: raw.dare ?? [] },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }
}

// ── This or That ──────────────────────────────────────────────────────────────

async function migrateThisOrThat(): Promise<void> {
  console.log('\n── This or That ─────────────────────────────────────────');
  const beDir = resolveFromRoot('this-or-that', 'this-or-that-be');
  const catFiles = ['category.json', 'category2.json'];

  for (const catFile of catFiles) {
    const filePath = path.join(beDir, catFile);
    if (!fs.existsSync(filePath)) continue;
    const raw: Record<string, [string, string][]> = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    for (const [category, pairs] of Object.entries(raw)) {
      const validPairs = pairs
        .filter((p) => Array.isArray(p) && p.length === 2)
        .map(([a, b]: [string, string]) => ({ a, b }));
      await writeTheme({
        gameId: 'this-or-that',
        name: category,
        description: `${category} choices`,
        tags: [catFile.replace('.json', ''), category.toLowerCase()],
        visibility: 'public',
        ownerId: null,
        isLLMGenerated: false,
        content: { pairs: validPairs },
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
  }
}

// ── Ranking ───────────────────────────────────────────────────────────────────

async function migrateRanking(): Promise<void> {
  console.log('\n── Ranking ──────────────────────────────────────────────');
  const dataDir = resolveFromRoot('ranking-game', 'ranking-game-be', 'data');

  // themesV2.js — categories with sub-themes as string arrays (items to rank)
  const themesV2Module = require(path.join(dataDir, 'themesV2.js')) as {
    themes: Record<string, string[]>;
  };
  for (const [category, items] of Object.entries(themesV2Module.themes)) {
    // Batch items into themes of 10-15 each if the list is long,
    // otherwise treat the whole category as one theme.
    if (items.length <= 20) {
      await writeTheme({
        gameId: 'ranking',
        name: category,
        description: `Rank the best ${category.toLowerCase()} options`,
        tags: [category.toLowerCase()],
        visibility: 'public',
        ownerId: null,
        isLLMGenerated: false,
        content: { items },
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } else {
      // Split into chunks of 15
      for (let i = 0; i < items.length; i += 15) {
        const chunk = items.slice(i, i + 15);
        await writeTheme({
          gameId: 'ranking',
          name: `${category} (Part ${Math.floor(i / 15) + 1})`,
          description: `Rank the best ${category.toLowerCase()} options`,
          tags: [category.toLowerCase()],
          visibility: 'public',
          ownerId: null,
          isLLMGenerated: false,
          content: { items: chunk },
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
    }
  }

  // fatherhood.json — private theme for the owner
  const fatherhoodPath = path.join(dataDir, 'fatherhood.json');
  if (fs.existsSync(fatherhoodPath)) {
    const raw = JSON.parse(fs.readFileSync(fatherhoodPath, 'utf-8'));
    await writeTheme({
      gameId: 'ranking',
      name: raw.theme ?? 'Fatherhood',
      description: 'A personal ranking theme',
      tags: ['personal', 'fatherhood'],
      visibility: 'private',
      ownerId: OWNER_UID,
      isLLMGenerated: false,
      content: { items: raw.items ?? [] },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log('Starting migration…');
  if (!OWNER_UID) {
    console.warn('⚠  OWNER_UID not set — private themes will have ownerId: null');
  }

  await migrateTruthOrDare();
  await migrateThisOrThat();
  await migrateRanking();

  console.log('\n✅ Migration complete');
  process.exit(0);
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
