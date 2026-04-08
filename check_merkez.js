import { PrismaClient } from '@prisma/client';
process.env.DATABASE_URL = 'mysql://root:rootpassword@localhost:3307/haberfoni';
const prisma = new PrismaClient();

async function check() {
    try {
        const target = await prisma.news.findMany({
            where: {
                title: { contains: 'Merkez Bankası' }
            }
        });
        
        console.log(`Found ${target.length} news items with 'Merkez Bankası' in title.`);
        target.forEach(n => {
            console.log(JSON.stringify(n, null, 2));
        });

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

check();
