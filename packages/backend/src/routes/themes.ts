import { Router } from 'express';
import { verifyToken, type AuthRequest } from '../middleware/verifyToken';
import { db } from '../firebase-admin';
import type { GameId } from '@games/shared';

const router = Router();

router.get('/', verifyToken, async (req, res) => {
  const { user } = req as AuthRequest;
  const gameIdParam = req.query.gameId;
  const gameId = typeof gameIdParam === 'string' ? (gameIdParam as GameId) : undefined;

  let query = db.collection('themes') as FirebaseFirestore.Query;
  if (gameId) query = query.where('gameId', '==', gameId);

  const snap = await query.get();
  const themes = snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((t: any) => t.visibility === 'public' || t.ownerId === user.uid);

  res.json(themes);
});

router.post('/', verifyToken, async (req, res) => {
  const { user } = req as AuthRequest;
  const { gameId, name, description, tags, visibility, content } = req.body;

  const ref = await db.collection('themes').add({
    gameId,
    name,
    description: description ?? '',
    tags: tags ?? [],
    visibility: visibility ?? 'private',
    ownerId: user.uid,
    isLLMGenerated: false,
    content,
    createdAt: new Date(),
  });

  res.json({ id: ref.id });
});

router.patch('/:themeId', verifyToken, async (req, res) => {
  const { user } = req as AuthRequest;
  const themeId = req.params.themeId;
  const ref = db.collection('themes').doc(Array.isArray(themeId) ? themeId[0] : themeId);
  const snap = await ref.get();

  if (!snap.exists || snap.data()?.ownerId !== user.uid) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }

  const { visibility, name, description, tags } = req.body;
  await ref.update({ visibility, name, description, tags });
  res.json({ ok: true });
});

export default router;
