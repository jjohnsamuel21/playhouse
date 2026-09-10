import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../firebase';
import { useAuth } from '../../../contexts/AuthContext';
import type { ThemeDoc } from '@games/shared';

export default function TotThemeSelect() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [themes, setThemes] = useState<(ThemeDoc & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const publicQ = query(collection(db, 'themes'), where('gameId', '==', 'this-or-that'), where('visibility', '==', 'public'));
    const ownedQ = query(collection(db, 'themes'), where('gameId', '==', 'this-or-that'), where('ownerId', '==', user.uid));
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
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-lg mx-auto">
        <button onClick={() => navigate('/')} className="text-gray-400 hover:text-white mb-6 flex items-center gap-2">← Back</button>
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-1">⚖️ This or That</h1>
            <p className="text-gray-400">Pick a category</p>
          </div>
          <button
            onClick={() => navigate('/generate?gameId=this-or-that')}
            className="flex items-center gap-1.5 px-3 py-2 bg-indigo-700/40 hover:bg-indigo-700/60 border border-indigo-500/30 rounded-xl text-sm text-indigo-300 transition-colors"
          >
            ✨ Generate with AI
          </button>
        </div>
        {loading ? (
          <div className="text-gray-500">Loading...</div>
        ) : (
          <div className="space-y-3">
            {themes.map((theme) => (
              <button
                key={theme.id}
                onClick={() => navigate(`/game/this-or-that/local-setup/${theme.id}`)}
                className="w-full bg-gray-900 hover:bg-gray-800 rounded-xl p-4 text-left transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{theme.name}</p>
                    {theme.description && <p className="text-sm text-gray-400 mt-0.5">{theme.description}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {theme.ownerId === user?.uid && theme.visibility === 'private' && (
                      <span className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded-full">private</span>
                    )}
                    {theme.isLLMGenerated && <span className="text-xs text-indigo-400">✨ AI</span>}
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
