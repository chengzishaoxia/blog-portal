import request from '@/utils/request';
import type { BlogMessageDanmakuVO, BlogMessageSubmitForm } from '@/types/blog';

interface ApiResp<T> {
  code?: string | number;
  data: T;
  msg?: string;
}

function unwrap<T>(resp: any): T {
  if (resp && typeof resp === 'object' && 'data' in resp) return (resp as ApiResp<T>).data;
  return resp as T;
}

export const MessageAPI = {
  async listDanmaku(limit = 120) {
    const data = await request.get('/v1/blog/messages/danmaku', { params: { limit } });
    return unwrap<BlogMessageDanmakuVO[]>(data);
  },
  async submit(form: BlogMessageSubmitForm) {
    const data = await request.post('/v1/blog/messages', form);
    return unwrap<boolean | any>(data);
  },
};
