import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getPlugin } from '../../registry/gameRegistry';
import type { ThemeDoc } from '@games/shared';

export default function GameLobby() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const plugin = getPlugin(gameId!);

  const [joinCode, setJoinCode] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(plugin.meta.maxPlayers);
  const [themeId, setThemeId] = useState('');
  const [themes, setThemes] = useState<(ThemeDoc & { id: string })[]>([]);
  const [themesLoading, setThemesLoading] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getToken().then((token) =>
      fetch(`${import.meta.env.VITE_BACKEND_URL}/api/themes?gameId=${gameId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.json())
        .then((data: (ThemeDoc & { id: string })[]) => {
          setThemes(data);
          if (data.length > 0) setThemeId(data[0].id);
          setThemesLoading(false);
        })
    );
  }, [gameId]);

  async function createRoom() {
    if (!themeId) return;
    setLoading(true);
    try {
      const token = await getToken();
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ gameId, maxPlayers, themeId }),
      });
      const { roomCode } = await res.json();
      navigate(`/room/${roomCode}`);
    } finally {
      setLoading(false);
    }
  }

  function joinRoom() {
    if (joinCode.trim().length === 6) {
      navigate(`/room/${joinCode.trim().toUpperCase()}`);
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">
        <button onClick={() => navigate('/')} className="text-gray-400 hover:text-white flex items-center gap-2">
          ← Back
        </button>
        <div>
          <h1 className="text-2xl font-bold">{plugin.meta.iconEmoji} {plugin.meta.displayName}</h1>
          <p className="text-gray-400 text-sm mt-1">Multiplayer · {plugin.meta.minPlayers}–{plugin.meta.maxPlayers} players</p>
        </div>

        {/* Create room */}
        <div className="bg-gray-900 rounded-2xl p-5 space-y-4">
          <h2 className="font-semibold">Create Room</h2>

          <label className="block">
            <span className="text-sm text-gray-400">Theme</span>
            {themesLoading ? (
              <div className="mt-1 text-gray-500 text-sm">Loading themes…</div>
            ) : (
              <select
                value={themeId}
                onChange={(e) => setThemeId(e.target.value)}
                className="mt-1 w-full bg-gray-800 rounded-lg px-3 py-2 text-white"
              >
                {themes.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            )}
          </label>

          <label className="block">
            <span className="text-sm text-gray-400">Max players</span>
            <select
              value={maxPlayers}
              onChange={(e) => setMaxPlayers(Number(e.target.value))}
              className="mt-1 w-full bg-gray-800 rounded-lg px-3 py-2 text-white"
            >
              {Array.from(
                { length: plugin.meta.maxPlayers - plugin.meta.minPlayers + 1 },
                (_, i) => plugin.meta.minPlayers + i
              ).map((n) => (
                <option key={n} value={n}>{n} players</option>
              ))}
            </select>
          </label>

          <button
            onClick={createRoom}
            disabled={loading || !themeId || themesLoading}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-xl font-semibold transition-colors"
          >
            {loading ? 'Creating…' : 'Create Room'}
          </button>
        </div>

        <div className="text-center text-gray-600 text-sm">— or —</div>

        {/* Join room */}
        <div className="bg-gray-900 rounded-2xl p-5 space-y-4">
          <h2 className="font-semibold">Join Room</h2>
          <input
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            placeholder="Enter 6-char code"
            maxLength={6}
            className="w-full bg-gray-800 rounded-lg px-3 py-2 text-white font-mono tracking-widest text-center placeholder:text-gray-600"
          />
          <button
            onClick={joinRoom}
            disabled={joinCode.length !== 6}
            className="w-full py-3 bg-gray-700 hover:bg-gray-600 disabled:opacity-40 rounded-xl font-semibold transition-colors"
          >
            Join Room
          </button>
        </div>
      </div>
    </div>
  );
}
