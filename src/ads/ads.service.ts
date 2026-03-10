import { Injectable } from '@nestjs/common';
import { CreateAdDto } from './dto/create-ad.dto';
import { UpdateAdDto } from './dto/update-ad.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdsService {
  constructor(private prisma: PrismaService) { }

  create(createAdDto: CreateAdDto) {
    return this.prisma.ad.create({
      data: createAdDto,
    });
  }

  findAll(query: { all?: string; is_headline?: string; is_manset_2?: string; placement_code?: string } = {}) {
    const now = new Date();

    if (query.all === 'true') {
      return this.prisma.ad.findMany({
        orderBy: { created_at: 'desc' }
      });
    }

    const where: any = {
      is_active: true,
      AND: [
        {
          OR: [
            { start_date: null },
            { start_date: { lte: now } }
          ]
        },
        {
          OR: [
            { end_date: null },
            { end_date: { gte: now } }
          ]
        }
      ]
    };

    if (query.is_headline !== undefined) {
      where.is_headline = query.is_headline === 'true';
    }
    if (query.is_manset_2 !== undefined) {
      where.is_manset_2 = query.is_manset_2 === 'true';
    }
    if (query.placement_code) {
      where.placement_code = query.placement_code;
    }

    return this.prisma.ad.findMany({
      where,
      orderBy: { created_at: 'desc' }
    });
  }

  findOne(id: number) {
    return this.prisma.ad.findUnique({
      where: { id },
    });
  }

  update(id: number, updateAdDto: UpdateAdDto) {
    return this.prisma.ad.update({
      where: { id },
      data: updateAdDto,
    });
  }

  remove(id: number) {
    return this.prisma.ad.delete({
      where: { id },
    });
  }
}
