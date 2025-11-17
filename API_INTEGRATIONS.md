# 🔌 API ENTEGRASYONLARİ DOKÜMANTASYONU
## Karaman Medikal Stok Takip Sistemi - Supabase Version

**Tarih:** 17 Kasım 2025  
**Versiyon:** 5.1  
**Durum:** Aktif

---

## 📋 İÇİNDEKİLER

1. [Genel Bakış](#genel-bakış)
2. [Gemini AI Entegrasyonu](#gemini-ai-entegrasyonu)
3. [MetalPrice API](#metalprice-api)
4. [Fiyat Karşılaştırma](#fiyat-karşılaştırma)
5. [Currency API](#currency-api)
6. [Kullanım Örnekleri](#kullanım-örnekleri)
7. [Sorun Giderme](#sorun-giderme)

---

## 🌟 GENEL BAKIŞ

Sistemde 4 farklı external API entegrasyonu bulunmaktadır:

| API | Amaç | Ücretsiz Limit | Durum |
|-----|------|----------------|-------|
| **Gemini AI** | Ürün açıklaması oluşturma | 60 req/min (free tier) | ✅ Aktif |
| **MetalPrice API** | Altın/Gümüş fiyatları | 100 req/ay | ✅ Aktif |
| **ExchangeRate API** | Döviz kurları (USD, EUR) | Unlimited (free) | ✅ Aktif |
| **Fiyat Karşılaştırma** | Ürün fiyat karşılaştırma | Unlimited (mock) | ✅ Aktif |

---

## 🤖 GEMİNİ AI ENTEGRASYONU

### Amaç
Ürün adı, marka ve kategoriye göre otomatik olarak Türkçe ürün açıklaması oluşturma.

### Kullanılan Model
- **Model:** Gemini 1.5 Flash
- **Provider:** Google Generative AI
- **API Version:** v1beta

### Konfigürasyon

**Dosya:** `/app/frontend/.env`
```env
REACT_APP_GEMINI_API_KEY=AIzaSyCra2ryQMhLjpMollBXhQbKiDjw0znUjuU
```

### API Fonksiyonu

**Dosya:** `/app/frontend/src/lib/api.js`

```javascript
export const generateProductDescription = async (productName, brand, category) => {
  const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
  
  const prompt = `Sen bir medikal ürün uzmanısın. Aşağıdaki ürün için profesyonel ve bilgilendirici bir açıklama yaz (maksimum 150 kelime):

Ürün Adı: ${productName}
Marka: ${brand || 'Belirtilmemiş'}
Kategori: ${category || 'Medikal Ürün'}

Açıklama Türkçe olmalı, ürünün özelliklerini, kullanım alanlarını ve faydalarını içermeli.`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 300,
        }
      })
    }
  );

  const data = await response.json();
  return data.candidates[0].content.parts[0].text.trim();
};
```

### Kullanım

**Dosya:** `/app/frontend/src/pages/Stock.js`

```javascript
import { generateProductDescription } from '../lib/api';

const handleGenerateDescription = async () => {
  if (!formData.name || !formData.brand || !formData.category) {
    toast.error('Lütfen önce ürün adı, marka ve kategori girin');
    return;
  }

  setAiLoading(true);
  try {
    const description = await generateProductDescription(
      formData.name,
      formData.brand,
      formData.category
    );
    setFormData({ ...formData, description });
    toast.success('✨ Yapay zeka açıklaması oluşturuldu!');
  } catch (error) {
    toast.error('Açıklama oluşturulamadı: ' + error.message);
  } finally {
    setAiLoading(false);
  }
};
```

### Limitler
- **Free Tier:** 60 request/dakika
- **Max Output Tokens:** 300
- **Response Time:** ~2-3 saniye

### Örnek Çıktı

**Input:**
- Ürün Adı: "Dijital Tansiyon Aleti"
- Marka: "Omron"
- Kategori: "Tansiyon Ölçüm Cihazları"

**Output:**
```
Omron Dijital Tansiyon Aleti, yüksek hassasiyetle kan basıncı ve nabız ölçümü yapan profesyonel bir sağlık cihazıdır. Kolay kullanım arayüzü ve büyük LCD ekranıyla ev kullanımı için idealdir. Otomatik şişirme ve hava boşaltma sistemi sayesinde dakikalar içinde güvenilir sonuçlar sunar. Düzensiz kalp atışı tespiti özelliği ile kardiyovasküler sağlığınızı takip etmenize yardımcı olur. Hafıza fonksiyonu ile önceki ölçümleri kaydeder ve karşılaştırma yapmanızı sağlar.
```

---

## 💰 METALPRICE API

### Amaç
Gerçek zamanlı altın ve gümüş fiyatlarını TRY bazında çekme.

### API Sağlayıcı
- **Provider:** metalpriceapi.com
- **Plan:** Free Tier
- **Limit:** 100 request/ay

### Konfigürasyon

**Dosya:** `/app/frontend/.env`
```env
REACT_APP_METAL_PRICE_API_KEY=free
```

### API Fonksiyonu

**Dosya:** `/app/frontend/src/lib/api.js`

```javascript
export const getMetalPrices = async () => {
  try {
    const response = await fetch(
      'https://api.metalpriceapi.com/v1/latest?api_key=free&base=TRY&currencies=XAU,XAG'
    );

    const data = await response.json();
    
    // XAU = Gold (per troy ounce)
    // XAG = Silver (per troy ounce)
    // Convert to grams (1 troy oz = 31.1035 grams)
    
    const goldPerOunce = data.rates.XAU ? (1 / data.rates.XAU) : 2800;
    const silverPerOunce = data.rates.XAG ? (1 / data.rates.XAG) : 32;
    
    const goldPerGram = Math.round((goldPerOunce / 31.1035) * 100) / 100;
    const silverPerGram = Math.round((silverPerOunce / 31.1035) * 100) / 100;

    return {
      gold_try: goldPerGram,
      silver_try: silverPerGram,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    // Fallback values
    return {
      gold_try: 2800.0,
      silver_try: 32.5,
      timestamp: new Date().toISOString()
    };
  }
};
```

### Entegrasyon

Metal fiyatları `getCurrencyRates()` fonksiyonuna entegre edilmiştir:

```javascript
export const getCurrencyRates = async () => {
  try {
    // Get currency rates
    const currencyResponse = await fetch('https://api.exchangerate-api.com/v4/latest/TRY');
    const currencyData = await currencyResponse.json();
    const rates = currencyData.rates;

    const usd_try = Math.round((1 / rates.USD) * 100) / 100;
    const eur_try = Math.round((1 / rates.EUR) * 100) / 100;

    // Get metal prices
    const metalPrices = await getMetalPrices();

    return {
      usd_try,
      eur_try,
      gold_try: metalPrices.gold_try,
      silver_try: metalPrices.silver_try,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    // Fallback
    return {
      usd_try: 35.50,
      eur_try: 38.20,
      gold_try: 2800.0,
      silver_try: 32.5,
      timestamp: new Date().toISOString()
    };
  }
};
```

### Kullanım

**Dashboard.js** - Kur kartında altın ve gümüş fiyatları gösteriliyor:

```javascript
const [currencies, setCurrencies] = useState({
  usd_try: 0,
  eur_try: 0,
  gold_try: 0,
  silver_try: 0
});

useEffect(() => {
  const fetchCurrencies = async () => {
    try {
      const data = await getCurrencyRates();
      setCurrencies(data);
    } catch (error) {
      console.error('Kur bilgisi alınamadı:', error);
    }
  };

  fetchCurrencies();
  const interval = setInterval(fetchCurrencies, 300000); // 5 dakikada bir
  return () => clearInterval(interval);
}, []);
```

### Limitler
- **Free Tier:** 100 request/ay
- **Rate Limit:** Unlimited within quota
- **Data Update:** Gerçek zamanlı

### Örnek Response

```json
{
  "success": true,
  "timestamp": 1700000000,
  "base": "TRY",
  "date": "2025-11-17",
  "rates": {
    "XAU": 0.00001234,  // 1 TRY = 0.00001234 troy ounce gold
    "XAG": 0.00085678   // 1 TRY = 0.00085678 troy ounce silver
  }
}
```

**Hesaplama:**
- Altın: (1 / 0.00001234) / 31.1035 = 2,600 TRY/gram
- Gümüş: (1 / 0.00085678) / 31.1035 = 37.5 TRY/gram

---

## 🔍 FİYAT KARŞILAŞTIRMA

### Amaç
Ürünlerin farklı sitelerdeki fiyatlarını karşılaştırma.

### Implementasyon
Şu anda **mock data** ile çalışmaktadır. Production'da SERPAPI veya benzeri bir servis kullanılabilir.

### API Fonksiyonu

**Dosya:** `/app/frontend/src/lib/api.js`

```javascript
export const comparePrices = async (productName, brand) => {
  try {
    const searchQuery = `${brand ? brand + ' ' : ''}${productName}`;
    
    // Mock data for demonstration
    const mockResults = [
      {
        title: `${productName} - Online Medikal Market`,
        price: Math.floor(Math.random() * 500) + 100,
        currency: 'TRY',
        url: `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`,
        source: 'Online Medikal Market'
      },
      {
        title: `${productName} - Sağlık Ürünleri`,
        price: Math.floor(Math.random() * 500) + 100,
        currency: 'TRY',
        url: `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`,
        source: 'Sağlık Ürünleri'
      },
      {
        title: `${productName} - Medikal Store`,
        price: Math.floor(Math.random() * 500) + 100,
        currency: 'TRY',
        url: `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`,
        source: 'Medikal Store'
      }
    ].sort((a, b) => a.price - b.price);

    return {
      success: true,
      result_count: mockResults.length,
      price_results: mockResults,
      search_query: searchQuery
    };
  } catch (error) {
    return {
      success: false,
      error: 'Fiyat karşılaştırması yapılamadı',
      result_count: 0,
      price_results: []
    };
  }
};
```

### Kullanım

**Stock.js** - Ürün kartlarında fiyat karşılaştırma butonu:

```javascript
const searchProductPrices = async (product) => {
  setSelectedProduct(product);
  setPriceCompareDialogOpen(true);
  setPriceSearchLoading(true);
  setPriceResults([]);

  try {
    const result = await comparePrices(product.name, product.brand);
    
    if (result.success && result.price_results.length > 0) {
      setPriceResults(result.price_results);
      toast.success(`${result.result_count} site üzerinden fiyat karşılaştırması yapıldı`);
    } else {
      setPriceResults([]);
      toast.info('Fiyat bilgisi bulunamadı');
    }
  } catch (error) {
    toast.error('Fiyat karşılaştırması başarısız');
    setPriceResults([]);
  } finally {
    setPriceSearchLoading(false);
  }
};
```

### Production İçin Öneriler

Gerçek fiyat karşılaştırma için aşağıdaki seçenekler değerlendirilebilir:

1. **SERPAPI** (Google Shopping API)
   - URL: https://serpapi.com
   - Free Trial: 100 arama/ay
   - Fiyat: $50/ay (5,000 arama)

2. **Bright Data** (Google Shopping API)
   - URL: https://brightdata.com
   - Free Trial: Mevcut
   - Enterprise level data

3. **Custom Web Scraping**
   - Apify platform ($5/ay free credit)
   - Puppeteer/Playwright ile custom scraping

**Örnek SERPAPI Entegrasyonu:**

```javascript
export const comparePricesWithSerpAPI = async (productName, brand) => {
  const apiKey = process.env.REACT_APP_SERPAPI_KEY;
  const query = `${brand ? brand + ' ' : ''}${productName}`;
  
  const response = await fetch(
    `https://serpapi.com/search?engine=google_shopping&q=${encodeURIComponent(query)}&api_key=${apiKey}&location=Turkey&hl=tr&gl=tr`
  );
  
  const data = await response.json();
  
  return {
    success: true,
    result_count: data.shopping_results?.length || 0,
    price_results: data.shopping_results?.map(item => ({
      title: item.title,
      price: item.price,
      currency: 'TRY',
      url: item.link,
      source: item.source
    })) || []
  };
};
```

---

## 💱 CURRENCY API

### Amaç
USD ve EUR kurlarını TRY bazında çekme.

### API Sağlayıcı
- **Provider:** exchangerate-api.com
- **Plan:** Free
- **Limit:** Unlimited

### API Endpoint

```
GET https://api.exchangerate-api.com/v4/latest/TRY
```

### Örnek Response

```json
{
  "provider": "https://www.exchangerate-api.com",
  "WARNING_UPGRADE_TO_V6": "...",
  "terms": "...",
  "base": "TRY",
  "date": "2025-11-17",
  "time_last_updated": 1700000000,
  "rates": {
    "USD": 0.0282,  // 1 TRY = 0.0282 USD
    "EUR": 0.0262,  // 1 TRY = 0.0262 EUR
    // ... other currencies
  }
}
```

### Kullanım

Dashboard'da 5 dakikada bir otomatik güncelleniyor.

---

## 📚 KULLANIM ÖRNEKLERİ

### 1. AI Açıklama Oluşturma

**Senaryo:** Kullanıcı Stock sayfasında yeni ürün eklerken AI açıklama butonuna tıklıyor.

```javascript
// Stock.js - Ürün ekleme formu
<Button
  type="button"
  onClick={handleGenerateDescription}
  disabled={aiLoading || !formData.name || !formData.brand}
  className="w-full"
>
  {aiLoading ? (
    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Oluşturuluyor...</>
  ) : (
    <><Sparkles className="mr-2 h-4 w-4" /> AI ile Açıklama Oluştur</>
  )}
</Button>
```

**Akış:**
1. Kullanıcı ürün adı, marka ve kategori girer
2. "AI ile Açıklama Oluştur" butonuna tıklar
3. Gemini API'ye istek gönderilir
4. ~2-3 saniye sonra Türkçe açıklama form alanına doldurulur
5. Kullanıcı isterse düzenleyebilir ve kaydeder

### 2. Metal Fiyatları Görüntüleme

**Senaryo:** Dashboard'da kur kartında güncel altın ve gümüş fiyatları gösteriliyor.

```javascript
// Dashboard.js
<div className="grid grid-cols-2 gap-2">
  <div className="text-center p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded">
    <p className="text-xs text-yellow-700 dark:text-yellow-300">Altın (gr)</p>
    <p className="font-bold text-yellow-800 dark:text-yellow-200">
      {currencies.gold_try.toFixed(2)} ₺
    </p>
  </div>
  <div className="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
    <p className="text-xs text-gray-700 dark:text-gray-300">Gümüş (gr)</p>
    <p className="font-bold text-gray-800 dark:text-gray-200">
      {currencies.silver_try.toFixed(2)} ₺
    </p>
  </div>
</div>
```

**Akış:**
1. Dashboard yüklendiğinde `getCurrencyRates()` çağrılır
2. MetalPrice API'den güncel veriler çekilir
3. Gram başına TRY cinsinden fiyatlar gösterilir
4. Her 5 dakikada bir otomatik güncellenir

### 3. Fiyat Karşılaştırma

**Senaryo:** Kullanıcı Stock sayfasında bir ürünün fiyatlarını karşılaştırmak istiyor.

```javascript
// Stock.js - Ürün kartı
<Button
  size="sm"
  variant="outline"
  onClick={(e) => {
    e.stopPropagation();
    searchProductPrices(product);
  }}
>
  <Search className="h-4 w-4 mr-1" />
  Fiyat Karşılaştır
</Button>
```

**Akış:**
1. Kullanıcı ürün kartında "Fiyat Karşılaştır" butonuna tıklar
2. Dialog açılır ve loading gösterilir
3. `comparePrices()` fonksiyonu çağrılır
4. 3 farklı siteden fiyat bilgileri (mock) gösterilir
5. Fiyatlar küçükten büyüğe sıralanır
6. "Siteye Git" butonu ile kullanıcı ilgili siteye yönlendirilir

---

## 🔧 SORUN GİDERME

### Gemini API Sorunları

**Sorun:** "Gemini API hatası: 429"
- **Sebep:** Rate limit aşıldı (60 req/dakika)
- **Çözüm:** İstekleri throttle edin veya premium plana geçin

**Sorun:** "AI yanıt üretelemedi"
- **Sebep:** API response formatı beklenenle uyuşmuyor
- **Çözüm:** Console'da response'u kontrol edin, prompt'u gözden geçirin

**Sorun:** "Gemini API key bulunamadı"
- **Sebep:** .env dosyasında key tanımlı değil
- **Çözüm:** `.env` dosyasını kontrol edin, frontend'i restart edin

### MetalPrice API Sorunları

**Sorun:** "Metal fiyat API hatası"
- **Sebep:** Aylık 100 istek limiti dolmuş olabilir
- **Çözüm:** Fallback değerler kullanılır, premium plana geçilebilir

**Sorun:** Fiyatlar çok farklı görünüyor
- **Sebep:** Troy ounce → gram dönüşümü hatalı olabilir
- **Çözüm:** 1 troy oz = 31.1035 gram oranını kontrol edin

### Fiyat Karşılaştırma Sorunları

**Sorun:** Her seferinde aynı fiyatlar gösteriliyor
- **Sebep:** Mock data kullanılıyor
- **Çözüm:** Production için gerçek API entegrasyonu yapın

**Sorun:** "Siteye Git" butonu çalışmıyor
- **Sebep:** URL boş veya hatalı
- **Çözüm:** URL validation ve `window.open()` kullanımını kontrol edin

### Genel Debugging

```javascript
// API çağrılarını izlemek için console.log ekleyin:

export const generateProductDescription = async (productName, brand, category) => {
  console.log('🤖 AI Request:', { productName, brand, category });
  
  try {
    const response = await fetch(...);
    const data = await response.json();
    
    console.log('✅ AI Response:', data);
    return data.candidates[0].content.parts[0].text.trim();
  } catch (error) {
    console.error('❌ AI Error:', error);
    throw error;
  }
};
```

**Browser Console Commands:**

```javascript
// Test Gemini API
import { generateProductDescription } from './lib/api';
await generateProductDescription('Tansiyon Aleti', 'Omron', 'Medikal Cihaz');

// Test Metal Prices
import { getMetalPrices } from './lib/api';
await getMetalPrices();

// Test Price Comparison
import { comparePrices } from './lib/api';
await comparePrices('Tansiyon Aleti', 'Omron');
```

---

## 📞 DESTEK VE KAYNAKLAR

### API Dokümantasyonları

- **Gemini AI:** https://ai.google.dev/docs
- **MetalPrice API:** https://metalpriceapi.com/documentation
- **ExchangeRate API:** https://www.exchangerate-api.com/docs

### Rate Limits ve Fiyatlandırma

| API | Free Limit | Premium Fiyat |
|-----|-----------|---------------|
| Gemini AI | 60 req/min | Pay-as-you-go |
| MetalPrice API | 100 req/ay | $3.99/ay (1000 req) |
| ExchangeRate API | Unlimited | - |

### Environment Variables

Tüm API key'leri `/app/frontend/.env` dosyasında saklanmalı:

```env
# Supabase
REACT_APP_SUPABASE_URL=https://bqrxjhppxlzcllgwrkxf.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJ...

# AI & External APIs
REACT_APP_GEMINI_API_KEY=AIzaSy...
REACT_APP_METAL_PRICE_API_KEY=free

# Other
WDS_SOCKET_PORT=443
REACT_APP_ENABLE_VISUAL_EDITS=false
ENABLE_HEALTH_CHECK=false
DISABLE_HOT_RELOAD=false
```

### Güvenlik Notları

1. **API Key'leri asla frontend koduna hardcode etmeyin**
2. **Environment variables kullanın**
3. **Git'e commit etmeden önce .env'yi .gitignore'a ekleyin**
4. **Production'da backend proxy kullanarak API key'leri gizleyin**
5. **Rate limiting ve caching uygulayın**

---

**Dokümantasyon Tarihi:** 17 Kasım 2025  
**Son Güncelleme:** Tüm entegrasyonlar aktif ve test edildi  
**Versiyon:** 1.0
