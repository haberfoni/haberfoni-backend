# haberfoni-backend

## Genel Bilgi

**NestJS** tabanlı REST API. **Prisma ORM** ile **MySQL 8.0** kullanır.  
**Docker container** içinde çalışır (port **3000**).  
TypeScript ile yazılmıştır, `npm run build` ile derlenir.

## Teknoloji Stack

- **Framework:** NestJS (TypeScript)
- **ORM:** Prisma (`prisma/schema.prisma`)
- **Veritabanı:** MySQL 8.0
- **AI:** Google Gemini (AI Studio — ücretsiz), fallback: Groq.
- **Auth:** JWT tabanlı
- **Upload:** Lokal dosya sistemi (`/public/uploads/`, kategorize edilmiş: `news`, `gallery`, `video`, `editor`).

## Proje Yapısı

```
src/
├── ai/               # AI içerik üretimi (Gemini / Groq)
├── auth/             # JWT login/register
├── bot/              # Bot ve Scraper yönetimi
├── categories/       # Haber kategorileri
├── news/             # Ana haber CRUD
├── galleries/        # Fotoğraf galerileri
├── headlines/        # Manşet/slider yönetimi
├── settings/         # Uygulama ayarları (Panelden yönetilir)
└── prisma/           # PrismaService
```

## ⚠️ KRİTİK — Veritabanı Güvenliği

**SUNUCUDAKI VERİTABANI ÜRETİM VERİSİ İÇERİR.**
- Şifre: **`Haberfoni_Secur3!DB`** (haberfoni_user için)
- Root Şifre: **`Pr0duct10n_Root!2026`**
- Asla `docker-compose down -v` yapma (Veriler silinir).
- Bash üzerinden ünlem işaretli şifre yazarken hata almamak için önce `set +H` komutunu çalıştır.

## 💾 Yedekleme Sistemi
Script: `scripts/backup_system.sh`
- Her gece 03:00'te hem DB hem de `/uploads` klasörü yedeklenir.
- Yedekler `~/haberfoni_backups` içinde saklanır (7 gün rotasyon).

## API Endpoint Yapısı

**ÖNEMLİ:** Backend sunucuda kök dizinden (`/`) çalışmaktadır. Nginx üzerindeki `/servis/` yönlendirmesi backend'e ulaştığında prefix silindiği için backend'in kod tarafında prefix (`api` veya `servis`) kullanmaması zorunludur.

| Modül       | Örnek Yol (API Domain) |
|-------------|-------------------------|
| news        | `/servis/news`          |
| ads         | `/servis/ads`           |
| categories  | `/servis/categories`    |
| upload      | `/servis/upload`        |

## 🛠️ Son Geliştirmeler ve Çözümler (08.04.2026)

### 1. IHA Scraper Düzeltmeleri
- **Encoding Sorunu:** IHA'nın farklı sayfalarında kullandığı `windows-1254` ve `UTF-8` karmaşası, `iconv-lite` ile dinamik encoding algılama yapılarak çözüldü. Türkçe karakterler artık hatasız çekiliyor.
- **Görsel Eksikliği:** IHA'nın yeni şablonları için görsel seçicileri güncellendi.
- **Fallback Sistemi:** Görsel sunucuya indirilemezse dahi orijinal URL'i geri döndürerek broken-image oluşması engellendi.

### 2. Altyapı ve Rota Uyumluluğu
- **Prefix Kaldırılması:** Frontend'in 404 hataları almaması için `main.ts`'teki `globalPrefix` kaldırıldı.
- **CORS:** Üretim ortamındaki domainler (`kaprofis.com`) CORS izin listesine (whitelist) eklendi.
- **SSL / HTTPS:** Tüm API ve görsel linkleri HTTPS protokolüyle uyumlu (absolute URL) hale getirildi.

## Geliştirme Komutları

```bash
# Docker Build & Run
docker-compose up -d --build

# Log İzleme
docker logs haberfoni_backend -f
```
