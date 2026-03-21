# haberfoni-backend

## Genel Bilgi

**NestJS** tabanlı REST API. **Prisma ORM** ile **MySQL 8.0** kullanır.  
**Docker container** içinde çalışır (port **3000**).  
TypeScript ile yazılmıştır, `npm run build` ile derlenir.

## Teknoloji Stack

- **Framework:** NestJS (TypeScript)
- **ORM:** Prisma (`prisma/schema.prisma`)
- **Veritabanı:** MySQL 8.0
- **AI:** Google Gemini (AI Studio — ücretsiz), fallback: Groq
- **Auth:** JWT tabanlı
- **Upload:** Lokal dosya sistemi (`/public/uploads/`, Docker volume)

## Proje Yapısı

```
src/
├── ai/               # AI içerik üretimi (Gemini / Groq)
├── auth/             # JWT login/register
├── bot/              # Bot tetikleme (FORCE_RUN komutu gönderme)
├── categories/       # Haber kategorileri
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
DATABASE_URL="mysql://haberfoni_user:PASS@db:3306/haberfoni"
MYSQL_HOST=localhost
AI_API_KEY=<Google AI Studio Key>
AI_API_URL=https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent
```

**Not:** `DATABASE_URL` içindeki `@db:3306` kısmı Docker network adıdır. Local çalıştırmada `@localhost:3306` olmalı.

## API Endpoint Yapısı

Tüm endpointler `/api/` prefix ile başlar (`src/main.ts`'e göre).

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

## AI Servisi

`src/ai/ai.service.ts` merkezi AI servisini içerir:
- **Primary:** Gemini (`AI_API_URL` env'den alınır)
- **Fallback:** Groq (`GROQ_API_KEY` ayarlanırsa otomatik devreye girer)
- Settings tablosundan da key/URL okunabilir (admin panelinden override için)

## Prisma Şema Güncellemesi

Modelde değişiklik yapılacaksa:
1. `prisma/schema.prisma` dosyasını güncelle
2. `npx prisma migrate dev --name <isim>` çalıştır
3. Docker rebuild: `docker-compose up -d --build`

## Docker

```yaml
# docker-compose.yml servisleri:
# - db (MySQL 8.0, port 3306)
# - backend (NestJS, port 3000)
```

Bot container'ı bu compose dosyasında **yok** — bot kendi dizininden yönetilir.
