import { Controller, Get, Header, Req } from '@nestjs/common';
import { SeoService } from './seo.service';
import type { Request } from 'express';

@Controller()
export class SeoController {
    constructor(private readonly seoService: SeoService) { }

    private getRequestUrl(req: Request): string {
        return `${req.protocol}://${req.get('host')}`;
    }

    @Get('robots.txt')
    @Header('Content-Type', 'text/plain')
    async getRobots(@Req() req: Request) {
        return this.seoService.getRobotsTxt(this.getRequestUrl(req));
    }

    @Get('ads.txt')
    @Header('Content-Type', 'text/plain')
    async getAds() {
        return this.seoService.getAdsTxt();
    }

    @Get('sitemap.xml')
    @Header('Content-Type', 'application/xml')
    async getSitemap(@Req() req: Request) {
        return this.seoService.generateSitemap(this.getRequestUrl(req));
    }

    @Get('sitemap-news.xml')
    @Header('Content-Type', 'application/xml')
    async getNewsSitemap(@Req() req: Request) {
        return this.seoService.generateNewsSitemap(this.getRequestUrl(req));
    }

    @Get('rss.xml')
    @Header('Content-Type', 'application/xml')
    async getRSS(@Req() req: Request) {
        return this.seoService.generateRSS(this.getRequestUrl(req));
    }
}
