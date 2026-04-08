import { PrismaClient } from '@prisma/client';
process.env.DATABASE_URL = 'mysql://root:rootpassword@localhost:3307/haberfoni';
const prisma = new PrismaClient();

async function check() {
    try {
        const items = await prisma.news.findMany({
            where: {
                OR: [
                    { slug: 'siyaset-1' },
                    { slug: 'ist-kar-1' },
                    { slug: { contains: 'siyaset' } },
                    { slug: { contains: 'ist-kar' } }
                ]
            }
        });
        
        console.log(`Found ${items.length} items with target slugs.`);
        items.forEach(n => {
            console.log(`ID: ${n.id} | Slug: ${n.slug} | Title: ${n.title} | Image: [${n.image_url}]`);
        });

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

check();
