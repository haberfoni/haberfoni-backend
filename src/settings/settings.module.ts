import { Module } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { SettingsController } from './settings.controller';
import { EmailSettingsController } from './email-settings.controller';
import { FooterSectionsController } from './footer-sections.controller';

@Module({
  providers: [SettingsService],
  controllers: [SettingsController, EmailSettingsController, FooterSectionsController],
  exports: [SettingsService]
})
export class SettingsModule { }
