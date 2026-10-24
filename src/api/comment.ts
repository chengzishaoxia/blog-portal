import request from '@/utils/request';
import type {BlogCommentVO, BlogCommentForm, BlogRecentCommentVO} from '@/types/blog';

interface ApiResp<T> {
    code?: string | number;
    data: T;
    msg?: string
}

function unwrap<T>(resp: any): T {
    if (resp && typeof resp === 'object' && 'data' in resp) return (resp as ApiResp<T>).data;
    return resp as T;
}

export const CommentAPI = {
    async listByPost(postId: number) {
        const data = await request.get(`/v1/blog/comments/post/${postId}`);
        return unwrap<BlogCommentVO[]>(data);
    },
    async listRecent(limit = 6) {
        const data = await request.get('/v1/blog/comments/recent', { params: { limit } });
        return unwrap<BlogRecentCommentVO[]>(data);
    },
    async create(form: BlogCommentForm) {
        const data = await request.post('/v1/blog/comments', form);
        return unwrap<boolean | any>(data);
    },
    async update(id: number, form: BlogCommentForm) {
        const data = await request.put(`/v1/blog/comments/${id}`, form);
        return unwrap<boolean | any>(data);
    },
    async delete(id: number) {
        const data = await request.delete(`/v1/blog/comments/${id}`);
        return unwrap<boolean | any>(data);
    }
};

