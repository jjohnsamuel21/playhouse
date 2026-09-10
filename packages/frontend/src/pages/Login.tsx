import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';

export default function Login() {
  const { user, loading, signInWithGoogle } = useAuth();

  if (loading) return <LoadingScreen />;
  if (user) return <Navigate to="/" replace />;

  return (
    <div className="page-layer min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* hero spotlight — sits behind the content, above the sitewide atmosphere/canvas */}
      <div
        aria-hidden="true"
        className="absolute left-1/2 top-1/2 w-[600px] h-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none animate-aurora-drift -z-10"
        style={{
          background:
            'radial-gradient(circle, rgba(139,92,246,0.28) 0%, rgba(99,102,241,0.12) 45%, transparent 70%)',
        }}
      />

      <div className="text-center space-y-8 px-6">
        <div>
          <h1 className="text-6xl font-display font-bold tracking-wide text-glow-violet">
            <span className="animate-flicker">🎲</span> Game Night
          </h1>
          <p className="mt-3 text-gray-400 text-lg">Play together. Rank, choose, dare.</p>
        </div>
        <button
          onClick={signInWithGoogle}
          className="flex items-center gap-3 mx-auto px-6 py-3 bg-white text-gray-900 font-semibold rounded-xl hover:bg-gray-100 transition-colors shadow-lg hover:shadow-glow hover:shadow-neon-violet/40"
        >
          <GoogleIcon />
          Sign in with Google
        </button>
      </div>
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

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  );
}
