import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import AuthGuard from './components/AuthGuard';
import Login from './pages/Login';
import Home from './pages/Home';
import Profile from './pages/Profile';
import Room from './pages/Room';
import GameLobby from './pages/lobby/GameLobby';
import GenerateTheme from './pages/GenerateTheme';
import { getAllPlugins } from './registry/gameRegistry';

export default function App() {
  const plugins = getAllPlugins();

  return (
    <AuthProvider>
      <SocketProvider>
        <div aria-hidden="true" className="atmosphere-glow" />
        <BrowserRouter>
          <RouteErrorBoundary>
            <Suspense fallback={<RouteLoadingScreen />}>
              <Routes>
                {/* Public */}
                <Route path="/login" element={<Login />} />

                {/* Protected */}
                <Route path="/" element={<AuthGuard><Home /></AuthGuard>} />
                <Route path="/profile" element={<AuthGuard><Profile /></AuthGuard>} />
                <Route path="/room/:code" element={<AuthGuard><Room /></AuthGuard>} />
                <Route path="/game/:gameId/lobby" element={<AuthGuard><GameLobby /></AuthGuard>} />
                <Route path="/generate" element={<AuthGuard><GenerateTheme /></AuthGuard>} />

                {/* Dynamic game routes — generated from plugin registry, lazy-loaded per game */}
                {plugins.flatMap((plugin) =>
                  plugin.routes.map((route) => (
                    <Route
                      key={`${plugin.meta.id}-${route.path}`}
                      path={`/game/${plugin.meta.id}/${route.path}`}
                      element={<AuthGuard><route.component /></AuthGuard>}
                    />
                  ))
                )}

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </RouteErrorBoundary>
        </BrowserRouter>
      </SocketProvider>
    </AuthProvider>
  );
}

function RouteLoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

interface RouteErrorBoundaryState {
  hasError: boolean;
}

/**
 * Catches failed lazy-chunk loads (e.g. a cached page referencing JS chunks
 * deleted by a newer deploy) — without this, React unmounts to a blank
 * white screen instead of showing anything.
 */
class RouteErrorBoundary extends React.Component<{ children: React.ReactNode }, RouteErrorBoundaryState> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): RouteErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error('Route failed to load:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-6">
          <p className="text-playhouse-text-primary font-display font-semibold text-lg">
            Something went wrong loading this page.
          </p>
          <p className="text-playhouse-text-secondary text-sm">
            This can happen right after a new release. Reloading usually fixes it.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-2.5 rounded-xl font-bold text-sm text-white transition-opacity hover:opacity-90"
            style={{ background: 'linear-gradient(135deg,#e0479e,#a855f7)' }}
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
