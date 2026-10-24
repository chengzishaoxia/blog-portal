<template>
  <section class="friend-links" id="friend-links">
    <div class="section-head">
      <div>
        <p class="eyebrow">Friend Links</p>
        <h2 class="title">友链驻留</h2>
      </div>
      <p v-if="!loading" class="meta">共 {{ links.length }} 个站点</p>
    </div>

    <div v-if="loading" class="link-grid skeleton-grid" aria-busy="true">
      <div v-for="n in 4" :key="n" class="skeleton-card">
        <span class="sk avatar"></span>
        <span class="sk line w-50"></span>
        <span class="sk line w-90"></span>
      </div>
    </div>

    <div v-else-if="links.length" class="link-grid">
      <a
        v-for="link in links"
        :key="link.id"
        :href="link.url"
        target="_blank"
        rel="noopener noreferrer"
        class="link-card"
      >
        <div class="link-top">
          <span class="avatar" :class="{ filled: !!link.avatar }">
            <img v-if="link.avatar" :src="link.avatar" :alt="link.name" loading="lazy">
            <span v-else>{{ link.name.slice(0, 1) }}</span>
          </span>
          <span class="jump">Visit</span>
        </div>
        <h3 class="name">{{ link.name }}</h3>
        <p class="desc">{{ link.description || '欢迎来访。' }}</p>
        <p class="url">{{ simplifyUrl(link.url) }}</p>
      </a>
    </div>

    <p v-else class="empty">暂时还没有可展示的友链。</p>
  </section>
</template>

<script setup lang="ts">
import type { BlogFriendLinkVO } from '@/types/blog';

defineProps<{
  links: BlogFriendLinkVO[];
  loading: boolean;
}>();

function simplifyUrl(url: string) {
  return url.replace(/^https?:\/\//, '').replace(/\/$/, '');
}
</script>

<style scoped>
.friend-links {
  padding: 1.35rem;
  border: 1px solid color-mix(in srgb, var(--text-color) 10%, transparent);
  background:
    radial-gradient(circle at top right, rgba(99, 102, 241, 0.12), transparent 32%),
    linear-gradient(180deg, var(--card-bg), color-mix(in srgb, var(--card-bg) 84%, var(--bg-color) 16%));
  box-shadow: 0 28px 56px -40px rgba(0, 0, 0, 0.24);
}

.section-head {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}

.eyebrow {
  margin: 0 0 0.2rem;
  font-size: 0.68rem;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: var(--accent);
}

.title {
  margin: 0;
  font-size: 1.35rem;
}

.meta {
  margin: 0;
  font-size: 0.72rem;
  color: color-mix(in srgb, var(--text-color) 62%, transparent);
}

.link-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

.link-card {
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
  min-height: 180px;
  padding: 1rem;
  text-decoration: none;
  border-radius: 20px;
  border: 1px solid color-mix(in srgb, var(--text-color) 8%, transparent);
  background: color-mix(in srgb, var(--card-bg) 88%, transparent);
  box-shadow: 0 16px 32px -24px rgba(15, 23, 42, 0.5);
  transition: transform 0.28s ease, box-shadow 0.28s ease, border-color 0.28s ease;
}

.link-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 22px 36px -24px rgba(99, 102, 241, 0.45);
  border-color: rgba(99, 102, 241, 0.28);
}

.link-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.avatar {
  width: 52px;
  height: 52px;
  border-radius: 16px;
  background: linear-gradient(135deg, var(--accent), var(--accent-2));
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  font-weight: 700;
  overflow: hidden;
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.jump {
  padding: 0.22rem 0.55rem;
  border-radius: 999px;
  background: rgba(99, 102, 241, 0.12);
  color: var(--accent);
  font-size: 0.7rem;
  font-weight: 600;
}

.name {
  margin: 0;
  font-size: 1rem;
}

.desc {
  margin: 0;
  color: var(--text-color-soft);
  font-size: 0.8rem;
  line-height: 1.65;
  line-clamp: 2;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}

.url {
  margin: auto 0 0;
  font-size: 0.72rem;
  color: color-mix(in srgb, var(--text-color) 58%, transparent);
  word-break: break-all;
}

.empty {
  margin: 0;
  padding: 1rem 0 0.2rem;
  text-align: center;
  color: color-mix(in srgb, var(--text-color) 60%, transparent);
}

.skeleton-card {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  min-height: 180px;
  padding: 1rem;
  border-radius: 20px;
  background: color-mix(in srgb, var(--card-bg) 70%, var(--bg-color) 30%);
}

.sk {
  display: inline-block;
  background: linear-gradient(110deg, rgba(0, 0, 0, 0.06) 8%, rgba(0, 0, 0, 0.14) 18%, rgba(0, 0, 0, 0.06) 33%);
  background-size: 200% 100%;
  animation: shimmer 1.2s linear infinite;
}

:global(.dark) .sk {
  background: linear-gradient(110deg, rgba(255, 255, 255, 0.06) 8%, rgba(255, 255, 255, 0.16) 18%, rgba(255, 255, 255, 0.06) 33%);
}

.sk.avatar {
  width: 52px;
  height: 52px;
  border-radius: 16px;
}

.sk.line {
  height: 14px;
  border-radius: 999px;
}

.sk.line.w-50 {
  width: 50%;
}

.sk.line.w-90 {
  width: 90%;
}

@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }

  100% {
    background-position: 200% 0;
  }
}

@media (max-width: 720px) {
  .section-head {
    align-items: start;
    flex-direction: column;
  }

  .link-grid {
    grid-template-columns: 1fr;
  }
}
</style>