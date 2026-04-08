# haberfoni-backend

## Genel Bilgi

**NestJS** tabanlı REST API. **Prisma ORM** ile **MySQL 8.0** kullanır.  
**Docker container** içinde çalışır (port **3000**).  
TypeScript ile yazılmıştır, `npm run build` ile derlenir.

## Teknoloji Stack

- **Framework:** NestJS (TypeScript)
- **ORM:** Prisma (`prisma/schema.prisma`)
- **Veritabanı:** MySQL 8.0
- **AI:** Google Gemini (AI Studio — ücretsiz), fallback: Groq. (NOT: API Key'ler doğrudan Admin panelinden yönetilir, .env kullanılmaz).
- **Auth:** JWT tabanlı
- **Upload:** Lokal dosya sistemi (`/public/uploads/`, kategorize edilmiş: `news`, `gallery`, `video`, `editor`).

## Proje Yapısı

```
src/
├── ai/               # AI içerik üretimi (Gemini / Groq)
├── auth/             # JWT login/register
├── bot/              # Bot tetikleme (FORCE_RUN komutu gönderme)
├── categories/       # Haber kategorileri (name_en ve SEO alanları eklendi)
├── news/             # Ana haber CRUD
├── galleries/        # Fotoğraf galerileri
├── videos/           # Video içerikleri
├── headlines/        # Manşet/slider yönetimi
├── tags/             # Etiket sistemi
├── settings/         # Uygulama ayarları (AI key, URL, vb.)
├── ads/              # Reklam yönetimi
├── pages/            # Statik sayfalar (Hakkımızda vb.)
├── seo/              # SEO ayarları
├── users/            # Kullanıcı yönetimi
├── upload/           # Dosya yükleme
├── activity-logs/    # Admin işlem logları
└── prisma/           # PrismaService
prisma/schema.prisma  # Veritabanı şeması (tek kaynak gerçek)
```

## ⚠️ KRİTİK — Veritabanı Güvenliği

**SUNUCUDAKI VERİTABANI ÜRETİM VERİSİ İÇERİR. Hiçbir zaman:**
- `prisma migrate reset` çalıştırma — tüm veriyi siler
- `prisma db push --force-reset` çalıştırma — tüm veriyi siler
- `DROP TABLE` veya `TRUNCATE` içeren SQL çalıştırma
- `docker-compose down -v` çalıştırma — volume'aları ve veriyi siler
- Production `.env` dosyasındaki `DATABASE_URL`'yi değiştirme

**Güvenli migration:** Sadece `prisma migrate deploy` kullan (sadece yeni migration'ları uygular, veriyi silmez).

**Local vs Production farkı:**
- Local Docker: `docker-compose down -v` yapılabilir (test verisi)
- Sunucu: Asla `down -v` yapma, sadece `docker-compose restart` veya `up -d`

## 💾 Otomatik Yedekleme Sistemi (Sunucu - Tam Site)

Sistem hem veritabanını hem de **tüm proje dizinini** (kaynak kodlar, konfigürasyonlar ve `/uploads` klasörü) günlük olarak yedekler. Yedekler `~/haberfoni_backups` klasöründe saklanır ve 7 gün sonra otomatik silinir.

### 1. Yedekleme Scripti
Script konumu: `backend/scripts/backup_system.sh`

**Kurulum (Sunucuda bir kez):**
```bash
chmod +x ~/haberfoni/haberfoni-backend/scripts/backup_system.sh
```

### 2. Otomatik Zamanlayıcı (Cron)
Her gece 03:00'te yedek almak için crontab'a ekleyin:

```bash
# crontab -e ile açın ve en alta ekleyin:
0 3 * * * /bin/bash ~/haberfoni/haberfoni-backend/scripts/backup_system.sh >> ~/backup_log.txt 2>&1
```

### 3. Manuel Yedek ve Geri Yükleme
**Manuel Çalıştır:**
```bash
./scripts/backup_system.sh
```

Manuel yedek almak için:
```bash
docker exec haberfoni_db mysqldump -u haberfoni_user -pHaberfoni_Secur3!DB haberfoni > ~/backup_manual.sql
```

Yedeği geri yüklemek için:
```bash
docker exec -i haberfoni_db mysql -u haberfoni_user -pHaberfoni_Secur3!DB haberfoni < ~/backup_manual.sql
```

---

## Geliştirme Komutları

```bash
# Docker ile çalıştır (önerilen):
docker-compose up -d --build

# Logları izle:
docker-compose logs -f backend

# Local geliştirme (DB hâlâ Docker'da olmalı):
npm install
npm run start:dev     # watch mode

# Prisma işlemleri (local çalıştırırken):
npx prisma generate
npx prisma migrate dev --name <migration_ismi>
npx prisma studio     # DB GUI
```

## Env Değişkenleri (`.env`)

```env
MYSQL_ROOT_PASSWORD=...
MYSQL_DATABASE=haberfoni
MYSQL_USER=haberfoni_user
MYSQL_PASSWORD=...
# NOT: Host üzerindeki MySQL ile çakışmayı önlemek için Docker portu 3307'ye çekilmiştir.
DATABASE_URL="mysql://haberfoni_user:PASS@db:3307/haberfoni"
MYSQL_HOST=localhost
AI_API_KEY=<Google AI Studio Key — aistudio.google.com, ücretsiz>
AI_API_URL=https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent
# Opsiyonel Groq fallback:
# GROQ_API_KEY=<console.groq.com, ücretsiz>
```

> **Not:** `.env` dosyası artık git'te takip ediliyor (private repo). `.gitignore`'dan çıkarılmıştır.

## API Endpoint Yapısı

Tüm endpointler `/api/` prefix ile başlar (`src/main.ts`'te `app.setGlobalPrefix('api')` ile tanımlanmıştır). Bu prefix, Nginx ve Frontend uyumu için zorunludur.

| Modül       | Prefix              |
|-------------|---------------------|
| auth        | `/api/auth`         |
| news        | `/api/news`         |
| galleries   | `/api/galleries`    |
| videos      | `/api/videos`       |
| headlines   | `/api/headlines`    |
| tags        | `/api/tags`         |
| settings    | `/api/settings`     |
| ai          | `/api/ai`           |
| bot         | `/api/bot`          |
| upload      | `/api/upload`       |
| pages       | `/api/pages`        |

## AI Servisi

`src/ai/ai.service.ts` merkezi AI servisini içerir:
- **Primary:** Gemini (`ai_api_url` ayarından alınır)
- **Fallback:** Groq (`groq_api_key` ayarlanırsa otomatik devreye girer)
- **Yönetim:** API Anahtarları yalnızca Admin Panelindeki SEO & API sekmesinden yönetilir. `.env` üzerindeki anahtarlar artık kullanılmamaktadır.

## Prisma Şema Güncellemesi

Modelde değişiklik yapılacaksa:
1. `prisma/schema.prisma` dosyasını güncelle
2. `npx prisma migrate dev --name <isim>` çalıştır (Sunucuda sadece `prisma db push` veya `migrate deploy`)
3. Docker rebuild: `docker-compose up -d --build`

## Docker

```yaml
# docker-compose.yml servisleri:
# - db (MySQL 8.0, port 3307)
# - backend (NestJS, port 3000)

### 🌍 Sunucu Mimarisi (Hetzner)
- **İşletim Sistemi:** Ubuntu 24.04 (Noble)
- **Proxy:** Host üzerinde Nginx (Port 80 & 443)
- **SSL:** Certbot (Let's Encrypt) - Standalone Mode
- **Erişim:**
  - API: `https://api-haberfoni.kaprofis.com` (Prefix: `/api/`)
  - Frontend: `http://haberfoni.kaprofis.com` (Port 3001 üzerinden proxy)
```

Bot container'ı bu compose dosyasında **yok** — bot kendi dizininden yönetilir.

---

## 🛠️ Yapılan Çalışmalar Özeti (26.03.2026 - Restorasyon ve Optimizasyon)

Bu tarih itibarıyla projenin tüm modülleri Hetzner sunucusunda ayağa kaldırılmış ve aşağıdaki kritik iyileştirmeler yapılmıştır:

### 1. API Altyapısı ve Yönlendirme
- **Global API Prefix:** `main.ts` dosyasına `app.setGlobalPrefix('api');` eklenerek tüm endpointler frontend ve Nginx ile uyumlu hale getirildi. Bu sayede "Sayfalar" (Hakkımızda, Künye vb.) modülü tekrar çalışır hale geldi.
- **Port Stabilizasyonu:** Host makinedeki MySQL ile çakışma yaşanmaması için Docker DB portu `3306`'dan `3307`'ye taşındı.
- **HTTPS & CORS:** API trafiği HTTPS üzerinden stabilize edildi ve dinamik CORS politikaları güncellendi.

### 2. Medya Yönetimi ve Depolama
- **Alt Klasörleme Sistemi:** `/public/uploads` ana dizini; `news`, `gallery`, `gallery_item`, `video` ve `editor` olarak alt kategorilere ayrıldı. Bu sayede dosya hiyerarşisi düzenlendi.
- **Editör Yüklemeleri:** Rich Editor üzerinden yüklenen tüm görsellerin otomatik olarak `/editor` klasörüne gitmesi sağlandı.
- **Volume Mapping:** Docker içindeki medya dosyalarının host üzerindeki fiziksel diskte kalıcı (persistence) olması sağlandı.

### 3. Bot ve AI Performansı
- **Zengin İçerik (HTML):** Scraper'lar `.text()` yerine `.html()` moduna geçirilerek haber içi görsellerin ve mizanpajın korunması sağlandı.
- **Economic Mode (Sunucu Dostu):** Sunucu CPU'sunu korumak için her bot döngüsünde max **10 haber** sınırı getirildi.
- **AI Throttling:** Gemini/Groq rate-limit hatalarını önlemek için AI işlemleri arasına **5.5 saniye** zorunlu gecikme eklendi.

### 4. Güvenlik ve Yedekleme (Full Site Backup)
- **Otomatik Yedekleme:** `scripts/backup_system.sh` scripti oluşturuldu.
- **Kapsam:** Her gece 03:00'te hem **MySQL veritabanı** hem de **tüm proje kaynak kodları + medya dosyaları** yedeklenir.
- **Rotasyon:** Disk dolmasını önlemek için 7 günden eski yedekler otomatik temizlenir.
- **Exclusion:** `node_modules` ve ham `mysql_data` arşiv dışı bırakılarak yedek boyutu optimize edildi (~115 MB).

### 5. Giderilen Kritik Hatalar
- **Headlines 500 Hatası:** ID tip uyumsuzluğu (String vs Int) düzeltildi.
- **CORS Lock:** API ve Frontend arasındaki HTTPS/HTTP iletişim bozukluğu giderildi.
- **DHA/IHA Parsing:** Ajanslardaki yapı değişikliklerine karşı seçiciler güncellendi.

### 6. Sosyal Medya Meta-Proxy (26.03.2026)
- **SEO Truncation:** Facebook tarafından reddedilen çok uzun açıklama (summary) alanları veritabanına kaydedilmeden önce otomatik olarak limitlendi.
- **Dynamic Proxy Configuration (26.03.2026):** `social_share_proxy_url` ayarı eklendi. Bu sayede sosyal medya kartlarını oluşturan köprü adresi Panelden (Ayarlar -> Otomatik Paylaşım) değiştirilebilir hale getirildi.

---

## 🛠️ Son Geliştirmeler (08.04.2026 - API ve Görsel Hata Giderimi)

Projenin yerel geliştirme ortamında yaşanan bağlantı ve görsel sunum sorunları giderildi:

### 1. API Rota Düzeltmesi
- **Global Prefix Uyumu:** Backend'in `/api` global prefix'ini kullanması nedeniyle frontend'in 404 hataları alması engellendi (VITE_API_URL güncellendi).

### 2. Görsel Sunum Mantığı
- **CDN Ayrıştırma:** Görsellerin `/api/uploads` yerine doğrudan `/uploads` üzerinden sunulması sağlandı.
- **Path Doğrulama:** Veritabanındaki `/uploads/news/` yollarının `public/uploads/news/` fiziksel diziniyle tam uyumlu olduğu ve backend üzerinden başarıyla sunulduğu teyit edildi.

### 3. Open Graph (og:image) Düzeltmesi (Share Proxy)
- **Absolute URL Zorunluluğu:** Facebook Share Proxy endpointi (`share.controller.ts`) yeniden yapılandırıldı.
- Eskiden relative path (örn: `/uploads/news/resim.jpg`) olarak sunulan `og:image` linkleri nedeniyle Facebook resimleri çekemiyordu.
- Artık her bir görsel URL'sinin başına dinamik olarak host (örn: `https://api-haberfoni.kaprofis.com`) eklenerek **tam ve çekilebilir (absolute) resim adresleri** oluşturuldu. Bu sayede Facebook "Bağlantı Kartı" gösterimleri düzeldi.
