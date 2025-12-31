# Stripe Ödeme Entegrasyonu Kurulum Rehberi

Bu rehber, Defterli uygulaması için Stripe ödeme entegrasyonunu nasıl kuracağınızı adım adım açıklar.

## Adım 1: Stripe Hesabı Oluşturma

1. [Stripe](https://stripe.com) adresine gidin
2. "Sign up" ile yeni hesap oluşturun
3. Hesabınızı doğrulayın ve giriş yapın

## Adım 2: API Anahtarlarını Alma

1. Stripe Dashboard'a giriş yapın
2. Sol menüden "Developers" > "API keys" seçin
3. **Test modunda** çalışıyorsanız:
   - "Publishable key" (pk_test_...) kopyalayın
   - "Secret key" (sk_test_...) kopyalayın (Reveal test key butonuna tıklayın)
4. **Production modunda** çalışıyorsanız:
   - "Live mode" toggle'ını açın
   - "Publishable key" (pk_live_...) kopyalayın
   - "Secret key" (sk_live_...) kopyalayın

## Adım 3: Ürün ve Fiyat Oluşturma

1. Stripe Dashboard'da "Products" > "Add product" seçin
2. Her plan için bir ürün oluşturun:

### Başlangıç Planı
- **Name:** Başlangıç
- **Description:** Küçük işletmeler için ideal
- **Pricing:** 
  - Recurring: Monthly
  - Price: 99 TRY
  - Billing period: Monthly
- "Save product" butonuna tıklayın
- Oluşan **Price ID**'yi kopyalayın (örn: `price_1ABC123...`)

### Profesyonel Planı
- **Name:** Profesyonel
- **Description:** Büyüyen işletmeler için
- **Pricing:**
  - Recurring: Monthly
  - Price: 299 TRY
  - Billing period: Monthly
- "Save product" butonuna tıklayın
- Oluşan **Price ID**'yi kopyalayın

### Kurumsal Planı
- **Name:** Kurumsal
- **Description:** Büyük ekipler için
- **Pricing:**
  - Recurring: Monthly
  - Price: 799 TRY
  - Billing period: Monthly
- "Save product" butonuna tıklayın
- Oluşan **Price ID**'yi kopyalayın

**Not:** Yıllık planlar için ayrı bir fiyat oluşturmanız gerekebilir.

## Adım 4: Webhook Endpoint Oluşturma

1. Stripe Dashboard'da "Developers" > "Webhooks" seçin
2. "Add endpoint" butonuna tıklayın
3. **Endpoint URL:** `https://yourdomain.com/api/webhook`
   - Development için: `https://your-ngrok-url.ngrok.io/api/webhook` (ngrok kullanarak)
   - Production için: `https://yourdomain.com/api/webhook`
4. **Events to send:** Şu eventleri seçin:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. "Add endpoint" butonuna tıklayın
6. **Signing secret**'ı kopyalayın (whsec_...)

## Adım 5: Environment Variables Ekleme

`.env.local` dosyanıza şu değişkenleri ekleyin:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_... # veya sk_live_... (production için)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_... # veya pk_live_... (production için)
STRIPE_WEBHOOK_SECRET=whsec_... # Webhook signing secret

# Stripe Price IDs (her plan için)
NEXT_PUBLIC_STRIPE_PRICE_STARTER=price_1ABC123... # Başlangıç planı Price ID
NEXT_PUBLIC_STRIPE_PRICE_PROFESSIONAL=price_1DEF456... # Profesyonel planı Price ID
NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE=price_1GHI789... # Kurumsal planı Price ID

# Base URL (webhook ve success URL için)
NEXT_PUBLIC_BASE_URL=http://localhost:3000 # Development için
# NEXT_PUBLIC_BASE_URL=https://yourdomain.com # Production için
```

## Adım 6: Development için Webhook Test Etme

### Yerel Geliştirme için ngrok Kullanımı

1. [ngrok](https://ngrok.com/) indirin ve kurun
2. Terminal'de şu komutu çalıştırın:
   ```bash
   ngrok http 3000
   ```
3. ngrok'un verdiği HTTPS URL'ini kopyalayın (örn: `https://abc123.ngrok.io`)
4. Stripe Dashboard'da webhook endpoint URL'ini bu URL ile güncelleyin:
   - `https://abc123.ngrok.io/api/webhook`
5. Webhook'u test edin

### Alternatif: Stripe CLI

1. [Stripe CLI](https://stripe.com/docs/stripe-cli) kurun
2. Terminal'de şu komutu çalıştırın:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhook
   ```
3. CLI'nin verdiği webhook signing secret'ı `.env.local` dosyasına ekleyin

## Adım 7: Test Kartları

Stripe test modunda şu kartları kullanabilirsiniz:

- **Başarılı ödeme:** `4242 4242 4242 4242`
- **3D Secure:** `4000 0025 0000 3155`
- **Başarısız ödeme:** `4000 0000 0000 0002`

**CVV:** Herhangi bir 3 haneli sayı (örn: 123)
**Tarih:** Gelecek bir tarih (örn: 12/25)
**ZIP:** Herhangi bir 5 haneli sayı (örn: 12345)

## Adım 8: Production'a Geçiş

1. Stripe Dashboard'da "Activate account" ile hesabınızı aktifleştirin
2. Gerekli bilgileri doldurun (şirket bilgileri, banka hesabı vb.)
3. Environment variables'ları production değerleriyle güncelleyin:
   - `STRIPE_SECRET_KEY` → `sk_live_...`
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` → `pk_live_...`
   - Production Price ID'lerini kullanın
   - `NEXT_PUBLIC_BASE_URL` → Production domain'iniz
4. Webhook endpoint'i production URL'i ile güncelleyin

## Sorun Giderme

### Webhook çalışmıyor
- Webhook URL'inin doğru olduğundan emin olun
- Webhook signing secret'ın doğru olduğundan emin olun
- Stripe Dashboard'da webhook event loglarını kontrol edin
- Server loglarını kontrol edin

### Ödeme başarılı ama plan güncellenmiyor
- Webhook'un doğru çalıştığından emin olun
- Firestore'da kullanıcı verilerini kontrol edin
- Webhook event loglarını Stripe Dashboard'da kontrol edin

### "Invalid API Key" hatası
- API key'lerin doğru olduğundan emin olun
- Test/Live mod uyumunu kontrol edin
- `.env.local` dosyasının doğru yüklendiğinden emin olun

## Güvenlik Notları

- **Asla** secret key'leri client-side kodda kullanmayın
- Secret key'leri sadece server-side API route'larında kullanın
- Webhook signing secret'ı mutlaka kullanın
- Production'da HTTPS kullanın
- Webhook event'lerini doğrulayın (signature kontrolü)

## Destek

Sorun yaşarsanız:
1. Stripe Dashboard'da "Logs" sekmesini kontrol edin
2. Browser console'u kontrol edin
3. Server loglarını kontrol edin
4. [Stripe Dokümantasyonu](https://stripe.com/docs) referans alın

