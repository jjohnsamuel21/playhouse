import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function NavBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isHome = location.pathname === '/';
  const isProfile = location.pathname === '/profile';
  const initial = user?.displayName?.[0]?.toUpperCase() ?? '?';

  return (
    <nav className="relative z-10 flex items-center justify-between max-w-[1120px] mx-auto pt-[22px] px-6">
      <div
        className="flex items-center gap-2.5 cursor-pointer"
        onClick={() => navigate('/')}
      >
        <div
          className="w-7 h-7 rounded-lg"
          style={{ background: 'linear-gradient(135deg,#e0479e,#a855f7)' }}
        />
        <span className="font-display font-bold text-[19px] tracking-[0.2px] text-playhouse-text-primary">
          Playhouse
        </span>
      </div>

      <div className="flex items-center gap-7">
        <span
          className={`text-sm cursor-pointer transition-colors ${
            isHome ? 'text-playhouse-text-primary' : 'text-playhouse-text-secondary'
          }`}
          onClick={() => navigate('/')}
        >
          Home
        </span>
        <span
          className={`text-sm cursor-pointer transition-colors ${
            isProfile ? 'text-playhouse-text-primary' : 'text-playhouse-text-secondary'
          }`}
          onClick={() => navigate('/profile')}
        >
          Profile
        </span>
        <div className="flex items-center gap-2.5 pl-5 border-l border-white/10">
          {user?.photoURL ? (
            <img src={user.photoURL} alt="" className="w-[30px] h-[30px] rounded-full" />
          ) : (
            <div
              className="w-[30px] h-[30px] rounded-full flex items-center justify-center font-display font-bold text-xs text-playhouse-text-primary"
              style={{ background: 'linear-gradient(135deg,#a855f7,#6366f1)' }}
            >
              {initial}
            </div>
          )}
          <span className="text-sm text-[#c9bac2]">{user?.displayName}</span>
          <span
            className="text-[13px] text-playhouse-text-tertiary hover:text-[#c9bac2] cursor-pointer transition-colors"
            onClick={logout}
          >
            Sign out
          </span>
        </div>
      </div>
    </nav>
  );
}
