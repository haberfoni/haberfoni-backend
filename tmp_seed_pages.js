import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const systemPages = [
  { slug: 'hakkimizda', title: 'Hakkımızda', title_en: 'About Us' },
  { slug: 'kunye', title: 'Künye', title_en: 'Imprint' },
  { slug: 'iletisim', title: 'İletişim', title_en: 'Contact' },
  { slug: 'reklam', title: 'Reklam', title_en: 'Advertise' },
  { slug: 'kariyer', title: 'Kariyer', title_en: 'Careers' },
  { slug: 'kvkk', title: 'KVKK', title_en: 'Privacy (KVKK)' },
  { slug: 'cerez-politikasi', title: 'Çerez Politikası', title_en: 'Cookie Policy' }
];

async function main() {
  for (const page of systemPages) {
    const existing = await prisma.page.findUnique({ where: { slug: page.slug } });
    if (!existing) {
      await prisma.page.create({
        data: {
          slug: page.slug,
          title: page.title,
          title_en: page.title_en,
          is_active: true,
          content: '', // Let the component migration logic handle default content if needed
          content_en: ''
        }
      });
      console.log(`Created page: ${page.slug}`);
    } else {
      console.log(`Page already exists: ${page.slug}`);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
