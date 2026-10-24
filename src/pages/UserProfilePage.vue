<template>
  <div class="user-profile-page" v-if="!loading && !error">
    <div class="profile-header card">
      <div class="avatar-wrap" :class="{empty: !profile?.avatar}">
        <img v-if="profile?.avatar" :src="profile.avatar" :alt="profile.nickname || profile.username"
             @error="onImgErr"/>
        <span v-else>{{ initial }}</span>
      </div>
      <div class="info">
        <h1 class="nickname">{{ profile?.nickname || profile?.username || '未登录' }}</h1>
        <p class="username" v-if="profile">@{{ profile.username }}</p>
        <div class="meta" v-if="profile">
          <span>UID: {{ profile.userId }}</span>
          <span v-if="profile.roles?.length">角色: {{ profile.roles.join(', ') }}</span>
        </div>
        <div class="actions" v-if="profile">
          <button class="refresh" @click="reload">刷新资料</button>
        </div>
      </div>
    </div>

    <div class="detail-grid">
      <section class="card block" aria-labelledby="sec-perms">
        <h2 id="sec-perms">权限</h2>
        <ul class="perm-list" v-if="profile?.perms?.length">
          <li v-for="p in profile.perms" :key="p">{{ p }}</li>
        </ul>
        <p v-else class="empty">无权限数据</p>
      </section>
      <section class="card block" aria-labelledby="sec-security">
        <h2 id="sec-security">安全</h2>
        <p class="muted">此区域可扩展：修改密码、绑定邮箱、二步验证等。</p>
      </section>
    </div>
  </div>
  <div v-else-if="loading" class="profile-skeleton">
    <div class="card sk-header">
      <div class="sk-avatar"/>
      <div class="sk-lines">
        <div class="sk-line w-50"/>
        <div class="sk-line w-30"/>
        <div class="sk-line w-70"/>
      </div>
    </div>
    <div class="sk-grid">
      <div class="card sk-block" v-for="n in 2" :key="n">
        <div class="sk-line w-40"/>
        <div class="sk-line w-80"/>
        <div class="sk-line w-60"/>
      </div>
    </div>
  </div>
  <div v-else class="load-error">
    <p>加载用户资料失败</p>
    <button @click="retry">重试</button>
  </div>
</template>
<script setup lang="ts">
import {computed, ref, onMounted} from 'vue';
import {useAuthStore} from '@/store/auth-store';

const auth = useAuthStore();
const profile = computed(() => auth.profile);
const initial = computed(() => profile.value ? (profile.value.nickname || profile.value.username || '?').charAt(0).toUpperCase() : '?');
const loading = ref(false);
const error = ref(false);

function onImgErr(e: Event) {
  (e.target as HTMLImageElement).style.display = 'none';
}

async function ensureLoaded() {
  if (profile.value) return;
  loading.value = true;
  error.value = false;
  try {
    await auth.loadProfile();
    if (!profile.value) throw new Error('empty');
  } catch (e) {
    error.value = true;
  } finally {
    loading.value = false;
  }
}

async function reload() {
  loading.value = true;
  error.value = false;
  await auth.loadProfile().catch(() => error.value = true);
  loading.value = false;
}

function retry() {
  ensureLoaded();
}

onMounted(() => ensureLoaded());
</script>
<style scoped>
.user-profile-page {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.card {
  background: var(--card-bg);
  border-radius: 20px;
  padding: 1.4rem 1.5rem 1.6rem;
  box-shadow: 0 6px 18px -6px rgba(0, 0, 0, .12);
  position: relative;
}

:global(.dark) .card {
  background: var(--card-bg, #1b1f24);
  box-shadow: 0 6px 22px -10px rgba(0, 0, 0, .6);
}

.profile-header {
  display: flex;
  gap: 1.5rem;
  align-items: center;
}

.avatar-wrap {
  width: 110px;
  height: 110px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366f1, #a855f7);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3rem;
  font-weight: 600;
  color: #fff;
  position: relative;
  overflow: hidden;
  box-shadow: 0 10px 28px -10px rgba(99, 102, 241, .55);
}

.avatar-wrap.empty {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
}

.avatar-wrap img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.info {
  display: flex;
  flex-direction: column;
  gap: .6rem;
}

nickname, .nickname {
  margin: 0;
  font-size: 1.75rem;
  font-weight: 700;
  letter-spacing: .5px;
}

.username {
  margin: 0;
  font-size: .8rem;
  opacity: .65;
  letter-spacing: .5px;
}

.meta {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  font-size: .7rem;
  text-transform: uppercase;
  letter-spacing: .5px;
  opacity: .75;
}

.actions {
  display: flex;
  gap: .75rem;
}

.refresh {
  border: 0;
  background: linear-gradient(120deg, #6366f1, #8b5cf6);
  color: #fff;
  padding: .55rem 1.1rem;
  border-radius: 12px;
  cursor: pointer;
  font-size: .7rem;
  font-weight: 600;
  letter-spacing: .5px;
  box-shadow: 0 4px 16px -6px rgba(99, 102, 241, .5);
}

.refresh:hover {
  box-shadow: 0 6px 22px -8px rgba(99, 102, 241, .55);
}

.detail-grid {
  display: grid;
  grid-template-columns:repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.block h2 {
  margin: 0 0 1rem;
  font-size: 1rem;
  letter-spacing: .5px;
  font-weight: 600;
}

.perm-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: .5rem;
  font-size: .7rem;
  letter-spacing: .5px;
}

.perm-list li {
  background: rgba(0, 0, 0, .05);
  padding: .5rem .75rem;
  border-radius: 10px;
}

:global(.dark) .perm-list li {
  background: rgba(255, 255, 255, .08);
}

.empty {
  font-size: .7rem;
  opacity: .55;
}

.muted {
  font-size: .75rem;
  opacity: .7;
  line-height: 1.5;
}

.profile-skeleton {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.sk-header {
  display: flex;
  gap: 1.25rem;
  align-items: center;
}

.sk-avatar {
  width: 110px;
  height: 110px;
  border-radius: 50%;
  background: linear-gradient(120deg, rgba(0, 0, 0, .08), rgba(0, 0, 0, .18), rgba(0, 0, 0, .08));
  background-size: 200% 100%;
  animation: sh 1.2s linear infinite;
}

.sk-lines {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: .75rem;
}

.sk-line {
  height: 14px;
  border-radius: 8px;
  background: linear-gradient(110deg, rgba(0, 0, 0, .06) 8%, rgba(0, 0, 0, .16) 18%, rgba(0, 0, 0, .06) 33%);
  background-size: 200% 100%;
  animation: sh 1.35s linear infinite;
}

:global(.dark) .sk-line, :global(.dark) .sk-avatar {
  background: linear-gradient(110deg, rgba(255, 255, 255, .08) 8%, rgba(255, 255, 255, .18) 18%, rgba(255, 255, 255, .08) 33%);
}

.sk-line.w-50 {
  width: 50%;
}

.sk-line.w-30 {
  width: 30%;
}

.sk-line.w-70 {
  width: 70%;
}

.sk-grid {
  display: grid;
  grid-template-columns:repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
}

.sk-block {
  display: flex;
  flex-direction: column;
  gap: .6rem;
}

@keyframes sh {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

.load-error {
  text-align: center;
  padding: 3rem 1rem;
}

.load-error button {
  margin-top: 1rem;
  border: 0;
  background: linear-gradient(120deg, #6366f1, #8b5cf6);
  color: #fff;
  padding: .6rem 1.1rem;
  border-radius: 12px;
  cursor: pointer;
}
</style>
