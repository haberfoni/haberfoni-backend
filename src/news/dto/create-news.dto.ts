export class CreateNewsDto {
    title: string;
    slug?: string;
    summary?: string;
    content?: string;
    image_url?: string;
    category?: string;
    category_id?: number;
    original_url?: string;
    source?: string;
    author?: string;
    author_id?: string;
    published_at?: string | Date; // Date is handled by Prisma
    is_active?: boolean;
    views?: number;
    is_slider?: boolean;
    seo_title?: string;
    seo_description?: string;
    seo_keywords?: string;
}
