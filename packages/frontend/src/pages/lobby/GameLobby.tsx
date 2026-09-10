import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getPlugin } from '../../registry/gameRegistry';
import { GAME_VISUALS } from '../../registry/gameVisuals';
import NavBar from '../../components/NavBar';
import type { ThemeDoc } from '@games/shared';

export default function GameLobby() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const plugin = getPlugin(gameId!);
  const visual = GAME_VISUALS[plugin.meta.id];

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

  function incPlayers() {
    setMaxPlayers((n) => Math.min(plugin.meta.maxPlayers, n + 1));
  }
  function decPlayers() {
    setMaxPlayers((n) => Math.max(plugin.meta.minPlayers, n - 1));
  }

  return (
    <div className="page-layer min-h-screen animate-fadeUp">
      <NavBar />
      <div className="max-w-[760px] mx-auto px-6 pt-10 pb-20">
        <span
          onClick={() => navigate('/')}
          className="text-sm text-playhouse-text-secondary hover:text-playhouse-text-primary cursor-pointer transition-colors"
        >
          ← Back
        </span>

        <div className="flex items-center gap-3.5 mt-[22px] mb-2">
          <div
            className="w-[46px] h-[46px] rounded-[13px] flex items-center justify-center font-display font-bold text-[19px]"
            style={{ background: visual.gradient }}
          >
            {visual.glyph}
          </div>
          <div>
            <h1 className="font-display font-bold text-2xl text-playhouse-text-primary m-0">
              {plugin.meta.displayName}
            </h1>
            <p className="text-playhouse-text-secondary text-[13.5px] mt-1 m-0">
              Multiplayer · {plugin.meta.minPlayers}–{plugin.meta.maxPlayers} players
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-5 mt-7">
          {/* Create a room */}
          <div className="flex-[1_1_320px] bg-playhouse-surface border border-white/[0.06] rounded-[18px] p-6">
            <h2 className="font-display text-base font-semibold mb-5 text-playhouse-text-primary">
              Create a room
            </h2>

            <p className="text-[13px] text-playhouse-text-secondary mb-2">Theme</p>
            {themesLoading ? (
              <div className="text-playhouse-text-tertiary text-sm mb-[22px]">Loading themes…</div>
            ) : (
              <div className="flex flex-wrap gap-2 mb-[22px]">
                {themes.map((t) => {
                  const active = t.id === themeId;
                  return (
                    <span
                      key={t.id}
                      onClick={() => setThemeId(t.id)}
                      className={`px-3.5 py-2 rounded-full text-[13px] cursor-pointer border transition-all ${
                        active
                          ? 'border-playhouse-accent-primary bg-[rgba(224,71,158,0.14)] text-playhouse-text-primary'
                          : 'border-white/10 text-playhouse-text-secondary'
                      }`}
                    >
                      {t.name}
                    </span>
                  );
                })}
              </div>
            )}

            <p className="text-[13px] text-playhouse-text-secondary mb-2">Max players</p>
            <div className="flex items-center gap-3.5 mb-6">
              <button
                onClick={decPlayers}
                className="w-[34px] h-[34px] rounded-full border border-white/10 bg-transparent text-playhouse-text-primary text-base"
              >
                −
              </button>
              <span className="font-display font-bold text-lg w-5 text-center text-playhouse-text-primary">
                {maxPlayers}
              </span>
              <button
                onClick={incPlayers}
                className="w-[34px] h-[34px] rounded-full border border-white/10 bg-transparent text-playhouse-text-primary text-base"
              >
                +
              </button>
            </div>

            <button
              onClick={createRoom}
              disabled={loading || !themeId || themesLoading}
              className="w-full py-[13px] rounded-xl font-bold text-[14.5px] text-white disabled:opacity-50 transition-opacity hover:opacity-90"
              style={{ background: 'linear-gradient(135deg,#e0479e,#a855f7)' }}
            >
              {loading ? 'Creating…' : 'Create Room'}
            </button>
          </div>

          {/* Join a room */}
          <div className="flex-[1_1_260px] bg-playhouse-surface border border-white/[0.06] rounded-[18px] p-6 flex flex-col">
            <h2 className="font-display text-base font-semibold mb-5 text-playhouse-text-primary">
              Join a room
            </h2>
            <input
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
              placeholder="6-character code"
              maxLength={6}
              className="w-full bg-playhouse-bg border border-white/10 rounded-[10px] p-3 text-playhouse-text-primary font-mono tracking-[0.2em] text-center uppercase text-sm placeholder:text-playhouse-text-tertiary"
            />
            <div className="flex-1" />
            <button
              onClick={joinRoom}
              disabled={joinCode.length !== 6}
              className={`w-full mt-5 py-[13px] rounded-xl font-bold text-[14.5px] border border-white/[0.14] bg-transparent transition-colors ${
                joinCode.length === 6 ? 'text-playhouse-text-primary' : 'text-playhouse-text-tertiary'
              }`}
            >
              Join Room
            </button>
          </div>
        </div>

        {/* Play locally */}
        <div className="mt-5 bg-playhouse-surface border border-white/[0.06] rounded-[18px] p-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-base font-semibold text-playhouse-text-primary mb-1">
              Play locally on this device
            </h2>
            <p className="text-playhouse-text-secondary text-[13.5px]">
              Pass the phone or laptop around — no room, no other devices needed.
            </p>
          </div>
          <button
            onClick={() => navigate(`/game/${gameId}/themes`)}
            className="px-5 py-[11px] rounded-xl font-bold text-[14.5px] border border-white/[0.14] text-playhouse-text-primary bg-transparent hover:bg-white/[0.04] transition-colors shrink-0"
          >
            Play locally
          </button>
        </div>
      </div>
    </div>
  );
}
