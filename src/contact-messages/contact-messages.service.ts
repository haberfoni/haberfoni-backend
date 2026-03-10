import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ContactMessagesService {
    constructor(private prisma: PrismaService) { }

    async findAll(is_read?: boolean) {
        const where = is_read !== undefined ? { is_read } : {};
        return this.prisma.contactMessage.findMany({ where, orderBy: { created_at: 'desc' } });
    }

    async create(data: any) {
        return this.prisma.contactMessage.create({ data });
    }

    async update(id: number, data: any) {
        return this.prisma.contactMessage.update({ where: { id }, data });
    }

    async remove(id: number) {
        return this.prisma.contactMessage.delete({ where: { id } });
    }
}
