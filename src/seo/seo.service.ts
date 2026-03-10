import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NewsService } from '../news/news.service';

@Injectable()
export class SeoService {
    constructor(
        private prisma: PrismaService,
        private newsService: NewsService,
    ) { }

    private async getBaseUrl(requestOrigin: string): Promise<string> {
        const setting = await this.prisma.siteSetting.findUnique({
            where: { key: 'site_url' }
        });

        let url = setting?.value || requestOrigin;
        // Remove trailing slash if present
        if (url.endsWith('/')) {
            url = url.slice(0, -1);
        }
        return url;
    }

    async getRobotsTxt(requestOrigin: string) {
        const settings = await this.prisma.siteSetting.findMany({
            where: { key: { in: ['robots_txt', 'ads_txt'] } },
        });

        const robotsSetting = settings.find(s => s.key === 'robots_txt')?.value;

        if (robotsSetting) return robotsSetting;

        const baseUrl = await this.getBaseUrl(requestOrigin);

        return `User-agent: *
Disallow: /admin/
Disallow: /panel/
Allow: /

# Google Bot Specific Rules
User-agent: Googlebot
Disallow: /admin/
Disallow: /panel/
Allow: /

# Sitemap
Sitemap: ${baseUrl}/sitemap.xml
Sitemap: ${baseUrl}/sitemap-news.xml
Sitemap: ${baseUrl}/rss.xml`;
    }

    async getAdsTxt() {
        const setting = await this.prisma.siteSetting.findUnique({
            where: { key: 'ads_txt' },
        });
        return setting?.value || 'google.com, pub-0000000000000000, DIRECT, f08c47fec0942fa0';
    }

    async generateSitemap(requestOrigin: string) {
        const baseUrl = await this.getBaseUrl(requestOrigin);
        const now = new Date().toISOString();

        // Static Pages
        const staticPages = [
            '/', '/tum-haberler', '/hakkimizda', '/kunye', '/iletisim',
            '/reklam', '/kariyer', '/kvkk', '/cerez-politikasi',
            '/video-galeri', '/foto-galeri'
        ];

        let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

        staticPages.forEach(page => {
            xml += `
  <url>
    <loc>${baseUrl}${page}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`;
        });

        // Content
        try {
            // News
            const newsRes = await this.newsService.findAll({ status: 'published', limit: 5000 });
            newsRes.data.forEach(item => {
                const categorySlug = this.slugify(item.category || 'genel');
                xml += `
  <url>
    <loc>${baseUrl}/kategori/${categorySlug}/${item.slug}</loc>
    <lastmod>${item.published_at?.toISOString() || now}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`;
            });

            // Categories
            const categories = await this.prisma.category.findMany({ where: { is_active: true } });
            categories.forEach(cat => {
                xml += `
  <url>
    <loc>${baseUrl}/kategori/${cat.slug}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>`;
            });

        } catch (e) {
            console.error('Sitemap generation error:', e);
        }

        xml += '\n</urlset>';
        return xml;
    }

    async generateNewsSitemap(requestOrigin: string) {
        const baseUrl = await this.getBaseUrl(requestOrigin);
        const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
        const newsRes = await this.newsService.findAll({ status: 'published', limit: 1000, since: twoDaysAgo });

        let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">`;

        newsRes.data.forEach(item => {
            const categorySlug = this.slugify(item.category || 'genel');
            const date = item.published_at?.toISOString() || new Date().toISOString();
            const safeTitle = this.escapeXml(item.title);

            xml += `
  <url>
    <loc>${baseUrl}/kategori/${categorySlug}/${item.slug}</loc>
    <news:news>
      <news:publication>
        <news:name>Haberfoni</news:name>
        <news:language>tr</news:language>
      </news:publication>
      <news:publication_date>${date}</news:publication_date>
      <news:title>${safeTitle}</news:title>
    </news:news>
  </url>`;
        });

        xml += '\n</urlset>';
        return xml;
    }

    async generateRSS(requestOrigin: string) {
        const baseUrl = await this.getBaseUrl(requestOrigin);
        const now = new Date().toUTCString();
        const newsRes = await this.newsService.findAll({ status: 'published', limit: 50 });

        let xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:media="http://search.yahoo.com/mrss/">
<channel>
  <title>Haberfoni</title>
  <link>${baseUrl}</link>
  <description>Haberfoni - Güncel Haberler, Son Dakika Gelişmeleri</description>
  <language>tr</language>
  <lastBuildDate>${now}</lastBuildDate>
  <atom:link href="${baseUrl}/rss.xml" rel="self" type="application/rss+xml" />`;

        newsRes.data.forEach(item => {
            const categorySlug = this.slugify(item.category || 'genel');
            const link = `${baseUrl}/kategori/${categorySlug}/${item.slug}`;
            const pubDate = item.published_at?.toUTCString() || now;
            const safeTitle = this.escapeXml(item.title);
            const safeSummary = this.escapeXml(item.summary || '');

            xml += `
  <item>
    <title>${safeTitle}</title>
    <link>${link}</link>
    <guid isPermaLink="true">${link}</guid>
    <description><![CDATA[${safeSummary}]]></description>
    <pubDate>${pubDate}</pubDate>
    <category>${item.category || 'Genel'}</category>
    <enclosure url="${item.image_url}" type="image/jpeg" />
  </item>`;
        });

        xml += `
</channel>
</rss>`;
        return xml;
    }

    private slugify(text: string) {
        return text.toString().toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^\w\-]+/g, '')
            .replace(/\-\-+/g, '-')
            .replace(/^-+/, '')
            .replace(/-+$/, '');
    }

    private escapeXml(unsafe: string) {
        return unsafe.replace(/[<>&"']/g, (c) => {
            switch (c) {
                case '<': return '&lt;';
                case '>': return '&gt;';
                case '&': return '&amp;';
                case '"': return '&quot;';
                case "'": return '&apos;';
                default: return c;
            }
        });
    }
}
