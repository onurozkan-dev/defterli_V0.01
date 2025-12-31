'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

export default function LoginPage() {
  const [error, setError] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);
  const { signInWithGoogle } = useAuth();
  const router = useRouter();

  const handleGoogle = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
      router.push('/app');
    } catch (err: any) {
      setError(err.message || 'Google ile giriş başarısız oldu');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Giriş Yap
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            <Link href="/" className="font-medium text-blue-600 hover:text-blue-500">
              Defterli
            </Link>
          </p>
          <p className="mt-4 text-center text-sm text-gray-500">
            Google hesabınızla giriş yaparak devam edin
          </p>
        </div>
        <div className="mt-8 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div>
            <button
              type="button"
              disabled={googleLoading}
              onClick={handleGoogle}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 border-2 border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 font-semibold text-base transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <svg className="w-6 h-6" viewBox="0 0 533.5 544.3" aria-hidden="true">
                <path
                  fill="#4285f4"
                  d="M533.5 278.4c0-18.4-1.6-36-4.7-53.1H272v100.8h146.9c-6.3 34-25.2 62.8-53.8 82.1v68.1h86.7c50.8-46.8 81.7-115.7 81.7-197.9z"
                />
                <path
                  fill="#34a853"
                  d="M272 544.3c72.6 0 133.7-24 178.3-65.1l-86.7-68.1c-24.1 16.2-55 25.7-91.6 25.7-70.5 0-130.3-47.5-151.7-111.4H31.9v69.9c44.7 88.5 136 149 240.1 149z"
                />
                <path
                  fill="#fbbc04"
                  d="M120.3 325.4c-11-32.5-11-67.5 0-100l-69.9-69.9C-23.3 214.1-23.3 330.2 50.4 419l69.9-69.9z"
                />
                <path
                  fill="#ea4335"
                  d="M272 107.7c39.5-.6 77.4 14 106.2 40.8l79.2-79.2C408.5 24.6 342.6-.4 272 0 168 0 76.6 60.5 31.9 149.9l88.4 69.9C141.7 155.1 201.5 107.7 272 107.7z"
                />
              </svg>
              {googleLoading ? 'Google ile bağlanılıyor...' : 'Google ile devam et'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
