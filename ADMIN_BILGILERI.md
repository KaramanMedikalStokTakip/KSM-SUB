# 👤 Admin Kullanıcı Bilgileri

> **🆕 Supabase Migration (v5.0+):** Admin kullanıcısı artık Supabase PostgreSQL'de saklanıyor. Otomatik oluşturulmuyor, manuel olarak SQL ile oluşturmanız gerekiyor.

## 🔐 Giriş Bilgileri

```
Kullanıcı Adı: admin
Şifre:         Admin123!
Email:         admin@karaman.com
Rol:           yönetici
```

## 📝 Notlar

- **v5.0+:** Admin kullanıcısı manuel olarak Supabase SQL Editor'de oluşturulmalı
- Eğer admin kullanıcısı zaten varsa, yeniden oluşturulmaz
- Güvenlik için şifreyi değiştirmeniz önerilir
- Admin kullanıcısı tüm yetkilere sahiptir

## 🚀 Admin Kullanıcısı Oluşturma (Supabase)

Supabase Dashboard → SQL Editor'de şu komutu çalıştırın:

```sql
-- 1. pgcrypto extension'ını etkinleştir
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Eski admin varsa sil
DELETE FROM users WHERE username = 'admin';

-- 3. Yeni admin oluştur
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

## 🔒 Şifre Değiştirme

Uygulamaya giriş yaptıktan sonra **Ayarlar** sayfasından şifrenizi değiştirebilirsiniz.

### Manuel Şifre Değiştirme (Supabase SQL Editor)

```sql
UPDATE users 
SET password = crypt('YeniSifre123!', gen_salt('bf', 10))
WHERE username = 'admin';
```

## ⚠️ Güvenlik Uyarısı

Bu bilgileri güvenli bir yerde saklayın ve production ortamında mutlaka şifreyi değiştirin!

## 🐛 Sorun Giderme

**Login yapamıyorsanız:**

1. Supabase Dashboard'a gidin
2. SQL Editor'ı açın
3. Yukarıdaki admin oluşturma komutlarını çalıştırın
4. Tekrar login deneyin

Detaylı sorun giderme için [SUPABASE_MIGRATION_GUIDE.md](SUPABASE_MIGRATION_GUIDE.md) dosyasına bakın.
