import request from '@/utils/request';
import type { BlogWeatherVO } from '@/types/blog';

export interface BlogFooterStatsVO {
    totalPvCount: number;
}

interface ApiResp<T> {
    code?: string | number;
    data: T;
    msg?: string;
}

function unwrap<T>(resp: any): T {
    if (resp && typeof resp === 'object' && 'data' in resp) {
        return (resp as ApiResp<T>).data;
    }
    return resp as T;
}

export async function fetchWeather() {
    const data = await request.get('/v1/blog/portal/weather');
    return unwrap<BlogWeatherVO>(data);
}

export async function fetchFooterStats() {
    const data = await request.get('/v1/blog/portal/footer-stats');
    return unwrap<BlogFooterStatsVO>(data);
}