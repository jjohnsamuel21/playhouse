import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import AuthGuard from './components/AuthGuard';
import ParticleCanvas from './components/ParticleCanvas';
import AmbientAudioToggle from './components/AmbientAudioToggle';
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
        <ParticleCanvas />
        <AmbientAudioToggle />
        <BrowserRouter>
          <Routes>
            {/* Public */}
            <Route path="/login" element={<Login />} />

            {/* Protected */}
            <Route path="/" element={<AuthGuard><Home /></AuthGuard>} />
            <Route path="/profile" element={<AuthGuard><Profile /></AuthGuard>} />
            <Route path="/room/:code" element={<AuthGuard><Room /></AuthGuard>} />
            <Route path="/game/:gameId/lobby" element={<AuthGuard><GameLobby /></AuthGuard>} />
            <Route path="/generate" element={<AuthGuard><GenerateTheme /></AuthGuard>} />

            {/* Dynamic game routes — generated from plugin registry */}
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
        </BrowserRouter>
      </SocketProvider>
    </AuthProvider>
  );
}
