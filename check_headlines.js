import { PrismaClient } from '@prisma/client';
process.env.DATABASE_URL = 'mysql://root:rootpassword@localhost:3307/haberfoni';
const prisma = new PrismaClient();

async function check() {
    try {
        const headlines = await prisma.headline.findMany({
            include: { News: true },
            orderBy: { order_index: 'asc' }
        });
        
        console.log(`Found ${headlines.length} headlines.`);
        headlines.forEach(h => {
            console.log(`Slot: ${h.order_index} | Type: ${h.type} | NewsID: ${h.news_id} | Title: ${h.News?.title} | Image: ${h.News?.image_url}`);
        });

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

check();
