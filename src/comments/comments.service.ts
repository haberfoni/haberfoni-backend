import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CommentsService {
    constructor(private prisma: PrismaService) { }

    async findAll(is_approved?: boolean, news_id?: number) {
        const where: any = {};
        if (is_approved !== undefined) where.is_approved = is_approved;
        if (news_id !== undefined) where.news_id = news_id;

        return this.prisma.comment.findMany({
            where,
            include: { News: true },
            orderBy: { created_at: 'desc' }
        });
    }

    async create(data: any) {
        // Explicit mapping to avoid Prisma validation errors from mismatching field names
        return this.prisma.comment.create({
            data: {
                user_name: data.user_name || data.name || 'Anonim',
                comment: data.comment || data.content || '',
                news_id: parseInt(data.news_id || data.newsId),
                is_approved: false
            }
        });
    }

    async update(id: number, data: any) {
        const updateData = { ...data };
        if (updateData.is_approved === true) {
            updateData.approved_at = new Date();
        }
        return this.prisma.comment.update({ where: { id }, data: updateData });
    }

    async remove(id: number) {
        return this.prisma.comment.delete({ where: { id } });
    }
}
