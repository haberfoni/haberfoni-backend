import { PrismaClient } from '@prisma/client';
process.env.DATABASE_URL = 'mysql://root:rootpassword@localhost:3307/haberfoni';
const prisma = new PrismaClient();

async function check() {
    try {
        const galleries = await prisma.photoGallery.findMany({
            where: { title: { contains: 'Meclis' } }
        });
        console.log(`PhotoGalleries: ${galleries.length}`);
        
        const videos = await prisma.video.findMany({
            where: { title: { contains: 'Meclis' } }
        });
        console.log(`Videos: ${videos.length}`);

        // Check for specific titles in all 3 tables
        const titles = ['Meclis\'te Yoğun Mesai', 'Merkez Bankası Faiz Kararını Açıkladı', 'İstanbul\'da Beklenen Yoğun Kar Yağışı Başladı'];
        
        for (const t of titles) {
            const n = await prisma.news.count({ where: { title: t } });
            const p = await prisma.photoGallery.count({ where: { title: t } });
            const v = await prisma.video.count({ where: { title: t } });
            console.log(`Title: ${t} | News: ${n} | Photo: ${p} | Video: ${v}`);
        }

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

check();
