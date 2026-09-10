import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { getPlugin } from '../registry/gameRegistry';
import { GAME_VISUALS } from '../registry/gameVisuals';
import { formatRelativeTime } from '../lib/formatRelativeTime';
import NavBar from '../components/NavBar';
import type { GameHistoryDoc } from '@games/shared';

export default function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [history, setHistory] = useState<(GameHistoryDoc & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const initial = user?.displayName?.[0]?.toUpperCase() ?? '?';

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

  return (
    <div className="page-layer min-h-screen animate-fadeUp">
      <NavBar />
      <div className="max-w-[640px] mx-auto px-6 pt-10 pb-20">
        <span
          onClick={() => navigate('/')}
          className="text-sm text-playhouse-text-secondary hover:text-playhouse-text-primary cursor-pointer transition-colors"
        >
          ← Back
        </span>

        <div className="flex items-center gap-[18px] my-[26px] mb-10">
          {user?.photoURL ? (
            <img src={user.photoURL} alt="" className="w-16 h-16 rounded-full" />
          ) : (
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center font-display font-bold text-2xl text-playhouse-text-primary"
              style={{ background: 'linear-gradient(135deg,#a855f7,#6366f1)' }}
            >
              {initial}
            </div>
          )}
          <div>
            <h1 className="font-display font-bold text-2xl text-playhouse-text-primary m-0">
              {user?.displayName}
            </h1>
            <p className="text-playhouse-text-secondary text-[13.5px] mt-1 m-0">{user?.email}</p>
          </div>
        </div>

        <h2 className="font-display text-sm font-semibold text-playhouse-text-secondary uppercase tracking-[0.07em] mb-4">
          Game history
        </h2>

        {loading ? (
          <div className="text-playhouse-text-tertiary">Loading...</div>
        ) : history.length === 0 ? (
          <div className="text-playhouse-text-tertiary">No games played yet.</div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {history.map((item) => {
              const visual = GAME_VISUALS[item.gameId];
              const gameName = getPlugin(item.gameId).meta.displayName;
              const when = item.playedAt?.toDate
                ? formatRelativeTime(item.playedAt.toDate())
                : '';
              return (
                <div
                  key={item.id}
                  className="bg-playhouse-surface border border-white/[0.06] rounded-[14px] p-4 flex items-center gap-3.5"
                >
                  <div
                    className="w-[38px] h-[38px] rounded-[11px] flex items-center justify-center font-display font-bold text-sm shrink-0"
                    style={{ background: visual.gradient }}
                  >
                    {visual.glyph}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-playhouse-text-primary m-0 truncate">
                      {item.themeName}
                    </p>
                    <p className="text-xs text-playhouse-text-tertiary m-0">{gameName}</p>
                  </div>
                  <p className="text-xs text-playhouse-text-tertiary shrink-0 m-0">{when}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
