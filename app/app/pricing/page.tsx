'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

interface PricingPlan {
  id: string;
  name: string;
  price: number;
  priceId: string; // Stripe Price ID
  period: 'month' | 'year';
  description: string;
  features: string[];
  popular?: boolean;
  storageLimit: number; // GB cinsinden
  storageLimitText: string;
}

const PLANS: PricingPlan[] = [
  {
    id: 'starter',
    name: 'Başlangıç',
    price: 99,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER || '',
    period: 'month',
    description: 'Küçük işletmeler için ideal',
    features: [
      '10 müşteri',
      '100 fatura/yıl',
      '5 GB depolama',
      'Temel destek',
      'PDF arşivleme',
      'Paylaşım linkleri',
    ],
    storageLimit: 5,
    storageLimitText: '5 GB',
  },
  {
    id: 'professional',
    name: 'Profesyonel',
    price: 299,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PROFESSIONAL || '',
    period: 'month',
    description: 'Büyüyen işletmeler için',
    popular: true,
    features: [
      'Sınırsız müşteri',
      'Sınırsız fatura',
      '50 GB depolama',
      'Öncelikli destek',
      'PDF arşivleme',
      'Paylaşım linkleri',
      'Gelişmiş arama',
      'Toplu işlemler',
    ],
    storageLimit: 50,
    storageLimitText: '50 GB',
  },
  {
    id: 'enterprise',
    name: 'Kurumsal',
    price: 799,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE || '',
    period: 'month',
    description: 'Büyük ekipler için',
    features: [
      'Sınırsız müşteri',
      'Sınırsız fatura',
      '500 GB depolama',
      '7/24 destek',
      'PDF arşivleme',
      'Paylaşım linkleri',
      'Gelişmiş arama',
      'Toplu işlemler',
      'API erişimi',
      'Özel entegrasyonlar',
    ],
    storageLimit: 500,
    storageLimitText: '500 GB',
  },
];

function GiftCodeForm() {
  const { user, userData } = useAuth();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !userData) {
      setMessage({ type: 'error', text: 'Lütfen önce giriş yapın' });
      return;
    }

    if (!code.trim()) {
      setMessage({ type: 'error', text: 'Lütfen bir hediye kodu girin' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      // Önce API'ye gönder ve doğrula
      const response = await fetch('/api/gift-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: code.trim(),
          userId: user.uid,
          userData: userData, // Client-side'dan kullanıcı bilgilerini gönder
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Hediye kodu kullanılamadı');
      }

      // API doğrulaması başarılı, şimdi Firestore'a yaz (client-side)
      const { createUser } = await import('@/lib/firestore');
      const trialExpiresAt = new Date(data.trialExpiresAt);

      await createUser(user.uid, {
        uid: user.uid,
        role: 'accountant',
        plan: 'trial',
        giftCodeUsed: true,
        trialExpiresAt: trialExpiresAt,
        storageLimit: 1000000000000, // 1TB (sınırsız gibi)
      });

      setMessage({ type: 'success', text: data.message || '1 haftalık sınırsız üyelik kazandınız!' });
      setCode('');
      
      // Sayfayı yenile (kullanıcı bilgilerini güncellemek için)
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error: any) {
      console.error('Gift code error:', error);
      setMessage({ type: 'error', text: error.message || 'Bir hata oluştu' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex gap-2">
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="Hediye kodunu girin"
          disabled={loading || userData?.giftCodeUsed}
          className="flex-1 px-4 py-3 border-2 border-purple-300 rounded-lg focus:outline-none focus:border-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <button
          type="submit"
          disabled={loading || userData?.giftCodeUsed}
          className="px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'İşleniyor...' : 'Kullan'}
        </button>
      </div>
      
      {userData?.giftCodeUsed && (
        <p className="text-sm text-green-600 font-medium text-center">
          ✓ Hediye kodunuz zaten kullanılmış
        </p>
      )}
      
      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-50 border-2 border-green-200 text-green-800'
              : 'bg-red-50 border-2 border-red-200 text-red-800'
          }`}
        >
          <p className="font-semibold text-center">{message.text}</p>
        </div>
      )}
    </form>
  );
}

export default function PricingPage() {
  const { user, userData } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [billingPeriod, setBillingPeriod] = useState<'month' | 'year'>('month');

  const handleCheckout = async (plan: PricingPlan) => {
    if (!user || !userData) {
      router.push('/login');
      return;
    }

    setLoading(plan.id);

    try {
      // Create checkout session
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: plan.priceId,
          userId: user.uid,
          planId: plan.id,
          period: billingPeriod,
        }),
      });

      const { sessionId, error } = await response.json();

      if (error) {
        throw new Error(error);
      }

      // Redirect to Stripe Checkout
      const stripe = await stripePromise;
      if (stripe && sessionId) {
        // Use type assertion for redirectToCheckout
        const result = await (stripe as any).redirectToCheckout({
          sessionId,
        });

        if (result?.error) {
          throw new Error(result.error.message);
        }
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      alert('Ödeme işlemi başlatılamadı: ' + error.message);
    } finally {
      setLoading(null);
    }
  };

  const getYearlyPrice = (monthlyPrice: number) => {
    return Math.round(monthlyPrice * 10); // 2 ay indirim
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Fiyatlandırma</h1>
          <p className="text-xl text-gray-600 mb-8">
            İhtiyacınıza uygun planı seçin. İstediğiniz zaman yükseltebilir veya düşürebilirsiniz.
          </p>

          {/* Billing Period Toggle */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <span className={`text-sm font-medium ${billingPeriod === 'month' ? 'text-gray-900' : 'text-gray-500'}`}>
              Aylık
            </span>
            <button
              onClick={() => setBillingPeriod(billingPeriod === 'month' ? 'year' : 'month')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                billingPeriod === 'year' ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  billingPeriod === 'year' ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`text-sm font-medium ${billingPeriod === 'year' ? 'text-gray-900' : 'text-gray-500'}`}>
              Yıllık <span className="text-green-600">(2 ay indirim)</span>
            </span>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-white rounded-2xl shadow-lg border-2 transition-all duration-300 transform hover:-translate-y-2 ${
                plan.popular
                  ? 'border-blue-500 scale-105 shadow-xl'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                    En Popüler
                  </span>
                </div>
              )}

              <div className="p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <p className="text-gray-600 mb-6">{plan.description}</p>

                <div className="mb-6">
                  <span className="text-4xl font-bold text-gray-900">
                    ₺{billingPeriod === 'month' ? plan.price : getYearlyPrice(plan.price)}
                  </span>
                  <span className="text-gray-600 ml-2">
                    /{billingPeriod === 'year' ? 'yıl' : 'ay'}
                  </span>
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <svg
                        className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleCheckout(plan)}
                  disabled={loading === plan.id || !plan.priceId}
                  className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-200 ${
                    plan.popular
                      ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {loading === plan.id ? (
                    <span className="flex items-center justify-center">
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Yükleniyor...
                    </span>
                  ) : !plan.priceId ? (
                    'Yakında'
                  ) : (
                    'Planı Seç'
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Gift Code Section */}
        <div className="max-w-2xl mx-auto mb-16">
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-8 border-2 border-purple-200">
            <h2 className="text-2xl font-bold text-center text-gray-900 mb-4">
              🎁 Hediye Kodu Kullan
            </h2>
            <p className="text-center text-gray-600 mb-6">
              Hediye kodunuz varsa buraya girerek 1 haftalık ücretsiz deneme kazanabilirsiniz
            </p>
            <GiftCodeForm />
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">Sık Sorulan Sorular</h2>
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Plan değiştirebilir miyim?
              </h3>
              <p className="text-gray-600">
                Evet, istediğiniz zaman planınızı yükseltebilir veya düşürebilirsiniz. Değişiklik anında geçerli olur.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Ödeme nasıl yapılır?
              </h3>
              <p className="text-gray-600">
                Stripe üzerinden güvenli bir şekilde kredi kartı ile ödeme yapabilirsiniz. Tüm ödemeler SSL ile korunur.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                İptal edebilir miyim?
              </h3>
              <p className="text-gray-600">
                Evet, istediğiniz zaman iptal edebilirsiniz. İptal sonrası planınızın sonuna kadar erişiminiz devam eder.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

