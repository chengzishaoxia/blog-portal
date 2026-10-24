<template>
  <article class="post-card" :class="{ reverse: isReverse }" @click="goDetail">
    <div class="card-inner">
      <section class="face front" :style="coverStyle">
        <ProgressiveImage
          v-if="post.coverImage"
          class="cover-media"
          :src="post.coverImage"
          :alt="post.title"
          :lazy="false"
          :useNativeLazy="false"
          objectFit="cover"
        >
          <template #error>
            <img :src="outloadSvg" :alt="post.title" class="placeholder-image" />
          </template>
        </ProgressiveImage>
        <img v-else :src="outloadSvg" :alt="post.title" class="placeholder-image" />
        <div class="front-mask"></div>
        <div class="front-content">
          <span v-if="tags.length" class="cover-tag">{{ tags[0].name }}</span>
          <h2 class="front-title title">{{ post.title }}</h2>
          <p class="front-meta">{{ formatDate(post.createTime) || '未设置日期' }} · {{ post.viewCount || 0 }} 阅读</p>
        </div>
      </section>

      <section class="face back">
        <div class="ribbon">{{ post.pinned === 1 ? '置顶文章' : '文章详情' }}</div>
        <div class="back-main">
          <div class="post-meta">
            <span>{{ formatDate(post.createTime) || '未设置日期' }}</span>
            <span>{{ post.viewCount || 0 }} 阅读</span>
          </div>
          <h3 class="post-title title">{{ post.title }}</h3>
          <p class="post-summary">{{ post.summary || '这篇文章还没有摘要，点击后查看完整内容。' }}</p>
        </div>
        <div class="post-footer">
          <div class="tag-list">
            <span v-for="tag in visibleTags" :key="tag.id" class="tag-item">{{ tag.name }}</span>
          </div>
          <span class="read-more">阅读全文</span>
        </div>
      </section>
    </div>
  </article>
</template>
<script setup lang="ts">
import type { BlogPostItem } from '@/types/blog';
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import ProgressiveImage from '@/components/common/ProgressiveImage.vue';
import outloadSvg from '@/assets/svg/outload.svg';

const props = defineProps<{
  post: BlogPostItem;
  index?: number;
}>();

const router = useRouter();

const palette = [
  ['#f5b447', '#d85b80'],
  ['#4a90e2', '#3255a4'],
  ['#6fb98f', '#3b7d5e'],
  ['#f08e65', '#c95d78'],
  ['#7d9cff', '#5b67cc'],
];

const colorIndex = computed(() => props.post.id % palette.length);
const tags = computed(() => props.post.tags ?? []);
const visibleTags = computed(() => tags.value.slice(0, 3));
const isReverse = computed(() => typeof props.index === 'number' && props.index % 2 === 1);
const coverStyle = computed(() => ({
  background: `linear-gradient(135deg, ${palette[colorIndex.value][0]}, ${palette[colorIndex.value][1]})`
}));

function goDetail() {
  router.push({ name: 'post-detail', params: { id: props.post.id } });
}

function formatDate(value?: string) {
  return value ? value.slice(0, 10) : '';
}
</script>
<style scoped>
.post-card {
  position: relative;
  min-height: 18rem;
  border-radius: 24px;
  perspective: 1200px;
  cursor: pointer;
}

.card-inner {
  position: relative;
  min-height: 18rem;
  transform-style: preserve-3d;
  transition: transform 0.8s cubic-bezier(0.23, 1, 0.32, 1);
}

.post-card:hover .card-inner {
  transform: rotateY(180deg);
}

.face {
  position: absolute;
  inset: 0;
  overflow: hidden;
  border-radius: 24px;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}

.front {
  display: flex;
  align-items: flex-end;
  justify-content: flex-start;
}

.back {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 1.35rem 1.4rem 1.25rem;
  background: var(--card-bg);
  transform: rotateY(180deg);
  box-shadow: 0 18px 38px rgba(15, 23, 42, 0.08);
}

:global(.dark) .back {
  box-shadow: 0 20px 42px rgba(0, 0, 0, 0.28);
}

.cover-media,
.placeholder-image {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
}

.cover-media :deep(.pi-wrapper),
.cover-media :deep(.pi-placeholder),
.cover-media :deep(.pi-skeleton),
.cover-media :deep(.pi-img),
.cover-media :deep(.pi-error),
.cover-media :deep(.pi-placeholder-image) {
  width: 100%;
  height: 100%;
}

.placeholder-image {
  object-fit: cover;
  opacity: 0.78;
  mix-blend-mode: screen;
}

.front-mask {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(12, 21, 37, 0.05), rgba(12, 21, 37, 0.72));
}

.front-content {
  position: relative;
  z-index: 1;
  width: 100%;
  padding: 1.3rem;
  color: #fff;
}

.cover-tag {
  display: inline-flex;
  margin-bottom: 0.85rem;
  padding: 0.38rem 0.8rem;
  border-radius: 999px;
  font-size: 0.74rem;
  letter-spacing: 0.08em;
  color: #fff;
  background: rgba(15, 23, 42, 0.34);
  backdrop-filter: blur(6px);
}

.front-title {
  margin: 0;
  font-size: clamp(1.5rem, 2.8vw, 2.3rem);
  line-height: 1.35;
}

.front-meta,
.post-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem 1rem;
  margin-top: 0.9rem;
  font-size: 0.74rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  opacity: 0.72;
}

.post-title {
  margin: 1rem 0 0;
  font-size: 1.35rem;
  line-height: 1.35;
}

.post-summary {
  margin: 1rem 0 0;
  font-size: 0.9rem;
  line-height: 1.9;
  color: rgba(15, 23, 42, 0.7);
  display: -webkit-box;
  display: box;
  overflow: hidden;
  line-clamp: 4;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
}

:global(.dark) .post-summary {
  color: rgba(226, 232, 240, 0.72);
}

.ribbon {
  align-self: flex-start;
  padding: 0.42rem 0.95rem;
  border-radius: 0 0 14px 14px;
  font-size: 0.74rem;
  letter-spacing: 0.12em;
  color: #fff;
  background: linear-gradient(90deg, #f0af45, #da6a61);
}

.back-main {
  flex: 1;
}

.post-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
}

.tag-item {
  padding: 0.35rem 0.72rem;
  border-radius: 999px;
  font-size: 0.74rem;
  background: rgba(15, 23, 42, 0.05);
}

:global(.dark) .tag-item {
  background: rgba(255, 255, 255, 0.08);
}

.read-more {
  white-space: nowrap;
  font-size: 0.82rem;
  letter-spacing: 0.08em;
  color: #d85b80;
}

@media (max-width: 900px) {
  .post-card {
    min-height: 16rem;
  }

  .card-inner,
  .face {
    min-height: 16rem;
  }

  .post-footer {
    flex-direction: column;
    align-items: flex-start;
  }
}

@media (prefers-reduced-motion: reduce) {
  .card-inner,
  .post-card:hover .card-inner {
    transform: none;
    transition: none;
  }

  .back {
    display: none;
  }
}
</style>
