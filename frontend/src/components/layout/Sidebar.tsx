// src/components/layout/Sidebar.tsx

'use client'; // This component uses hooks, so mark it as a Client Component

import Link from 'next/link';
import { usePathname } from 'next/navigation';
// To use icons, install lucide-react: npm install lucide-react
import { LayoutDashboard, Users, CheckSquare, BookText, BarChart2, NotebookText, Key, Shield } from 'lucide-react';

const Sidebar = () => {
  const pathname = usePathname();

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Students', href: '/students', icon: Users },
    { name: 'Attendance', href: '/attendance', icon: CheckSquare },
    { name: 'Progress', href: '/progress', icon: BookText },
    { name: 'Journals', href: '/journals', icon: NotebookText },
    { name: 'Reports', href: '/reports', icon: BarChart2 },
  ];

  const adminItems = [
    { name: 'Admin Dashboard', href: '/admin', icon: Shield },
    { name: 'Course Codes', href: '/admin/course-codes', icon: Key },
    { name: 'User Management', href: '/admin/users', icon: Users },
  ];

  return (
    <aside className="w-72 flex-shrink-0 bg-logo-primary-blue text-white flex flex-col shadow-lg">
      <div className="h-16 flex items-center px-5 border-b border-white/20 overflow-hidden">
        <div className="flex items-center gap-2">
          <img src="/logo.jpg" alt="Logo" className="h-12 w-12 rounded-sm object-contain" />
          <span className="ml-2 text-white/90 text-base md:text-xl font-semibold tracking-tight truncate">
            Progress Portal
          </span>
        </div>
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
  );
};

export default Sidebar;
