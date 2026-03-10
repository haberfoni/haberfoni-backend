import { Module } from '@nestjs/common';
import { GalleriesService } from './galleries.service';
import { GalleriesController } from './galleries.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [GalleriesController],
    providers: [GalleriesService],
    exports: [GalleriesService]
})
export class GalleriesModule { }
