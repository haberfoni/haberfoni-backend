# Haberfoni Proje Tanımı ve Teknik Klavuz

Haberfoni, birden fazla kaynaktan (AA, IHA, DHA) haber toplayan, bunları kategorize eden ve sosyal medya kanallarında (Telegram, Meta/Facebook) otomatik olarak paylaşan bir haber platformudur.

## Proje Yapısı

### 1. Haberfoni Backend (`haberfoni-backend`)
- **Teknoloji:** NestJS, Prisma ORM, MySQL.
- **Görev:** Admin paneli, API hizmetleri ve haber botlarının (Scrapers) çekirdek mantığını yönetir.
- **Kritik Uç Noktalar:**
  - `GET /share/:id`: Sosyal medya platformları için OpenGraph (OG) etiketlerini içeren önizleme sayfası.
  - **Bot Koruması:** Facebook, Twitter ve diğer botların içeriği doğru çekebilmesi için yönlendirme filtresi (`botPattern`) içerir.

### 2. Haberfoni Bot (`haberfoni-bot`)
- **Teknoloji:** Node.js, MySQL2.
- **Görev:** Veritabanındaki `news` tablosunu izler ve yeni haberleri anlık olarak sosyal medyaya servis eder.
- **Güvenlik:** Veritabanı bağlantısı şifre karmaşasını önlemek için tekil ortam değişkenleri (`MYSQL_USER`, `MYSQL_PASSWORD`) ile yönetilir.

### 3. Haberfoni Frontend (`haberfoni-frontend`)
- **Teknoloji:** React, Vite.
- **Dağıtım:** Nginx üzerinde `/` root dizininde çalışır. API isteklerini `/servis/` prefix'i ile backend'e iletir.

## Üretim Ortamı Yapılandırması (Production)

### Nginx Yönlendirmeleri (api-haberfoni.kaprofis.com)
- `/servis/` -> `http://haberfoni_backend:3000/` (Backend API)
- `/uploads/` -> `http://haberfoni_backend:3000/uploads/` (Haber Görselleri)
- `/` -> Frontend Statik Dosyalar

### Veritabanı Ayarları
- **Host:** `haberfoni_db` (Docker içi ağ ismi)
- **Port:** `3306`
- **User:** `haberfoni_user`
- **Password:** `userpassword`

## Kritik Teknik İyileştirmeler (Nisan 2026)

### 1. IHA Scraper Optimizasyonu
- **Akıllı Karakter Çözme:** `windows-1254` ve `UTF-8` kodlamaları `iconv-lite` ile dinamik olarak tespit edilir.
- **Görsel Sağlamlık:** Resim bulunamadığında orijinal URL'e fallback yapılır, protokol bağımsız (`//`) linkler desteklenir.

### 2. Sosyal Medya Paylaşım Sistemi
- **Telegram:** Mesaj başlıkları HTML etiketlerinden arındırılarak (sanitize) `parse_mode: HTML` hataları önlenir.
- **Meta (Facebook):** `ShareController` üzerinden bot olmayan kullanıcılar gerçek haber linkine yönlendirilirken, Meta botlarına statik OG etiketleri sunulur.
- **Tekrar Deneme Mantığı:** Bir platformda (örn: Telegram) paylaşılan ama diğerinde (örn: Meta) eksik kalan haberler sistem tarafından fark edilip tekrar denemeye alınır.

### 3. Gemini Kota Yönetimi (10 Nisan 2026)
- **Akıllı Gecikme (Throttling):** Gemini Free Tier kotasına (15 RPM) takılmamak için `AiService` içine her istek arasına **4 saniyelik zorunlu bekleme** (`sleep`) eklendi.
- **Otomatik Kurtarma:** Gemini hata verdiğinde Groq'a geçiş yapıldıktan sonra sistemin tekrar Gemini'yi denemesi sağlandı.

## Bakım ve İzleme
- **Backend Logları:** `docker logs haberfoni_backend`
- **Bot Logları:** `docker logs haberfoni_bot`
- **Veritabanı Yedekleme:** `scripts/backup_system.sh` (Günlük crontab üzerinde çalışır).

---
*Son Güncelleme: 10 Nisan 2026*
