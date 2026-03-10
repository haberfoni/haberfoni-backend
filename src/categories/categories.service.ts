import { Injectable } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) { }

  create(createCategoryDto: CreateCategoryDto) {
    const slug = createCategoryDto.slug || this.slugify(createCategoryDto.name);
    return this.prisma.category.create({
      data: {
        ...createCategoryDto,
        slug,
      },
    });
  }

  findAll() {
    return this.prisma.category.findMany({
      where: { is_active: true },
      orderBy: { order_index: 'asc' },
    });
  }

  findOne(id: number) {
    return this.prisma.category.findUnique({
      where: { id },
    });
  }

  update(id: number, updateCategoryDto: UpdateCategoryDto) {
    return this.prisma.category.update({
      where: { id },
      data: updateCategoryDto,
    });
  }

  remove(id: number) {
    return this.prisma.category.delete({
      where: { id },
    });
  }

  private slugify(text: string) {
    return text
      .toString()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '');
  }
}
