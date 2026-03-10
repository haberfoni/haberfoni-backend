import { Injectable } from '@nestjs/common';
import { CreateNewsDto } from './dto/create-news.dto';
import { UpdateNewsDto } from './dto/update-news.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NewsService {
  constructor(private prisma: PrismaService) { }

  create(createNewsDto: CreateNewsDto) {
    return this.prisma.news.create({
      data: {
        ...createNewsDto,
        slug: this.slugify(createNewsDto.title),
      },
    });
  }

  async findAll(params: {
    page?: number;
    limit?: number;
    category?: string;
    search?: string;
    slug?: string;
    status?: 'published' | 'draft';
    authorId?: number;
    isSlider?: boolean;
    since?: string;
  }) {
    const { page = 1, limit = 20, category, search, slug, status, authorId, isSlider, since } = params;
    const skip = (page - 1) * limit;

    const where: any = { is_active: true };

    if (category) {
      where.category = category;
    }
    if (slug) {
      where.slug = slug;
    }
    if (authorId) {
      where.author_id = authorId;
    }
    if (isSlider !== undefined) {
      where.is_slider = isSlider;
    }
    if (status) {
      if (status === 'published') {
        where.published_at = { not: null };
      } else if (status === 'draft') {
        where.published_at = null;
      }
    }
    if (since) {
      where.published_at = {
        ...(where.published_at || {}),
        gte: new Date(since),
      };
    }
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { summary: { contains: search } }
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.news.findMany({
        skip,
        take: +limit, // Ensure limit is number
        where,
        orderBy: { published_at: 'desc' },
        include: { Category: true }
      }),
      this.prisma.news.count({ where })
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

  async findBySlug(slug: string) {
    return this.prisma.news.findFirst({
      where: { slug },
      include: { Category: true }
    });
  }

  findOne(id: number) {
    return this.prisma.news.findUnique({
      where: { id },
      include: { Category: true },
    });
  }

  update(id: number, updateNewsDto: UpdateNewsDto) {
    return this.prisma.news.update({
      where: { id },
      data: updateNewsDto,
    });
  }

  remove(id: number) {
    return this.prisma.news.delete({
      where: { id },
    });
  }

  async bulkDelete(ids: number[]) {
    return this.prisma.news.deleteMany({
      where: { id: { in: ids } },
    });
  }

  async incrementViews(id: number) {
    return this.prisma.news.update({
      where: { id },
      data: {
        views: {
          increment: 1
        }
      }
    });
  }

  async getTags(id: number) {
    const newsTags = await this.prisma.newsTag.findMany({
      where: { news_id: id },
      include: { Tag: true } // Assuming 'Tag' is the relation name in Prisma schema
    });
    return newsTags.map(nt => nt.Tag);
  }

  async updateTags(newsId: number, tagIds: any[]) {
    // 1. Delete all existing tags for this news
    await this.prisma.newsTag.deleteMany({
      where: { news_id: newsId },
    });

    // 2. Insert new tags
    if (tagIds && tagIds.length > 0) {
      const newsTagsData = tagIds.map(tagInput => {
        // Handle both simple arrays of IDs and arrays of {id: ...} objects
        const tagId = typeof tagInput === 'object' && tagInput.id ? tagInput.id : tagInput;
        return {
          news_id: newsId,
          tag_id: Number(tagId),
        };
      });

      await this.prisma.newsTag.createMany({
        data: newsTagsData,
      });
    }

    return true;
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
