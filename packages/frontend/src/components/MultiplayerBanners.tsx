import React from 'react';

interface Props {
  disconnectedPlayers: string[];
  skippedNotices: string[];
  onDismissDisconnect: (i: number) => void;
  onDismissSkip: (i: number) => void;
}

export function MultiplayerBanners({ disconnectedPlayers, skippedNotices, onDismissDisconnect, onDismissSkip }: Props) {
  return (
    <>
      {skippedNotices.map((msg, i) => (
        <div key={`skip-${i}`} className="bg-yellow-900/40 border border-yellow-500/30 rounded-xl px-4 py-3 flex items-center justify-between">
          <span className="text-sm text-yellow-300">⏩ {msg}</span>
          <button onClick={() => onDismissSkip(i)} className="text-yellow-400 hover:text-yellow-200 text-lg ml-4">×</button>
        </div>
      ))}
      {disconnectedPlayers.map((name, i) => (
        <div key={`disc-${i}`} className="bg-red-900/40 border border-red-500/30 rounded-xl px-4 py-3 flex items-center justify-between">
          <span className="text-sm text-red-300">⚠️ {name} left the game</span>
          <button onClick={() => onDismissDisconnect(i)} className="text-red-400 hover:text-red-200 text-lg ml-4">×</button>
        </div>
      ))}
    </>
  );
}

interface GameEndedScreenProps {
  endedBy: string;
}

export function GameEndedScreen({ endedBy }: GameEndedScreenProps) {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
      <div className="text-center space-y-4">
        <p className="text-4xl">🏁</p>
        <h2 className="text-xl font-bold">{endedBy} ended the game</h2>
        <p className="text-gray-400 text-sm">Returning to home in 3 seconds…</p>
      </div>
    </div>
  );
}
