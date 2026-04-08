import { PrismaClient } from '@prisma/client';
process.env.DATABASE_URL = 'mysql://root:rootpassword@localhost:3307/haberfoni';
const prisma = new PrismaClient();

async function check() {
    try {
        const totalBroken = await prisma.news.count({
            where: {
                OR: [
                    { image_url: null },
                    { image_url: '' },
                    { image_url: { contains: 'no-image' } }
                ]
            }
        });
        console.log(`Total count of news without images in DB: ${totalBroken}`);

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

check();
