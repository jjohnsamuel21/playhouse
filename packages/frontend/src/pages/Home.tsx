import React, { useEffect, useState } from 'react';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { getAllPlugins } from '../registry/gameRegistry';
import { GAME_VISUALS } from '../registry/gameVisuals';
import { formatRelativeTime } from '../lib/formatRelativeTime';
import GameCard from '../components/GameCard';
import NavBar from '../components/NavBar';
import type { GameHistoryDoc } from '@games/shared';

const CATALOG_PLACEHOLDER = true;

export default function Home() {
  const { user } = useAuth();
  const games = getAllPlugins();
  const firstName = user?.displayName?.split(' ')[0] ?? 'there';

  const [history, setHistory] = useState<(GameHistoryDoc & { id: string })[]>([]);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'gameHistory'),
      where('uid', '==', user.uid),
      orderBy('playedAt', 'desc'),
      limit(4)
    );
    getDocs(q).then((snap) => {
      setHistory(snap.docs.map((d) => ({ id: d.id, ...(d.data() as GameHistoryDoc) })));
    });
  }, [user]);

  return (
    <div className="page-layer min-h-screen animate-fadeUp">
      <NavBar />
      <div className="max-w-[1120px] mx-auto px-6 pt-10 pb-20">
        <header className="mb-9">
          <h1 className="font-display font-bold text-[30px] tracking-[-0.3px] mb-1.5 text-playhouse-text-primary">
            Good evening, {firstName}
          </h1>
          <p className="text-playhouse-text-secondary text-[15px]">
            Pick a game, start solo, or pull the group in.
          </p>
        </header>

        <div className="flex flex-wrap gap-8 items-start">
          <div className="flex-[2_1_480px] min-w-0">
            <h2 className="font-display font-semibold text-[15px] text-playhouse-text-secondary uppercase tracking-[0.08em] mb-4">
              Games
            </h2>
            <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px,1fr))' }}>
              {games.map((plugin) => (
                <GameCard key={plugin.meta.id} plugin={plugin} />
              ))}
              {CATALOG_PLACEHOLDER && (
                <div className="border border-dashed border-white/[0.12] rounded-[18px] p-[22px] flex flex-col items-start justify-center min-h-[170px] text-playhouse-text-tertiary">
                  <span className="text-[13px]">More games are in the works.</span>
                  <span className="text-xs mt-1 text-[#4a3d44]">This is a growing catalog.</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex-[1_1_260px] min-w-[240px] flex flex-col gap-5">
            <div className="bg-playhouse-surface border border-white/[0.06] rounded-2xl p-[18px]">
              <h3 className="font-display text-[13px] font-semibold text-playhouse-text-secondary uppercase tracking-[0.07em] mb-3.5">
                Recently played
              </h3>
              <div className="flex flex-col gap-[18px]">
                {history.length === 0 ? (
                  <p className="text-[13.5px] text-playhouse-text-tertiary">
                    No games played yet.
                  </p>
                ) : (
                  history.map((h) => {
                    const visual = GAME_VISUALS[h.gameId];
                    const when = h.playedAt?.toDate ? formatRelativeTime(h.playedAt.toDate()) : '';
                    return (
                      <div key={h.id} className="flex items-start gap-3">
                        <div
                          className="w-[30px] h-[30px] rounded-[9px] flex items-center justify-center font-display font-bold text-[13px] shrink-0"
                          style={{ background: visual.gradient }}
                        >
                          {visual.glyph}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[13.5px] leading-[1.4] text-playhouse-text-primary m-0">
                            {h.themeName}
                          </p>
                          <p className="text-xs leading-[1.4] text-playhouse-text-tertiary mt-0.5 m-0">
                            {when}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
