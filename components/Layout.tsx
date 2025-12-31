'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { signOut, userData, user } = useAuth();

  const navItems = [
    { href: '/app', label: 'Dashboard' },
    { href: '/app/clients', label: 'Müşteriler' },
    { href: '/app/invoices', label: 'Faturalar' },
    { href: '/app/upload', label: 'Yükle' },
    { href: '/app/pricing', label: 'Fiyatlandırma' },
    { href: '/app/settings', label: 'Ayarlar' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link href="/app" className="text-xl font-bold text-blue-600">
                  Defterli
                </Link>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`${
                      pathname === item.href
                        ? 'border-blue-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-4">
              {userData && (
                <div className="flex items-center gap-2">
                  {user?.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={userData.displayName || userData.email || 'Kullanıcı'}
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-semibold">
                      {(userData.displayName || userData.email || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="text-sm text-gray-700 hidden sm:inline">
                    {userData.displayName || userData.email || 'Kullanıcı'}
                  </span>
                </div>
              )}
              <button
                onClick={signOut}
                className="text-gray-500 hover:text-gray-700 px-3 py-2 text-sm font-medium"
              >
                Çıkış
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
