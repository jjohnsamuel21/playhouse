import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

export default function TodCoinToss() {
  const { themeId } = useParams<{ themeId: string }>();
  const navigate = useNavigate();
  const [flipping, setFlipping] = useState(false);
  const [result, setResult] = useState<'heads' | 'tails' | null>(null);
  const [players, setPlayers] = useState(['Player 1', 'Player 2']);

  function flip() {
    setFlipping(true);
    setResult(null);
    setTimeout(() => {
      setResult(Math.random() < 0.5 ? 'heads' : 'tails');
      setFlipping(false);
    }, 1000);
  }

  const firstPlayer = result === 'heads' ? players[0] : result === 'tails' ? players[1] : null;

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm text-center space-y-6">
        <h1 className="text-2xl font-bold">Coin Toss</h1>
        <p className="text-gray-400">Who goes first?</p>

        {/* Player name inputs */}
        <div className="grid grid-cols-2 gap-3">
          {players.map((name, i) => (
            <input
              key={i}
              value={name}
              onChange={(e) => setPlayers((prev) => prev.map((p, j) => j === i ? e.target.value : p))}
              className="bg-gray-800 rounded-lg px-3 py-2 text-center text-white text-sm"
              placeholder={`Player ${i + 1}`}
            />
          ))}
        </div>

        {/* Coin */}
        <div
          className={`w-28 h-28 mx-auto rounded-full border-4 border-yellow-400 flex items-center justify-center text-4xl font-bold text-yellow-400 select-none transition-transform ${flipping ? 'animate-spin' : ''}`}
        >
          {result ? (result === 'heads' ? 'H' : 'T') : '?'}
        </div>

        {firstPlayer && (
          <p className="text-lg font-semibold text-green-400">{firstPlayer} goes first!</p>
        )}

        <button
          onClick={flip}
          disabled={flipping}
          className="w-full py-3 bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-bold rounded-xl transition-colors disabled:opacity-50"
        >
          {flipping ? 'Flipping...' : 'Flip Coin'}
        </button>

        {result && (
          <button
            onClick={() => navigate(`/game/truth-or-dare/play/${themeId}`, { state: { firstPlayer, players } })}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-semibold transition-colors"
          >
            Start Game →
          </button>
        )}

        <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-300 text-sm">
          ← Back
        </button>
      </div>
    </div>
  );
}
