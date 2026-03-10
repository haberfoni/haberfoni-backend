import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class VideosService {
    constructor(private prisma: PrismaService) { }

    async findAll(params: {
        page?: number;
        limit?: number;
        search?: string;
        status?: 'published' | 'draft';
    }) {
        const { page = 1, limit = 20, search, status } = params;
        const skip = (page - 1) * limit;

        const where: any = {};

        if (status) {
            if (status === 'published') {
                where.published_at = { not: null };
            } else if (status === 'draft') {
                where.published_at = null;
            }
        }

        if (search) {
            where.OR = [
                { title: { contains: search } },
                { description: { contains: search } }
            ];
        }

        const [data, total] = await Promise.all([
            this.prisma.video.findMany({
                skip,
                take: +limit,
                where,
                orderBy: { created_at: 'desc' },
            }),
            this.prisma.video.count({ where })
        ]);

        return {
            data,
            meta: {
                total,
                page: +page,
                limit: +limit,
                totalPages: Math.ceil(total / +limit),
            }
        };
    }

    findOne(id: number) {
        return this.prisma.video.findUnique({
            where: { id }
        });
    }

    create(data: any) {
        return this.prisma.video.create({
            data
        });
    }

    update(id: number, data: any) {
        return this.prisma.video.update({
            where: { id },
            data
        });
    }

    remove(id: number) {
        return this.prisma.video.delete({
            where: { id }
        });
    }

    async bulkDelete(ids: number[]) {
        return this.prisma.video.deleteMany({
            where: { id: { in: ids } }
        });
    }

    async incrementViews(id: number) {
        return this.prisma.video.update({
            where: { id },
            data: { views: { increment: 1 } }
        });
    }
}
