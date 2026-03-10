import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { NewsModule } from './news/news.module';
import { AdsModule } from './ads/ads.module';
import { BotModule } from './bot/bot.module';
import { CategoriesModule } from './categories/categories.module';
import { SettingsModule } from './settings/settings.module';
import { UploadModule } from './upload/upload.module';
import { ContactMessagesModule } from './contact-messages/contact-messages.module';
import { CommentsModule } from './comments/comments.module';
import { HeadlinesModule } from './headlines/headlines.module';
import { RedirectsModule } from './redirects/redirects.module';
import { StatsModule } from './stats/stats.module';
import { TagsModule } from './tags/tags.module';
import { ActivityLogsModule } from './activity-logs/activity-logs.module';
import { PagesModule } from './pages/pages.module';
import { GalleriesModule } from './galleries/galleries.module';
import { VideosModule } from './videos/videos.module';
import { SubscribersModule } from './subscribers/subscribers.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { RedirectMiddleware } from './redirects/redirect.middleware';
import { SeoModule } from './seo/seo.module';
import { NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AiModule } from './ai/ai.module';

const UPLOAD_DIR = join(process.cwd(), '..', 'public', 'uploads');

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: UPLOAD_DIR,
      serveRoot: '/uploads',
    }),
    ScheduleModule.forRoot(),
    PrismaModule, NewsModule, AdsModule, BotModule, CategoriesModule, SettingsModule, UploadModule, ContactMessagesModule, CommentsModule, HeadlinesModule, RedirectsModule, StatsModule, TagsModule, ActivityLogsModule, PagesModule, GalleriesModule, VideosModule, SubscribersModule, UsersModule, AuthModule, SeoModule, AiModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  constructor() {
    if (!existsSync(UPLOAD_DIR)) {
      mkdirSync(UPLOAD_DIR, { recursive: true });
    }
  }

  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(RedirectMiddleware)
      .forRoutes('*');
  }
}
