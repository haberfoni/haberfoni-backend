import { Module } from '@nestjs/common';
import { BotService } from './bot.service';
import { BotController } from './bot.controller';
import { ActivityLogsModule } from '../activity-logs/activity-logs.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [ActivityLogsModule, AiModule],
  controllers: [BotController],
  providers: [BotService],
})
export class BotModule { }
