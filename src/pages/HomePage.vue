<template>
  <div class="home-page" id="blog-list" ref="observerRoot">
    <RouterLink class="talk-strip" :to="{ name: 'message-board' }">
      <span class="talk-icon">🔊</span>
      <div class="talk-track">
        <p class="talk-copy">{{ state.keywords ? `正在搜索：${state.keywords}` : siteConfig.sidebarNotice.content }}</p>
      </div>
      <span class="talk-arrow">≫</span>
    </RouterLink>

    <section v-if="!postStore.loading && featuredPosts.length" class="recommend-section">
      <article class="recommend-stage hero-stage" @click="openPost(featuredPosts[0].id)">
        <ProgressiveImage
          v-if="featuredPosts[0].coverImage"
          class="recommend-media"
          :src="featuredPosts[0].coverImage"
          :alt="featuredPosts[0].title"
          :lazy="false"
          :useNativeLazy="false"
          objectFit="cover"
          fetchPriority="high"
        >
          <template #error>
            <div class="recommend-fallback" :style="featureToneStyle(featuredPosts[0])"></div>
          </template>
        </ProgressiveImage>
        <div v-else class="recommend-fallback" :style="featureToneStyle(featuredPosts[0])"></div>
        <span class="recommend-flag">推荐</span>
        <div class="recommend-mask"></div>
        <div class="recommend-content hero-content">
          <h2 class="recommend-title title">{{ featuredPosts[0].title }}</h2>
          <span class="recommend-date">发布时间：{{ formatDate(featuredPosts[0].createTime) }}</span>
        </div>
      </article>

      <div v-if="featuredPosts.length > 1" class="recommend-stack">
        <article
          v-for="item in featuredPosts.slice(1)"
          :key="item.id"
          class="recommend-stage mini-stage"
          @click="openPost(item.id)"
        >
          <ProgressiveImage
            v-if="item.coverImage"
            class="recommend-media"
            :src="item.coverImage"
            :alt="item.title"
            :lazy="false"
            :useNativeLazy="false"
            objectFit="cover"
          >
            <template #error>
              <div class="recommend-fallback" :style="featureToneStyle(item)"></div>
            </template>
          </ProgressiveImage>
          <div v-else class="recommend-fallback" :style="featureToneStyle(item)"></div>
          <div class="recommend-mask"></div>
          <div class="recommend-content mini-content">
            <h3 class="recommend-title title">{{ item.title }}</h3>
            <span class="recommend-date">发布时间：{{ formatDate(item.createTime) }}</span>
          </div>
        </article>
      </div>
    </section>

    <section class="stream-section">
      <div class="stream-head">
        <span class="stream-kicker">{{ state.keywords ? 'Search' : 'Articles' }}</span>
        <h2 class="stream-title title">{{ state.keywords ? '搜索结果' : '最新文章' }}</h2>
      </div>

      <div v-if="postStore.loading && !streamPosts.length" class="skeleton-list" role="status" aria-live="polite" aria-busy="true">
        <div v-for="n in 4" :key="n" class="skeleton-bar">
          <div class="skeleton-thumb"></div>
          <div class="skeleton-main">
            <div class="sk-line w-35"></div>
            <div class="sk-line w-75"></div>
            <div class="sk-line w-90"></div>
            <div class="sk-line w-55"></div>
          </div>
        </div>
      </div>

      <div v-else-if="streamPosts.length" class="posts">
        <div
          v-for="(post, index) in streamPosts"
          :key="post.id"
          class="post-fade"
          :style="{ animationDelay: `${Number(index) * 70}ms` }"
        >
          <PostCard
            :post="post"
            :index="index"
          />
        </div>
      </div>

      <div v-if="!postStore.loading && !postStore.list.length" class="empty">暂无文章</div>
    </section>

    <AnimePagination
      v-model:page="state.pageNum"
      :page-size="state.pageSize"
      :total="postStore.total"
      :loading="postStore.loading"
      @change="onPagerChange"
    />
  </div>
</template>
<script setup lang="ts">
import { computed, inject, nextTick, onActivated, onBeforeUnmount, reactive, ref as vueRef, type Ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AnimePagination from '@/components/common/AnimePagination.vue';
import ProgressiveImage from '@/components/common/ProgressiveImage.vue';
import PostCard from '@/components/post/PostCard.vue';
import { fetchRecommendPosts } from '@/api/blog';
import { usePostStore } from '@/store/post-store';
import { createDefaultSiteConfig, type SiteConfig } from '@/types/site-config';
import type { BlogPostItem } from '@/types/blog';

const postStore = usePostStore();
const route = useRoute();
const router = useRouter();
const injectedSiteConfig = inject<Ref<SiteConfig>>('portalSiteConfig');

const state = reactive({ pageNum: 1, pageSize: 5, keywords: '' });
const observerRoot = vueRef<HTMLElement | null>(null);
const recommendPosts = vueRef<BlogPostItem[]>([]);
const featurePalette = [
  'linear-gradient(135deg, rgba(245, 180, 71, 0.92), rgba(216, 91, 128, 0.92))',
  'linear-gradient(135deg, rgba(74, 144, 226, 0.92), rgba(50, 85, 164, 0.92))',
  'linear-gradient(135deg, rgba(106, 184, 143, 0.92), rgba(54, 104, 92, 0.92))',
];

const siteConfig = computed(() => injectedSiteConfig?.value ?? createDefaultSiteConfig());
const featuredPosts = computed(() => (!state.keywords ? recommendPosts.value : []));
const streamPosts = computed(() => postStore.list);

let io: IntersectionObserver | null = null;

function initObserver() {
  io?.disconnect();
  io = null;
  if (typeof IntersectionObserver === 'undefined' || !observerRoot.value) {
    return;
  }
  io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        (entry.target as HTMLElement).classList.add('in');
        io?.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  observerRoot.value.querySelectorAll('.post-fade').forEach((card: Element) => io?.observe(card));
}

async function load() {
  const shouldLoadRecommend = !state.keywords && state.pageNum === 1;
  const shouldClearRecommend = !!state.keywords && state.pageNum === 1;
  await Promise.all([
    postStore.loadPage({
      pageNum: state.pageNum,
      pageSize: state.pageSize,
      keywords: state.keywords || undefined,
    }, { append: state.pageNum > 1 }),
    shouldLoadRecommend
      ? fetchRecommendPosts().then((list) => {
          recommendPosts.value = list;
        })
      : Promise.resolve().then(() => {
          if (!shouldClearRecommend) {
            return;
          }
          recommendPosts.value = [];
        }),
  ]);
  await nextTick();
  initObserver();
}

async function onPagerChange() {
  const previousScrollY = window.scrollY;
  await load();
  await nextTick();
  window.scrollTo({ top: previousScrollY, behavior: 'auto' });
}

function applyRouteQuery() {
  state.keywords = (route.query.q as string) || '';
}

function formatDate(value?: string) {
  return value ? value.slice(0, 10) : '';
}

function openPost(id: number) {
  router.push({ name: 'post-detail', params: { id } });
}

function featureToneStyle(item: BlogPostItem) {
  const paletteIndex = Math.abs(Number(item.id) || 0) % featurePalette.length;
  return {
    background: featurePalette[paletteIndex],
  };
}

watch(() => route.query.q, async () => {
  applyRouteQuery();
  state.pageNum = 1;
  await load();
});

onActivated(async () => {
  applyRouteQuery();
  await load();
});

onBeforeUnmount(() => {
  io?.disconnect();
  io = null;
});
</script>
<style scoped>
.home-page {
  display: grid;
  gap: 1.15rem;
  overflow: visible;
}

.talk-strip {
  display: flex;
  align-items: center;
  gap: 0.9rem;
  margin: 0 0.5rem;
  padding: 0.7rem 1rem;
  border-radius: 0.75rem;
  text-decoration: none;
  color: var(--text-color);
  background: var(--card-bg);
  box-shadow: var(--shadow-card);
  transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
}

.talk-strip:hover {
  transform: translateY(-2px);
  box-shadow: 0 0.625rem 1.875rem -0.9375rem rgba(15, 23, 42, 0.16);
}

.talk-icon,
.talk-arrow {
  flex: 0 0 auto;
  font-size: 1.05rem;
}

.talk-icon {
  animation: scaleEffect 1.5s infinite alternate;
}

.talk-arrow {
  animation: passing 1.5s infinite;
}

.talk-track {
  min-width: 0;
  flex: 1;
}

.talk-copy {
  width: 100%;
  margin: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  font-size: 0.94rem;
}

.recommend-section,
.stream-section {
  display: grid;
  gap: 1rem;
  overflow: visible;
}

.recommend-section {
  margin: 0 0.5rem;
  grid-template-columns: minmax(0, 1.7fr) minmax(16rem, 0.95fr);
}

.recommend-stage {
  position: relative;
  overflow: hidden;
  border-radius: 0.75rem;
  cursor: pointer;
}

.recommend-media,
.recommend-fallback {
  position: absolute;
  inset: 0;
}

.recommend-media :deep(.pi-placeholder),
.recommend-media :deep(.pi-skeleton),
.recommend-media :deep(.pi-img),
.recommend-media :deep(.pi-error),
.recommend-media :deep(.pi-placeholder-image) {
  width: 100%;
  height: 100%;
}

.recommend-fallback {
  background-position: center;
  background-size: cover;
}

.hero-stage {
  min-height: 13.875rem;
}

.recommend-stack {
  display: grid;
  gap: 1rem;
}

.mini-stage {
  min-height: calc((13.875rem - 1rem) / 2);
}

.recommend-flag {
  position: absolute;
  top: 0;
  left: 0.625rem;
  z-index: 2;
  width: 4.0625rem;
  display: flex;
  justify-content: center;
  padding: 0.35rem 0;
  border-radius: 0 0 0.75rem 0.75rem;
  font-size: 0.9rem;
  letter-spacing: 0.18rem;
  color: #fff;
  background: linear-gradient(90deg, #f0af45, #da6a61);
}

.recommend-mask {
  position: absolute;
  inset: 0;
  z-index: 1;
  background: rgba(0, 0, 0, 0.12);
}

.recommend-content {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  height: 100%;
  color: #fff;
}

.hero-content {
  align-items: center;
  padding: 0 3.125rem 1.25rem;
  text-align: center;
}

.mini-content {
  align-items: flex-start;
  padding: 1rem 1.2rem;
  text-align: left;
}

.recommend-title {
  margin: 0;
  line-height: 1.4;
}

.hero-content .recommend-title {
  font-size: 2rem;
}

.mini-content .recommend-title {
  font-size: 1.15rem;
}

.recommend-date {
  margin-top: 0.45rem;
  font-size: 0.9rem;
  line-height: 1.5;
}

.stream-head {
  margin: 0 0.5rem;
}

.stream-kicker {
  display: inline-block;
  margin-bottom: 0.3rem;
  font-size: 0.76rem;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  opacity: 0.58;
}

.stream-title {
  margin: 0;
  font-size: 1.65rem;
}

.posts {
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
  margin: 0 0.5rem;
  overflow: visible;
}

.post-fade {
  opacity: 0;
  transform: translateY(24px);
  will-change: transform, opacity;
  overflow: visible;
}

.post-fade.in {
  animation: cardIn 0.65s cubic-bezier(0.22, 0.75, 0.32, 1) forwards;
}

.skeleton-list {
  display: grid;
  gap: 1rem;
}

.skeleton-bar {
  display: grid;
  grid-template-columns: 36% 1fr;
  gap: 1rem;
  padding: 1rem;
  border-radius: 24px;
  background: var(--card-bg);
}

.skeleton-thumb {
  min-height: 12rem;
  border-radius: 20px;
  background: linear-gradient(110deg, rgba(0, 0, 0, 0.06) 8%, rgba(0, 0, 0, 0.12) 18%, rgba(0, 0, 0, 0.06) 33%);
  background-size: 200% 100%;
  animation: skShimmer 1.35s linear infinite;
}

.skeleton-main {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0.7rem;
}

.sk-line {
  height: 14px;
  border-radius: 999px;
  background: linear-gradient(110deg, rgba(0, 0, 0, 0.06) 8%, rgba(0, 0, 0, 0.12) 18%, rgba(0, 0, 0, 0.06) 33%);
  background-size: 200% 100%;
  animation: skShimmer 1.35s linear infinite;
}

:global(.dark) .skeleton-thumb,
:global(.dark) .sk-line {
  background: linear-gradient(110deg, rgba(255, 255, 255, 0.06) 8%, rgba(255, 255, 255, 0.14) 18%, rgba(255, 255, 255, 0.06) 33%);
}

.w-35 {
  width: 35%;
}

.w-55 {
  width: 55%;
}

.w-75 {
  width: 75%;
}

.w-90 {
  width: 90%;
}

.empty {
  padding: 3rem 1rem;
  text-align: center;
  opacity: 0.6;
}

@keyframes passing {
  0% {
    transform: translateX(-50%);
    opacity: 0;
  }

  50% {
    transform: translateX(0);
    opacity: 1;
  }

  100% {
    transform: translateX(50%);
    opacity: 0;
  }
}

@keyframes scaleEffect {
  0% {
    transform: scale(1);
  }

  50% {
    transform: scale(1.35);
  }

  100% {
    transform: scale(1);
  }
}

@keyframes cardIn {
  from {
    opacity: 0;
    transform: translateY(24px) scale(0.985);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes skShimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

@media (max-width: 960px) {
  .talk-strip,
  .recommend-section,
  .stream-head,
  .posts {
    margin-left: 0;
    margin-right: 0;
  }

  .recommend-section {
    grid-template-columns: 1fr;
  }

  .hero-stage {
    min-height: 14rem;
  }

  .mini-stage {
    min-height: 8rem;
  }

  .skeleton-bar {
    grid-template-columns: 1fr;
  }
}

@media (prefers-reduced-motion: reduce) {
  .post-fade,
  .post-fade.in,
  .skeleton-thumb,
  .sk-line,
  .talk-icon,
  .talk-arrow {
    animation: none;
    opacity: 1;
    transform: none;
  }
}
</style>
