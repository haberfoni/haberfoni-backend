
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    console.log('Seeding database...');

    // 1. Categories
    const categories = [
        { name: 'Gündem', slug: 'gundem', order_index: 1 },
        { name: 'Spor', slug: 'spor', order_index: 2 },
        { name: 'Ekonomi', slug: 'ekonomi', order_index: 3 },
        { name: 'Dünya', slug: 'dunya', order_index: 4 },
        { name: 'Teknoloji', slug: 'teknoloji', order_index: 5 },
        { name: 'Sağlık', slug: 'saglik', order_index: 6 },
        { name: 'Magazin', slug: 'magazin', order_index: 7 },
        { name: 'Yaşam', slug: 'yasam', order_index: 8 },
        { name: 'Kültür Sanat', slug: 'kultur-sanat', order_index: 9 },
    ];

    for (const cat of categories) {
        await prisma.category.upsert({
            where: { slug: cat.slug },
            update: {},
            create: cat,
        });
    }
    console.log('Categories seeded.');

    // 2. Bot Settings
    const botSettings = [
        { source_name: 'AA', is_active: true, auto_publish: true, daily_limit: 100 },
        { source_name: 'IHA', is_active: true, auto_publish: true, daily_limit: 50 },
        { source_name: 'DHA', is_active: true, auto_publish: true, daily_limit: 50 },
    ];

    for (const setting of botSettings) {
        const existing = await prisma.botSetting.findUnique({ where: { source_name: setting.source_name } });
        if (!existing) {
            await prisma.botSetting.create({ data: setting });
        }
    }
    console.log('Bot Settings seeded.');


    // 3. Bot Category Mappings (AA RSS)
    // Ensure we map to existing category slugs
    const mappings = [
        { source_name: 'AA', source_url: 'https://www.aa.com.tr/tr/rss/default?cat=guncel', target_category: 'gundem', is_active: true },
        { source_name: 'AA', source_url: 'https://www.aa.com.tr/tr/rss/default?cat=ekonomi', target_category: 'ekonomi', is_active: true },
        { source_name: 'AA', source_url: 'https://www.aa.com.tr/tr/rss/default?cat=spor', target_category: 'spor', is_active: true },
        { source_name: 'AA', source_url: 'https://www.aa.com.tr/tr/rss/default?cat=dunya', target_category: 'dunya', is_active: true },
        { source_name: 'AA', source_url: 'https://www.aa.com.tr/tr/rss/default?cat=bilim-teknoloji', target_category: 'teknoloji', is_active: true },
        { source_name: 'AA', source_url: 'https://www.aa.com.tr/tr/rss/default?cat=saglik', target_category: 'saglik', is_active: true },
        { source_name: 'AA', source_url: 'https://www.aa.com.tr/tr/rss/default?cat=yasam', target_category: 'yasam', is_active: true },
        { source_name: 'AA', source_url: 'https://www.aa.com.tr/tr/rss/default?cat=kultur-sanat', target_category: 'kultur-sanat', is_active: true },
    ];

    for (const map of mappings) {
        await prisma.botCategoryMapping.upsert({
            where: { source_url: map.source_url },
            update: { is_active: map.is_active },
            create: map
        });
    }

    // 3.1 IHA & DHA Mappings
    const otherMappings = [
        { source_name: 'IHA', source_url: 'https://www.iha.com.tr/haberler', target_category: 'gundem', is_active: true },
        { source_name: 'DHA', source_url: 'https://www.dha.com.tr/son-dakika/', target_category: 'gundem', is_active: true },
    ];
    for (const map of otherMappings) {
        await prisma.botCategoryMapping.upsert({
            where: { source_url: map.source_url },
            update: { is_active: map.is_active },
            create: map
        });
    }

    console.log('Bot Mappings seeded.');

    // 3.2 Site Settings (Key-Value)
    const settings = [
        { key: 'site_title', value: 'Haberfoni' },
        { key: 'site_description', value: 'Haberfoni - En Güncel ve Tarafsız Haberler' },
        { key: 'newsletter_title', value: 'Haber Bültenimize Abone Olun' },
        { key: 'contact_email', value: 'info@haberfoni.com' },
        { key: 'footer_text', value: '© 2026 Haberfoni. Tüm hakları saklıdır.' }
    ];

    for (const s of settings) {
        await prisma.siteSetting.upsert({
            where: { key: s.key },
            update: {},
            create: s
        });
    }
    console.log('Site Settings seeded.');

    // 4. Dummy Galleries (Photos & Videos)
    const videos = [
        { title: 'Togg T10X İncelemesi', slug: 'togg-t10x-incelemesi', description: 'Yerli otomobil TOGG test sürüşü detayları', video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', thumbnail_url: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&q=80', original_url: 'youtube-1', source: 'Youtube', published_at: new Date() },
        { title: 'Filenin Sultanlarından Tarihi Başarı', slug: 'filenin-sultanlari-basari', description: 'Avrupa şampiyonu olan milli takımımız', video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', thumbnail_url: 'https://images.unsplash.com/photo-1612872087720-48ca556fa396?w=800&q=80', original_url: 'youtube-2', source: 'Youtube', published_at: new Date() },
        { title: 'Uzay Yolculuğu Başlıyor', slug: 'uzay-yolculugu-basliyor', description: 'Yeni nesil roketlerin fırlatma anı', video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', thumbnail_url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&q=80', original_url: 'youtube-3', source: 'Youtube', published_at: new Date() },
        { title: 'Ekonomide Yeni Dönem', slug: 'ekonomide-yeni-donem', description: 'Merkez Bankası kararları sonrası piyasalar', video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', thumbnail_url: 'https://images.unsplash.com/photo-1611974765270-ca1258634369?w=800&q=80', original_url: 'youtube-4', source: 'Youtube', published_at: new Date() },
    ];
    for (const v of videos) {
        await prisma.video.upsert({ where: { slug: v.slug }, update: {}, create: v });
    }
    console.log('Videos seeded.');

    const pg = await prisma.photoGallery.upsert({
        where: { slug: 'istanbul-kis-manzaralari' },
        update: {},
        create: {
            title: 'İstanbul\'da Kış Manzaraları', slug: 'istanbul-kis-manzaralari', description: 'Kar altındaki İstanbul', thumbnail_url: 'https://images.unsplash.com/photo-1485594050903-8e8ee5322318?w=800&q=80', original_url: 'gal-1', source: 'Yerel', published_at: new Date(),
            gallery_images: {
                create: [
                    { image_url: 'https://images.unsplash.com/photo-1485594050903-8e8ee5322318?w=800&q=80', order_index: 0 },
                    { image_url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&q=80', order_index: 1 }
                ]
            }
        }
    });
    console.log('Photo Galleries seeded.');

    // 5. Dummy News Items (Ensuring 4+ items per key category so they show up)
    const newsData = [
        // Manşet / Slider Haberleri (is_slider: true)
        { title: "İstanbul'da Beklenen Yoğun Kar Yağışı Başladı", slug: "ist-kar-1", category_id: 1, is_slider: true, image_url: "https://images.unsplash.com/photo-1485594050903-8e8ee5322318?w=1600&q=80", summary: "Kar yağışı etkisini gösteriyor.", content: "Detaylı haber metni...", published_at: new Date() },
        { title: "Meclis'te Yoğun Mesai", slug: "siyaset-1", category_id: 1, is_slider: true, image_url: "https://images.unsplash.com/photo-1529101091760-61df6be5d18b?w=1600&q=80", summary: "Yeni yasa teklifi görüşülüyor.", content: "Detaylı haber metni...", published_at: new Date() },
        { title: "Merkez Bankası Faiz Kararını Açıkladı", slug: "ekonomi-manset-1", category_id: 3, is_slider: true, image_url: "https://images.unsplash.com/photo-1611974765270-ca1258634369?w=1600&q=80", summary: "Faiz oranları belirlendi.", content: "Detaylı haber metni...", published_at: new Date() },
        { title: "Süper Lig'de Dev Derbi Heyecanı", slug: "spor-manset-1", category_id: 2, is_slider: true, image_url: "https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=1600&q=80", summary: "Derbi öncesi nefesler tutuldu.", content: "Detaylı haber metni...", published_at: new Date() },
        { title: "Yeni Yapay Zeka Modeli Tanıtıldı", slug: "tek-manset-1", category_id: 5, is_slider: true, image_url: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=1600&q=80", summary: "Teknoloji devinin yeni AI hamlesi.", content: "Detaylı haber metni...", published_at: new Date() },
        
        // Gündem İçerikleri (Min 4)
        { title: "Eğitimde Yeni Düzenleme", slug: "gundem-1", category_id: 1, is_slider: false, image_url: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?", summary: "Müfredat değişiyor.", content: "İçerik", published_at: new Date() },
        { title: "Sağlık Bakanından Açıklama", slug: "gundem-2", category_id: 1, is_slider: false, image_url: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?", summary: "Yeni hastaneler açılıyor.", content: "İçerik", published_at: new Date() },
        { title: "Trafikte Yeni Kurallar", slug: "gundem-3", category_id: 1, is_slider: false, image_url: "https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?", summary: "Ehliyet şartları güncellendi.", content: "İçerik", published_at: new Date() },
        
        // Ekonomi İçerikleri (Min 4)
        { title: "Borsada Rekor Kapanış", slug: "ekonomi-1", category_id: 3, is_slider: false, image_url: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?", summary: "BIST 100 tarihi zirvede.", content: "İçerik", published_at: new Date() },
        { title: "Konut Satışları Arttı", slug: "ekonomi-2", category_id: 3, is_slider: false, image_url: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?", summary: "TÜİK verileri açıklandı.", content: "İçerik", published_at: new Date() },
        { title: "Asgari Ücret Görüşmeleri Başlıyor", slug: "ekonomi-3", category_id: 3, is_slider: false, image_url: "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?", summary: "İlk toplantı yarın.", content: "İçerik", published_at: new Date() },
        
        // Spor İçerikleri (Min 4)
        { title: "Şampiyonlar Ligi Kuraları Çekildi", slug: "spor-1", category_id: 2, is_slider: false, image_url: "https://images.unsplash.com/photo-1493225255756-d9584f8606e9?", summary: "Rakiplerimiz belli oldu.", content: "İçerik", published_at: new Date() },
        { title: "Yılın Transfer Bombası Patladı", slug: "spor-2", category_id: 2, is_slider: false, image_url: "https://images.unsplash.com/photo-1555848962-6e79363ec58f?", summary: "Yıldız oyuncu imza attı.", content: "İçerik", published_at: new Date() },
        { title: "Formula 1 İstanbul Park Takvime Girdi", slug: "spor-3", category_id: 2, is_slider: false, image_url: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?", summary: "Yarış heyecanı geri dönüyor.", content: "İçerik", published_at: new Date() },
    ];

    for (const item of newsData) {
        const cat = categories.find(c => c.order_index === item.category_id);
        const newsItem = await prisma.news.upsert({
            where: { slug: item.slug },
            update: {},
            create: {
                ...item,
                category: cat ? cat.name : 'Gündem',
                is_active: true,
                original_url: `seed-${item.slug}`
            }
        });

        // Add to headlines if it's a slider
        if (item.is_slider) {
            await prisma.headline.create({
                data: { news_id: newsItem.id, type: 1, order_index: Math.floor(Math.random() * 10) }
            });
            await prisma.headline.create({
                data: { news_id: newsItem.id, type: 2, order_index: Math.floor(Math.random() * 10) }
            });
        }
    }
    console.log('News and Headlines seeded.');

    // Create Admin User
    const adminUser = await prisma.user.upsert({
        where: { email: 'ahmetcansertce@hotmail.com' },
        update: { role: 'admin' },
        create: {
            email: 'ahmetcansertce@hotmail.com',
            password: '123456',
            full_name: 'Admin User',
            role: 'admin',
            is_active: true
        }
    });
    console.log('Admin user created:', adminUser.email);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
