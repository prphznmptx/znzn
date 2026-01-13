import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Crown, User, LogOut, Settings, Bell, Star, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleSignOut = () => {
    signOut();
    navigate('/');
    setShowUserMenu(false);
  };

  const getNavLinks = () => {
    if (user) {
      if (user.role === 'creator') {
        return [
          { path: '/dashboard', label: 'Dashboard' },
          { path: '/creator-membership', label: 'Membership' },
          { path: '/portfolio', label: 'Portfolio' },
          { path: '/content', label: 'Content' },
          { path: '/media', label: 'Media' },
          { path: '/masterclass', label: 'Masterclass' },
          { path: '/projects', label: 'Projects' },
          { path: '/events', label: 'Events' },
        ];
      } else {
        return [
          { path: '/account', label: 'Account' },
          { path: '/connect', label: 'Connect' },
          { path: '/member-membership', label: 'Membership' },
          { path: '/media', label: 'Media' },
          { path: '/masterclass', label: 'Masterclass' },
          { path: '/projects', label: 'Projects' },
          { path: '/events', label: 'Events' },
        ];
      }
    } else {
      return [
        { path: '/media', label: 'Media' },
        { path: '/masterclass', label: 'Masterclass' },
        { path: '/projects', label: 'Projects' },
        { path: '/events', label: 'Events' },
      ];
    }
  };

  const navLinks = getNavLinks();

  return (
    <nav className="fixed top-0 w-full z-50 bg-gray-900/95 backdrop-blur-sm border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left Section */}
          <div className="flex-1 flex items-center justify-start">
            <Link to="/" className="flex items-center space-x-2">
              <Crown className="w-8 h-8 text-rose-400" />
              {!user && (
                <span className="text-2xl font-playfair font-bold gradient-text">FlourishTalents</span>
              )}
            </Link>
          </div>

          {/* Center Section (Desktop) */}
          <div className="hidden md:flex flex-1 items-center justify-center">
            <div className="flex items-center space-x-6 xl:space-x-8">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                    location.pathname === link.path
                      ? 'text-rose-400 bg-white/10'
                      : 'text-white hover:text-rose-400 hover:bg-white/5'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Right Section (Desktop Actions & Mobile Button) */}
          <div className="flex-1 flex items-center justify-end">
            <div className="hidden md:flex items-center space-x-4">
              {!user && (
                <>
                  <Link to="/signin" className="text-white hover:text-rose-400 transition-colors text-sm font-medium">
                    Sign In
                  </Link>
                  <Link to="/signup" className="text-white hover:text-rose-400 transition-colors">
                    <UserPlus className="w-6 h-6" />
                  </Link>
                </>
              )}
              {user && (
                <>
                  <button className="p-2 rounded-full text-white hover:bg-white/10 transition-colors">
                    <Bell className="w-5 h-5" />
                  </button>
                  <div className="relative">
                    <button
                      onClick={() => setShowUserMenu(!showUserMenu)}
                      className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-white/10 transition-all"
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-rose-400 to-purple-500 flex items-center justify-center">
                        {user.profileImage ? (
                          <img src={user.profileImage} alt="Profile" className="w-full h-full rounded-full object-cover" />
                        ) : (
                          <User className="w-4 h-4 text-white" />
                        )}
                      </div>
                      <div className="text-left">
                        <div className="text-sm font-medium text-white">{user.name}</div>
                        <div className="text-xs flex items-center space-x-1 text-yellow-400">
                          <Star className="w-3 h-3" />
                          <span>{user.loyaltyPoints} Points</span>
                        </div>
                      </div>
                    </button>

                    {showUserMenu && (
                      <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-xl border border-gray-700">
                        <div className="py-2">
                          <Link
                            to="/profile"
                            className="flex items-center px-4 py-2 text-sm text-white hover:bg-white/10 transition-colors"
                            onClick={() => setShowUserMenu(false)}
                          >
                            <Settings className="w-4 h-4 mr-3" />
                            Profile Settings
                          </Link>
                          <div className="px-4 py-2 text-sm text-gray-300">
                            Loyalty Points: <span className="text-yellow-400 font-medium">{user.loyaltyPoints}</span>
                          </div>
                          <button
                            onClick={handleSignOut}
                            className="flex items-center w-full px-4 py-2 text-sm text-red-400 hover:bg-white/10 transition-colors"
                          >
                            <LogOut className="w-4 h-4 mr-3" />
                            Sign Out
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
            <div className="md:hidden">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 rounded-lg text-white hover:bg-white/10 transition-colors"
              >
                {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden bg-gray-800 border-t border-gray-700">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`block px-3 py-2 rounded-lg text-base font-medium transition-colors ${
                  location.pathname === link.path
                    ? 'text-rose-400 bg-white/10'
                    : 'text-white hover:text-rose-400 hover:bg-white/5'
                }`}
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            {!user && (
              <>
                <Link
                  to="/signin"
                  className="block px-3 py-2 rounded-lg text-base font-medium text-white hover:text-rose-400 hover:bg-white/5 transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="block px-3 py-2 rounded-lg text-base font-medium text-white hover:text-rose-400 hover:bg-white/5 transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  Sign Up
                </Link>
              </>
            )}
            {user && (
              <button
                onClick={handleSignOut}
                className="block w-full text-left px-3 py-2 rounded-lg text-base font-medium text-red-400 hover:bg-white/10 transition-colors"
              >
                Sign Out
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
