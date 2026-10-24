<template>
  <section ref="rootRef" class="tags-page">
    <div class="main-card">
      <header class="panel-head">
        <h2 class="panel-title">
          <svg class="panel-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M20 13 11 22l-9-9V4h9l9 9Z" />
            <path d="M7 7h.01" />
          </svg>
          标签 ({{ sortedTags.length }})
        </h2>
      </header>

      <section class="tag-box">
        <div v-if="tagsLoading" class="loading-wrapper" aria-busy="true">
          <div v-for="n in 12" :key="n" class="skeleton tag" />
        </div>

        <div v-else class="tag-list">
          <button
            v-for="(tag, index) in sortedTags"
            :key="tag.id"
            type="button"
            class="tag-option"
            :class="{ active: tag.id === selectedTagId }"
            :style="tagStyle(index)"
            @click="selectTag(tag.id)"
          >
            {{ tag.name }}
            <span class="num">{{ tag.postCount || 0 }}</span>
          </button>
          <div v-if="!sortedTags.length" class="empty">暂无标签</div>
        </div>
      </section>

      <hr class="divider">

      <div v-if="postStore.loading && !postStore.list.length" class="skeleton-list" role="status" aria-busy="true">
        <div v-for="n in 6" :key="n" class="skeleton-bar">
          <div class="sk-line w-60" />
          <div class="sk-line w-90" />
          <div class="sk-line w-40" />
        </div>
      </div>

      <div v-else-if="selectedTag" class="posts-wrap">
        <div class="list-summary">
          当前标签 “{{ selectedTag.name }}” 共 {{ postStore.total }} 篇文章
        </div>

        <div v-if="postStore.list.length" class="posts-grid">
          <PostCard v-for="post in postStore.list" :key="post.id" :post="post" />
        </div>

        <div v-else class="empty post-empty">这个标签下还没有文章</div>

        <AnimePagination
          v-if="postStore.total > query.pageSize"
          v-model:page="query.pageNum"
          :page-size="query.pageSize"
          :total="postStore.total"
          :loading="postStore.loading"
          @change="onPagerChange"
        />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref } from 'vue';
import AnimePagination from '@/components/common/AnimePagination.vue';
import PostCard from '@/components/post/PostCard.vue';
import { usePostStore } from '@/store/post-store';

const postStore = usePostStore();
const rootRef = ref<HTMLElement | null>(null);

const query = reactive({
  pageNum: 1,
  pageSize: 6,
});

const selectedTagId = ref<number | null>(null);

const sortedTags = computed(() => {
  return [...postStore.tags]
    .filter(tag => tag.status === 1)
    .sort((a, b) => (b.postCount || 0) - (a.postCount || 0) || a.name.localeCompare(b.name));
});

const selectedTag = computed(() => sortedTags.value.find(tag => tag.id === selectedTagId.value) || null);
const tagsLoading = computed(() => !postStore.tagLoaded);

const palettes = [
  { text: '#6dbaaf', soft: 'rgba(152, 212, 206, .38)', accent: '#5aa9ff' },
  { text: '#c59453', soft: 'rgba(242, 215, 163, .28)', accent: '#5aa9ff' },
  { text: '#e76d94', soft: 'rgba(245, 181, 202, .28)', accent: '#5aa9ff' },
  { text: '#8ccf58', soft: 'rgba(200, 234, 145, .28)', accent: '#5aa9ff' },
  { text: '#4c6fff', soft: 'rgba(178, 191, 255, .3)', accent: '#5aa9ff' },
  { text: '#ae4e95', soft: 'rgba(229, 189, 223, .28)', accent: '#5aa9ff' },
];

function tagStyle(index: number) {
  const palette = palettes[index % palettes.length];
  return {
    '--tag-color': palette.text,
    '--tag-soft': palette.soft,
    '--tag-badge': palette.accent,
  } as Record<string, string>;
}

async function loadPosts() {
  if (!selectedTagId.value) return;
  await postStore.loadPage({
    pageNum: query.pageNum,
    pageSize: query.pageSize,
    tagId: selectedTagId.value,
  }, { append: query.pageNum > 1 });
}

async function selectTag(tagId: number) {
  if (selectedTagId.value === tagId) return;
  selectedTagId.value = tagId;
  query.pageNum = 1;
  await loadPosts();
  await nextTick();
  scrollToList();
}

async function onPagerChange() {
  const previousScrollY = window.scrollY;
  await loadPosts();
  await nextTick();
  window.scrollTo({ top: previousScrollY, behavior: 'auto' });
}

function scrollToList() {
  const el = rootRef.value;
  if (!el) return;
  const top = el.getBoundingClientRect().top + window.scrollY - 84;
  window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
}

async function bootstrap() {
  await postStore.loadTags();
  if (!sortedTags.value.length) return;
  selectedTagId.value = selectedTagId.value ?? sortedTags.value[0].id;
  await loadPosts();
}

onMounted(() => {
  bootstrap();
});
</script>

<style scoped>
.tags-page {
  padding-bottom: 2.6rem;
  color: var(--text-color);
}

.main-card {
  width: 100%;
  border-radius: 28px;
  background: color-mix(in srgb, var(--card-bg) 92%, transparent);
  border: 1px solid color-mix(in srgb, var(--text-color) 10%, transparent);
  box-shadow: 0 30px 60px -42px rgba(15, 23, 42, .22);
  padding: 2.2rem 2.4rem 2.6rem;
  color: var(--text-color);
  backdrop-filter: blur(14px);
}

:global(.dark) .main-card {
  background: rgba(19, 24, 31, .88) !important;
  border-color: rgba(148, 163, 184, .14);
  box-shadow: 0 26px 56px -38px rgba(0, 0, 0, .78);
}

.panel-head {
  margin-bottom: 1.9rem;
}

.panel-title {
  display: flex;
  align-items: center;
  gap: .7rem;
  margin: 0;
  font-family: var(--font-display);
  font-size: 2rem;
  color: var(--text-color);
}

.panel-icon {
  width: 1.6rem;
  height: 1.6rem;
  color: #70b6ff;
}

.tag-box {
  padding: .2rem 0 0;
}

.tag-list,
.loading-wrapper {
  display: flex;
  flex-wrap: wrap;
  gap: 1.2rem 1.1rem;
}

.tag-option {
  border: 0;
  background: transparent;
  color: var(--tag-color, #70b6ff);
  display: inline-flex;
  align-items: center;
  gap: .55rem;
  font: inherit;
  font-size: 1.05rem;
  font-family: var(--font-display);
  font-weight: 700;
  padding: .72rem .88rem;
  border-radius: 10px;
  cursor: pointer;
  transition: transform .2s ease, background .2s ease, box-shadow .2s ease;
}

.tag-option:hover,
.tag-option.active {
  background: var(--tag-soft, rgba(112, 182, 255, .18));
  transform: translateY(-1px);
}

.num {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.65rem;
  height: 1.65rem;
  padding: 0 .32rem;
  border-radius: 999px;
  background: var(--tag-badge, #5aa9ff);
  color: #fff;
  font-size: .8rem;
  line-height: 1;
}

.divider {
  margin: 2.1rem 0 2rem;
  border: 0;
  border-top: 5px dotted #d7eafd;
}

:global(.dark) .divider {
  border-top-color: rgba(138, 179, 231, .35);
}

.posts-wrap {
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
}

.list-summary {
  font-size: .85rem;
  color: color-mix(in srgb, var(--text-color) 62%, transparent);
}

.posts-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

.empty {
  width: 100%;
  text-align: center;
  padding: 2.4rem 1rem;
  color: color-mix(in srgb, var(--text-color) 55%, transparent);
}

.post-empty {
  background: rgba(112, 182, 255, .06);
  border-radius: 18px;
}

:global(.dark) .post-empty {
  background: rgba(59, 130, 246, .09);
}

.skeleton.tag {
  width: 118px;
  height: 44px;
  border-radius: 10px;
  background: linear-gradient(90deg, #e5e7eb, #f3f4f6, #e5e7eb);
  background-size: 200% 100%;
  animation: shimmer 1.2s linear infinite;
}

.skeleton-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.skeleton-bar {
  padding: 1rem;
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
  animation: shimmer 1.35s linear infinite;
}

:global(.dark) .sk-line,
:global(.dark) .skeleton.tag {
  background: linear-gradient(110deg, rgba(255, 255, 255, .08) 8%, rgba(255, 255, 255, .18) 18%, rgba(255, 255, 255, .08) 33%);
}

.w-40 {
  width: 40%;
}

.w-60 {
  width: 60%;
}

.w-90 {
  width: 90%;
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

@media (max-width: 920px) {
  .main-card {
    padding: 1.3rem 1rem 1.6rem;
  }

  .posts-grid {
    grid-template-columns: 1fr;
  }
}
</style>