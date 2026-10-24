import request from '@/utils/request';

export interface CurrentUserDTO {
    userId: number | string;
    username: string;
    nickname: string;
    avatar?: string;
    roles: string[];
    perms: string[];
}

function unwrap<T>(r: any): T {
    if (r && typeof r === 'object' && 'data' in r) return r.data as T;
    return r as T;
}

export async function fetchCurrentUser() {
    const data = await request.get('/v1/users/me');
    return unwrap<CurrentUserDTO>(data);
}

