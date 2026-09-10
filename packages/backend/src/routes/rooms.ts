import { Router } from 'express';
import { verifyToken, type AuthRequest } from '../middleware/verifyToken';
import { db } from '../firebase-admin';
import type { GameId } from '@games/shared';

const router = Router();

function generateCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

router.post('/', verifyToken, async (req, res) => {
  const { user } = req as AuthRequest;
  const { gameId, maxPlayers, themeId = '' } = req.body as { gameId: GameId; maxPlayers: number; themeId?: string };

  let roomCode = generateCode();
  // Ensure uniqueness
  while ((await db.collection('rooms').doc(roomCode).get()).exists) {
    roomCode = generateCode();
  }

  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const sessionRef = await db.collection('sessions').add({
    gameId,
    themeId,
    roomId: roomCode,
    hostId: user.uid,
    playerIds: [user.uid],
    status: 'waiting',
    state: {},
    createdAt: new Date(),
    finishedAt: null,
  });

  await db.collection('rooms').doc(roomCode).set({
    sessionId: sessionRef.id,
    hostId: user.uid,
    gameId,
    playerIds: [user.uid],
    maxPlayers,
    status: 'waiting',
    createdAt: new Date(),
    expiresAt,
  });

  res.json({ roomCode, sessionId: sessionRef.id });
});

router.get('/:code', verifyToken, async (req, res) => {
  const code = req.params.code;
  const snap = await db.collection('rooms').doc(Array.isArray(code) ? code[0] : code).get();
  if (!snap.exists) {
    res.status(404).json({ error: 'Room not found' });
    return;
  }
  res.json({ id: snap.id, ...snap.data() });
});

export default router;
