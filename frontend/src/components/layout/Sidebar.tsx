// src/components/layout/Sidebar.tsx

'use client'; // This component uses hooks, so mark it as a Client Component

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
// To use icons, install lucide-react: npm install lucide-react
import { LayoutDashboard, Users, CheckSquare, BookText, BarChart2, NotebookText, Key, Shield, BookOpen, X, Menu } from 'lucide-react';

const Sidebar = () => {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  // Close sidebar when route changes on mobile
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Prevent body scroll when sidebar is open on mobile
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Students', href: '/students', icon: Users },
    { name: 'Attendance', href: '/attendance', icon: CheckSquare },
    { name: 'Progress', href: '/progress', icon: BookText },
    { name: 'Journals', href: '/journals', icon: NotebookText },
    { name: 'Reports', href: '/reports', icon: BarChart2 },
  ];

  const adminItems = [
    { name: 'Course Management', href: '/admin/courses', icon: BookOpen },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-72 flex-shrink-0 bg-logo-primary-blue text-white flex flex-col shadow-lg
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="h-16 flex items-center justify-between px-5 border-b border-white/20 overflow-hidden">
          <div className="flex items-center gap-2">
            <img src="/logo.jpg" alt="Logo" className="h-12 w-12 rounded-sm object-contain" />
            <span className="ml-2 text-white/90 text-base md:text-xl font-semibold tracking-tight truncate">
              Progress Portal
            </span>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="lg:hidden p-2 hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      <nav className="flex-1 px-4 py-6">
        <ul>
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.name} className="mb-1">
                <Link
                  href={item.href}
                  className={`flex items-center px-4 py-3 rounded-lg transition-colors duration-200 ${
                    isActive
                      ? 'bg-white/15 text-white shadow-md'
                      : 'hover:bg-white/10 text-white/80'
                  }`}
                >
                  <item.icon className={`w-5 h-5 mr-3 ${isActive ? 'text-white' : 'text-white/60'}`} />
                  <span className="font-medium">{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
        
        {/* Admin Section */}
        <div className="mt-8">
          <div className="px-4 py-2">
            <h3 className="text-xs font-semibold text-white/60 uppercase tracking-wider">Administration</h3>
          </div>
          <ul>
            {adminItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <li key={item.name} className="mb-1">
                  <Link
                    href={item.href}
                    className={`flex items-center px-4 py-3 rounded-lg transition-colors duration-200 ${
                      isActive
                        ? 'bg-white/15 text-white shadow-md'
                        : 'hover:bg-white/10 text-white/80'
                    }`}
                  >
                    <item.icon className={`w-5 h-5 mr-3 ${isActive ? 'text-white' : 'text-white/60'}`} />
                    <span className="font-medium">{item.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>
      <div className="p-4 text-center border-t border-white/20">
        <p className="text-xs text-white/70">© 2025 Basis Learning</p>
      </div>
    </aside>

      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="lg:hidden fixed top-3 left-3 z-30 p-2.5 bg-logo-primary-blue text-white rounded-lg shadow-lg hover:bg-logo-secondary-blue transition-colors touch-target"
        aria-label="Open sidebar"
      >
        <Menu className="w-5 h-5" />
      </button>
    </>
  );
};

export default Sidebar;
