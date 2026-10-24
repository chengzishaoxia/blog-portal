<template>
  <section class="archives-page">
    <div class="main-card">
          <template v-if="postStore.archiveLoading">
            <div class="loading-wrap">
              <div class="skeleton-year" v-for="n in 3" :key="n">
                <div class="bar year-bar"/>
                <div class="month-list">
                  <div class="month-item" v-for="m in 2" :key="m">
                    <div class="bar month-bar"/>
                    <div class="posts">
                      <div class="bar post-bar" v-for="p in 2" :key="p"/>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </template>
          <template v-else-if="grouped.length">
            <div class="archive-groups">
              <div class="year-group" v-for="(group, yIdx) in grouped" :key="group.year">
                <h2 class="year-title">
                  <span class="year-dot"/>
                  <span class="year-num">{{ group.year }} 年</span>
                  <span class="year-count">{{ group.total }} 篇</span>
                </h2>
                <div class="month-groups">
                  <div class="month-group" v-for="month in group.months" :key="month.month">
                    <div class="month-head">
                      <span class="month-label">{{ month.month.toString().padStart(2, '0') }} 月</span>
                      <span class="month-count">{{ month.count }}</span>
                    </div>
                    <ul class="post-list">
                      <li v-for="post in month.posts" :key="post.id" class="post-item">
                        <RouterLink class="post-link" :to="`/post/${post.id}`">
                          <span class="p-date">{{ post.createTime?.slice(5, 10) }}</span>
                          <span class="p-title">{{ post.title }}</span>
                        </RouterLink>
                      </li>
                    </ul>
                  </div>
                </div>
                <div v-if="yIdx < grouped.length - 1" class="year-separator"/>
              </div>
            </div>
          </template>
          <p v-else class="empty-tip">暂无文章归档</p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { usePostStore } from '@/store/post-store';

const postStore = usePostStore();

onMounted(() => {
  postStore.loadArchives().catch(() => {
  });
});

interface MonthGroup {
  month: number;
  count: number;
  posts: any[];
}

interface YearGroup {
  year: number;
  total: number;
  months: MonthGroup[];
}

const grouped = computed<YearGroup[]>(() => {
  if (!postStore.archives.length) return [];
  const byYear: Record<number, MonthGroup[]> = {};
  postStore.archives.forEach(group => {
    const list = byYear[group.year] || (byYear[group.year] = []);
    list.push({ month: group.month, count: group.count, posts: group.posts });
  });
  return Object.keys(byYear).sort((a, b) => Number(b) - Number(a)).map(year => {
    const months = byYear[Number(year)].sort((a, b) => b.month - a.month);
    const total = months.reduce((sum, month) => sum + month.count, 0);
    return { year: Number(year), total, months };
  });
});
</script>

<style scoped>
.archives-page {
  padding-bottom: 2.5rem;
  color: var(--text-color);
}

.main-card {
  width: 100%;
  max-width: 100%;
  border-radius: 28px;
  background: color-mix(in srgb, var(--card-bg) 92%, transparent);
  border: 1px solid color-mix(in srgb, var(--text-color) 10%, transparent);
  box-shadow: 0 30px 60px -42px rgba(15, 23, 42, .45);
  color: var(--text-color);
  backdrop-filter: blur(14px);
}

:global(.dark) .main-card {
  background: rgba(19, 24, 31, .88) !important;
  border-color: rgba(148, 163, 184, .14);
  box-shadow: 0 26px 56px -38px rgba(0, 0, 0, .78);
}

.main-card {
  padding: 1.7rem 2rem 2.2rem;
}

.year-group {
  margin-bottom: 2rem;
}

.year-title {
  margin: 0 0 .8rem;
  font-size: 1.22rem;
  display: flex;
  align-items: baseline;
  gap: .75rem;
  font-weight: 600;
}

.year-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #fff;
  border: 3px solid #f43f5e;
  box-shadow: 0 0 0 6px rgba(244, 63, 94, .12);
}

.year-count {
  font-size: .78rem;
  opacity: .6;
}

.month-count,
.p-date,
.empty-tip {
  color: color-mix(in srgb, var(--text-color) 58%, transparent);
}

.month-groups {
  display: flex;
  flex-direction: column;
  gap: 1.3rem;
  margin-left: .35rem;
  padding-left: 1.4rem;
  border-left: 3px dashed rgba(244, 63, 94, .2);
}

.month-group {
  position: relative;
  padding: .2rem 0 0 .4rem;
}

.month-head {
  display: flex;
  align-items: center;
  gap: .6rem;
  margin: 0 0 .55rem;
}

.month-label {
  font-size: 1rem;
  font-weight: 600;
  letter-spacing: .5px;
}

.month-count {
  font-size: .82rem;
  opacity: .55;
}

.post-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: .35rem;
}

.post-item {
  font-size: .72rem;
  line-height: 1.35;
}

.post-link {
  display: inline-flex;
  gap: .65rem;
  align-items: baseline;
  text-decoration: none;
  color: var(--text-color);
  position: relative;
  width: 100%;
  padding: .55rem .75rem;
  border-radius: 16px;
  background: rgba(148, 163, 184, .08);
  transition: .28s;
}

:global(.dark) .post-link {
  background: rgba(148, 163, 184, .1);
}

.post-link:hover {
  background: linear-gradient(110deg, rgba(244, 63, 94, .1), rgba(168, 85, 247, .14));
  transform: translateX(4px);
}

.p-date {
  font-family: monospace;
  font-size: .75rem;
  opacity: .55;
  width: 3.2rem;
}

.p-title {
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 420px;
}

.year-separator {
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(0, 0, 0, .15), transparent);
  margin: 1.4rem 0 0;
}

:global(.dark) .year-separator {
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, .15), transparent);
}

.empty-tip {
  font-size: .8rem;
  letter-spacing: .5px;
}

.loading-wrap {
  display: flex;
  flex-direction: column;
  gap: 1.8rem;
}

.skeleton-year {
  display: flex;
  flex-direction: column;
  gap: .9rem;
}

.bar {
  background: linear-gradient(90deg, rgba(0, 0, 0, .08), rgba(0, 0, 0, .15), rgba(0, 0, 0, .08));
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
  border-radius: 6px;
}

:global(.dark) .bar {
  background: linear-gradient(90deg, rgba(255, 255, 255, .08), rgba(255, 255, 255, .18), rgba(255, 255, 255, .08));
}

.year-bar { width: 160px; height: 20px; }

.month-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding-left: .5rem;
}

.month-item {
  display: flex;
  flex-direction: column;
  gap: .5rem;
}

.month-bar { width: 120px; height: 14px; }

.posts {
  display: flex;
  flex-direction: column;
  gap: .4rem;
}

.post-bar {
  width: 320px;
  max-width: 80%;
  height: 12px;
}

@keyframes shimmer {
  0% { background-position: 0 0; }
  100% { background-position: -200% 0; }
}

@media (max-width: 720px) {
  .p-title {
    max-width: 200px;
  }

  .archives-page {
    padding-bottom: 2rem;
  }

  .main-card {
    padding-inline: 1rem;
  }
}
</style>