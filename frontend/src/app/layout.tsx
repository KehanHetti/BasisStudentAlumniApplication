// src/app/layout.tsx

import type { Metadata } from 'next';
import localFont from 'next/font/local';
import '../styles/globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { ToastProvider } from '@/contexts/ToastContext';
import AuthGuard from '@/components/auth/AuthGuard';
import ConditionalLayout from '@/components/layout/ConditionalLayout';

// Configure the local Avenir font (use Medium by default)
const avenir = localFont({
  src: [
    {
      path: '../../public/fonts/AvenirLTProMedium.otf',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../../public/fonts/AvenirLTProHeavy.otf',
      weight: '700',
      style: 'normal',
    },
  ],
  display: 'swap',
  variable: '--font-avenir',
});

export const metadata: Metadata = {
  title: 'Basis Learning Tracker',
  description: 'Student & Alumni Tracking Platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${avenir.variable} font-sans font-medium bg-ui-background text-ui-text-dark antialiased`}>
        <AuthProvider>
          <ToastProvider>
            <AuthGuard>
              <ConditionalLayout>{children}</ConditionalLayout>
            </AuthGuard>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
