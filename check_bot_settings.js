
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const settings = await prisma.botSetting.findMany();
  console.log('BOT_SETTINGS:', JSON.stringify(settings, null, 2));
  const globalSettings = await prisma.setting.findMany();
  console.log('GLOBAL_SETTINGS:', JSON.stringify(globalSettings, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
