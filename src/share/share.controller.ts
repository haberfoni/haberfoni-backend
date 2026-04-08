import { Controller, Get, Param, Header } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('share')
export class ShareController {
  constructor(private prisma: PrismaService) {}
  @Get(':id')
  @Header('Content-Type', 'text/html')
  async getShare(@Param('id') id: string) {
    try {
      const news = await this.prisma.news.findUnique({ where: { id: parseInt(id) } });
      if (!news) return `<html><body><script>window.location.href="https://haberfoni.kaprofis.com";</script></body></html>`;
      
      const esc = (t: string | null | undefined): string => {
        const text = t || '';
        return text.replace(/[<>"']/g, (m) => {
          const map: Record<string, string> = { '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
          return map[m] || m;
        });
      };

      const title = esc(news.title);
      const summary = esc(news.summary || news.title);
      const imageUrl = (news.image_url || '');
      
      // Ensure absolute URL for social meta tags
      let absoluteImageUrl = imageUrl;
      if (imageUrl && !imageUrl.startsWith('http')) {
        const baseUrl = 'https://api-haberfoni.kaprofis.com';
        absoluteImageUrl = imageUrl.startsWith('/') ? `${baseUrl}${imageUrl}` : `${baseUrl}/${imageUrl}`;
      }

      const targetUrl = `https://haberfoni.kaprofis.com/haber/${news.slug}`;
      
      const proxyBase = (await this.prisma.siteSetting.findUnique({ where: { key: 'social_share_proxy_url' } }))?.value || 'https://api-haberfoni.kaprofis.com/servis/share/';
      const currentUrl = `${proxyBase}${id}`;

      return `<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <title>${title}</title>
    <!-- Social Meta Tags -->
    <meta property="og:type" content="article" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${summary}" />
    <meta property="og:image" content="${absoluteImageUrl}" />
    <meta property="og:image:secure_url" content="${absoluteImageUrl}" />
    <meta property="og:url" content="${currentUrl}" />
    <meta property="og:site_name" content="Haberfoni" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${summary}" />
    <meta name="twitter:image" content="${absoluteImageUrl}" />
    <script>
      // Sadece gerçek kullanıcıları yönlendir
      if (!navigator.userAgent.includes('facebookexternalhit')) {
         setTimeout(function() { window.location.href = "${targetUrl}"; }, 500);
      }
    </script>
</head>
<body style="font-family:sans-serif; text-align:center; padding-top:100px; background:#f0f2f5;">
    <div style="background:white; display:inline-block; padding:30px; border-radius:10px; box-shadow:0 2px 10px rgba(0,0,0,0.1);">
        <h2>${title}</h2>
        <p>Haber detayına yönlendiriliyorsunuz...</p>
    </div>
</body>
</html>`;
    } catch (e) { return `<html><body><script>window.location.href="https://haberfoni.kaprofis.com";</script></body></html>`; }
  }
}
