import React, { useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { getPlugin } from '../registry/gameRegistry';
import NavBar from './NavBar';

export default function LocalPlayerSetup() {
  const { themeId } = useParams<{ themeId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  // Route is registered per-plugin as `/game/<gameId>/local-setup/:themeId` —
  // <gameId> is a literal segment baked in per plugin, not a route param.
  const gameId = location.pathname.split('/')[2];
  const plugin = getPlugin(gameId);
  const { minPlayers, maxPlayers } = plugin.meta;

  const [players, setPlayers] = useState<string[]>(
    Array.from({ length: Math.max(minPlayers, 2) }, (_, i) => `Player ${i + 1}`)
  );
  const [shuffling, setShuffling] = useState(false);
  const [firstPlayer, setFirstPlayer] = useState<string | null>(null);

  function updateName(i: number, value: string) {
    setPlayers((prev) => prev.map((p, j) => (j === i ? value : p)));
  }

  function addPlayer() {
    setPlayers((prev) =>
      prev.length >= maxPlayers ? prev : [...prev, `Player ${prev.length + 1}`]
    );
  }

  function removePlayer(i: number) {
    setPlayers((prev) => (prev.length <= minPlayers ? prev : prev.filter((_, j) => j !== i)));
  }

  function pickFirstPlayer() {
    setShuffling(true);
    setFirstPlayer(null);
    setTimeout(() => {
      setFirstPlayer(players[Math.floor(Math.random() * players.length)]);
      setShuffling(false);
    }, 700);
  }

  function startGame() {
    navigate(`/game/${gameId}/play/${themeId}`, { state: { firstPlayer, players } });
  }

  return (
    <div className="page-layer min-h-screen animate-fadeUp">
      <NavBar />
      <div className="max-w-[420px] mx-auto px-6 pt-10 pb-20">
        <span
          onClick={() => navigate(-1)}
          className="text-sm text-playhouse-text-secondary hover:text-playhouse-text-primary cursor-pointer transition-colors"
        >
          ← Back
        </span>

        <h1 className="font-display font-bold text-2xl text-playhouse-text-primary mt-[22px] mb-1">
          Who's playing?
        </h1>
        <p className="text-playhouse-text-secondary text-[13.5px] mb-7">
          Pass the device around — add everyone playing on this screen.
        </p>

        <div className="bg-playhouse-surface border border-white/[0.06] rounded-[18px] p-6">
          <div className="flex flex-col gap-2.5 mb-5">
            {players.map((name, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  value={name}
                  onChange={(e) => updateName(i, e.target.value)}
                  placeholder={`Player ${i + 1}`}
                  className="flex-1 bg-playhouse-bg border border-white/10 rounded-[10px] p-2.5 text-playhouse-text-primary text-sm"
                />
                {players.length > minPlayers && (
                  <button
                    onClick={() => removePlayer(i)}
                    className="w-8 h-8 rounded-full border border-white/10 text-playhouse-text-tertiary hover:text-playhouse-text-primary text-sm shrink-0"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>

          {players.length < maxPlayers && (
            <button
              onClick={addPlayer}
              className="w-full py-2.5 rounded-[10px] border border-dashed border-white/[0.14] text-playhouse-text-secondary text-sm mb-6 hover:text-playhouse-text-primary transition-colors"
            >
              + Add player
            </button>
          )}

          {firstPlayer && !shuffling && (
            <p className="text-center text-sm text-playhouse-accent-primary font-semibold mb-4">
              {firstPlayer} goes first!
            </p>
          )}

          {!firstPlayer ? (
            <button
              onClick={pickFirstPlayer}
              disabled={shuffling}
              className="w-full py-[13px] rounded-xl font-bold text-[14.5px] text-white disabled:opacity-60 transition-opacity hover:opacity-90"
              style={{ background: 'linear-gradient(135deg,#e0479e,#a855f7)' }}
            >
              {shuffling ? 'Picking…' : "Who's first?"}
            </button>
          ) : (
            <button
              onClick={startGame}
              className="w-full py-[13px] rounded-xl font-bold text-[14.5px] text-white transition-opacity hover:opacity-90"
              style={{ background: 'linear-gradient(135deg,#e0479e,#a855f7)' }}
            >
              Start Game →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
