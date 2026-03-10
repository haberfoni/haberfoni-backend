import { Module } from '@nestjs/common';
import { RedirectsService } from './redirects.service';
import { RedirectsController } from './redirects.controller';

@Module({
  providers: [RedirectsService],
  controllers: [RedirectsController]
})
export class RedirectsModule {}
