// 使用文件分页接口获取用途为 CAROUSEL 的图片文件
import request from '@/utils/request';
import type {BlogCarouselVO} from '@/types/blog';

/** 获取所有启用的轮播图列表（后端 /v1/blog/carousels/list） */
export async function fetchCarousels(): Promise<BlogCarouselVO[]> {
    try {
        const data = await request.get('/v1/blog/carousels/list');
        return Array.isArray(data) ? (data as BlogCarouselVO[]) : [];
    } catch (e) {
        console.error('[carousel] list error:', e);
        return [];
    }
}

