'use client';

import { usePathname } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';

export default function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const publicRoutes = ['/auth/login', '/auth/register', '/auth/forgot-password'];
  const isPublicRoute = publicRoutes.includes(pathname);
  const isRootRoute = pathname === '/';

  // Don't show sidebar/topbar for public routes or root route (which redirects)
  if (isPublicRoute || isRootRoute) {
    return <>{children}</>;
  }

  // Show sidebar/topbar for authenticated routes
  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        <Topbar />
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}

