import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PagesService {
  constructor(private prisma: PrismaService) { }

  create(data: any) {
    return this.prisma.page.create({ data });
  }

  findAll(filters?: any) {
    const where: any = {};
    if (filters?.slug) {
      where.slug = filters.slug;
    }
    if (filters?.is_active) {
      where.is_active = filters.is_active === 'true' || filters.is_active === true;
    }
    return this.prisma.page.findMany({ where, orderBy: { created_at: 'desc' } });
  }

  findOne(id: number) {
    return this.prisma.page.findUnique({ where: { id } });
  }

  update(id: number, data: any) {
    return this.prisma.page.update({ where: { id }, data });
  }

  remove(id: number) {
    return this.prisma.page.delete({ where: { id } });
  }
}
