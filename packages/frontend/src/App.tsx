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
