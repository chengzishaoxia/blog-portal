import request from '@/utils/request';
import type { PageResult, BlogPostItem, BlogPostDetail, PostPageQuery, BlogTagVO, BlogFriendLinkVO } from '@/types/blog';
import type { BlogArchiveGroup } from '@/types/blog';

interface ApiResp<T> {
    code?: string;
    data: T;
    msg?: string;
}

function unwrap<T>(resp: any): T {
    if (resp && typeof resp === 'object' && 'data' in resp && (resp.code || resp.msg)) {
        return (resp as ApiResp<T>).data;
    }
    return resp as T;
}

interface BlogTagPageQuery {
    pageNum: number;
    pageSize: number;
    keywords?: string;
}

export async function fetchTagPage(query: BlogTagPageQuery) {
    const data = await request.post('/v1/blog/tags/page', query);
    return unwrap<PageResult<BlogTagVO[]>>(data);
}

export async function fetchTags() {
    return await fetchTagPage({ pageNum: 1, pageSize: 1000 });
}

export async function fetchPosts(query: PostPageQuery) {
    const data = await request.post('/v1/blog/posts/page', query);
    return unwrap<PageResult<BlogPostItem[]>>(data);
}

export async function fetchRecommendPosts() {
    const data = await request.get('/v1/blog/posts/recommend');
    return unwrap<BlogPostItem[]>(data);
}

export async function fetchPostDetail(id: number | string) {
    const data = await request.get(`/v1/blog/posts/${id}`);
    return unwrap<BlogPostDetail>(data);
}

export async function fetchArchives() {
    const data = await request.get('/v1/blog/posts/archives');
    return unwrap<BlogArchiveGroup[]>(data);
}

export async function fetchFriendLinks() {
    const data = await request.get('/v1/blog/friend-links/list');
    return unwrap<BlogFriendLinkVO[]>(data);
}