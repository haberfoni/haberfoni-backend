import { Module } from '@nestjs/common';
import { SeoController } from './seo.controller';
import { SeoService } from './seo.service';
import { PrismaModule } from '../prisma/prisma.module';
import { NewsModule } from '../news/news.module';

@Module({
    imports: [PrismaModule, NewsModule],
    controllers: [SeoController],
    providers: [SeoService],
})
export class SeoModule { }
