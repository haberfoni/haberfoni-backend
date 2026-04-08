import { PrismaClient } from '@prisma/client';
process.env.DATABASE_URL = 'mysql://root:rootpassword@localhost:3307/haberfoni';
const prisma = new PrismaClient();

async function check() {
    try {
        const target = await prisma.news.findMany({
            where: {
                title: { contains: 'Meclis' }
            },
            take: 10
        });
        
        console.log(`Found ${target.length} news items with 'Meclis' in title.`);
        target.forEach(n => {
            console.log(`ID: ${n.id} | Title: ${n.title} | ImageURL: [${n.image_url}]`);
        });

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

check();
