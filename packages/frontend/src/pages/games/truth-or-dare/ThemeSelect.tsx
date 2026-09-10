import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, or, getDocs } from 'firebase/firestore';
import { db } from '../../../firebase';
import { useAuth } from '../../../contexts/AuthContext';
import { GAME_VISUALS } from '../../../registry/gameVisuals';
import type { ThemeDoc } from '@games/shared';

const visual = GAME_VISUALS['truth-or-dare'];

export default function TodThemeSelect() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [themes, setThemes] = useState<(ThemeDoc & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const publicQ = query(collection(db, 'themes'), where('gameId', '==', 'truth-or-dare'), where('visibility', '==', 'public'));
    const ownedQ = query(collection(db, 'themes'), where('gameId', '==', 'truth-or-dare'), where('ownerId', '==', user.uid));
    Promise.all([getDocs(publicQ), getDocs(ownedQ)]).then(([pubSnap, ownSnap]) => {
      const seen = new Set<string>();
      const all: (ThemeDoc & { id: string })[] = [];
      for (const d of [...pubSnap.docs, ...ownSnap.docs]) {
        if (!seen.has(d.id)) { seen.add(d.id); all.push({ id: d.id, ...(d.data() as ThemeDoc) }); }
      }
      setThemes(all);
      setLoading(false);
    });
  }, [user]);

  return (
    <div className="page-layer min-h-screen p-6 animate-fadeUp">
      <div className="max-w-lg mx-auto">
        <span
          onClick={() => navigate('/')}
          className="text-sm text-playhouse-text-secondary hover:text-playhouse-text-primary cursor-pointer transition-colors"
        >
          ← Back
        </span>
        <div className="flex items-start justify-between mt-4 mb-6">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center font-display font-bold text-lg shrink-0"
              style={{ background: visual.gradient }}
            >
              {visual.glyph}
            </div>
            <div>
              <h1 className="font-display font-bold text-2xl text-playhouse-text-primary m-0">Truth or Dare</h1>
              <p className="text-playhouse-text-secondary text-[13.5px] mt-0.5 m-0">Pick a theme to play</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/generate?gameId=truth-or-dare')}
            className="flex items-center gap-1.5 px-3 py-2 bg-[rgba(224,71,158,0.1)] hover:bg-[rgba(224,71,158,0.18)] border border-[rgba(224,71,158,0.3)] rounded-xl text-sm text-playhouse-accent-primary transition-colors shrink-0"
          >
            ✨ Generate with AI
          </button>
        </div>

        {loading ? (
          <div className="text-playhouse-text-tertiary">Loading themes...</div>
        ) : (
          <div className="space-y-3">
            {themes.map((theme) => (
              <button
                key={theme.id}
                onClick={() => navigate(`/game/truth-or-dare/local-setup/${theme.id}`)}
                className="w-full bg-playhouse-surface border border-white/[0.06] hover:border-[rgba(224,71,158,0.35)] rounded-xl p-4 text-left transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-playhouse-text-primary">{theme.name}</p>
                    {theme.description && (
                      <p className="text-sm text-playhouse-text-secondary mt-0.5">{theme.description}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {theme.ownerId === user?.uid && theme.visibility === 'private' && (
                      <span className="text-xs bg-white/[0.06] text-playhouse-text-tertiary px-2 py-0.5 rounded-full">
                        private
                      </span>
                    )}
                    {theme.isLLMGenerated && (
                      <span className="text-xs text-playhouse-accent-primary">✨ AI</span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
