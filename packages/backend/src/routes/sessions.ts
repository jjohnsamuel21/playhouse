import { Router } from 'express';
import { verifyToken, type AuthRequest } from '../middleware/verifyToken';
import { db } from '../firebase-admin';

const router = Router();

router.get('/', verifyToken, async (req, res) => {
  const { user } = req as AuthRequest;
  const snap = await db
    .collection('gameHistory')
    .where('uid', '==', user.uid)
    .orderBy('playedAt', 'desc')
    .limit(50)
    .get();
  res.json(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
});

export default router;
