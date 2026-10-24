<template>
  <div class="tag-page" id="tag-post-list" ref="rootRef">
    <section class="tag-hero card" v-if="tagLoaded && tagName">
      <h1 class="gradient-text tag-title"># {{ tagName }}</h1>
      <p class="tag-sub" v-if="postStore.loading"><span class="inline-skel w-90" aria-hidden="true"/></p>
      <p class="tag-sub" v-else>共 <strong>{{ total }}</strong> 篇相关文章</p>
      <div class="tag-actions">
        <RouterLink to="/" class="link-accent small">返回首页</RouterLink>
      </div>
    </section>

    <section v-else class="tag-hero card loading-tag">
      <div class="skeleton title"/>
      <div class="skeleton line"/>
    </section>

    <!-- Skeleton list when loading posts -->
    <div v-if="postStore.loading && !postStore.list.length" class="skeleton-list" role="status" aria-live="polite" aria-busy="true">
      <div v-for="n in 6" :key="n" class="skeleton-bar">
        <div class="sk-line w-60"/>
        <div class="sk-line w-90"/>
        <div class="sk-line w-40"/>
      </div>
    </div>

    <div v-else class="posts-grid">
      <PostCard v-for="p in postStore.list" :key="p.id" :post="p"/>
    </div>

    <AnimePagination
      v-model:page="query.pageNum"
      :page-size="query.pageSize"
      :total="total"
      :loading="postStore.loading"
      @change="onPagerChange"
    />

    <div v-if="!postStore.loading && !postStore.list.length" class="empty">暂无该标签的文章</div>
  </div>
</template>
<script setup lang="ts">
import {reactive, computed, ref, watch, onMounted, nextTick} from 'vue';
import {useRoute} from 'vue-router';
import {usePostStore} from '@/store/post-store';
import PostCard from '@/components/post/PostCard.vue';
import AnimePagination from '@/components/common/AnimePagination.vue';

const route = useRoute();
const postStore = usePostStore();
const query = reactive({pageNum: 1, pageSize: 10});
const total = computed(() => postStore.total);

const tagLoaded = ref(false);
const tagName = ref('');
const rootRef = ref<HTMLElement | null>(null);

async function ensureTags() {
  await postStore.loadTags();
  tagLoaded.value = true;
  const id = Number(route.params.id);
  const found = postStore.tags.find(t => t.id == id);
  tagName.value = found ? found.name : `标签 ${id}`;
}

async function loadList() {
  const id = Number(route.params.id);
  if (!Number.isFinite(id)) return;
  await postStore.loadPage({pageNum: query.pageNum, pageSize: query.pageSize, tagId: id}, {append: query.pageNum > 1});
}

async function onPagerChange(p: number) {
  const previousScrollY = window.scrollY;
  await loadList();
  await nextTick();
  window.scrollTo({ top: previousScrollY, behavior: 'auto' });
}

function scrollToAnchor() {
  const el = rootRef.value;
  if (!el) return;
  const offset = 70;
  const top = el.getBoundingClientRect().top + window.scrollY - offset;
  window.scrollTo({top: top < 0 ? 0 : top, behavior: 'smooth'});
}

async function bootstrap() {
  query.pageNum = 1;
  await Promise.all([ensureTags(), loadList()]);
}

watch(() => route.params.id, () => bootstrap());

onMounted(() => bootstrap());
</script>
<style scoped>
.tag-hero {
  margin: 0 0 1.25rem;
  text-align: center;
  padding: 2.2rem 1.5rem 2.4rem;
}

.tag-page {
  color: var(--text-color);
}

.tag-title {
  margin: 0 0 .65rem;
  font-size: 2rem;
  font-weight: 700;
}

.tag-sub {
  margin: 0;
  font-size: .8rem;
  letter-spacing: .5px;
  color: color-mix(in srgb, var(--text-color) 72%, transparent);
}

.tag-actions {
  margin-top: .8rem;
}

.small {
  font-size: .75rem;
}

.posts-grid {
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
}

.empty {
  text-align: center;
  padding: 3rem 1rem;
  color: color-mix(in srgb, var(--text-color) 55%, transparent);
}

/* Tag skeleton */
.loading-tag .skeleton {
  background: linear-gradient(90deg, #e5e7eb, #f3f4f6, #e5e7eb);
  background-size: 200% 100%;
  animation: shimmer 1.2s linear infinite;
  border-radius: 12px;
}

.loading-tag .title {
  height: 42px;
  width: 60%;
  margin: 0 auto 1rem;
}

.loading-tag .line {
  height: 14px;
  width: 30%;
  margin: 0 auto;
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

/* List skeleton bars */
.skeleton-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.skeleton-bar {
  padding: 1rem 1rem;
  border-radius: 18px;
  background: var(--card-bg);
  box-shadow: 0 4px 10px -6px rgba(0, 0, 0, .08), 0 2px 5px -3px rgba(0, 0, 0, .06);
  display: flex;
  flex-direction: column;
  gap: .55rem;
}

:global(.dark) .skeleton-bar {
  background: #1c2229;
  box-shadow: 0 4px 12px -6px rgba(0, 0, 0, .55);
}

.sk-line {
  height: 14px;
  border-radius: 8px;
  background: linear-gradient(110deg, rgba(0, 0, 0, .06) 8%, rgba(0, 0, 0, .16) 18%, rgba(0, 0, 0, .06) 33%);
  background-size: 200% 100%;
  animation: skShimmer 1.35s linear infinite;
}

:global(.dark) .sk-line {
  background: linear-gradient(110deg, rgba(255, 255, 255, .08) 8%, rgba(255, 255, 255, .18) 18%, rgba(255, 255, 255, .08) 33%);
}

.sk-line.w-60 {
  width: 60%;
}

.sk-line.w-90 {
  width: 90%;
}

.sk-line.w-40 {
  width: 40%;
}

@keyframes skShimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

/* Inline skeleton for tag sub */
.inline-skel {
  display: inline-block;
  height: .85rem;
  border-radius: 6px;
  background: linear-gradient(110deg, rgba(0, 0, 0, .06) 8%, rgba(0, 0, 0, .16) 18%, rgba(0, 0, 0, .06) 33%);
  background-size: 200% 100%;
  animation: skShimmer 1.35s linear infinite;
  vertical-align: middle;
}

:global(.dark) .inline-skel {
  background: linear-gradient(110deg, rgba(255, 255, 255, .08) 8%, rgba(255, 255, 255, .18) 18%, rgba(255, 255, 255, .08) 33%);
}

.inline-skel.w-90 {
  width: 170px;
}
</style>
