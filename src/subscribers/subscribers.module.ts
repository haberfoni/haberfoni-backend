import { Module } from '@nestjs/common';
import { SubscribersService } from './subscribers.service';
import { SubscribersController } from './subscribers.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [SubscribersController],
    providers: [SubscribersService],
    exports: [SubscribersService],
})
export class SubscribersModule { }
