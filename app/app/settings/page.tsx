'use client';

import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

export default function SettingsPage() {
  const { userData, user } = useAuth();

  // Plan bilgilerini formatla
  const getPlanName = (plan?: string) => {
    switch (plan) {
      case 'trial':
        return 'Ücretsiz Deneme';
      case 'starter':
        return 'Başlangıç';
      case 'professional':
        return 'Profesyonel';
      case 'enterprise':
        return 'Kurumsal';
      default:
        return 'Ücretsiz';
    }
  };

  const getPlanColor = (plan?: string) => {
    switch (plan) {
      case 'trial':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'starter':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'professional':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'enterprise':
        return 'bg-indigo-100 text-indigo-800 border-indigo-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  // Kalan süreyi hesapla
  const getRemainingDays = () => {
    if (!userData?.trialExpiresAt) return null;
    
    const now = new Date();
    const expiresAt = new Date(userData.trialExpiresAt);
    const diffTime = expiresAt.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 0;
    return diffDays;
  };

  const remainingDays = getRemainingDays();
  const isTrialExpired = remainingDays !== null && remainingDays === 0;
  const isTrialActive = userData?.plan === 'trial' && remainingDays !== null && remainingDays > 0;

  return (
    <div className="px-4 sm:px-0">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Ayarlar</h1>
      </div>

      <div className="space-y-6 max-w-2xl">
        {/* Üyelik Bilgileri */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Üyelik Bilgileri</h2>
          <dl className="grid grid-cols-1 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">Mevcut Plan</dt>
              <dd className="mt-1">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold border ${getPlanColor(userData?.plan)}`}>
                  {getPlanName(userData?.plan)}
                </span>
              </dd>
            </div>
            
            {isTrialActive && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Kalan Süre</dt>
                <dd className="mt-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-lg font-bold ${remainingDays! <= 3 ? 'text-red-600' : 'text-green-600'}`}>
                      {remainingDays} gün
                    </span>
                    {remainingDays! <= 3 && (
                      <span className="text-xs text-red-600 font-medium">(Yakında sona eriyor!)</span>
                    )}
                  </div>
                  {userData?.trialExpiresAt && (
                    <p className="text-xs text-gray-500 mt-1">
                      Son kullanma: {new Date(userData.trialExpiresAt).toLocaleDateString('tr-TR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  )}
                </dd>
              </div>
            )}

            {isTrialExpired && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Durum</dt>
                <dd className="mt-1">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-red-100 text-red-800 border border-red-300">
                    Deneme Süresi Doldu
                  </span>
                </dd>
              </div>
            )}

            {!userData?.plan && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Durum</dt>
                <dd className="mt-1 text-sm text-gray-600">
                  Aktif bir planınız bulunmuyor. Plan seçmek için{' '}
                  <Link href="/app/pricing" className="text-blue-600 hover:text-blue-800 font-medium">
                    fiyatlandırma
                  </Link>
                  {' '}sayfasını ziyaret edin.
                </dd>
              </div>
            )}

            {userData?.plan && userData.plan !== 'trial' && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Durum</dt>
                <dd className="mt-1">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800 border border-green-300">
                    Aktif
                  </span>
                </dd>
              </div>
            )}
          </dl>
          
          {(!userData?.plan || isTrialExpired) && (
            <div className="mt-6 pt-6 border-t">
              <Link
                href="/app/pricing"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Plan Seç
              </Link>
            </div>
          )}
        </div>

        {/* Hesap Bilgileri */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Hesap Bilgileri</h2>
          <dl className="grid grid-cols-1 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">E-posta</dt>
              <dd className="mt-1 text-sm text-gray-900">{user?.email}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Kullanıcı ID</dt>
              <dd className="mt-1 text-sm text-gray-900 font-mono">{userData?.uid}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Rol</dt>
              <dd className="mt-1 text-sm text-gray-900 capitalize">{userData?.role || 'accountant'}</dd>
            </div>
          </dl>
        </div>

        {/* Depolama Bilgileri */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Depolama Bilgileri</h2>
          <dl className="grid grid-cols-1 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">Kullanılan Depolama</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {userData?.storageUsed
                  ? `${(userData.storageUsed / 1024 / 1024).toFixed(2)} MB`
                  : '0 MB'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Depolama Limiti</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {userData?.storageLimit
                  ? `${(userData.storageLimit / 1024 / 1024 / 1024).toFixed(2)} GB`
                  : '1 GB'}
              </dd>
            </div>
            {userData?.storageUsed && userData?.storageLimit && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Kullanım Oranı</dt>
                <dd className="mt-1">
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-blue-600 h-2.5 rounded-full"
                      style={{
                        width: `${(userData.storageUsed / userData.storageLimit) * 100}%`,
                      }}
                    />
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    %{((userData.storageUsed / userData.storageLimit) * 100).toFixed(1)} kullanılıyor
                  </p>
                </dd>
              </div>
            )}
          </dl>
        </div>
      </div>
    </div>
  );
}
