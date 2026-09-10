import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getAllPlugins } from '../registry/gameRegistry';
import GameCard from '../components/GameCard';

export default function Home() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const games = getAllPlugins();

  return (
    <div className="page-layer min-h-screen p-6">
      {/* Header */}
      <header className="max-w-4xl mx-auto mb-10">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-display font-semibold text-glow-violet">🎲 Game Night</h1>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/profile')}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              {user?.photoURL && (
                <img src={user.photoURL} alt="" className="w-8 h-8 rounded-full" />
              )}
              <span className="text-sm">{user?.displayName}</span>
            </button>
            <button
              onClick={logout}
              className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
        <div
          aria-hidden="true"
          className="mt-4 h-px w-full animate-glow-pulse"
          style={{
            background:
              'linear-gradient(90deg, transparent, rgba(139,92,246,0.7), transparent)',
          }}
        />
      </header>

      {/* Game grid */}
      <main className="max-w-4xl mx-auto">
        <h2 className="text-lg font-display text-gray-400 mb-6">Choose a game</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {games.map((plugin) => (
            <GameCard key={plugin.meta.id} plugin={plugin} />
          ))}
        </div>
      </main>
    </div>
  );
}
