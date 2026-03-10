#!/bin/sh

# Veritabanının hazır olmasını docker-compose hallediyor (healthcheck ile)
# Prisma şemasını veritabanına uygula (gerekirse tabloları oluştur)
echo "Veritabanı şeması eşitleniyor (db push)..."
npx prisma db push

# Varsayılan verileri yükle (site settings, ilk admin vb.)
# Hata verirse (zaten veri varsa) yoksay ve devam et
echo "Varsayılan veriler yükleniyor (db seed)..."
npx prisma db seed || true

# Uygulamayı başlat
echo "Uygulama başlatılıyor..."
npm run start:prod
