import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SettingsService {
    constructor(private prisma: PrismaService) { }

    async findAll() {
        return this.prisma.siteSetting.findMany();
    }

    async findOne(key: string) {
        return this.prisma.siteSetting.findUnique({
            where: { key },
        });
    }

    async update(key: string, value: string) {
        return this.prisma.siteSetting.upsert({
            where: { key },
            update: { value },
            create: { key, value },
        });
    }
}
