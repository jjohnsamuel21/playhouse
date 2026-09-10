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
        <div key={`skip-${i}`} className="bg-[rgba(251,191,36,0.1)] border border-[rgba(251,191,36,0.3)] rounded-xl px-4 py-3 flex items-center justify-between">
          <span className="text-sm text-amber-300">⏩ {msg}</span>
          <button onClick={() => onDismissSkip(i)} className="text-amber-400 hover:text-amber-200 text-lg ml-4">×</button>
        </div>
      ))}
      {disconnectedPlayers.map((name, i) => (
        <div key={`disc-${i}`} className="bg-[rgba(248,113,113,0.1)] border border-[rgba(248,113,113,0.3)] rounded-xl px-4 py-3 flex items-center justify-between">
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
    <div className="page-layer min-h-screen flex items-center justify-center p-6">
      <div className="text-center space-y-4">
        <p className="text-4xl">🏁</p>
        <h2 className="font-display font-bold text-xl text-playhouse-text-primary">{endedBy} ended the game</h2>
        <p className="text-playhouse-text-secondary text-sm">Returning to home in 3 seconds…</p>
      </div>
    </div>
  );
}
