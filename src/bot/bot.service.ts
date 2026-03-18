import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { AiService } from '../ai/ai.service';
import { scrapeAA } from './scrapers/aa.scraper';
import { scrapeIHA } from './scrapers/iha.scraper';
import { scrapeDHA } from './scrapers/dha.scraper';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import axios from 'axios';

@Injectable()
export class BotService implements OnModuleInit {
    private readonly logger = new Logger(BotService.name);
    private readonly UPLOAD_DIR = path.join(process.cwd(), '..', 'public', 'uploads');

    constructor(
        private prisma: PrismaService,
        private activityLogsService: ActivityLogsService,
        private aiService: AiService
    ) {
        if (!fs.existsSync(this.UPLOAD_DIR)) {
            fs.mkdirSync(this.UPLOAD_DIR, { recursive: true });
        }
    }

    async onModuleInit() {
        this.logger.log('BotService initialized');
        await this.cleanupStuckCommands();
        await this.ensureBotSettings();
        await this.ensurePermanentCategoriesAndMappings();
    }

    async ensureBotSettings() {
        try {
            const agencies = ['AA', 'IHA', 'DHA'];
            for (const agency of agencies) {
                const existing = await this.prisma.botSetting.findUnique({
                    where: { source_name: agency }
                });
                if (!existing) {
                    await this.prisma.botSetting.create({
                        data: { source_name: agency, is_active: true, auto_publish: true }
                    });
                    this.logger.log(`Created default bot setting for ${agency}`);
                }
            }
            this.logger.log('Bot settings verified.');
        } catch (error) {
            this.logger.error(`Failed to ensure bot settings: ${error.message}`);
        }
    }

    async cleanupStuckCommands() {
        try {
            const result = await this.prisma.botCommand.updateMany({
                where: {
                    status: { in: ['PENDING', 'PROCESSING'] }
                },
                data: {
                    status: 'FAILED',
                    payload: 'System restarted while task was pending/processing.',
                    executed_at: new Date() // Mark the time it was failed
                }
            });
            if (result.count > 0) {
                this.logger.warn(`Cleaned up ${result.count} stuck bot commands.`);
            }
        } catch (error) {
            this.logger.error(`Failed to cleanup stuck commands: ${error.message}`);
        }
    }

    async createCommand(type: string) {
        return this.prisma.botCommand.create({
            data: {
                command: type,
                status: 'PENDING'
            }
        });
    }

    async getLatestCommand() {
        return this.prisma.botCommand.findFirst({
            orderBy: { created_at: 'desc' }
        });
    }

    @Cron('*/5 * * * *')
    async handleCron() {
        this.logger.log('Starting scheduled scrape cycle (5 min frequency)...');
        await this.scrapeAll();
    }

    async scrapeAll(commandId?: number) {
        // PREVENT OVERLAPPING: Check if any command is currently PROCESSING
        const activeCommand = await this.prisma.botCommand.findFirst({
            where: { status: 'PROCESSING' }
        });

        if (activeCommand && (!commandId || activeCommand.id !== commandId)) {
            this.logger.warn(`Scrape cycle skipped. Another command is already PROCESSING: ID ${activeCommand.id}`);
            // If this was a PENDING command that we're trying to start, mark it as FAILED/SKIPPED
            if (commandId) {
                await this.prisma.botCommand.update({
                    where: { id: commandId },
                    data: { status: 'FAILED', payload: 'Another process is already running.' }
                }).catch(() => { });
            }
            return;
        }

        let cmdId = commandId;

        // If no commandId provided (e.g. Cron), create one
        if (!cmdId) {
            try {
                const cmd = await this.prisma.botCommand.create({
                    data: {
                        command: 'CRON_RUN',
                        status: 'PROCESSING',
                        executed_at: new Date()
                    }
                });
                cmdId = cmd.id;
            } catch (e) {
                this.logger.error(`Failed to create bot command record: ${e.message}`);
            }
        } else {
            // Update existing command to PROCESSING
            try {
                await this.prisma.botCommand.update({
                    where: { id: cmdId },
                    data: { status: 'PROCESSING', executed_at: new Date() }
                });
            } catch (e) {
                this.logger.error(`Failed to update bot command status to PROCESSING: ${e.message}`);
                // If we can't update status, we should probably stop or at least log heavily
            }
        }

        try {
            this.logger.log('Starting full scrape for all agencies...');
            this.logger.log('Starting full scrape for all agencies sequentially...');
            const mappingsCount = await this.prisma.botCategoryMapping.count({ where: { is_active: true } });
            this.logger.log(`Active mappings found: ${mappingsCount}`);

            const results: any[] = [];
            
            this.logger.log('Running AA Scraper...');
            try {
                const res = await scrapeAA(this);
                results.push({ status: 'fulfilled', value: res });
            } catch (err) {
                results.push({ status: 'rejected', reason: err });
            }

            this.logger.log('Running IHA Scraper...');
            try {
                const res = await scrapeIHA(this);
                results.push({ status: 'fulfilled', value: res });
            } catch (err) {
                results.push({ status: 'rejected', reason: err });
            }

            this.logger.log('Running DHA Scraper...');
            try {
                const res = await scrapeDHA(this);
                results.push({ status: 'fulfilled', value: res });
            } catch (err) {
                results.push({ status: 'rejected', reason: err });
            }

            this.logger.log(`Scraper execution summaries:`);
            results.forEach((res, i) => {
                const agency = ['AA', 'IHA', 'DHA'][i];
                if (res.status === 'fulfilled') {
                    this.logger.log(`${agency}: Scraper finished (fulfilled). Result: ${JSON.stringify(res.value)}`);
                } else {
                    this.logger.error(`${agency}: Scraper FAILED (rejected). Reason: ${res.reason}`);
                }
            });

            if (cmdId) {
                await this.prisma.botCommand.update({
                    where: { id: cmdId },
                    data: { status: 'COMPLETED' }
                });
            }
            this.logger.log('Scrape cycle finished.');
            await this.activityLogsService.create({
                action_type: 'BOT_RUN',
                entity_type: 'BOT',
                description: 'Haber botu otomatik tarama döngüsünü başarıyla tamamladı.'
            }).catch(() => { });
        } catch (error) {
            this.logger.error(`Scrape cycle failed: ${error.message}`);
            if (cmdId) {
                await this.prisma.botCommand.update({
                    where: { id: cmdId },
                    data: { status: 'FAILED', payload: error.message }
                });
            }
        }
    }

    // --- DB Helpers for Scrapers ---

    async getSettings() {
        return this.prisma.botSetting.findMany({
            orderBy: { source_name: 'asc' }
        });
    }

    async updateSetting(id: number, data: any) {
        return this.prisma.botSetting.update({
            where: { id },
            data
        });
    }

    async getAllMappings() {
        return this.prisma.botCategoryMapping.findMany({
            orderBy: { source_name: 'asc' }
        });
    }

    async getBotMappings(sourceName: string) {
        return this.prisma.botCategoryMapping.findMany({
            where: { source_name: sourceName }, // include inactive so admin can manage them
        });
    }

    async addMapping(data: any) {
        try {
            return await this.prisma.botCategoryMapping.create({
                data
            });
        } catch (error) {
            this.logger.error(`Error adding mapping: ${error.message}`);
            throw error;
        }
    }

    async deleteMapping(id: number) {
        const mapping = await this.prisma.botCategoryMapping.findUnique({ where: { id } });
        if (mapping && (mapping.target_category === 'foto-galeri' || mapping.target_category === 'video-galeri')) {
            throw new Error('This mapping is critical and cannot be deleted.');
        }
        return this.prisma.botCategoryMapping.delete({
            where: { id }
        });
    }

    async ensurePermanentCategoriesAndMappings() {
        try {
            this.logger.log('Ensuring permanent categories and mappings...');
            
            // 1. Ensure Categories
            const categories = [
                { name: 'Foto Galeri', slug: 'foto-galeri' },
                { name: 'Video Galeri', slug: 'video-galeri' }
            ];

            for (const cat of categories) {
                await this.prisma.category.upsert({
                    where: { slug: cat.slug },
                    update: { name: cat.name, is_active: true },
                    create: { name: cat.name, slug: cat.slug, is_active: true }
                });
            }

            // 2. Ensure Mappings
            const mappings = [
                { source_name: 'IHA', source_url: 'https://www.iha.com.tr/video', target_category: 'video-galeri' },
                { source_name: 'IHA', source_url: 'https://www.iha.com.tr/foto-galeri', target_category: 'foto-galeri' },
                { source_name: 'DHA', source_url: 'https://www.dha.com.tr/video', target_category: 'video-galeri' },
                { source_name: 'DHA', source_url: 'https://www.dha.com.tr/foto-galeri', target_category: 'foto-galeri' },
                { source_name: 'AA', source_url: 'https://www.aa.com.tr/tr/video', target_category: 'video-galeri' },
                { source_name: 'AA', source_url: 'https://www.aa.com.tr/tr/foto-galeri', target_category: 'foto-galeri' },
                { source_name: 'AA', source_url: 'https://www.aa.com.tr/tr/video-galerisi', target_category: 'video-galeri' },
                { source_name: 'AA', source_url: 'https://www.aa.com.tr/tr/fotoraf-galerisi', target_category: 'foto-galeri' }
            ];

            for (const m of mappings) {
                const existing = await this.prisma.botCategoryMapping.findUnique({
                    where: { source_url: m.source_url }
                });
                if (!existing) {
                    await this.prisma.botCategoryMapping.create({
                        data: { ...m, is_active: true }
                    });
                    this.logger.log(`Created permanent mapping for ${m.source_url}`);
                }
            }

            this.logger.log('Permanent categories and mappings verified.');
        } catch (error) {
            this.logger.error(`Failed to ensure permanent items: ${error.message}`);
        }
    }

    async toggleMapping(id: number, isActive: boolean) {
        return this.prisma.botCategoryMapping.update({
            where: { id },
            data: { is_active: isActive, updated_at: new Date() }
        });
    }

    async resetBotCommands() {
        return this.prisma.botCommand.updateMany({
            where: {
                status: { in: ['PENDING', 'PROCESSING'] }
            },
            data: {
                status: 'FAILED',
                payload: 'Manually reset by admin.',
                executed_at: new Date()
            }
        });
    }

    async updateMappingStatus(url: string, status: string, count: number, error?: string) {
        try {
            await this.prisma.botCategoryMapping.update({
                where: { source_url: url },
                data: {
                    last_scraped_at: new Date(),
                    last_status: status,
                    last_item_count: count,
                    last_error: error || null
                }
            });
        } catch (e) {
            this.logger.error(`Error updating mapping status for ${url}: ${e.message}`);
        }
    }

    private async downloadImage(url: string | null | undefined, source: string, type: string): Promise<string | null> {
        if (!url || !url.startsWith('http')) return url || null;

        try {
            const hash = crypto.createHash('md5').update(url).digest('hex');
            const urlPath = new URL(url).pathname;
            const ext = path.extname(urlPath) || '.jpg';
            const filename = `${source.toLowerCase()}_${type}_${hash}${ext}`;
            const filepath = path.join(this.UPLOAD_DIR, filename);

            // Check if already exists
            if (fs.existsSync(filepath)) {
                return `/uploads/${filename}`;
            }

            // Download
            const response = await axios.get(url, {
                responseType: 'arraybuffer',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                    'Referer': new URL(url).origin
                },
                timeout: 10000
            });

            fs.writeFileSync(filepath, response.data);
            this.logger.debug(`Downloaded image: ${filename} from ${url}`);
            return `/uploads/${filename}`;
        } catch (error) {
            this.logger.warn(`Failed to download image from ${url}: ${error.message}`);
            return url; // Fallback to original URL
        }
    }

    async saveVideo(data: any) {
        try {
            // Check for generic titles
            if (this.isGenericTitle(data.title)) {
                this.logger.verbose(`Skipping generic video title: ${data.title}`);
                return false;
            }

            // Check for duplicate by original_url
            if (data.original_url) {
                const existing = await this.prisma.video.findFirst({
                    where: { original_url: data.original_url }
                });
                if (existing) {
                    // Update title if existing one is 'Video' or empty
                    if (existing.title.toLowerCase() === 'video' || !existing.title) {
                        await this.prisma.video.update({
                            where: { id: existing.id },
                            data: { title: data.title }
                        });
                        this.logger.log(`Updated title for existing video: ${data.title}`);
                        return true;
                    }
                    this.logger.verbose(`Skipping existing video: ${data.title}`);
                    return false;
                }
            }

            // DHA Specific: If a gallery with same title exists, skip video
            if (data.source === 'DHA') {
                const galleryExists = await this.prisma.photoGallery.findFirst({
                    where: { title: data.title, source: 'DHA' }
                });
                if (galleryExists) {
                    this.logger.verbose(`Skipping DHA video because gallery exists: ${data.title}`);
                    return false;
                }
            }

            // Check if source is active
            const settings = await this.prisma.botSetting.findUnique({
                where: { source_name: data.source }
            });
            if (settings && !settings.is_active) {
                this.logger.verbose(`Source ${data.source} is inactive, skipping video.`);
                return false;
            }

            const slug = data.slug || this.slugify(data.title);
            
            // 3.5 AI Rewrite if enabled
            let socialPosts: any = null;
            let finalTitle = data.title;
            let finalDescription = data.description || '';
            let aiModel: string | null = null;
            let author = data.author || data.source;
            let seoTitle = data.title;
            let seoDescription = data.description
                ? data.description.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().substring(0, 160)
                : '';
            let seoKeywords = this.generateKeywords(data.title);

            if (settings && settings.use_ai_rewrite) {
                this.logger.log(`AI Rewrite is active for Video from ${data.source}. Attempting rewrite...`);
                const rewritten = await this.aiService.rewriteVisualContent(data.title, data.description || '');
                if (rewritten) {
                    finalTitle = rewritten.title;
                    finalDescription = rewritten.description;
                    seoTitle = rewritten.seo_title;
                    seoDescription = rewritten.seo_description;
                    seoKeywords = rewritten.seo_keywords;
                    author = 'Yapay Zeka Editörü';
                    aiModel = rewritten.model;

                    // Only use AI's English if free translate is NOT active
                    if (!settings.use_free_translate) {
                        (data as any).title_en = rewritten.title_en;
                        (data as any).description_en = rewritten.description_en;
                        (data as any).seo_title_en = rewritten.seo_title_en;
                        (data as any).seo_description_en = rewritten.seo_description_en;
                        (data as any).seo_keywords_en = rewritten.seo_keywords_en;
                    }

                    this.logger.log(`AI Rewrite SUCCESS for video: ${finalTitle} (${aiModel})`);
                    
                    // Generate social posts
                    socialPosts = await this.aiService.generateSocialPosts(finalTitle, finalDescription.substring(0, 300));
                } else {
                    this.logger.warn(`AI Rewrite FAILED or SKIPPED for video: ${data.title}`);
                }
                await new Promise(resolve => setTimeout(resolve, 4500));
            }

            // High Priority: Free Translation (Overrides AI English if both active)
            if (settings && settings.use_free_translate) {
                // Basic translation without AI (or overriding AI's English)
                const [titleEn, descEn] = await Promise.all([
                    this.aiService.translateFree(finalTitle, 'en'),
                    this.aiService.translateFree(finalDescription || '', 'en')
                ]);
                (data as any).title_en = titleEn;
                (data as any).description_en = descEn;
                (data as any).seo_title_en = titleEn;
                (data as any).seo_description_en = descEn ? descEn.substring(0, 160) : '';
                this.logger.log(`Free Translation applied (Priority) for video: ${finalTitle}`);
            }

            // 3.6 Download Thumbnail
            let localThumbnail = data.thumbnail_url;
            if (data.thumbnail_url && data.thumbnail_url.startsWith('http')) {
                const downloaded = await this.downloadImage(data.thumbnail_url, data.source, 'video');
                if (downloaded) localThumbnail = downloaded;
            }

            // 4. Create Video
            const createdVideo = await this.prisma.video.create({
                data: {
                    title: finalTitle,
                    slug,
                    description: finalDescription,
                    title_en: (data as any).title_en,
                    description_en: (data as any).description_en,
                    video_url: data.video_url,
                    thumbnail_url: localThumbnail,
                    source: data.source,
                    author: author,
                    ai_model: aiModel,
                    original_url: data.original_url,
                    published_at: new Date(),
                    seo_title: seoTitle,
                    seo_description: seoDescription,
                    seo_keywords: seoKeywords,
                    seo_title_en: (data as any).seo_title_en,
                    seo_description_en: (data as any).seo_description_en,
                    seo_keywords_en: (data as any).seo_keywords_en,
                    social_posts: socialPosts || undefined
                }
            });

            // 3.6 Tags
            if (seoKeywords) {
                const tagIds = await this.getOrCreateTags(seoKeywords);
                await this.syncVideoTags(createdVideo.id, tagIds);
            }

            this.logger.log(`Successfully saved video: ${finalTitle} (Source: ${data.source})`);
            return true;
        } catch (error) {
            this.logger.error(`Error saving video [${data.title}] from ${data.source}: ${error.message}`);
            return false;
        }
    }

    async saveGallery(data: any) {
        try {
            // Check for generic titles
            if (this.isGenericTitle(data.title)) {
                this.logger.verbose(`Skipping generic gallery title: ${data.title}`);
                return false;
            }

            // Check for duplicate by original_url
            if (data.original_url) {
                const existing = await this.prisma.photoGallery.findFirst({
                    where: { original_url: data.original_url }
                });
                if (existing) {
                    this.logger.verbose(`Skipping existing gallery: ${data.title}`);
                    return false;
                }
            }

            // DHA Specific: If a video with same title exists, delete it (Gallery wins)
            if (data.source === 'DHA') {
                const videoExists = await this.prisma.video.findFirst({
                    where: { title: data.title, source: 'DHA' }
                });
                if (videoExists) {
                    await this.prisma.video.delete({ where: { id: videoExists.id } });
                    this.logger.log(`Deleted duplicate DHA video in favor of gallery: ${data.title}`);
                }
            }

            // Check if source is active
            const settings = await this.prisma.botSetting.findUnique({
                where: { source_name: data.source }
            });
            if (settings && !settings.is_active) {
                this.logger.verbose(`Source ${data.source} is inactive, skipping gallery.`);
                return false;
            }

            const slug = data.slug || this.slugify(data.title);

            // 3.5 AI Rewrite if enabled
            let socialPosts: any = null;
            let finalTitle = data.title;
            let finalDescription = data.description || '';
            let aiModel: string | null = null;
            let author = data.author || data.source;
            let seoTitle = data.title;
            let seoDescription = data.description
                ? data.description.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().substring(0, 160)
                : '';
            let seoKeywords = this.generateKeywords(data.title);

            if (settings && settings.use_ai_rewrite) {
                this.logger.log(`AI Rewrite is active for Gallery from ${data.source}. Attempting rewrite...`);
                const rewritten = await this.aiService.rewriteVisualContent(data.title, data.description || '');
                if (rewritten) {
                    finalTitle = rewritten.title;
                    finalDescription = rewritten.description;
                    seoKeywords = rewritten.seo_keywords;
                    author = 'Yapay Zeka Editörü';
                    aiModel = rewritten.model;

                    // Only use AI's English if free translate is NOT active
                    if (!settings.use_free_translate) {
                        (data as any).title_en = rewritten.title_en;
                        (data as any).description_en = rewritten.description_en;
                        (data as any).seo_title_en = rewritten.seo_title_en;
                        (data as any).seo_description_en = rewritten.seo_description_en;
                        (data as any).seo_keywords_en = rewritten.seo_keywords_en;
                    }

                    this.logger.log(`AI Rewrite SUCCESS for gallery: ${finalTitle} (${aiModel})`);
                    
                    // Generate social posts
                    socialPosts = await this.aiService.generateSocialPosts(finalTitle, finalDescription.substring(0, 300));
                } else {
                    this.logger.warn(`AI Rewrite FAILED or SKIPPED for gallery: ${data.title}`);
                }
                await new Promise(resolve => setTimeout(resolve, 4500));
            }

            // High Priority: Free Translation (Overrides AI English if both active)
            if (settings && settings.use_free_translate) {
                // Basic translation without AI
                const [titleEn, descEn] = await Promise.all([
                    this.aiService.translateFree(finalTitle, 'en'),
                    this.aiService.translateFree(finalDescription || '', 'en')
                ]);
                (data as any).title_en = titleEn;
                (data as any).description_en = descEn;
                (data as any).seo_title_en = titleEn;
                (data as any).seo_description_en = descEn ? descEn.substring(0, 160) : '';
                this.logger.log(`Free Translation applied (Priority) for gallery: ${finalTitle}`);
            }

            const createdGallery = await this.prisma.photoGallery.create({
                data: {
                    title: finalTitle,
                    slug,
                    description: finalDescription,
                    title_en: (data as any).title_en,
                    description_en: (data as any).description_en,
                    thumbnail_url: await this.downloadImage(data.thumbnail_url, data.source, 'gallery'),
                    source: data.source,
                    author: author,
                    ai_model: aiModel,
                    original_url: data.original_url,
                    published_at: new Date(),
                    seo_title: seoTitle,
                    seo_description: seoDescription,
                    seo_keywords: seoKeywords,
                    seo_title_en: (data as any).seo_title_en,
                    seo_description_en: (data as any).seo_description_en,
                    seo_keywords_en: (data as any).seo_keywords_en,
                    social_posts: socialPosts || undefined,
                    gallery_images: {
                        create: data.images ? await Promise.all(data.images.map(async (img: any, index: number) => {
                            const imageUrl = await this.downloadImage(img.url, data.source, 'gallery_item');
                            let caption_en: string | null = null;

                            // Handle caption translation if enabled
                            if (settings && settings.use_free_translate && img.caption) {
                                try {
                                    caption_en = await this.aiService.translateFree(img.caption, 'en');
                                } catch (e) {
                                    this.logger.warn(`Failed to translate gallery image caption: ${e.message}`);
                                }
                            }

                            return {
                                image_url: imageUrl,
                                caption: img.caption || '',
                                caption_en: caption_en,
                                media_type: img.media_type || 'image',
                                video_url: img.video_url || null,
                                order_index: index
                            };
                        })) : []
                    }
                }
            });

            // 3.6 Tags
            if (seoKeywords) {
                const tagIds = await this.getOrCreateTags(seoKeywords);
                await this.syncGalleryTags(createdGallery.id, tagIds);
            }

            this.logger.log(`Successfully saved gallery: ${finalTitle} (Source: ${data.source})`);
            return true;
        } catch (error) {
            this.logger.error(`Error saving gallery [${data.title}] from ${data.source}: ${error.message}`);
            return false;
        }
    }

    async saveNews(newsItem: any): Promise<boolean> {
        try {
            // Check for generic titles
            if (this.isGenericTitle(newsItem.title)) {
                this.logger.verbose(`Skipping generic news title: ${newsItem.title}`);
                return false;
            }

            // 0. Get Settings early for logic control
            const settings = await this.prisma.botSetting.findUnique({
                where: { source_name: newsItem.source },
            });
            if (settings && !settings.is_active) return false;

            // 1. Check existence
            const existing = await this.prisma.news.findFirst({
                where: { original_url: newsItem.original_url },
            });

            if (existing) {
                const needsImageUpdate = existing.image_url === null && newsItem.image_url;
                
                if (needsImageUpdate) {
                    this.logger.log(`Updating missing image for existing news item: ${existing.id}`);
                    const localImageUrl = await this.downloadImage(newsItem.image_url, newsItem.source, 'news_update');
                    await this.prisma.news.update({
                        where: { id: existing.id },
                        data: { image_url: localImageUrl }
                    });
                }
                
                this.logger.verbose(`Skipping existing news (Content protected): ${newsItem.title.substring(0, 50)}...`);
                return false;
            }

            // 2. Settings already loaded at the top
            const shouldPublish = settings ? settings.auto_publish : false;

            // 3. Category ID
            const category = await this.prisma.category.findFirst({
                where: { 
                    OR: [
                        { slug: newsItem.category },
                        { name: newsItem.category }
                    ]
                },
            });
            const categoryId = category ? category.id : null;

            // 3.5 AI Rewrite if enabled
            let socialPosts: any = null;
            if (settings && settings.use_ai_rewrite) {
                this.logger.log(`AI Rewrite is active for ${newsItem.source}. Attempting rewrite...`);
                const rewritten = await this.aiService.rewriteNews(newsItem.title, newsItem.summary, newsItem.content);
                if (rewritten) {
                    newsItem.title = rewritten.title;
                    newsItem.summary = rewritten.summary;
                    newsItem.content = rewritten.content;
                    
                    // Always keep AI provided translations if available
                    newsItem.title_en = rewritten.title_en || newsItem.title_en;
                    newsItem.summary_en = rewritten.summary_en || newsItem.summary_en;
                    newsItem.content_en = rewritten.content_en || newsItem.content_en;
                    newsItem.seo_title_en = rewritten.seo_title_en || newsItem.title_en;
                    newsItem.seo_description_en = rewritten.seo_description_en || (newsItem.summary_en ? newsItem.summary_en.substring(0, 160) : '');
                    newsItem.seo_keywords_en = rewritten.seo_keywords_en || '';
                    
                    newsItem.author = 'Yapay Zeka Editörü';
                    (newsItem as any).ai_model = rewritten.model;
                    this.logger.log(`AI Rewrite SUCCESS for: ${newsItem.title} (${rewritten.model})`);
                } else {
                    this.logger.warn(`AI Rewrite FAILED or SKIPPED for: ${newsItem.title}`);
                }
                // Central delay to respect AI RPM limits (Gemini free is 15 RPM ~ 1 per 4s)
                await new Promise(resolve => setTimeout(resolve, 4500));
            }

            // Priority 2: Use Free Translation ONLY if we don't have English yet
            if (settings && settings.use_free_translate && !newsItem.title_en) {
                this.logger.log(`Starting Free Translation for news: ${newsItem.title}`);
                const [titleEn, summaryEn, contentEn] = await Promise.all([
                    this.aiService.translateFree(newsItem.title, 'en'),
                    this.aiService.translateFree(newsItem.summary || '', 'en'),
                    this.aiService.translateHtmlFree(newsItem.content || '', 'en')
                ]);
                newsItem.title_en = titleEn;
                newsItem.summary_en = summaryEn;
                newsItem.content_en = contentEn;
                newsItem.seo_title_en = titleEn;
                newsItem.seo_description_en = summaryEn ? summaryEn.substring(0, 160) : '';
                this.logger.log(`Free Translation applied (Result Length: ${titleEn?.length || 0}) for news: ${newsItem.title}`);
            }

            // Clean up messy HTML content if AI didn't rewrite it
            if (newsItem.author !== 'Yapay Zeka Editörü' && newsItem.content) {
                newsItem.content = newsItem.content
                    .replace(/\s(style|class)="[^"]*"/gi, '') // Remove inline styles and classes
                    .replace(/<div[^>]*>/gi, '<p>')          // Convert divs to p
                    .replace(/<\/div>/gi, '</p>')
                    .replace(/<span[^>]*>/gi, '')           // Remove spans
                    .replace(/<\/span>/gi, '')
                    .replace(/<p>\s*<\/p>/gi, '')           // Remove empty p tags
                    .trim();
            }

            // 3.6 Add Source Attribution Footer
            const sourceFooter = this.getSourceFooterHtml(newsItem.source);
            if (sourceFooter) {
                newsItem.content = (newsItem.content || '') + sourceFooter;
            }

            // 4. Slug
            const slug = this.slugify(newsItem.title);

            // 5. SEO Pre-processing
            const seoDescription = newsItem.summary
                ? newsItem.summary.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().substring(0, 160)
                : '';
            const seoKeywords = this.generateKeywords(newsItem.title);

            // 6. Insert
            const createdNews = await this.prisma.news.create({
                data: {
                    title: newsItem.title,
                    slug: slug,
                    summary: newsItem.summary,
                    content: newsItem.content,
                    title_en: newsItem.title_en,
                    summary_en: newsItem.summary_en,
                    content_en: newsItem.content_en,
                    image_url: await this.downloadImage(newsItem.image_url, newsItem.source, 'news'),
                    category: newsItem.category,
                    category_id: categoryId,
                    original_url: newsItem.original_url,
                    source: newsItem.source,
                    author: newsItem.author,
                    published_at: shouldPublish ? new Date() : null,
                    is_active: true,
                    is_slider: false,
                    seo_title: newsItem.title,
                    seo_description: seoDescription,
                    seo_keywords: seoKeywords,
                    seo_title_en: newsItem.seo_title_en,
                    seo_description_en: newsItem.seo_description_en,
                    seo_keywords_en: newsItem.seo_keywords_en,
                    social_posts: socialPosts || undefined,
                    ai_model: (newsItem as any).ai_model || null,
                },
            });

            await this.activityLogsService.create({
                action_type: 'CREATE',
                entity_type: 'NEWS',
                entity_id: createdNews.id,
                description: `Haber botu tarafından eklendi: ${newsItem.title} (Kaynak: ${newsItem.source})`
            }).catch(() => { });

            // 6.5 Tags
            if (seoKeywords) {
                const tagIds = await this.getOrCreateTags(seoKeywords);
                await this.syncNewsTags(createdNews.id, tagIds);
            }

            return true;
        } catch (e) {
            if (e.code === 'P2002') return false; // Unique constraint
            this.logger.error(`Error saving news: ${e.message}`);
            return false;
        }
    }

    private getSourceFooterHtml(source: string): string {
        const agencies = {
            'AA': 'Anadolu Ajansı',
            'IHA': 'İhlas Haber Ajansı',
            'DHA': 'Demirören Haber Ajansı'
        };

        const agencyName = agencies[source.toUpperCase()];
        if (!agencyName) return '';

        return `
            <div style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #f0f0f0; clear: both;">
                <p style="font-size: 0.7rem; font-style: italic; color: #888;">
                    Bu haber ${agencyName}'dan alınmıştır.
                </p>
            </div>
        `;
    }

    private generateKeywords(title: string): string {
        if (!title) return '';
        const cleanTitle = title.replace(/[^\w\s-çğıöşüÇĞİÖŞÜ]/g, ' ').replace(/\s+/g, ' ').trim();
        const words = cleanTitle.split(' ');
        const filteredWords = words.filter(word => word.length > 3);
        return Array.from(new Set(filteredWords)).join(', ');
    }

    private slugify(text: string, withRandom: boolean = true) {
        let slug = text
            .toString()
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^\w\-]+/g, '')
            .replace(/\-\-+/g, '-')
            .replace(/^-+/, '')
            .replace(/-+$/, '');

        if (withRandom) {
            slug += '-' + Math.floor(Math.random() * 1000);
        }
        return slug;
    }

    public isGenericTitle(title: string): boolean {
        if (!title) return true;
        const genericTitles = [
            'Video', 'VIDEO', 'video',
            'Video Galeri', 'VIDEO GALERİ', 'video galeri',
            'Haber', 'HABER', 'haber',
            'Foto Galeri Haberleri', 'FOTO GALERİ HABERLERİ', 'foto galeri haberleri',
            'Foto Galeri', 'FOTO GALERİ', 'foto galeri'
        ];
        return genericTitles.includes(title.trim());
    }

    private async getOrCreateTags(keywords: string): Promise<number[]> {
        if (!keywords) return [];
        const tagNames = keywords.split(',').map(k => k.trim()).filter(k => k.length > 0);
        const tagIds: number[] = [];

        for (const name of tagNames) {
            const slug = this.slugify(name, false);
            
            // Try to translate the tag name to English
            let nameEn: string | null = null;
            try {
                // We use translateFree here. It might be slightly slow for many tags, 
                // but since we process them sequentially in the bot cycle, it's manageable.
                nameEn = await this.aiService.translateFree(name, 'en');
            } catch (e) {
                this.logger.warn(`Failed to translate tag [${name}]: ${e.message}`);
            }

            const tag = await this.prisma.tag.upsert({
                where: { slug },
                update: {
                   // Update name_en if it was missing
                   ...(nameEn ? { name_en: nameEn } : {})
                },
                create: { 
                    name, 
                    slug,
                    name_en: nameEn
                }
            });
            tagIds.push(tag.id);
        }
        return tagIds;
    }

    private async syncNewsTags(newsId: number, tagIds: number[]) {
        for (const tagId of tagIds) {
            await this.prisma.newsTag.upsert({
                where: { news_id_tag_id: { news_id: newsId, tag_id: tagId } },
                update: {},
                create: { news_id: newsId, tag_id: tagId }
            });
        }
    }

    private async syncVideoTags(videoId: number, tagIds: number[]) {
        for (const tagId of tagIds) {
            await this.prisma.videoTag.upsert({
                where: { video_id_tag_id: { video_id: videoId, tag_id: tagId } },
                update: {},
                create: { video_id: videoId, tag_id: tagId }
            });
        }
    }

    private async syncGalleryTags(galleryId: number, tagIds: number[]) {
        for (const tagId of tagIds) {
            await this.prisma.photoGalleryTag.upsert({
                where: { gallery_id_tag_id: { gallery_id: galleryId, tag_id: tagId } },
                update: {},
                create: { gallery_id: galleryId, tag_id: tagId }
            });
        }
    }
}
