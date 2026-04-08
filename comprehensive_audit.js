import { PrismaClient } from '@prisma/client';
process.env.DATABASE_URL = 'mysql://root:rootpassword@localhost:3307/haberfoni';
const prisma = new PrismaClient();

async function check() {
    try {
        const hCount = await prisma.headline.count();
        const nCount = await prisma.news.count();
        const brokenCount = await prisma.news.count({
            where: {
                OR: [
                    { image_url: null },
                    { image_url: '' },
                    { image_url: { contains: 'no-image' } },
                    { image_url: { contains: 'unsplash' } }
                ]
            }
        });

        console.log(`Headlines: ${hCount}`);
        console.log(`Total News: ${nCount}`);
        console.log(`Broken News: ${brokenCount}`);

        const headlines = await prisma.headline.findMany({
            include: { News: true },
            take: 20
        });
        
        console.log('\nHeadlines Sample:');
        headlines.forEach(h => {
             console.log(`Slot: ${h.order_index} | ID: ${h.news_id} | Title: ${h.News?.title} | Image: ${h.News?.image_url}`);
        });

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

check();
