import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class HeadlinesService {
    constructor(private prisma: PrismaService) { }

    async findAll(type?: number, news_id?: string) {
        const where: any = {};
        if (type !== undefined) where.type = type;
        if (news_id !== undefined) where.news_id = news_id;
        return this.prisma.headline.findMany({ where, include: { News: true }, orderBy: { order_index: 'asc' } });
    }

    async create(data: any) {
        // Target specific slot
        await this.prisma.headline.deleteMany({
            where: { order_index: data.order_index, type: data.type }
        });
        return this.prisma.headline.create({ data });
    }

    async removeBySlot(order_index: number, type: number) {
        return this.prisma.headline.deleteMany({
            where: { order_index, type }
        });
    }
}
