export class CreateCategoryDto {
    name: string;
    name_en?: string;
    slug?: string;
    is_active?: boolean;
    order_index?: number;
    seo_title?: string;
    seo_description?: string;
    seo_keywords?: string;
}
