# 📦 Karaman Medikal Stok Takip Sistemi

Modern ve kullanıcı dostu bir medikal stok yönetimi, müşteri takibi ve iş organizasyon sistemi.

> **🎉 v5.0 - Supabase Migration + AI Entegrasyonları!** Bu proje FastAPI + MongoDB'den Supabase (PostgreSQL) ile tamamen serverless mimariye taşındı. Gemini AI ve MetalPrice API entegrasyonları eklendi. Detaylar için [SUPABASE_MIGRATION_GUIDE.md](SUPABASE_MIGRATION_GUIDE.md) ve [API_INTEGRATIONS.md](API_INTEGRATIONS.md) dosyalarına bakın.

## ✨ Özellikler

### 📊 Stok Yönetimi
- Ürün ekleme, düzenleme, silme
- **🤖 AI ile Otomatik Açıklama Oluşturma** (Gemini AI)
- Barkod ile ürün arama
- Kamera ile barkod okuma ve fotoğraf çekme
- Kutu/adet bazında satış takibi
- Stok uyarıları ve filtreleme
- **💰 Fiyat karşılaştırma** sistemi

### 👥 Müşteri Yönetimi
- Müşteri kayıt ve takibi
- Soft delete (geri getirilebilir silme)
- Detaylı müşteri bilgileri

### 📅 Takvim ve Etkinlikler
- Randevu ve etkinlik yönetimi
- Çift tıklama ile hızlı ekleme
- Detaylı etkinlik görüntüleme

### 💰 Satış Noktası (POS)
- Hızlı satış işlemleri
- Sepet yönetimi
- Ödeme takibi

### 📈 Raporlama
- Satış raporları
- Stok raporları
- En çok satan ve en karlı ürünler
- **💱 Gerçek Zamanlı Kur Bilgileri** (USD, EUR, Altın, Gümüş)
- PDF/Excel/TXT export desteği

### 📱 PWA Desteği
- Mobil cihaza kurulabilir
- Offline çalışma
- Hızlı yükleme
- Native uygulama deneyimi

## 🚀 Hızlı Başlangıç

### Admin Girişi

Uygulama otomatik olarak bir admin kullanıcısı oluşturur:

```
Kullanıcı Adı: admin
Şifre:         Admin123!
```

> ⚠️ **Güvenlik:** İlk girişten sonra şifrenizi mutlaka değiştirin!

## 📚 Dokümantasyon

- **[Supabase Migration Guide](SUPABASE_MIGRATION_GUIDE.md)** - 🆕 Detaylı migrasyon rehberi
- **[API Integrations Guide](API_INTEGRATIONS.md)** - 🆕 Gemini AI, MetalPrice API, Fiyat Karşılaştırma dokümantasyonu
- **[Changelog](CHANGELOG.md)** - Tüm versiyon değişiklikleri
- **[PWA Kurulum Rehberi](PWA_KURULUM_REHBERI.md)** - Progressive Web App kurulumu
- **[Admin Bilgileri](ADMIN_BILGILERI.md)** - Admin kullanıcı bilgileri

## 🛠️ Teknolojiler

### Backend (Serverless)
- **Supabase** (PostgreSQL Database + Auth)
- Row Level Security (RLS)
- PostgreSQL Functions (RPC)
- bcrypt password hashing

### Frontend
- React 19
- Tailwind CSS
- Radix UI Components
- React Router
- Supabase JS Client
- PWA Support

### External APIs
- **Gemini AI** (Google) - Ürün açıklaması oluşturma
- **MetalPrice API** - Altın/Gümüş fiyatları
- **ExchangeRate API** - Döviz kurları

## 📦 Kurulum

### Gereksinimler
- Node.js 16+
- Yarn package manager
- Supabase hesabı ([supabase.com](https://supabase.com))
- Gemini API key ([makersuite.google.com](https://makersuite.google.com))

### Frontend

```bash
cd frontend
yarn install

# .env dosyasını yapılandırın:
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
REACT_APP_GEMINI_API_KEY=your_gemini_api_key
REACT_APP_METAL_PRICE_API_KEY=free

yarn start
```

### Supabase Database Setup

1. Supabase hesabı oluşturun
2. Yeni proje oluşturun
3. SQL Editor'de `supabase-schema.sql` dosyasını çalıştırın
4. API bilgilerini `.env` dosyasına ekleyin

Detaylı kurulum için [SUPABASE_MIGRATION_GUIDE.md](SUPABASE_MIGRATION_GUIDE.md) dosyasına bakın.

## 🌐 PWA Kurulumu

Uygulama Progressive Web App özelliklerine sahiptir. Detaylı kurulum talimatları için [PWA Kurulum Rehberi](PWA_KURULUM_REHBERI.md) dosyasına bakın.

### Hızlı PWA Kurulumu

**Android (Chrome):**
1. Chrome'da uygulamayı açın
2. ⋮ menü → "Ana ekrana ekle"
3. "Yükle" butonuna tıklayın

**iOS (Safari):**
1. Safari'de uygulamayı açın
2. Paylaş 📤 → "Ana Ekrana Ekle"
3. "Ekle" butonuna tıklayın

## 🔒 Güvenlik

- Custom authentication with bcrypt password hashing
- Row Level Security (RLS) policies
- Role-based access control (yönetici/depo/satış)
- PostgreSQL RPC functions for secure operations
- Environment variables for API keys

## 📄 Lisans

Bu proje özel kullanım için geliştirilmiştir.

## 🤝 Katkıda Bulunma

Katkılarınızı bekliyoruz! Pull request göndermekten çekinmeyin.

---

**Made with ❤️ using Emergent.sh**
