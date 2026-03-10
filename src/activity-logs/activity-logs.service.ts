import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ActivityLogsService {
    constructor(private prisma: PrismaService) { }

    async findAll(page: number = 1, limit: number = 20) {
        const offset = (page - 1) * limit;
        const [data, total] = await Promise.all([
            this.prisma.activityLog.findMany({
                skip: offset,
                take: limit,
                orderBy: { created_at: 'desc' },
                include: { User: { select: { id: true, full_name: true, email: true } } }
            }),
            this.prisma.activityLog.count()
        ]);
        return { data, meta: { total } };
    }

    async create(data: any) {
        const payload = { ...data };
        if (payload.entity_id) {
            payload.entity_id = Number(payload.entity_id);
        }
        return this.prisma.activityLog.create({ data: payload });
    }

    async remove(id: number) {
        return this.prisma.activityLog.delete({ where: { id } });
    }

    async removeAll() {
        return this.prisma.activityLog.deleteMany();
    }
}
