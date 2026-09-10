import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';

export default function Login() {
  const { user, loading, signInWithGoogle } = useAuth();

  if (loading) return <LoadingScreen />;
  if (user) return <Navigate to="/" replace />;

  return (
    <div className="page-layer min-h-screen grid grid-cols-1 md:grid-cols-[1.1fr_1fr] animate-fadeUp">
      {/* Left panel — brand, copy, sign-in */}
      <div className="flex flex-col justify-center p-16 min-w-[320px]">
        <div className="max-w-[420px]">
          <div className="flex items-center gap-2.5 mb-9">
            <div
              className="w-8 h-8 rounded-[9px]"
              style={{ background: 'linear-gradient(135deg,#e0479e,#a855f7)' }}
            />
            <span className="font-display font-bold text-[22px] text-playhouse-text-primary">
              Playhouse
            </span>
          </div>

          <h1 className="font-display font-bold text-[46px] leading-[1.08] mb-[18px] tracking-[-0.5px] text-playhouse-text-primary">
            Where your games
            <br />
            come to play.
          </h1>

          <p className="text-[#b8a3ae] text-base leading-[1.6] mb-9">
            One home for every game night — rank, choose, dare, and whatever we build
            next. Jump in solo or pull the group into a room.
          </p>

          <button
            onClick={signInWithGoogle}
            className="flex items-center gap-3 px-[22px] py-[14px] rounded-full font-semibold text-[15px] transition-transform"
            style={{
              background: '#f2ecf0',
              color: '#1a0f1f',
              boxShadow: '0 8px 30px rgba(224,71,158,0.18)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 10px 34px rgba(224,71,158,0.28)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = '';
              e.currentTarget.style.boxShadow = '0 8px 30px rgba(224,71,158,0.18)';
            }}
          >
            <GoogleIcon />
            Sign in with Google
          </button>

          <p className="mt-7 text-[13px] text-playhouse-text-tertiary">
            No password to forget. No noob screens to look at.
          </p>
        </div>
      </div>

      {/* Right panel — ambient wash + floating boxes */}
      <div
        className="relative overflow-hidden hidden md:block"
        style={{ background: 'linear-gradient(160deg,#160a1a,#0f0810)' }}
      >
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            backgroundImage:
              'radial-gradient(circle at 70% 30%, rgba(224,71,158,0.16), transparent 50%), radial-gradient(circle at 30% 75%, rgba(168,85,247,0.14), transparent 50%)',
          }}
        />
        <div
          aria-hidden="true"
          className="absolute animate-drift1"
          style={{
            top: '18%',
            left: '20%',
            width: 140,
            height: 140,
            borderRadius: 28,
            background: 'linear-gradient(135deg,#e0479e,#ff8a65)',
            opacity: 0.85,
            boxShadow: '0 30px 60px rgba(224,71,158,0.25)',
          }}
        />
        <div
          aria-hidden="true"
          className="absolute animate-drift2"
          style={{
            top: '50%',
            left: '52%',
            width: 110,
            height: 110,
            borderRadius: 24,
            background: 'linear-gradient(135deg,#a855f7,#6366f1)',
            opacity: 0.85,
            boxShadow: '0 30px 60px rgba(168,85,247,0.22)',
          }}
        />
        <div
          aria-hidden="true"
          className="absolute animate-drift3"
          style={{
            top: '66%',
            left: '18%',
            width: 90,
            height: 90,
            borderRadius: 20,
            background: 'linear-gradient(135deg,#e0479e,#a855f7)',
            opacity: 0.85,
            boxShadow: '0 30px 60px rgba(224,71,158,0.2)',
          }}
        />
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
    <svg width="18" height="18" viewBox="0 0 48 48">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  );
}
