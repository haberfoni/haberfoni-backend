import { PrismaClient } from '@prisma/client';
process.env.DATABASE_URL = 'mysql://root:rootpassword@localhost:3307/haberfoni';
const prisma = new PrismaClient();

async function check() {
    try {
        const brokenNews = await prisma.news.findMany({
            where: {
                OR: [
                    { image_url: null },
                    { image_url: '' },
                    { image_url: { contains: 'no-image' } }
                ]
            },
            take: 20,
            orderBy: { published_at: 'desc' }
        });
        
        console.log(`Found ${brokenNews.length} news items without images (sample of 20).`);
        brokenNews.forEach(n => {
            console.log(`ID: ${n.id} | Title: ${n.title} | Date: ${n.published_at}`);
        });

        const totalBroken = await prisma.news.count({
            where: {
                OR: [
                    { image_url: null },
                    { image_url: '' },
                    { image_url: { contains: 'no-image' } }
                ]
            }
        });
        console.log(`Total count of news without images: ${totalBroken}`);

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

check();
