import { PrismaClient } from '@prisma/client';
process.env.DATABASE_URL = 'mysql://root:rootpassword@localhost:3307/haberfoni';
const prisma = new PrismaClient();

async function check() {
    try {
        const total = await prisma.news.count();
        console.log(`Total news in DB: ${total}`);

        const broken = await prisma.news.findMany({
            where: {
                OR: [
                    { image_url: null },
                    { image_url: '' },
                    { image_url: { contains: 'no-image' } },
                    { image_url: { contains: 'placeholder' } }
                ]
            },
            take: 20,
            orderBy: { published_at: 'desc' }
        });
        
        console.log(`Found ${broken.length} broken items (sample).`);
        broken.forEach(n => {
            console.log(`ID: ${n.id} | Title: ${n.title} | Image: ${n.image_url} | PublishedAt: ${n.published_at}`);
        });

        // Check for specific exact titles from screenshot
        const exact = await prisma.news.findMany({
            where: {
                title: { in: ['Meclis\'te Yoğun Mesai', 'Merkez Bankası Faiz Kararını Açıkladı', 'İstanbul\'da Beklenen Yoğun Kar Yağışı Başladı'] }
            }
        });
        console.log(`\nExact matches for screenshot items: ${exact.length}`);
        exact.forEach(n => {
            console.log(`ID: ${n.id} | Title: ${n.title} | Image: [${n.image_url}]`);
        });

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

check();
