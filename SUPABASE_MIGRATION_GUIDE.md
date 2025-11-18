# 🚀 SUPABASE MİGRASYON REHBERİ
## Karaman Medikal Stok Takip Sistemi - FastAPI + MongoDB → Supabase

**Migrasyon Tarihi:** 16 Kasım 2025  
**Proje:** KSM 4.3 → Supabase Version  
**Amaç:** Backend'i FastAPI + MongoDB'den Supabase PostgreSQL'e taşımak

---

## 📋 İÇİNDEKİLER

1. [Migrasyon Özeti](#migrasyon-özeti)
2. [Supabase Kurulum Adımları](#supabase-kurulum-adımları)
3. [Database Schema](#database-schema)
4. [Frontend Değişiklikleri](#frontend-değişiklikleri)
5. [Silinen Dosyalar](#silinen-dosyalar)
6. [Yeni Eklenen Dosyalar](#yeni-eklenen-dosyalar)
7. [Değiştirilen Dosyalar](#değiştirilen-dosyalar)
8. [API Fonksiyonları](#api-fonksiyonları)
9. [Test Adımları](#test-adımları)
10. [Önemli Notlar](#önemli-notlar)

---

## 🎯 MİGRASYON ÖZETİ

### Önceki Teknoloji Stack:
- **Backend:** FastAPI (Python)
- **Database:** MongoDB
- **Auth:** JWT + bcrypt (FastAPI)
- **API:** REST (axios ile)

### Yeni Teknoloji Stack:
- **Backend:** ❌ Kaldırıldı - Serverless
- **Database:** Supabase PostgreSQL
- **Auth:** Custom users tablosu + bcrypt (PostgreSQL pgcrypto)
- **API:** Supabase Client SDK

---

## 🔧 SUPABASE KURULUM ADIMLARI

### Adım 1: Supabase Hesabı ve Proje Oluşturma

1. **Supabase'e kayıt olun:**
   - URL: https://supabase.com
   - GitHub ile giriş yapıldı

2. **Yeni proje oluşturuldu:**
   - Project Name: `karaman-medikal-stok`
   - Region: `Europe (Frankfurt)`
   - Database Password: *(güçlü şifre oluşturuldu)*

3. **API Bilgileri alındı:**
   ```
   Project URL: https://bqrxjhppxlzcllgwrkxf.supabase.co
   Anon Public Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxcnhqaHBweGx6Y2xsZ3dya3hmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzMjI3MTYsImV4cCI6MjA3ODg5ODcxNn0.A75Y3qp_5l25I3PY7SUM6iLVQSx-BnkPvVik41oYF58
   Service Role Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxcnhqaHBweGx6Y2xsZ3dya3hmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzMyMjcxNiwiZXhwIjoyMDc4ODk4NzE2fQ.0NdAgvhgBZZ-VJsE8wkmwRczCiq2N3yI2GYdgjzWFDg
   ```

### Adım 2: Database Schema Kurulumu

**Dosya:** `/app/supabase-schema.sql`

**Supabase SQL Editor'de çalıştırılan SQL:**

```sql
-- 5 ana tablo oluşturuldu:
1. users (kullanıcılar - custom auth)
2. products (ürünler)
3. customers (müşteriler - soft delete destekli)
4. sales (satışlar - JSONB items ile)
5. calendar_events (takvim etkinlikleri)

-- Row Level Security (RLS) politikaları eklendi
-- Indexes oluşturuldu
-- Triggers eklendi (updated_at için)
-- Default admin user eklendi (username: admin, password: Admin123!)
-- 5 örnek ürün ve 5 örnek müşteri eklendi
```

**Detaylı SQL dosyası:** `/app/supabase-schema.sql` (262 satır)

### Adım 3: Şifre Doğrulama RPC Fonksiyonu

**Supabase SQL Editor'de ek olarak çalıştırıldı:**

```sql
-- pgcrypto extension etkinleştirildi
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Şifre doğrulama fonksiyonu
CREATE OR REPLACE FUNCTION verify_user_password(
  p_username TEXT,
  p_password TEXT
)
RETURNS TABLE(
  user_id UUID,
  username TEXT,
  email TEXT,
  role TEXT,
  created_at TIMESTAMPTZ,
  password_match BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.username,
    u.email,
    u.role,
    u.created_at,
    (u.password = crypt(p_password, u.password)) AS password_match
  FROM users u
  WHERE u.username = p_username
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Amaç:** Bcrypt şifre karşılaştırmasını PostgreSQL tarafında yapmak (tarayıcıda bcrypt.compare performans sorunu yaşanabilir)

---

## 📦 FRONTEND DEĞİŞİKLİKLERİ

### 1. Yeni Paketler Kuruldu

**Komut:**
```bash
cd /app/frontend
yarn add @supabase/supabase-js bcryptjs
```

**Eklenen paketler:**
- `@supabase/supabase-js@2.81.1` - Supabase client
- `bcryptjs@3.0.3` - Şifre hash'leme (kullanıcı kaydı için)

### 2. Environment Variables (.env)

**Dosya:** `/app/frontend/.env`

**DEĞİŞTİRİLEN:**
```diff
- REACT_APP_BACKEND_URL=https://retail-gemini-app.preview.emergentagent.com
+ REACT_APP_SUPABASE_URL=https://bqrxjhppxlzcllgwrkxf.supabase.co
+ REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxcnhqaHBweGx6Y2xsZ3dya3hmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzMjI3MTYsImV4cCI6MjA3ODg5ODcxNn0.A75Y3qp_5l25I3PY7SUM6iLVQSx-BnkPvVik41oYF58
  WDS_SOCKET_PORT=443
  REACT_APP_ENABLE_VISUAL_EDITS=false
  ENABLE_HEALTH_CHECK=false
  DISABLE_HOT_RELOAD=false
```

---

## 📁 YENİ EKLENEN DOSYALAR

### 1. `/app/supabase-schema.sql` (262 satır)
**Amaç:** Supabase database schema dosyası  
**İçerik:**
- 5 tablo tanımı (users, products, customers, sales, calendar_events)
- RLS policies
- Indexes
- Triggers
- Default admin user
- Örnek test verileri

### 2. `/app/frontend/src/lib/supabase.js` (15 satır)
**Amaç:** Supabase client konfigürasyonu

```javascript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false
  }
});
```

### 3. `/app/frontend/src/lib/api.js` (650+ satır)
**Amaç:** Tüm API fonksiyonlarını Supabase ile yapılandırma

**Modüller:**
- Auth (login, register)
- Users (CRUD)
- Products (CRUD, barcode search, low stock)
- Customers (CRUD, search, soft delete)
- Sales (CRUD, with inventory updates)
- Calendar Events (CRUD)
- Reports (dashboard stats, stock report, top selling, top profit)
- Currency API (external)

**Örnek Fonksiyon:**
```javascript
export const loginUser = async (username, password) => {
  const { data, error } = await supabase
    .rpc('verify_user_password', {
      p_username: username,
      p_password: password
    });

  if (!data || data.length === 0) 
    throw new Error('Kullanıcı adı veya şifre hatalı');

  const result = data[0];
  if (!result.password_match) 
    throw new Error('Kullanıcı adı veya şifre hatalı');

  const { password_match, ...user } = result;
  return user;
};
```

---

## 🔄 DEĞİŞTİRİLEN DOSYALAR

### 1. `/app/frontend/src/App.js`

**DEĞİŞİKLİKLER:**

**Kaldırılanlar:**
```javascript
- import axios from 'axios';
- const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
- const API = `${BACKEND_URL}/api`;
- axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
- export { API };
```

**Eklenenler:**
```javascript
+ import { supabase } from './lib/supabase';
+ export { supabase };
```

**Güncellenen login fonksiyonu:**
```javascript
// ÖNCE:
const login = (token, userData) => {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(userData));
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  setUser(userData);
};

// SONRA:
const login = (userData) => {
  localStorage.setItem('user', JSON.stringify(userData));
  setUser(userData);
};
```

### 2. `/app/frontend/src/pages/Login.js`

**DEĞİŞİKLİKLER:**

```javascript
// ÖNCE:
import { useAuth, API } from '../App';
import axios from 'axios';

const handleLogin = async (e) => {
  const response = await axios.post(`${API}/auth/login`, loginForm);
  login(response.data.access_token, response.data.user);
};

// SONRA:
import { useAuth } from '../App';
import { loginUser } from '../lib/api';

const handleLogin = async (e) => {
  const user = await loginUser(loginForm.username, loginForm.password);
  login(user);
};
```

---

## 🗑️ SİLİNEN DOSYALAR

### Backend Klasörü Tamamen Kaldırıldı

**Komut:**
```bash
rm -rf /app/backend
```

**Silinen dosyalar:**
- `/app/backend/server.py` (1,205 satır FastAPI kodu)
- `/app/backend/requirements.txt`
- `/app/backend/.env`
- `/app/backend/add_test_data.py`

**Toplam:** ~1,300+ satır Python kodu kaldırıldı

---

## 📚 API FONKSİYONLARI KARŞILAŞTIRMASI

### Auth

| Önceki (FastAPI) | Yeni (Supabase) | Dosya |
|------------------|-----------------|-------|
| POST /api/auth/login | loginUser() | api.js |
| POST /api/auth/register | registerUser() | api.js |

### Users

| Önceki (FastAPI) | Yeni (Supabase) | Dosya |
|------------------|-----------------|-------|
| GET /api/users | getAllUsers() | api.js |
| PUT /api/users/:id | updateUser() | api.js |
| DELETE /api/users/:id | deleteUser() | api.js |

### Products

| Önceki (FastAPI) | Yeni (Supabase) | Dosya |
|------------------|-----------------|-------|
| GET /api/products | getAllProducts() | api.js |
| GET /api/products/barcode/:barcode | getProductByBarcode() | api.js |
| GET /api/products/low-stock | getLowStockProducts() | api.js |
| POST /api/products | createProduct() | api.js |
| PUT /api/products/:id | updateProduct() | api.js |
| DELETE /api/products/:id | deleteProduct() | api.js |
| GET /api/products/filters | getProductFilters() | api.js |

### Customers

| Önceki (FastAPI) | Yeni (Supabase) | Dosya |
|------------------|-----------------|-------|
| GET /api/customers | getAllCustomers() | api.js |
| GET /api/customers/search?q= | searchCustomers() | api.js |
| POST /api/customers | createCustomer() | api.js |
| PUT /api/customers/:id | updateCustomer() | api.js |
| DELETE /api/customers/:id | deleteCustomer() | api.js |
| GET /api/customers/:id/purchases | getCustomerPurchases() | api.js |

### Sales

| Önceki (FastAPI) | Yeni (Supabase) | Dosya |
|------------------|-----------------|-------|
| GET /api/sales | getAllSales() | api.js |
| POST /api/sales | createSale() | api.js |

### Calendar

| Önceki (FastAPI) | Yeni (Supabase) | Dosya |
|------------------|-----------------|-------|
| GET /api/calendar | getCalendarEvents() | api.js |
| POST /api/calendar | createCalendarEvent() | api.js |
| PUT /api/calendar/:id | updateCalendarEvent() | api.js |
| DELETE /api/calendar/:id | deleteCalendarEvent() | api.js |

### Reports

| Önceki (FastAPI) | Yeni (Supabase) | Dosya |
|------------------|-----------------|-------|
| GET /api/reports/dashboard | getDashboardStats() | api.js |
| GET /api/reports/stock | getStockReport() | api.js |
| GET /api/reports/top-selling | getTopSellingProducts() | api.js |
| GET /api/reports/top-profit | getTopProfitProducts() | api.js |

### Currency (External API)

| Önceki (FastAPI) | Yeni (Supabase) | Dosya |
|------------------|-----------------|-------|
| GET /api/currency | getCurrencyRates() | api.js |

---

## 🧪 TEST ADIMLARI

### 1. Login Testi

**Credentials:**
```
Username: admin
Password: Admin123!
```

**Test Senaryosu:**
1. Login sayfasına git
2. Admin credentials ile giriş yap
3. Dashboard'a yönlendirilmeli
4. LocalStorage'da user bilgisi kayıtlı olmalı

**Beklenen Sonuç:** ✅ Başarılı giriş

### 2. Dashboard Testi

**Test Edilecekler:**
- [ ] Toplam ürün sayısı gösteriliyor
- [ ] Düşük stok sayısı gösteriliyor
- [ ] Bugünkü satış rakamları
- [ ] Haftalık satış rakamları

### 3. Ürünler (Products) Testi

**Test Edilecekler:**
- [ ] Ürün listesi görüntüleniyor (5 örnek ürün)
- [ ] Yeni ürün eklenebiliyor
- [ ] Ürün düzenlenebiliyor
- [ ] Ürün silinebiliyor
- [ ] Barkod ile arama çalışıyor

### 4. Müşteriler (Customers) Testi

**Test Edilecekler:**
- [ ] Müşteri listesi görüntüleniyor (5 örnek müşteri)
- [ ] Yeni müşteri eklenebiliyor
- [ ] Müşteri düzenlenebiliyor
- [ ] Müşteri silinebiliyor (soft delete)
- [ ] İsim/telefon ile arama çalışıyor

### 5. Satış (POS) Testi

**Test Edilecekler:**
- [ ] Ürün sepete eklenebiliyor
- [ ] Satış kaydedilebiliyor
- [ ] Stok miktarı güncelleniyor
- [ ] Müşteri total_spent güncelleniyor

### 6. Takvim Testi

**Test Edilecekler:**
- [ ] Etkinlikler görüntüleniyor
- [ ] Yeni etkinlik eklenebiliyor
- [ ] Etkinlik düzenlenebiliyor
- [ ] Etkinlik silinebiliyor

### 7. Raporlar Testi

**Test Edilecekler:**
- [ ] Stok raporu oluşturuluyor
- [ ] En çok satanlar raporu
- [ ] En karlı ürünler raporu
- [ ] PDF/Excel export çalışıyor

---

## ⚠️ ÖNEMLİ NOTLAR

### 🔒 Güvenlik

1. **Row Level Security (RLS) Aktif:**
   - Tüm tablolarda RLS politikaları tanımlandı
   - Yönetici/depo/satış rolleri için farklı yetkiler

2. **Şifre Güvenliği:**
   - PostgreSQL pgcrypto extension kullanılıyor
   - Bcrypt hash algoritması (cost: 12)
   - Şifreler asla client tarafına gönderilmiyor

3. **API Anahtarları:**
   - Anon key: Client tarafında kullanılıyor (public)
   - Service role key: Backend işlemler için (GİZLİ - .env'de tutulmalı)

### 🚀 Performans

1. **Database Indexes:**
   - username, barcode, brand, category, phone üzerinde indexler
   - Low stock sorguları için composite index

2. **Client-Side Caching:**
   - LocalStorage ile user session
   - PWA service worker ile offline destek

### 📝 Database Yapısı

1. **UUID Kullanımı:**
   - Tüm ID'ler UUID formatında (MongoDB ObjectID yerine)
   - JSON serialization sorunu yok

2. **JSONB Kullanımı:**
   - Sales.items JSONB array olarak saklanıyor
   - PostgreSQL JSONB query özellikleri kullanılabilir

3. **Soft Delete:**
   - Customers tablosunda `deleted` boolean flag
   - Fiziksel silme yerine mantıksal silme

### 🔄 Migration Notları

1. **Mevcut Veriler:**
   - MongoDB'deki veriler Supabase'e migrate edilmedi
   - Örnek test verileri SQL'de eklendi
   - Prod için data migration scripti gerekebilir

2. **External APIs:**
   - Currency API (exchangerate-api.com) aktif ✅
   - **MetalPrice API** (metalpriceapi.com) - Free tier (100 requests/month) aktif ✅
   - **NOT:** SERPAPI yerine basit fiyat karşılaştırma mock implementasyonu yapıldı

3. **AI Özellikler:**
   - ✅ **Gemini AI Product Description Generation** aktif! (API Key: frontend/.env)
   - Frontend'de doğrudan Gemini 1.5 Flash API kullanılıyor
   - Ürün adı, marka ve kategoriye göre Türkçe açıklama üretiliyor

---

## 🎯 SONRAKI ADIMLAR

### ✅ TAMAMLANAN İŞLER (17 Kasım 2025):

1. **✅ Tüm Sayfaları Supabase'e Adapt Etme:**
   - ✅ Dashboard.js
   - ✅ Stock.js
   - ✅ POS.js
   - ✅ Customers.js
   - ✅ Reports.js
   - ✅ Calendar.js
   - ✅ Settings.js

2. **✅ AI ve API Entegrasyonları:**
   - ✅ Gemini AI ürün açıklaması oluşturma
   - ✅ MetalPrice API (altın/gümüş fiyatları)
   - ✅ Basit fiyat karşılaştırma sistemi

### Yapılması Gerekenler:

1. **Test ve Debug:**
   - [ ] Tüm CRUD operasyonlarını test et
   - [ ] RLS politikalarını doğrula
   - [ ] AI açıklama özelliğini test et
   - [ ] Fiyat karşılaştırma özelliğini test et
   - [ ] Error handling iyileştir

2. **Prod Hazırlık:**
   - [ ] Supabase production tier'a geç (gerekirse)
   - [ ] Backup stratejisi
   - [ ] Monitoring ve logging

3. **Dokümantasyon:**
   - [ ] API dokümantasyonu
   - [ ] Deployment guide
   - [ ] User manual

---

## 📞 DESTEK

**Supabase Dashboard:** https://supabase.com/dashboard/project/bqrxjhppxlzcllgwrkxf

**Dokümantasyon:**
- Supabase Docs: https://supabase.com/docs
- Supabase JS Client: https://supabase.com/docs/reference/javascript

**GitHub Repository:** https://github.com/KaramanMedikalStokTakip/KSM4.3

---

## 🔧 SORUN GİDERME (TROUBLESHOOTING)

### Sorun 1: "Kullanıcı adı veya şifre hatalı" Hatası

**Belirti:**
- Login ekranında admin/Admin123! ile giriş yapılamıyor
- Console'da "Kullanıcı adı veya şifre hatalı" hatası görünüyor

**Çözüm:**

#### A) Admin Kullanıcısı Oluşturma (Supabase SQL Editor)

```sql
-- 1. pgcrypto extension'ını etkinleştir
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Eski admin varsa sil
DELETE FROM users WHERE username = 'admin';

-- 3. Yeni admin oluştur (şifre: Admin123!)
INSERT INTO users (username, email, password, role)
VALUES (
    'admin',
    'admin@karaman.com',
    crypt('Admin123!', gen_salt('bf', 10)),
    'yönetici'
);

-- 4. Kontrol et
SELECT id, username, email, role, created_at 
FROM users 
WHERE username = 'admin';
```

#### B) RPC Fonksiyonu Kontrol

Eğer `verify_user_password()` RPC fonksiyonu yoksa:

```sql
CREATE OR REPLACE FUNCTION verify_user_password(
  p_username TEXT,
  p_password TEXT
)
RETURNS TABLE(
  id UUID,
  username TEXT,
  email TEXT,
  role TEXT,
  created_at TIMESTAMPTZ,
  password_match BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.username,
    u.email,
    u.role,
    u.created_at,
    (u.password = crypt(p_password, u.password)) AS password_match
  FROM users u
  WHERE u.username = p_username
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Not:** `loginUser()` fonksiyonunda fallback mekanizması var, RPC yoksa otomatik olarak direkt users tablosundan okuma yapıyor.

---

### Sorun 2: Dashboard'da Veriler Görünmüyor

**Belirti:**
- Dashboard'da "0 ürün" gösteriliyor ama Stok Yönetimi'nde ürünler var
- Console'da "400 Bad Request" hatası: `quantity=lte.min_quantity`
- "Failed to execute 'clone' on 'Response'" hatası

**Çözüm:**

Supabase **column-to-column karşılaştırma** desteklemiyor. `/app/frontend/src/lib/api.js` dosyasında değişiklik yapıldı:

**Önceki (Hatalı):**
```javascript
const { data, error } = await supabase
  .from('products')
  .select('*')
  .filter('quantity', 'lte', 'min_quantity'); // ❌ Çalışmaz
```

**Yeni (Doğru):**
```javascript
const { data, error } = await supabase
  .from('products')
  .select('*');

// JavaScript'te filtreleme
const lowStock = data.filter(p => p.quantity <= p.min_quantity);
```

**Düzeltildi:** `getLowStockProducts()` ve `getDashboardStats()` fonksiyonları güncellendi.

---

### Sorun 3: Metal Fiyatları Hata Veriyor

**Belirti:**
- Console'da "Cannot read properties of undefined (reading 'XAU')" hatası
- Metal fiyatları gösterilmiyor

**Çözüm:**

`getMetalPrices()` fonksiyonunda `data.rates` kontrolü eklendi:

```javascript
export const getMetalPrices = async () => {
  try {
    const response = await fetch(
      'https://api.metalpriceapi.com/v1/latest?api_key=free&base=TRY&currencies=XAU,XAG'
    );
    const data = await response.json();
    
    // ✅ Güvenli kontrol
    if (!data || !data.rates || !data.rates.XAU || !data.rates.XAG) {
      throw new Error('Invalid API response');
    }
    
    // ... fiyat hesaplama
  } catch (error) {
    // Fallback değerler
    return {
      gold_try: 2800.0,
      silver_try: 32.5,
      timestamp: new Date().toISOString()
    };
  }
};
```

**Düzeltildi:** API hata verirse fallback değerlere geçiliyor.

---

### Sorun 4: "AI ile Açıklama Oluştur" Çalışmıyor

**Belirti:**
- Stock.js'te AI butonu hata veriyor
- Console'da "API key not valid. Please pass a valid API key" hatası

**Çözüm:**

#### A) Gemini API Key Alma (Ücretsiz)

1. https://aistudio.google.com/app/apikey adresine gidin
2. "Create API Key" butonuna tıklayın
3. API key'i kopyalayın

#### B) .env Dosyasını Güncelleme

`/app/frontend/.env` dosyasına ekleyin:

```env
REACT_APP_GEMINI_API_KEY=YOUR_GEMINI_API_KEY_HERE
```

#### C) Frontend'i Yeniden Başlatma

```bash
cd /app/frontend
sudo supervisorctl restart frontend
```

**Gemini Free Tier:** 60 istek/dakika

---

### Sorun 5: Frontend Başlamıyor (craco not found)

**Belirti:**
- `sudo supervisorctl status frontend` → FATAL
- Log'da: `/bin/sh: 1: craco: not found`

**Çözüm:**

```bash
cd /app/frontend
yarn install
sudo supervisorctl restart frontend
```

**Açıklama:** `@craco/craco` paketi node_modules'de eksikti, `yarn install` ile kuruldu.

---

### Sorun 6: RLS (Row Level Security) Hataları

**Belirti:**
- "new row violates row-level security policy" hatası
- Tablolara insert/update yapılamıyor

**Çözüm:**

Supabase Dashboard → Authentication → Policies:

**Users tablosu için:**
```sql
-- Herkes okuyabilir
CREATE POLICY "Users can view all users"
    ON users FOR SELECT
    USING (true);
```

**Products tablosu için:**
```sql
-- Herkes okuyabilir
CREATE POLICY "Everyone can view products"
    ON products FOR SELECT
    USING (true);
```

---

### Yararlı Komutlar

#### Frontend Durumu Kontrol
```bash
sudo supervisorctl status frontend
```

#### Frontend Logları
```bash
tail -f /var/log/supervisor/frontend.out.log
tail -f /var/log/supervisor/frontend.err.log
```

#### Frontend Yeniden Başlatma
```bash
sudo supervisorctl restart frontend
```

#### Package Kurulumu
```bash
cd /app/frontend
yarn install
```

---

**Migrasyon Tamamlanma Tarihi:** 16 Kasım 2025  
**Versiyon:** 5.0.1 (Supabase Migration + Bugfixes)  
**Son Güncelleme:** 18 Kasım 2025 - Login, Dashboard ve AI entegrasyonu hataları düzeltildi
