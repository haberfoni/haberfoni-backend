import { Module } from '@nestjs/common';
import { ContactMessagesService } from './contact-messages.service';
import { ContactMessagesController } from './contact-messages.controller';

@Module({
  providers: [ContactMessagesService],
  controllers: [ContactMessagesController]
})
export class ContactMessagesModule {}
