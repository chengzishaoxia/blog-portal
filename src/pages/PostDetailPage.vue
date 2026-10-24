<template>
  <div class="post-detail-page">
    <article class="post-detail" v-if="detail">
      <h1 class="post-title gradient-text">{{ detail.title }}</h1>
      <div class="meta">
        <span>{{ formatDate(detail.updateTime || detail.createTime) }}</span>
        <span> · {{ detail.viewCount || 0 }} 次阅读</span>
        <span v-if="detail.pinned === 1"> · <strong class="pinned-text">置顶</strong></span>
        <span v-if="detail.tags?.length"> ·
          <RouterLink v-for="t in detail.tags" :key="t.id" :to="{name:'tag', params:{id:t.id}}"
                      class="tag-link">#{{ t.name }}</RouterLink>
        </span>
      </div>
      <div v-if="detail.coverImage" class="hero-cover">
        <img :src="detail.coverImage" :alt="detail.title"/>
      </div>
      <div class="markdown-body content" v-html="detail.content"/>
    </article>
    <div v-else-if="loading" class="loading loading-skel" aria-busy="true" aria-live="polite">
      <span class="visually-hidden">加载中…</span>
      <div class="skel skel-title shimmer"></div>
      <div class="skel skel-meta shimmer"></div>
      <div class="skel skel-cover shimmer"></div>
      <div class="skel skel-line shimmer" v-for="n in 6" :key="n" :style="{width: n % 3 === 0 ? '82%' : n % 4 === 0 ? '63%' : '95%'}"></div>
    </div>
    <div v-else class="empty">文章不存在或已被移除。</div>

    <!-- 评论区 -->
    <CommentsSection v-if="detail" :post-id="detail.id" class="comments-block"/>
  </div>
</template>
<script setup lang="ts">
import {ref, watch, onMounted} from 'vue';
import {useRoute} from 'vue-router';
import {usePostStore} from '@/store/post-store';
import type {BlogPostDetail} from '@/types/blog';
import CommentsSection from '@/components/comment/CommentsSection.vue';

const route = useRoute();
const postStore = usePostStore();
const loading = ref(false);
const detail = ref<BlogPostDetail | null>(null);

function formatDate(d?: string) {
  return d ? d.slice(0, 10) : '';
}

async function load() {
  loading.value = true;
  try {
    const id = Number(route.params.id);
    if (!id) return;
    detail.value = await postStore.getDetail(id);
  } finally {
    loading.value = false;
  }
}

watch(() => route.params.id, load);
onMounted(load);
</script>
<style scoped>
.post-detail-page { position:relative; animation:postFadeIn .45s ease; }
@keyframes postFadeIn { from { opacity:0; transform:translateY(8px);} to { opacity:1; transform:translateY(0);} }

.post-detail {
  max-width: 840px;
  margin: 0 auto;
}

.post-title {
  margin: 0 0 .75rem;
  font-size: 2.2rem;
  line-height: 1.15;
  letter-spacing: .5px;
}

.meta {
  font-size: .7rem;
  text-transform: uppercase;
  opacity: .7;
  display: flex;
  flex-wrap: wrap;
  gap: .35rem;
  margin-bottom: 1.2rem;
}

.tag-link {
  text-decoration: none;
  margin: 0 .35rem;
  color: var(--accent);
  font-weight: 500;
}

.hero-cover {
  margin: 0 0 1.25rem;
  border-radius: 20px;
  overflow: hidden;
  max-height: 420px;
}

.hero-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.content {
  font-size: .95rem;
  line-height: 1.75;
}

.content :deep(img) {
  max-width: 100%;
  border-radius: 14px;
  box-shadow: 0 4px 18px -6px rgba(0, 0, 0, .15);
  margin: 1.25rem auto;
}

.content :deep(p) {
  margin: .85rem 0;
}

.content :deep(h2) {
  margin: 2.2rem 0 1.1rem;
  font-size: 1.55rem;
}

.content :deep(h3) {
  margin: 1.75rem 0 1rem;
  font-size: 1.25rem;
}

.loading { text-align:center; padding:3rem 1rem; opacity:.6; }
.empty { text-align:center; padding:3rem 1rem; opacity:.6; }

/* 新的骨架屏样式 */
.loading-skel { max-width:840px; margin:0 auto; display:flex; flex-direction:column; gap:14px; align-items:stretch; text-align:initial; opacity:1; }
.loading-skel .skel { position:relative; overflow:hidden; border-radius:14px; background:linear-gradient(145deg,#f5f3ff,#fdf2f8 55%,#fff7ed); border:1px solid var(--ani-border,#e9d5ff); box-shadow:0 4px 14px -6px rgba(var(--ani-shadow-rgb,139 92 246)/.25); }
.dark .loading-skel .skel { background:linear-gradient(145deg,#302642,#241c36 55%,#331f35); border-color:var(--ani-border,#4c3b61); box-shadow:0 4px 18px -6px rgba(var(--ani-shadow-rgb,236 72 153)/.35); }
.skel-title { height:48px; width:70%; margin-top:10px; }
.skel-meta { height:16px; width:38%; border-radius:8px; }
.skel-cover { height:260px; border-radius:20px; }
.skel-line { height:14px; border-radius:8px; }

/* 闪光动画 */
.shimmer { background-size:200% 100%; animation: shimmerMove 1.8s linear infinite; background-image:linear-gradient(110deg, rgba(255,255,255,.15) 0%, rgba(255,255,255,.55) 18%, rgba(255,255,255,.15) 33%), linear-gradient(145deg,#f5f3ff,#fdf2f8 55%,#fff7ed); }
.dark .shimmer { background-image:linear-gradient(110deg, rgba(255,255,255,.05) 0%, rgba(255,255,255,.35) 18%, rgba(255,255,255,.05) 33%), linear-gradient(145deg,#302642,#241c36 55%,#331f35); }
@keyframes shimmerMove { 0% { background-position: -120% 0, 0 0; } 100% { background-position: 120% 0, 0 0; } }

/* 减少运动偏好：停用动画，仅静态柔和色块 */
@media (prefers-reduced-motion: reduce) { .shimmer { animation:none; background-position:0 0; } }

.visually-hidden { position:absolute; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden; clip:rect(0 0 0 0); white-space:nowrap; border:0; }

.pinned-text { color: #f59e0b; }
:global(.dark) .pinned-text { color: #fbbf24; }
</style>
