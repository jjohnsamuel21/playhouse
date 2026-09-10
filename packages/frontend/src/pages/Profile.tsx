import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import type { GameHistoryDoc } from '@games/shared';

export default function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [history, setHistory] = useState<(GameHistoryDoc & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'gameHistory'),
      where('uid', '==', user.uid),
      orderBy('playedAt', 'desc'),
      limit(20)
    );
    getDocs(q).then((snap) => {
      setHistory(snap.docs.map((d) => ({ id: d.id, ...(d.data() as GameHistoryDoc) })));
      setLoading(false);
    });
  }, [user]);

  const EMOJI: Record<string, string> = {
    'ranking': '🏆',
    'this-or-that': '⚖️',
    'truth-or-dare': '🎲',
  };

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-2xl mx-auto">
        <button onClick={() => navigate('/')} className="text-gray-400 hover:text-white mb-6 flex items-center gap-2">
          ← Back
        </button>
        <div className="flex items-center gap-4 mb-8">
          {user?.photoURL && (
            <img src={user.photoURL} alt="" className="w-16 h-16 rounded-full" />
          )}
          <div>
            <h1 className="text-2xl font-bold">{user?.displayName}</h1>
            <p className="text-gray-400 text-sm">{user?.email}</p>
          </div>
        </div>

        <h2 className="text-lg font-semibold mb-4">Game History</h2>
        {loading ? (
          <div className="text-gray-500">Loading...</div>
        ) : history.length === 0 ? (
          <div className="text-gray-500">No games played yet.</div>
        ) : (
          <div className="space-y-3">
            {history.map((item) => (
              <div key={item.id} className="bg-gray-900 rounded-xl p-4 flex items-center gap-4">
                <span className="text-3xl">{EMOJI[item.gameId] ?? '🎮'}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{item.themeName}</p>
                  <p className="text-sm text-gray-400 capitalize">{item.gameId.replace(/-/g, ' ')}</p>
                </div>
                <p className="text-xs text-gray-500 shrink-0">
                  {item.playedAt?.toDate?.()?.toLocaleDateString() ?? ''}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
