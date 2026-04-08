import { PrismaClient } from '@prisma/client';
process.env.DATABASE_URL = 'mysql://root:rootpassword@localhost:3307/haberfoni';
const prisma = new PrismaClient();

async function check() {
    try {
        const target = await prisma.news.findMany({
            where: {
                title: 'Meclis\'te Yoğun Mesai'
            }
        });
        
        console.log(`Found ${target.length} news items with exact title 'Meclis\'te Yoğun Mesai'.`);
        target.forEach(n => {
            console.log(`ID: ${n.id} | Title: ${n.title} | ImageURL: [${n.image_url}] | Source: ${n.source}`);
        });

        const latest = await prisma.news.findMany({
            take: 10,
            orderBy: { created_at: 'desc' }
        });
        console.log('\nLatest 10 items in DB:');
        latest.forEach(n => {
            console.log(`ID: ${n.id} | Title: ${n.title} | Image: ${n.image_url} | CreatedAt: ${n.created_at}`);
        });

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

check();
