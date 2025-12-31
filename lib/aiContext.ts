import { usePathname } from 'next/navigation';

const SYSTEM_INFO = `
# Defterli - Fatura Arşiv Sistemi

## Sistem Hakkında
Defterli, muhasebeciler için tasarlanmış web tabanlı bir fatura PDF arşiv sistemidir. Muhasebeciler birden fazla müşteriyi yönetebilir, fatura PDF'lerini güvenli bir şekilde saklayabilir, arayıp filtreleyebilir ve müşterileriyle salt okunur linkler paylaşabilir.

## Teknoloji Yığını
- Next.js (App Router) - React framework
- TypeScript - Type safety
- Tailwind CSS - Styling
- Firebase Auth - Authentication
- Firestore - Metadata storage
- Firebase Storage - PDF file storage

## Kullanıcı Rolleri
- Muhasebeci (ana kullanıcı) - Giriş yaparak sistemi kullanır
- Müşteri (giriş yok) - Sadece paylaşılan link ile fatura görüntüleyebilir

## Temel Özellikler
1. Muhasebeci kimlik doğrulama (e-posta/şifre)
2. Müşteri oluşturma ve yönetme
3. Müşteri bazında fatura PDF yükleme
4. PDF'leri Firebase Storage'da saklama
5. Fatura listeleme:
   - Arama (müşteri adı, ID)
   - Filtreleme (tarih aralığı)
   - PDF önizleme (tarayıcıda)
   - PDF indirme
6. Paylaşım linki oluşturma (24 saat geçerli, salt okunur)

## Sayfalar ve Kullanım

### Ana Sayfa (/)
- Landing page, giriş yapma veya demo modunda devam etme seçeneği

### Giriş Sayfası (/login)
- E-posta ve şifre ile giriş yapma veya kayıt olma
- Demo modu aktifse giriş yapmadan devam edilebilir

### Dashboard (/app)
- Özet istatistikler: müşteri sayısı, fatura sayısı, depolama kullanımı
- Hızlı erişim linkleri

### Müşteriler Sayfası (/app/clients)
- Müşteri listesi görüntüleme
- Yeni müşteri ekleme (ad, vergi no/TCKN)
- Müşterileri listeleme ve görüntüleme

### Faturalar Sayfası (/app/invoices)
- Fatura listesi görüntüleme
- Arama: müşteri adı, ID ile arama
- Filtreleme: tarih aralığı ile filtreleme
- PDF önizleme: tarayıcıda PDF görüntüleme
- PDF indirme
- Paylaşım linki oluşturma (24 saat geçerli)

### Yükleme Sayfası (/app/upload)
- Müşteri seçme
- Fatura tarihi girme
- Tutar girme
- PDF dosyası yükleme
- Not: Önce müşteri oluşturulmalı

### Ayarlar Sayfası (/app/settings)
- Hesap bilgileri görüntüleme
- Depolama bilgileri görüntüleme

### Paylaşım Linki (/share/[token])
- Paylaşılan fatura görüntüleme
- PDF önizleme ve indirme
- 24 saat geçerlidir

## Veritabanı Yapısı

### Firestore Collections
- users/{uid}: Kullanıcı bilgileri (role, plan, storageUsed, storageLimit)
- clients/{clientId}: Müşteri bilgileri (uid, name, taxId, createdAt)
- invoices/{invoiceId}: Fatura bilgileri (uid, clientId, invoiceDate, amount, pdfPath, createdAt)
- shareLinks/{token}: Paylaşım linkleri (invoiceId, expiresAt, createdAt)

### Storage Yapısı
invoices/{uid}/{clientId}/{YYYY}/{MM}/{invoiceId}.pdf

## Demo Modu
Demo modu aktifse (NEXT_PUBLIC_DEMO_MODE=true), Firebase yapılandırması olmadan da sistem çalışır. Veriler localStorage'da saklanır.
`;

export function getPageContext(pathname: string): string {
  const pageContexts: Record<string, string> = {
    '/': 'Kullanıcı ana sayfada. Burada giriş yapabilir veya demo modunda devam edebilir.',
    '/login': 'Kullanıcı giriş sayfasında. E-posta ve şifre ile giriş yapabilir veya kayıt olabilir.',
    '/app': 'Kullanıcı dashboard sayfasında. Özet istatistikleri görüntülüyor.',
    '/app/clients': 'Kullanıcı müşteriler sayfasında. Müşteri ekleyebilir veya mevcut müşterileri görüntüleyebilir.',
    '/app/invoices': 'Kullanıcı faturalar sayfasında. Faturaları arayabilir, filtreleyebilir, önizleyebilir ve paylaşabilir.',
    '/app/upload': 'Kullanıcı fatura yükleme sayfasında. Yeni fatura PDF\'i yükleyebilir.',
    '/app/settings': 'Kullanıcı ayarlar sayfasında. Hesap ve depolama bilgilerini görüntülüyor.',
  };

  return pageContexts[pathname] || `Kullanıcı ${pathname} sayfasında.`;
}

export function buildContext(
  pathname: string,
  isDemoMode: boolean,
  isAuthenticated: boolean
): string {
  const pageContext = getPageContext(pathname);
  const modeContext = isDemoMode
    ? 'Demo modu aktif. Veriler localStorage\'da saklanıyor.'
    : 'Normal mod aktif. Firebase kullanılıyor.';
  const authContext = isAuthenticated
    ? 'Kullanıcı giriş yapmış durumda.'
    : 'Kullanıcı giriş yapmamış durumda.';

  return `${SYSTEM_INFO}

## Mevcut Durum
- Sayfa: ${pageContext}
- Mod: ${modeContext}
- Kimlik Doğrulama: ${authContext}

Kullanıcıya bu bilgilere göre yardımcı ol.`;
}

