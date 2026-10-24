<template>
  <aside class="hexo-sidebar side-header" aria-hidden="false">
    <section class="hexo-card author-card">
      <div class="author-avatar-wrap">
        <div class="author-avatar" :class="{ empty: !siteConfig.sidebarProfile.avatarUrl }" tabindex="0">
          <ProgressiveImage
            v-if="siteConfig.sidebarProfile.avatarUrl"
            class="author-avatar-media"
            :src="siteConfig.sidebarProfile.avatarUrl"
            :alt="siteConfig.sidebarProfile.name"
            :lazy="false"
            :useNativeLazy="false"
            objectFit="cover"
          >
            <template #error>
              <span class="author-avatar-fallback">{{ avatarFallback }}</span>
            </template>
          </ProgressiveImage>
          <span v-else>{{ avatarFallback }}</span>
        </div>
      </div>
      <h2 class="author-name title">{{ siteConfig.sidebarProfile.name }}</h2>
      <p class="author-intro">{{ siteConfig.sidebarProfile.intro }}</p>
      <div class="author-stats">
        <div class="stat-item">
          <strong>{{ postStore.total || 0 }}</strong>
          <span>文章</span>
        </div>
        <div class="stat-item">
          <strong>{{ archiveCount }}</strong>
          <span>分类</span>
        </div>
        <div class="stat-item">
          <strong>{{ postStore.tags.length || 0 }}</strong>
          <span>标签</span>
        </div>
      </div>
    </section>

    <section class="hexo-card notice-card">
      <div class="card-head">
        <h3 class="side-title"><span class="title-mark">📣</span>{{ siteConfig.sidebarNotice.title || '公告' }}</h3>
      </div>
      <p class="notice-content">{{ siteConfig.sidebarNotice.content }}</p>
    </section>

    <section class="hexo-card contact-card">
      <div class="card-head">
        <h3 class="side-title"><span class="title-mark">✧</span>关注我</h3>
      </div>
      <div class="contact-list">
        <div
          v-for="item in contactItems"
          :key="item.label"
          :class="['contact-item', item.tone]"
        >
          <span class="contact-icon">{{ item.icon }}</span>
          <a
            v-if="item.external"
            class="contact-value"
            :href="item.href"
            target="_blank"
            rel="noopener noreferrer"
          >{{ item.display }}</a>
          <span v-else class="contact-value">{{ item.display }}</span>
          <button class="contact-label" type="button" @click="copyContact(item.display)">{{ item.action }}</button>
        </div>
      </div>
    </section>

    <section class="hexo-card recent-card">
      <div class="card-head">
        <h3 class="side-title"><span class="title-mark">💬</span>最新评论</h3>
        <span class="card-badge">{{ recentComments.length }}</span>
      </div>
      <div v-if="recentLoading" class="comment-skeletons">
        <span v-for="n in 3" :key="n" class="comment-skeleton"></span>
      </div>
      <div v-else class="recent-list">
        <AutoScrollList v-if="recentComments.length" :list="recentComments" item-height="5rem" height="15rem">
          <template #default="{ row }">
            <RouterLink
              :to="{ name: 'post-detail', params: { id: row.postId } }"
              class="recent-item"
            >
              <div class="recent-avatar" :class="{ empty: !row.avatar }">
                <ProgressiveImage
                  v-if="row.avatar"
                  class="recent-avatar-media"
                  :src="row.avatar"
                  :alt="row.nickname || '游客'"
                  :lazy="false"
                  :useNativeLazy="false"
                  objectFit="cover"
                >
                  <template #error>
                    <span>{{ (row.nickname || '游').charAt(0) }}</span>
                  </template>
                </ProgressiveImage>
                <span v-else>{{ (row.nickname || '游').charAt(0) }}</span>
              </div>
              <div class="recent-main">
                <div class="recent-topline">
                  <strong>{{ row.nickname || '游客' }}</strong>
                  <span>{{ formatDate(row.createTime) }}</span>
                </div>
                <p class="recent-content">{{ row.content }}</p>
                <span class="recent-post">{{ row.postTitle || '查看文章' }}</span>
              </div>
            </RouterLink>
          </template>
        </AutoScrollList>
        <p v-if="!recentComments.length" class="empty-text">还没有最新评论。</p>
      </div>
    </section>

    <section class="hexo-card weather-card">
      <div class="card-head">
        <h3 class="side-title"><span class="title-mark">☼</span>今日天气</h3>
      </div>
      <div v-if="weather" class="weather-panel">
        <div class="weather-datetime">
          <div class="weather-date">{{ weatherDateText }}</div>
        </div>
        <div class="weather-main">
          <div class="weather-temp">{{ weather.temperature || '--' }} ℃</div>
          <div class="weather-condition">
            <span class="weather-icon">{{ weatherIcon }}</span>
            <span>{{ weather.weather || '未知天气' }}</span>
          </div>
          <div class="weather-location-row">
            <span class="weather-icon">⌖</span>
            <span>{{ weather.location || '未知位置' }}</span>
          </div>
        </div>
        <div class="weather-grid">
          <div class="weather-detail-item">
            <span class="detail-icon">↑</span>
            <span>高温 {{ weather.highTemperature || '--' }}℃</span>
          </div>
          <div class="weather-detail-item">
            <span class="detail-icon">↓</span>
            <span>低温 {{ weather.lowTemperature || '--' }}℃</span>
          </div>
          <div class="weather-detail-item">
            <span class="detail-icon">↺</span>
            <span>{{ weather.windDirection || '--' }}</span>
          </div>
          <div class="weather-detail-item">
            <span class="detail-icon">≈</span>
            <span>{{ weather.windScale || '--' }}</span>
          </div>
        </div>
      </div>
      <p v-else class="empty-text">天气信息获取中。</p>
    </section>

  </aside>
</template>
<script setup lang="ts">
import { computed, inject, onBeforeUnmount, onMounted, ref, type Ref } from 'vue';
import { CommentAPI } from '@/api/comment';
import { fetchWeather } from '@/api/portal';
import AutoScrollList from '@/components/common/AutoScrollList.vue';
import ProgressiveImage from '@/components/common/ProgressiveImage.vue';
import { usePostStore } from '@/store/post-store';
import { createDefaultSiteConfig, type SiteConfig } from '@/types/site-config';
import type { BlogArchiveGroup, BlogRecentCommentVO, BlogWeatherVO } from '@/types/blog';

const postStore = usePostStore();
const injectedSiteConfig = inject<Ref<SiteConfig>>('portalSiteConfig');

const recentComments = ref<BlogRecentCommentVO[]>([]);
const recentLoading = ref(true);
const weather = ref<BlogWeatherVO | null>(null);
const currentDateTime = ref(new Date());
const siteConfig = computed(() => injectedSiteConfig?.value ?? createDefaultSiteConfig());

const avatarFallback = computed(() => (siteConfig.value.sidebarProfile.name || 'B').charAt(0));
const archiveCount = computed(() => {
  const totalPosts = postStore.archives.reduce<number>((total: number, group: BlogArchiveGroup) => total + (group.count || 0), 0);
  return totalPosts || postStore.tags.length || 0;
});
const weatherDateText = computed(() => {
  const date = currentDateTime.value;
  const weekday = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'][date.getDay()];
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')} ${weekday}`;
});
const weatherIcon = computed(() => {
  const text = weather.value?.weather || '';
  if (text.includes('雷')) return '⛈';
  if (text.includes('雪')) return '❄';
  if (text.includes('雨')) return '🌧';
  if (text.includes('云')) return '☁';
  if (text.includes('阴')) return '☁';
  if (text.includes('雾') || text.includes('霾')) return '〰';
  return '☀';
});
const contactItems = computed(() => {
  const contact = siteConfig.value.contact;
  const entries = [
    { label: 'QQ', value: contact.qq, action: 'QQ号', icon: 'Q', tone: 'qq' },
    // { label: 'GitHub', value: contact.github, action: 'github', icon: 'G', tone: 'github' },
    // { label: 'Gitee', value: contact.gitee, action: 'gitee', icon: '码', tone: 'gitee' },
    { label: '邮箱', value: contact.email, action: '邮箱', icon: '邮', tone: 'email' },
    { label: '微信', value: contact.wechat, action: '微信', icon: '微', tone: 'wechat' },
    // { label: 'QQ群', value: contact.qqGroup, action: 'QQ群', icon: '群', tone: 'qqgroup' },
    // { label: 'CSDN', value: contact.csdn, action: 'csdn', icon: 'C', tone: 'csdn' },
  ];
  return entries
    .filter(item => !!item.value)
    .map(item => ({
      ...item,
      display: item.value as string,
      href: toHref(item.label, item.value as string),
      external: isExternalLink(item.label, item.value as string),
    }));
});

function toHref(label: string, value: string) {
  if (label === '邮箱') {
    return value.startsWith('mailto:') ? value : `mailto:${value}`;
  }
  if (/^https?:\/\//i.test(value)) {
    return value;
  }
  return '';
}

function isExternalLink(label: string, value: string) {
  return label === '邮箱' || /^https?:\/\//i.test(value);
}

function formatDate(value?: string) {
  return value ? value.slice(0, 10) : '';
}

function copyContact(value: string) {
  navigator.clipboard.writeText(value).catch(() => undefined);
}

let clockTimer: ReturnType<typeof setInterval> | null = null;

function startClock() {
  currentDateTime.value = new Date();
  clockTimer = setInterval(() => {
    currentDateTime.value = new Date();
  }, 1000);
}

async function loadSidebarData() {
  recentLoading.value = true;
  try {
    const [commentList, weatherInfo] = await Promise.all([
      CommentAPI.listRecent(6),
      fetchWeather(),
      postStore.loadTags().catch(() => undefined),
      postStore.loadArchives().catch(() => undefined),
    ]);
    recentComments.value = commentList;
    weather.value = weatherInfo;
  } finally {
    recentLoading.value = false;
  }
}

onMounted(() => {
  startClock();
  loadSidebarData();
});

onBeforeUnmount(() => {
  if (clockTimer) {
    clearInterval(clockTimer);
    clockTimer = null;
  }
});
</script>
<style scoped>
.side-header {
  gap: 1.2rem;
  width: 300px;
}

.author-card {
  text-align: center;
}

.author-avatar-wrap {
  display: flex;
  justify-content: center;
  margin-bottom: 1rem;
}

.author-avatar {
  width: 6rem;
  height: 6rem;
  padding: 0.16rem;
  border-radius: 50%;
  overflow: hidden;
  background: linear-gradient(135deg, #f8fbff, #77b9ff 52%, #4a82ff);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 1.9rem;
  box-shadow: 0 0 1rem 0.55rem rgba(99, 102, 241, 0.12);
  border: 1px solid rgba(99, 102, 241, 0.12);
  transition: transform 1s ease, box-shadow .35s ease;
}

.author-avatar img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.author-avatar-media {
  width: 100%;
  height: 100%;
}

.author-avatar-media :deep(.pi-placeholder),
.author-avatar-media :deep(.pi-skeleton),
.author-avatar-media :deep(.pi-img),
.author-avatar-media :deep(.pi-error),
.author-avatar-media :deep(.pi-placeholder-image) {
  border-radius: 50%;
}

.author-avatar-fallback {
  display: flex;
  width: 100%;
  height: 100%;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.author-avatar:hover,
.author-avatar:focus-visible {
  box-shadow: 0 0 1.35rem 0.72rem rgba(99, 102, 241, 0.18);
  animation: rotate-avatar 1s linear;
}

.author-name {
  margin: 0;
  font-size: 1.4rem;
}

.author-intro {
  width: 100%;
  margin: 0.75rem 0 1.1rem;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  text-align: center;
  font-size: 0.9rem;
  color: transparent;
  background: radial-gradient(circle at 49.86% 48.37%, #0090ff 0, #717aff 10%, #c45de1 20%, #ff317a 40%, #f94646 50%, #c97500 66.67%, #7a9300 83.33%, #00a23d 100%);
  -webkit-background-clip: text;
  background-clip: text;
}

.author-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
}

.stat-item strong {
  display: block;
  font-size: 1rem;
}

.stat-item span {
  display: block;
  margin-top: 0.25rem;
  font-size: 0.78rem;
  opacity: 0.7;
}

@keyframes rotate-avatar {
  0% {
    transform: rotate(0deg) scale(1);
  }
  50% {
    transform: rotate(180deg) scale(1.04);
  }
  100% {
    transform: rotate(360deg) scale(1);
  }
}

.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.9rem;
}

.side-title {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  margin: 0;
  font-size: 1.15rem;
}

.card-badge {
  min-width: 1.5rem;
  padding: 0.12rem 0.45rem;
  border-radius: 999px;
  font-size: 0.72rem;
  text-align: center;
  color: #fff;
  background: linear-gradient(135deg, #efb64d, #d85b80);
}

.notice-content,
.empty-text {
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.85;
  color: color-mix(in srgb, var(--text-color) 78%, transparent);
}

.contact-list {
  display: grid;
  gap: 0.75rem;
}

.contact-item {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
  gap: 0.6rem;
  border: 1px solid #dcdcdc;
  border-radius: 4px;
  padding: 0.6rem 0.8rem;
  font-size: 0.75rem;
}

.contact-icon {
  flex: 0 0 auto;
  width: 1.1rem;
  text-align: center;
  font-weight: 700;
}

.contact-value {
  flex: 1;
  min-width: 0;
  margin-right: 3.5rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: inherit;
  text-decoration: none;
}

.contact-label {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  min-width: 3.5rem;
  border: 0;
  color: #fff;
  cursor: pointer;
  padding: 0 0.75rem;
  border-radius: 0 4px 4px 0;
}

.contact-item.qq,
.contact-item.qqgroup {
  border-color: #409eff;
}

.contact-item.qq .contact-label,
.contact-item.qqgroup .contact-label {
  background: #409eff;
}

.contact-item.github {
  border-color: #606266;
}

.contact-item.github .contact-label {
  background: #606266;
}

.contact-item.gitee,
.contact-item.csdn {
  border-color: #e32c32;
}

.contact-item.gitee .contact-label,
.contact-item.csdn .contact-label {
  background: #e32c32;
}

.contact-item.email {
  border-color: #e98f36;
}

.contact-item.email .contact-label {
  background: #e98f36;
}

.contact-item.wechat {
  border-color: #67c23a;
}

.contact-item.wechat .contact-label {
  background: #67c23a;
}

.comment-skeletons {
  display: grid;
  gap: 0.75rem;
}

.comment-skeleton {
  height: 4.5rem;
  border-radius: 16px;
  background: linear-gradient(110deg, rgba(0, 0, 0, 0.06) 8%, rgba(0, 0, 0, 0.12) 18%, rgba(0, 0, 0, 0.06) 33%);
  background-size: 200% 100%;
  animation: shimmer 1.5s linear infinite;
}

:global(.dark) .comment-skeleton {
  background: linear-gradient(110deg, rgba(255, 255, 255, 0.06) 8%, rgba(255, 255, 255, 0.14) 18%, rgba(255, 255, 255, 0.06) 33%);
}

.recent-list {
  display: grid;
}

.recent-item {
  display: flex;
  gap: 0.8rem;
  text-decoration: none;
  color: inherit;
  width: 100%;
}

.recent-avatar {
  flex: 0 0 2.5rem;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  overflow: hidden;
  background: linear-gradient(135deg, #efb64d, #d85b80);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.95rem;
}

.recent-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.recent-avatar-media {
  width: 100%;
  height: 100%;
}

.recent-avatar-media :deep(.pi-placeholder),
.recent-avatar-media :deep(.pi-skeleton),
.recent-avatar-media :deep(.pi-img),
.recent-avatar-media :deep(.pi-error),
.recent-avatar-media :deep(.pi-placeholder-image) {
  border-radius: 50%;
}

.recent-main {
  min-width: 0;
  flex: 1;
}

.recent-topline {
  display: flex;
  justify-content: space-between;
  gap: 0.65rem;
  font-size: 0.75rem;
}

.recent-topline strong {
  color: var(--text-color);
}

.recent-topline span {
  color: color-mix(in srgb, var(--text-color) 56%, transparent);
  white-space: nowrap;
}

.recent-content,
.recent-post {
  display: block;
  margin: 0.3rem 0 0;
  font-size: 0.78rem;
  line-height: 1.6;
  color: color-mix(in srgb, var(--text-color) 72%, transparent);
}

.recent-content {
  display: -webkit-box;
  overflow: hidden;
  line-clamp: 2;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.recent-post {
  color: var(--accent);
}

.weather-panel {
  border-radius: 12px;
  padding: 0.35rem;
  text-align: center;
  background: color-mix(in srgb, var(--card-bg) 84%, var(--bg-color) 16%);
}

.weather-datetime {
  margin-bottom: 0.2rem;
}

.weather-date {
  display: flex;
  justify-content: center;
  padding: 0.175rem;
  font-size: 0.9rem;
  color: color-mix(in srgb, var(--text-color) 74%, transparent);
}

.weather-main {
  display: grid;
  gap: 0.2rem;
  margin-bottom: 0.2rem;
}

.weather-temp {
  font-size: 2rem;
  color: var(--text-color);
}

.weather-condition,
.weather-location-row {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.35rem;
  font-size: 1rem;
  color: color-mix(in srgb, var(--text-color) 82%, transparent);
}

.weather-location-row {
  color: color-mix(in srgb, var(--text-color) 68%, transparent);
}

.weather-icon,
.detail-icon {
  display: inline-flex;
  width: 1.2rem;
  justify-content: center;
}

.weather-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.6rem;
  padding: 12px;
  background: color-mix(in srgb, var(--card-bg) 92%, transparent);
  border-radius: 8px;
  font-size: 0.75rem;
}

.weather-detail-item {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  color: color-mix(in srgb, var(--text-color) 74%, transparent);
}

.theme-switch {
  width: 100%;
  border: 0;
  border-radius: 999px;
  padding: 0.8rem 1rem;
  cursor: pointer;
  color: #fff;
  font-size: 0.82rem;
  letter-spacing: 0.08em;
  background: linear-gradient(135deg, #efb64d, #d85b80);
}

@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

@media (max-width: 960px) {
  .side-header {
    display: none;
  }
}
</style>
