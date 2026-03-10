import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RedirectsService {
    constructor(private prisma: PrismaService) { }

    async findAll() {
        return this.prisma.redirect.findMany({ orderBy: { id: 'desc' } });
    }

    async findByPath(source_url: string) {
        return this.prisma.redirect.findUnique({
            where: { source_url }
        });
    }

    async create(data: any) {
        return this.prisma.redirect.create({ data });
    }

    async update(id: number, data: any) {
        return this.prisma.redirect.update({ where: { id }, data });
    }

    async remove(id: number) {
        return this.prisma.redirect.delete({ where: { id } });
    }
}
