# Firebase Authentication Kurulum Rehberi

Bu rehber, Defterli uygulaması için Firebase Authentication'ı nasıl kuracağınızı adım adım açıklar.

## Adım 1: Firebase Projesi Oluşturma

1. [Firebase Console](https://console.firebase.google.com/) adresine gidin
2. "Add project" (Proje Ekle) butonuna tıklayın
3. Proje adını girin (örn: "defterli")
4. Google Analytics'i etkinleştirmek isteyip istemediğinizi seçin (opsiyonel)
5. "Create project" (Proje Oluştur) butonuna tıklayın

## Adım 2: Web Uygulaması Ekleme

1. Firebase Console'da projenizi açın
2. Sol menüden "Project settings" (⚙️) ikonuna tıklayın
3. Aşağı kaydırın ve "Your apps" bölümünde "</>" (Web) ikonuna tıklayın
4. App nickname girin (örn: "Defterli Web")
5. "Register app" butonuna tıklayın
6. Firebase yapılandırma bilgilerinizi kopyalayın (sonraki adımda kullanılacak)

## Adım 3: Authentication'ı Etkinleştirme

1. Firebase Console'da sol menüden "Authentication" seçin
2. "Get started" butonuna tıklayın
3. "Sign-in method" (Giriş yöntemleri) sekmesine gidin
4. **Email/Password** provider'ını etkinleştirin:
   - "Email/Password" satırına tıklayın
   - "Enable" toggle'ını açın
   - "Save" butonuna tıklayın
5. **Google** provider'ını etkinleştirin:
   - "Google" satırına tıklayın
   - "Enable" toggle'ını açın
   - Support email seçin (proje email'iniz)
   - "Save" butonuna tıklayın

## Adım 4: Firestore Database Oluşturma

1. Sol menüden "Firestore Database" seçin
2. "Create database" butonuna tıklayın
3. "Start in test mode" seçin (geliştirme için)
4. Location seçin (örn: "europe-west1" - Türkiye'ye yakın)
5. "Enable" butonuna tıklayın

**Önemli:** Test modunda tüm erişim açıktır. Production'da security rules kullanın!

## Adım 5: Storage'ı Etkinleştirme

1. Sol menüden "Storage" seçin
2. "Get started" butonuna tıklayın
3. Security rules için "Start in test mode" seçin
4. Location seçin (Firestore ile aynı olabilir)
5. "Done" butonuna tıklayın

## Adım 6: Environment Variables Ekleme

Proje kök dizininde `.env.local` dosyası oluşturun ve Firebase yapılandırma bilgilerinizi ekleyin:

```bash
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Demo Mode (opsiyonel - true yaparsanız demo modu aktif olur)
NEXT_PUBLIC_DEMO_MODE=false

# OpenAI API Key (AI Asistan için - opsiyonel)
OPENAI_API_KEY=your_openai_api_key
```

**Firebase yapılandırma bilgilerini nereden bulabilirim?**
- Firebase Console > Project Settings > Your apps > Web app
- Veya Firebase Console > Project Settings > General > Your apps

## Adım 7: Security Rules Deploy Etme

### Firestore Rules

1. Firebase Console'da "Firestore Database" > "Rules" sekmesine gidin
2. `firestore.rules` dosyasındaki kuralları kopyalayıp yapıştırın:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users - users can only read/write their own user document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Clients - users can only access their own clients
    match /clients/{clientId} {
      allow read, write: if request.auth != null && 
        (request.auth.uid == resource.data.uid || request.auth.uid == request.resource.data.uid);
    }
    
    // Invoices - users can only access their own invoices
    match /invoices/{invoiceId} {
      allow read, write: if request.auth != null && 
        (request.auth.uid == resource.data.uid || request.auth.uid == request.resource.data.uid);
    }
    
    // Share links - anyone can read if token is valid (checked by expiration in app logic)
    match /shareLinks/{token} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

3. "Publish" butonuna tıklayın

### Storage Rules

1. Firebase Console'da "Storage" > "Rules" sekmesine gidin
2. `storage.rules` dosyasındaki kuralları kopyalayıp yapıştırın:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Invoice PDFs - users can only access files in their own folder
    match /invoices/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

3. "Publish" butonuna tıklayın

## Adım 8: Test Etme

1. Development server'ı başlatın:
   ```bash
   npm run dev
   ```

2. Tarayıcıda `http://localhost:3000` adresine gidin

3. "Giriş Yap" butonuna tıklayın

4. Yeni hesap oluşturun veya Google ile giriş yapın

5. Giriş yaptıktan sonra `/app` sayfasına yönlendirilmelisiniz

## Sorun Giderme

### "Firebase yapılandırması eksik" hatası
- `.env.local` dosyasının proje kök dizininde olduğundan emin olun
- Server'ı yeniden başlatın (`npm run dev`)
- Environment variable'ların `NEXT_PUBLIC_` ile başladığından emin olun

### "Permission denied" hatası
- Firestore ve Storage security rules'ları deploy ettiğinizden emin olun
- Rules'ların doğru olduğundan emin olun

### Google ile giriş çalışmıyor
- Firebase Console'da Google provider'ın etkin olduğundan emin olun
- OAuth consent screen'i yapılandırın (Google Cloud Console'da)

## Önemli Notlar

- **Test Mode:** Geliştirme aşamasında test mode kullanabilirsiniz, ancak production'da mutlaka security rules kullanın
- **API Keys:** Firebase API keys client-side'da kullanılır ve güvenlidir, ancak domain restrictions ekleyebilirsiniz
- **Billing:** Firestore ve Storage için ücretsiz kotanın üzerinde kullanım yaparsanız ücretlendirilirsiniz

## Destek

Sorun yaşarsanız:
1. Browser console'u kontrol edin (F12)
2. Firebase Console'da "Authentication" > "Users" sekmesinde kullanıcıların oluştuğunu kontrol edin
3. Firebase Console'da "Firestore Database" > "Data" sekmesinde verilerin kaydedildiğini kontrol edin

