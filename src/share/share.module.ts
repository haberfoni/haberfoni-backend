import { Module } from '@nestjs/common';
import { ShareController } from './share.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ShareController],
})
export class ShareModule {}
