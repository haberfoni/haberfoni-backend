import { PrismaClient } from '@prisma/client';
process.env.DATABASE_URL = 'mysql://root:rootpassword@localhost:3307/haberfoni';
const prisma = new PrismaClient();

async function check() {
    try {
        const suspectNews = await prisma.news.findMany({
            where: {
                OR: [
                    { image_url: null },
                    { image_url: '' },
                    { image_url: { contains: 'no-image' } },
                    { image_url: { startsWith: '/' } }, // Some relative paths might be broken
                ]
            },
            take: 100,
            orderBy: { published_at: 'desc' }
        });
        
        console.log(`Found ${suspectNews.length} suspect news items.`);
        suspectNews.slice(0, 10).forEach(n => {
            console.log(`ID: ${n.id} | Title: ${n.title} | Image: ${n.image_url}`);
        });

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

check();
