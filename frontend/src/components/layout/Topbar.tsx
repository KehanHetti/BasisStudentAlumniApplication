'use client';

// src/components/layout/Topbar.tsx

import { useAuth } from '@/contexts/AuthContext';
import { LogOut, User, Settings } from 'lucide-react';
import { useState } from 'react';

const Topbar = ({ title = 'Dashboard' }: { title?: string }) => {
  const { user, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleLogout = () => {
    logout();
    setShowDropdown(false);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleDisplay = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrator';
      case 'teacher':
        return 'Teacher';
      case 'student':
        return 'Student';
      default:
        return 'User';
    }
  };

  return (
    <header className="h-16 bg-ui-card-background/80 backdrop-blur border-b border-ui-border flex items-center justify-between px-4 md:px-6 shadow-custom-sm lg:pl-6">
      <div className="flex items-center gap-2 lg:ml-0 ml-14">
        <h1 className="text-sm sm:text-base md:text-lg font-bold text-ui-text-dark tracking-tight truncate max-w-[40vw]">{title}</h1>
      </div>
      <div className="flex items-center gap-4">
        {user ? (
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-3 hover:bg-ui-background rounded-lg p-2 transition-colors"
            >
              <div className="w-10 h-10 rounded-full grid place-items-center bg-logo-secondary-blue/10 text-logo-secondary-blue font-bold">
                {getInitials(user.full_name)}
              </div>
              <div className="hidden sm:block leading-tight">
                <p className="font-semibold text-sm text-ui-text-dark">{user.full_name}</p>
                <p className="text-xs text-ui-text-light">{getRoleDisplay(user.role)}</p>
              </div>
            </button>

            {showDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-ui-border py-1 z-50">
                <div className="px-4 py-2 border-b border-ui-border">
                  <p className="text-sm font-medium text-ui-text-dark">{user.full_name}</p>
                  <p className="text-xs text-ui-text-light">{user.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <a
              href="/auth/login"
              className="px-4 py-2 bg-logo-primary-blue text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
            >
              Sign In
            </a>
          </div>
        )}
      </div>
    </header>
  );
};

export default Topbar;
