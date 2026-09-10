import { useNavigate } from 'react-router-dom';
import type { FrontendGamePlugin } from '../registry/gameRegistry';
import { GAME_VISUALS } from '../registry/gameVisuals';

interface Props {
  plugin: FrontendGamePlugin;
}

export default function GameCard({ plugin }: Props) {
  const navigate = useNavigate();
  const { meta } = plugin;
  const visual = GAME_VISUALS[meta.id];

  return (
    <div
      onClick={() => navigate(`/game/${meta.id}/lobby`)}
      className="bg-playhouse-surface border border-white/[0.06] rounded-[18px] p-[22px] cursor-pointer transition-[transform,border-color] duration-[0.25s] ease-out hover:-translate-y-1 hover:border-[rgba(224,71,158,0.35)]"
    >
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center font-display font-bold text-lg mb-4"
        style={{ background: visual.gradient }}
      >
        {visual.glyph}
      </div>
      <h3 className="font-display text-[17px] font-semibold mb-1.5 text-playhouse-text-primary">
        {meta.displayName}
      </h3>
      <p className="text-playhouse-text-secondary text-[13.5px] leading-[1.5] mb-4 min-h-10">
        {meta.description}
      </p>
      <div className="flex items-center justify-between">
        <span className="text-xs text-playhouse-text-tertiary">
          {meta.minPlayers === meta.maxPlayers
            ? `${meta.minPlayers}`
            : `${meta.minPlayers}–${meta.maxPlayers}`}{' '}
          players
        </span>
        <span className="text-xs font-semibold text-playhouse-accent-primary">Play →</span>
      </div>
      {meta.supportsLLMGeneration && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/generate?gameId=${meta.id}`);
          }}
          className="mt-3 text-xs font-medium text-playhouse-text-secondary hover:text-playhouse-accent-secondary transition-colors"
        >
          ✨ Generate with AI
        </button>
      )}
    </div>
  );
}
