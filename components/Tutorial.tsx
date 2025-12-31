'use client';

import { useEffect, useState, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

const TUTORIAL_STORAGE_KEY = 'defterli_tutorial_completed';

interface TutorialStep {
  element?: string;
  title: string;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

const TUTORIAL_STEPS: Record<string, TutorialStep[]> = {
  '/app': [
    {
      title: 'Hoş Geldiniz! 👋',
      content: 'Defterli\'ye hoş geldiniz! Bu dashboard sayfası sisteminizin özet bilgilerini gösterir. Buradan müşteri sayınızı, fatura sayınızı ve depolama kullanımınızı takip edebilirsiniz.',
      position: 'bottom',
    },
    {
      title: 'Müşteri İstatistiği',
      content: 'Bu kart toplam müşteri sayınızı gösterir. "Tümünü gör" linkine tıklayarak müşteriler sayfasına gidebilir ve müşterilerinizi yönetebilirsiniz.',
      position: 'bottom',
    },
    {
      title: 'Fatura İstatistiği',
      content: 'Bu kart toplam fatura sayınızı gösterir. "Tümünü gör" linkine tıklayarak faturalar sayfasına gidebilir, faturalarınızı arayabilir ve yönetebilirsiniz.',
      position: 'bottom',
    },
    {
      title: 'Depolama Bilgisi',
      content: 'Bu kart depolama kullanımınızı gösterir. Ne kadar alan kullandığınızı ve limitinizi buradan takip edebilirsiniz. "Yeni yükle" linkine tıklayarak yeni fatura ekleyebilirsiniz.',
      position: 'bottom',
    },
  ],
  '/app/clients': [
    {
      title: 'Müşteriler Sayfası 📋',
      content: 'Bu sayfada tüm müşterilerinizi görüntüleyebilir ve yönetebilirsiniz. Müşterilerinizi buradan ekleyebilir, listeleyebilir ve bilgilerini görüntüleyebilirsiniz.',
      position: 'bottom',
    },
    {
      title: 'Yeni Müşteri Ekleme',
      content: 'Sağ üstteki "+ Yeni Müşteri" butonuna tıklayarak yeni müşteri ekleme formunu açabilirsiniz. Bu butona tıkladığınızda form açılacak ve müşteri bilgilerini girebileceksiniz.',
      position: 'bottom',
    },
    {
      title: 'Müşteri Bilgileri',
      content: 'Müşteri eklerken iki bilgi girmeniz gerekiyor:\n\n1. Müşteri Adı: Müşterinin tam adını veya şirket adını girin\n2. Vergi No / TCKN: Müşterinin vergi numarası veya TC kimlik numarasını girin\n\nHer iki alan da zorunludur.',
      position: 'bottom',
    },
    {
      title: 'Müşteri Kaydetme',
      content: 'Bilgileri girdikten sonra "Kaydet" butonuna tıklayın. Müşteri başarıyla eklendikten sonra listede görünecektir. Form otomatik olarak kapanacak ve yeni müşteriyi görebileceksiniz.',
      position: 'bottom',
    },
    {
      title: 'Müşteri Listesi',
      content: 'Eklediğiniz tüm müşteriler bu listede görüntülenir. Her müşteri için ad, vergi no ve oluşturulma tarihi gösterilir. Müşterilerinizi buradan takip edebilirsiniz.',
      position: 'bottom',
    },
  ],
  '/app/invoices': [
    {
      title: 'Faturalar Sayfası 📄',
      content: 'Bu sayfada tüm faturalarınızı görüntüleyebilir, arayabilir, filtreleyebilir ve yönetebilirsiniz. Faturalarınızı buradan önizleyebilir, indirebilir ve müşterilerinizle paylaşabilirsiniz.',
      position: 'bottom',
    },
    {
      title: 'Arama Özelliği',
      content: 'Arama kutusuna müşteri adı, vergi numarası veya fatura ID\'si yazarak faturalarınızı hızlıca bulabilirsiniz. Örneğin: "ABC Şirketi" veya "1234567890" yazarak arama yapabilirsiniz.',
      position: 'bottom',
    },
    {
      title: 'Tarih Filtreleme',
      content: 'Başlangıç ve bitiş tarihi seçerek belirli bir tarih aralığındaki faturaları filtreleyebilirsiniz. Örneğin, sadece bu ayın faturalarını görmek için bu ayın başlangıç ve bitiş tarihlerini seçin.',
      position: 'bottom',
    },
    {
      title: 'Filtreleme',
      content: 'Arama ve tarih bilgilerini girdikten sonra "Filtrele" butonuna tıklayın. Sistem belirttiğiniz kriterlere göre faturaları filtreleyecektir. Sonuçları görmek için listeye bakın.',
      position: 'bottom',
    },
    {
      title: 'Fatura İşlemleri',
      content: 'Her fatura için üç işlem yapabilirsiniz:\n\n1. Önizle: PDF\'i tarayıcıda görüntüleyin\n2. İndir: PDF\'i bilgisayarınıza indirin\n3. Paylaş: Müşterinizle paylaşmak için 24 saatlik link oluşturun',
      position: 'bottom',
    },
    {
      title: 'Paylaşım Linki',
      content: 'Paylaş butonuna tıkladığınızda, fatura için 24 saat geçerli bir paylaşım linki oluşturulur. Bu linki müşterinize gönderebilirsiniz. Müşteri linke tıklayarak faturayı görüntüleyebilir ve indirebilir.',
      position: 'bottom',
    },
  ],
  '/app/upload': [
    {
      title: 'Fatura Yükleme Sayfası 📤',
      content: 'Bu sayfada yeni fatura PDF\'lerini sisteme yükleyebilirsiniz. Fatura yüklemek için önce bir müşteri oluşturmanız gerektiğini unutmayın. Eğer henüz müşteri yoksa, önce müşteriler sayfasına gidip müşteri ekleyin.',
      position: 'bottom',
    },
    {
      title: 'Müşteri Seçimi',
      content: 'İlk adım olarak faturayı hangi müşteri için yüklediğinizi seçmeniz gerekiyor. "Müşteri seçin" dropdown menüsünden müşteriyi seçin. Eğer müşteri yoksa, müşteriler sayfasına gidip önce müşteri ekleyin.',
      position: 'bottom',
    },
    {
      title: 'Fatura Tarihi',
      content: 'Faturanın tarihini seçin. Tarih seçiciyi kullanarak fatura tarihini girin. Bu tarih faturayı filtrelerken ve sıralarken kullanılacaktır.',
      position: 'bottom',
    },
    {
      title: 'Fatura Tutarı',
      content: 'Faturanın tutarını girin. Tutarı Türk Lirası cinsinden girin. Örneğin: 1500.50 gibi. Ondalık kısım için nokta (.) kullanın.',
      position: 'bottom',
    },
    {
      title: 'PDF Dosyası Seçme',
      content: 'Fatura PDF dosyasını seçin. "PDF Dosyası" alanına tıklayarak bilgisayarınızdan PDF dosyasını seçin. Sadece PDF formatındaki dosyalar kabul edilir. Dosya seçildikten sonra dosya adı görünecektir.',
      position: 'bottom',
    },
    {
      title: 'Fatura Yükleme',
      content: 'Tüm bilgileri doldurduktan sonra "Yükle" butonuna tıklayın. Sistem faturayı yükleyecek ve faturalar sayfasına yönlendirecektir. Yüklenen faturayı faturalar sayfasında görebilirsiniz.',
      position: 'bottom',
    },
  ],
};

export default function Tutorial() {
  const pathname = usePathname();
  const { userData, isDemoMode, loading } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [showTutorial, setShowTutorial] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const hasCheckedRef = useRef(false);

  useEffect(() => {
    // Reset check when pathname changes
    hasCheckedRef.current = false;
  }, [pathname]);

  useEffect(() => {
    // Check if tutorial was completed for this user and page
    if (typeof window === 'undefined') return;
    if (loading) return; // Wait for auth to load
    if (hasCheckedRef.current) return; // Only check once per pathname
    hasCheckedRef.current = true;

    // Get user identifier (uid for authenticated users, 'demo' for demo mode)
    const userId = userData?.uid || (isDemoMode ? 'demo' : null);
    if (!userId) return;

    const userTutorialKey = `${TUTORIAL_STORAGE_KEY}_${userId}_${pathname}`;
    const completed = localStorage.getItem(userTutorialKey);
    const steps = TUTORIAL_STEPS[pathname];

    if (!completed && steps && steps.length > 0) {
      // Show tutorial after a short delay
      setTimeout(() => {
        setShowTutorial(true);
        setIsVisible(true);
      }, 1000);
    }
  }, [pathname, userData, isDemoMode, loading]);

  const steps = TUTORIAL_STEPS[pathname] || [];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = () => {
    setIsVisible(false);
    setTimeout(() => {
      setShowTutorial(false);
      if (typeof window !== 'undefined') {
        // Mark tutorial as completed for this user and page
        const userId = userData?.uid || (isDemoMode ? 'demo' : null);
        if (userId) {
          const userTutorialKey = `${TUTORIAL_STORAGE_KEY}_${userId}_${pathname}`;
          localStorage.setItem(userTutorialKey, 'true');
        }
      }
    }, 300);
  };

  if (!showTutorial || steps.length === 0) {
    return null;
  }

  const step = steps[currentStep];

  return (
    <>
      {/* Overlay */}
      {isVisible && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
          onClick={handleSkip}
        />
      )}

      {/* Tutorial Card */}
      {isVisible && (
        <div
          className={`fixed z-50 bg-white rounded-lg shadow-2xl p-6 max-w-lg transition-all ${
            isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          }`}
          style={{
            bottom: step.position === 'top' ? 'auto' : '80px',
            top: step.position === 'top' ? '80px' : 'auto',
            left: step.position === 'right' ? 'auto' : '50%',
            right: step.position === 'right' ? '80px' : 'auto',
            transform: step.position === 'right' ? 'none' : 'translateX(-50%)',
            maxHeight: '80vh',
            overflowY: 'auto',
          }}
        >
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{step.title}</h3>
              <p className="text-sm text-gray-500 mt-1">
                {currentStep + 1} / {steps.length}
              </p>
            </div>
            <button
              onClick={handleSkip}
              className="text-gray-400 hover:text-gray-600"
              aria-label="Kapat"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div className="text-gray-700 mb-6">
            <p className="whitespace-pre-line leading-relaxed">{step.content}</p>
          </div>

          <div className="flex justify-between items-center">
            <button
              onClick={handleSkip}
              className="text-gray-500 hover:text-gray-700 text-sm"
            >
              Atla
            </button>
            <div className="flex gap-2">
              {currentStep > 0 && (
                <button
                  onClick={() => setCurrentStep(currentStep - 1)}
                  className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Geri
                </button>
              )}
              <button
                onClick={handleNext}
                className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                {currentStep < steps.length - 1 ? 'İleri' : 'Tamam'}
              </button>
            </div>
          </div>

          {/* Progress dots */}
          <div className="flex justify-center gap-2 mt-4">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-2 w-2 rounded-full ${
                  index === currentStep ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>
      )}
    </>
  );
}

