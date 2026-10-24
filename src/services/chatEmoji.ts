// 表情(图片)相关 API 封装
// 用户自定义表情：获取、上传、删除
import request from '@/utils/request';

export interface ChatEmojiItem {
  id: number;
  imageUrl: string;
  width?: number;
  height?: number;
  userId?: number;
  md5?: string;
}

// 获取当前用户自定义的表情
export async function listMyEmojis(): Promise<ChatEmojiItem[]> {
  try {
    const data = await request.get('/chat/emoji/mine'); // 移除 withToken 头
    return Array.isArray(data) ? data : [];
  } catch (e) {
    console.warn('[emoji] load mine failed', e);
    return [];
  }
}

// 上传一个新的表情图片，返回新 ID
export async function uploadMyEmoji(file: File): Promise<number | string> {
  const form = new FormData();
  form.append('file', file);
  try {
    return await request.post('/chat/emoji/mine', form, { headers: { 'Content-Type': 'multipart/form-data' } });
  } catch (e) {
    console.warn('[emoji] upload failed', e);
    return '';
  }
}

// 删除表情
export async function deleteMyEmoji(id: number): Promise<boolean> {
  try {
    await request.delete(`/chat/emoji/mine/${id}`); // 移除 withToken 头
    return true;
  } catch (e) {
    console.warn('[emoji] delete failed', e);
    return false;
  }
}
