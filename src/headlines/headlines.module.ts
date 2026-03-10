import { Module } from '@nestjs/common';
import { HeadlinesService } from './headlines.service';
import { HeadlinesController } from './headlines.controller';

@Module({
  providers: [HeadlinesService],
  controllers: [HeadlinesController]
})
export class HeadlinesModule {}
