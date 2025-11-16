# CHANGELOG
Tüm önemli değişiklikler bu dosyada belgelenmektedir.

## [5.0.0] - 2025-11-16 - SUPABASE MİGRASYONU

### 🎯 Büyük Değişiklikler

#### Backend Tamamen Kaldırıldı
- **Kaldırılan:** FastAPI + MongoDB backend
- **Yeni Sistem:** Supabase (PostgreSQL + API)
- **Etki:** Serverless mimari, daha kolay bakım

### ✅ Eklenenler

#### Supabase Entegrasyonu
- Supabase client kurulumu (`@supabase/supabase-js@2.81.1`)
- Supabase config dosyası (`/app/frontend/src/lib/supabase.js`)
- Kapsamlı API helper library (`/app/frontend/src/lib/api.js` - 650+ satır)
- Database schema dosyası (`/app/supabase-schema.sql` - 262 satır)

#### Database
- 5 PostgreSQL tablosu oluşturuldu:
  - `users` - Kullanıcı yönetimi (custom auth)
  - `products` - Ürün yönetimi
  - `customers` - Müşteri yönetimi (soft delete)
  - `sales` - Satış kayıtları (JSONB items)
  - `calendar_events` - Takvim etkinlikleri
- Row Level Security (RLS) policies
- Database indexes (username, barcode, brand, category, phone)
- Triggers (updated_at otomatik güncelleme)
- PostgreSQL RPC fonksiyonu: `verify_user_password()` (bcrypt doğrulama)

#### Test Verileri
- Default admin kullanıcısı (username: admin, password: Admin123!)
- 5 medikal ürün örneği
- 5 müşteri örneği

#### Dependencies
- `@supabase/supabase-js` - Supabase JavaScript client
- `bcryptjs` - Şifre hash'leme

### 🔄 Değiştirileler

#### Authentication
- **Önceki:** JWT token + axios interceptors
- **Yeni:** Custom users tablosu + localStorage
- Login fonksiyonu Supabase RPC kullanıyor
- Şifre doğrulama PostgreSQL tarafında (pgcrypto)

#### API Çağrıları
- **Önceki:** axios ile REST API (`/api/*` endpoints)
- **Yeni:** Supabase client SDK (direct PostgreSQL queries)
- Tüm CRUD operasyonları Supabase fonksiyonlarına dönüştürüldü

#### Environment Variables
```diff
- REACT_APP_BACKEND_URL=https://...
+ REACT_APP_SUPABASE_URL=https://bqrxjhppxlzcllgwrkxf.supabase.co
+ REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOi...
```

#### App.js
- axios import kaldırıldı
- API constant kaldırıldı
- supabase client export edildi
- Login fonksiyonu basitleştirildi (token yönetimi yok)

#### Login.js
- axios post yerine `loginUser()` fonksiyonu
- Error handling güncellendi

### ❌ Kaldırılanlar

#### Backend Dosyaları (Tamamen Silindi)
- `/app/backend/server.py` (1,205 satır FastAPI)
- `/app/backend/requirements.txt`
- `/app/backend/.env`
- `/app/backend/add_test_data.py`
- **Toplam:** ~1,300+ satır Python kodu

#### Dependencies
- FastAPI
- Motor (MongoDB async driver)
- PyMongo
- Python-jose (JWT)
- Passlib (Password hashing)
- uvicorn

#### Concepts
- JWT token management
- axios interceptors
- Bearer authentication
- REST API endpoints
- MongoDB queries

### 🐛 Düzeltmeler

#### Şifre Doğrulama Sorunu
- **Problem:** bcryptjs tarayıcıda hash karşılaştırması yaparken performans sorunu
- **Çözüm:** PostgreSQL RPC fonksiyonu ile backend tarafında doğrulama
- **Kullanılan:** pgcrypto extension + `crypt()` fonksiyonu

### 📝 Dokümantasyon

#### Yeni Dosyalar
- `SUPABASE_MIGRATION_GUIDE.md` - Detaylı migrasyon rehberi
- `CHANGELOG.md` - Bu dosya
- `supabase-schema.sql` - Database schema

### 🔒 Güvenlik

#### Row Level Security (RLS)
- Tüm tablolarda RLS aktif
- Rol bazlı erişim kontrolleri:
  - `yönetici` - Tüm yetkiler
  - `depo` - Sınırlı yetkiler
  - `satış` - Sınırlı yetkiler

#### Şifre Güvenliği
- bcrypt hash algoritması (cost: 12)
- Şifreler PostgreSQL'de hash'leniyor
- Şifreler asla client'a gönderilmiyor
- SELECT sorgularında password field exclude ediliyor

---

## [4.3.x] - Önceki Versiyonlar

### [4.3.0] - 2025-11 (Aralık)

#### Eklenenler
- PDF indirme düzeltmesi
- Raporlar sekmesi yetkilendirme (sadece yönetici)
- Test verileri manuel ekleme
- PWA desteği
- Dark mode iyileştirmeleri

#### Düzelitmeler
- PDF export hatası (doc.autoTable is not a function)
- Türkçe karakter desteği PDF'lerde
- Dark mode okunabilirlik

---

## Versiyon Numaralandırma

Bu proje [Semantic Versioning](https://semver.org/) kullanmaktadır.

Format: `MAJOR.MINOR.PATCH`

- **MAJOR:** Uyumlu olmayan API değişiklikleri
- **MINOR:** Geriye uyumlu yeni özellikler
- **PATCH:** Geriye uyumlu hata düzeltmeleri

---

## Gelecek Planlanan Değişiklikler (Roadmap)

### v5.1.0 (Yakında)
- [ ] Tüm sayfaları Supabase'e adapt etme
  - [ ] Dashboard.js
  - [ ] Stock.js
  - [ ] POS.js
  - [ ] Customers.js
  - [ ] Reports.js
  - [ ] Calendar.js
  - [ ] Settings.js

### v5.2.0
- [ ] Real-time özellikler (Supabase Realtime)
- [ ] Supabase Storage (dosya/resim yükleme)
- [ ] Supabase Edge Functions (AI features)

### v5.3.0
- [ ] Offline-first architecture
- [ ] PWA iyileştirmeleri
- [ ] Background sync

---

**Not:** Bu CHANGELOG dosyası [Keep a Changelog](https://keepachangelog.com/) formatını takip etmektedir.
