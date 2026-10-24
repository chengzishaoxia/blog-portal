import request from '@/utils/request';
import type { SiteConfig } from '@/types/site-config';

export async function fetchSiteConfig() {
  const data = await request.get('/v1/blog/site-config');
  return data as unknown as SiteConfig;
}