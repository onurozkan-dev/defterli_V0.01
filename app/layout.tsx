import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import AIChatWidget from '@/components/AIChatWidget';
import Tutorial from '@/components/Tutorial';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Defterli - Fatura Arşiv Sistemi',
  description: 'Muhasebeciler için fatura PDF arşiv sistemi',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <body className={inter.className}>
        <AuthProvider>
          {children}
          <AIChatWidget />
          <Tutorial />
        </AuthProvider>
      </body>
    </html>
  );
}
