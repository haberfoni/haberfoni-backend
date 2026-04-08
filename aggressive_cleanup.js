import { PrismaClient } from '@prisma/client';
process.env.DATABASE_URL = 'mysql://root:rootpassword@localhost:3307/haberfoni';
const prisma = new PrismaClient();

async function aggressiveCleanup() {
    try {
        // Use Raw SQL to avoid any Prisma logic/middleware issues
        const result = await prisma.$executeRaw`DELETE FROM news WHERE image_url IS NULL OR image_url = '' OR image_url LIKE '%no-image%' OR image_url LIKE '%unsplash%' OR image_url = 'null'`;
        
        console.log(`AGGRESSIVE_CLEANUP_SUCCESS: Deleted ${result} items.`);

        // Also ensure Headlines table is definitely synced
        const hResult = await prisma.$executeRaw`DELETE FROM headlines WHERE news_id NOT IN (SELECT id FROM news)`;
        console.log(`ORPHAN_HEADLINE_CLEANUP: Deleted ${hResult} items.`);

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

aggressiveCleanup();
