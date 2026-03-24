const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.botSetting.updateMany({
    data: { use_ai_rewrite: true }
  });
  console.log('Successfully enabled AI rewrite for all sources in DB.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
