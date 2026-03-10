export class CreateAdDto {
    name: string;
    type: string;
    placement_code?: string;
    image_url?: string;
    link_url?: string;
    code?: string;
    width?: number;
    height?: number;
    device_type?: string;
    target_page?: string;
    target_category?: string;
    target_news_id?: number;
    is_active?: boolean;
    is_sticky?: boolean;
    is_headline?: boolean;
    headline_slot?: number;
    is_manset_2?: boolean;
    manset_2_slot?: number;
    start_date?: string | Date;
    end_date?: string | Date;
}
