import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { doc, getDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../firebase';
import { useAuth } from '../../../contexts/AuthContext';
import type { TriviaContent, ThemeDoc } from '@games/shared';
import ChatPanel from '../../../components/ChatPanel';
import { MultiplayerBanners, GameEndedScreen } from '../../../components/MultiplayerBanners';
import { useMultiplayerRoom } from '../../../hooks/useMultiplayerRoom';

interface AnswerRecord {
  question: string;
  player: string;
  correct: boolean;
}

interface PlayerInfo { uid: string; displayName: string; photoURL: string; }

export default function TriviaGameBoard() {
  const { themeId } = useParams<{ themeId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const locationState = (location.state as {
    firstPlayer?: string;
    players?: string[];
    sessionId?: string;
    roomCode?: string;
    playerInfos?: PlayerInfo[];
    hostId?: string;
  }) ?? {};

  const [theme, setTheme] = useState<(ThemeDoc & { id: string }) | null>(null);
  const [questions, setQuestions] = useState<TriviaContent['questions']>([]);
  const [round, setRound] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [scores, setScores] = useState<Record<string, number>>({});
  const answersRef = useRef<AnswerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [done, setDone] = useState(false);

  const [players] = useState<string[]>(
    locationState.players ?? [user?.displayName ?? 'Player 1']
  );
  const [playerIndex, setPlayerIndex] = useState(() => {
    const i = locationState.firstPlayer ? players.indexOf(locationState.firstPlayer) : 0;
    return i === -1 ? 0 : i;
  });
  const currentPlayer = players[playerIndex] ?? players[0];

  const saveHistory = useCallback(async () => {
    if (!user || !themeId || !theme) return;
    await addDoc(collection(db, 'gameHistory'), {
      uid: user.uid,
      sessionId: locationState.sessionId ?? null,
      gameId: 'trivia',
      themeId,
      themeName: theme.name,
      result: { scores, answers: answersRef.current },
      playedAt: serverTimestamp(),
    });
  }, [user, themeId, theme, scores, locationState.sessionId]);

  const {
    isMultiplayer,
    isHost,
    disconnectedPlayers,
    skippedNotices,
    gameEndedBy,
    endGame,
    dismissDisconnect,
    dismissSkip,
  } = useMultiplayerRoom({
    sessionId: locationState.sessionId,
    hostId: locationState.hostId,
    playerInfos: locationState.playerInfos,
    onGameEnded: saveHistory,
  });

  useEffect(() => {
    if (!themeId) return;
    getDoc(doc(db, 'themes', themeId)).then((snap) => {
      if (snap.exists()) {
        const data = snap.data() as ThemeDoc;
        setTheme({ id: snap.id, ...data });
        const content = data.content as TriviaContent;
        const shuffled = [...content.questions].sort(() => Math.random() - 0.5);
        setQuestions(shuffled);
      }
      setLoading(false);
    });
  }, [themeId]);

  function handleAnswer(optionIndex: number) {
    if (selectedIndex !== null) return;
    setSelectedIndex(optionIndex);

    const q = questions[round];
    const correct = optionIndex === q.correctIndex;
    answersRef.current = [...answersRef.current, { question: q.question, player: currentPlayer, correct }];
    if (correct) {
      setScores((prev) => ({ ...prev, [currentPlayer]: (prev[currentPlayer] ?? 0) + 1 }));
    }
  }

  async function nextRound() {
    if (players.length > 1) {
      setPlayerIndex((playerIndex + 1) % players.length);
    }
    setSelectedIndex(null);

    if (round + 1 >= questions.length) {
      await saveHistory();
      setDone(true);
    } else {
      setRound(round + 1);
    }
  }

  if (loading) return <LoadingScreen />;
  if (!theme || questions.length === 0) {
    return <div className="p-6 text-playhouse-text-secondary">No questions found.</div>;
  }
  if (gameEndedBy) return <GameEndedScreen endedBy={gameEndedBy} />;

  if (done) {
    const leaderboard = [...players].sort((a, b) => (scores[b] ?? 0) - (scores[a] ?? 0));
    return (
      <div className="page-layer min-h-screen p-6">
        <div className="max-w-lg mx-auto text-center space-y-6">
          <h1 className="font-display font-bold text-2xl text-playhouse-text-primary">Leaderboard</h1>
          <div className="space-y-2">
            {leaderboard.map((name, i) => (
              <div key={name} className="bg-playhouse-surface border border-white/[0.06] rounded-xl p-4 flex items-center gap-4">
                <span className="font-display text-2xl font-bold text-playhouse-accent-primary w-8">#{i + 1}</span>
                <span className="flex-1 text-left text-playhouse-text-primary">{name}</span>
                <span className="text-playhouse-text-secondary text-sm">{scores[name] ?? 0} correct</span>
              </div>
            ))}
          </div>
          <button
            onClick={() => navigate('/')}
            className="w-full py-3 rounded-xl font-bold text-white transition-opacity hover:opacity-90"
            style={{ background: 'linear-gradient(135deg,#e0479e,#a855f7)' }}
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const q = questions[round];

  return (
    <div className="page-layer min-h-screen flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">
        <MultiplayerBanners
          disconnectedPlayers={disconnectedPlayers}
          skippedNotices={skippedNotices}
          onDismissDisconnect={dismissDisconnect}
          onDismissSkip={dismissSkip}
        />

        <div className="text-center">
          {!isMultiplayer && players.length > 1 && (
            <p className="font-display font-bold text-lg mb-1 text-playhouse-text-primary">{currentPlayer}'s turn</p>
          )}
          <p className="text-playhouse-text-secondary text-sm">{theme.name}</p>
          <p className="text-playhouse-text-tertiary text-xs mt-1">{round + 1} / {questions.length}</p>
        </div>

        <div className="w-full bg-white/[0.06] rounded-full h-1">
          <div
            className="h-1 rounded-full transition-all"
            style={{ width: `${((round + 1) / questions.length) * 100}%`, background: 'linear-gradient(90deg,#8b5cf6,#6366f1)' }}
          />
        </div>

        <p className="text-center text-playhouse-text-primary font-display font-medium text-lg">{q.question}</p>

        <div className="space-y-3">
          {q.options.map((option, i) => {
            const isSelected = selectedIndex === i;
            const isCorrectOption = i === q.correctIndex;
            const showResult = selectedIndex !== null;
            let borderColor = 'border-white/[0.06]';
            if (showResult && isCorrectOption) borderColor = 'border-emerald-500/50';
            else if (showResult && isSelected) borderColor = 'border-red-500/50';

            return (
              <button
                key={i}
                onClick={() => handleAnswer(i)}
                disabled={selectedIndex !== null}
                className={`w-full py-4 px-4 bg-playhouse-surface border-2 ${borderColor} rounded-2xl text-left font-medium text-playhouse-text-primary transition-all disabled:cursor-default`}
              >
                {option}
                {showResult && isCorrectOption && <span className="ml-2 text-emerald-400">✓</span>}
                {showResult && isSelected && !isCorrectOption && <span className="ml-2 text-red-400">✕</span>}
              </button>
            );
          })}
        </div>

        {selectedIndex !== null && (
          <button
            onClick={nextRound}
            className="w-full py-3 rounded-xl font-semibold border border-white/10 text-playhouse-text-primary hover:bg-white/[0.04] transition-colors"
          >
            {round + 1 >= questions.length ? 'See Results →' : 'Next Question →'}
          </button>
        )}

        {isMultiplayer && isHost && (
          <button onClick={endGame} className="w-full text-playhouse-text-tertiary hover:text-playhouse-text-secondary text-sm transition-colors">
            End Game for Everyone
          </button>
        )}
      </div>

      {locationState.sessionId && <ChatPanel sessionId={locationState.sessionId} />}
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="page-layer min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
