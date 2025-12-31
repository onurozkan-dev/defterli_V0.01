# Defterli

Muhasebeciler için web tabanlı fatura PDF arşiv sistemi. Muhasebeciler birden fazla müşteriyi yönetebilir, fatura PDF'lerini güvenli bir şekilde saklayabilir, arayıp filtreleyebilir ve müşterileriyle salt okunur linkler paylaşabilir.

## Teknoloji Yığını

- **Next.js** (App Router) - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Firebase Auth** - Authentication
- **Firestore** - Metadata storage
- **Firebase Storage** - PDF file storage

## Kullanıcı Rolleri

- **Muhasebeci** (ana kullanıcı) - Giriş yaparak sistemi kullanır
- **Müşteri** (giriş yok) - Sadece paylaşılan link ile fatura görüntüleyebilir

## Temel Özellikler (MVP)

- ✅ Muhasebeci kimlik doğrulama (e-posta/şifre)
- ✅ Müşteri oluşturma ve yönetme
- ✅ Müşteri bazında fatura PDF yükleme
- ✅ PDF'leri Firebase Storage'da saklama
- ✅ Fatura listeleme:
  - Arama (müşteri adı, ID)
  - Filtreleme (tarih aralığı)
  - PDF önizleme (tarayıcıda)
  - PDF indirme
- ✅ Paylaşım linki oluşturma (24 saat geçerli, salt okunur)
- ✅ AI Asistan (sağ alt köşede chat widget)
- ✅ Rehberli Tur (ilk kullanım için tutorial)

## Kurulum

### Gereksinimler

- Node.js 18+ 
- npm veya yarn
- Firebase projesi

### Adımlar

1. Projeyi klonlayın veya indirin:
```bash
cd gib
```

2. Bağımlılıkları yükleyin:
```bash
npm install
```

3. Firebase yapılandırması:
   - **Detaylı kurulum için `FIREBASE_SETUP.md` dosyasına bakın**
   - Firebase Console'da yeni bir proje oluşturun
   - Authentication'ı etkinleştirin (Email/Password ve Google)
   - Firestore Database oluşturun
   - Storage'ı etkinleştirin
   - Firebase yapılandırma bilgilerini alın

4. Environment variables oluşturun:
`.env.local` dosyası oluşturun ve `.env.example` dosyasını referans alarak gerekli değişkenleri ekleyin:
```bash
cp .env.example .env.local
```

Ardından `.env.local` dosyasını düzenleyerek kendi Firebase, OpenAI ve Stripe bilgilerinizi ekleyin.

5. Firebase Security Rules:
   - Firestore Rules: `firestore.rules` dosyasındaki kuralları Firebase Console'da deploy edin
   - Storage Rules: `storage.rules` dosyasındaki kuralları Firebase Console'da deploy edin

6. Development server'ı başlatın:
```bash
npm run dev
```

Tarayıcınızda [http://localhost:3000](http://localhost:3000) adresine gidin.

## Veritabanı Yapısı

### Firestore Collections

**users/{uid}**
- `role`: "accountant"
- `plan`: string (optional)
- `storageUsed`: number
- `storageLimit`: number
- `createdAt`: timestamp

**clients/{clientId}**
- `uid`: string (accountant user ID)
- `name`: string
- `taxId`: string
- `createdAt`: timestamp

**invoices/{invoiceId}**
- `uid`: string (accountant user ID)
- `clientId`: string
- `invoiceDate`: timestamp
- `amount`: number
- `pdfPath`: string
- `createdAt`: timestamp

**shareLinks/{token}**
- `invoiceId`: string
- `expiresAt`: timestamp
- `createdAt`: timestamp

### Storage Yapısı

```
invoices/{uid}/{clientId}/{YYYY}/{MM}/{invoiceId}.pdf
```

## Sayfalar

- `/` - Landing page
- `/login` - Giriş/Kayıt sayfası
- `/app` - Dashboard (özet istatistikler)
- `/app/clients` - Müşteri listesi ve yönetimi
- `/app/invoices` - Fatura listesi (arama, filtre, önizleme)
- `/app/upload` - PDF yükleme sayfası
- `/app/settings` - Ayarlar sayfası
- `/share/[token]` - Paylaşım linki görüntüleme sayfası

## Güvenlik

- Kullanıcılar sadece kendi verilerine erişebilir
- Storage erişimi kullanıcı klasörü ile sınırlıdır
- Paylaşım linkleri 24 saat geçerlidir
- Paylaşım linkleri salt okunurdur (sadece görüntüleme ve indirme)

## Notlar

- MVP'de GIB entegrasyonu yok
- Otomatik fatura çekme yok
- Basitlik ve hıza odaklanılmış

## Build

Production build için:
```bash
npm run build
npm start
```
