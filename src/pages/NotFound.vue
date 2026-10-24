<template>
  <div class="nf-wrapper">
    <div class="nf-card card">
      <h1 class="nf-code gradient-text" aria-label="404">404</h1>
      <p class="nf-text">抱歉，你访问的页面消失在宇宙深处了。</p>
      <p class="nf-sub">Possible causes: 网址输入错误 / 页面已被移除 / 文章改了永久链接</p>
      <div class="nf-actions">
        <RouterLink to="/" class="btn primary">返回首页</RouterLink>
        <button class="btn ghost" @click="goBack">返回上一页</button>
      </div>
      <form class="nf-search" @submit.prevent="submitSearch">
        <input v-model.trim="keyword" type="text" placeholder="站内搜索关键字..."/>
        <button type="submit" :disabled="!keyword">搜索</button>
      </form>
      <div v-if="recentPosts.length" class="nf-recent">
        <h3 class="small-title">最近发布</h3>
        <ul>
          <li v-for="p in recentPosts" :key="p.id">
            <RouterLink :to="`/post/${p.id}`" class="link-accent">{{ p.title }}</RouterLink>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import {ref, computed} from 'vue';
import {useRouter} from 'vue-router';
import {usePostStore} from '@/store/post-store';

const router = useRouter();
const keyword = ref('');
const postStore = usePostStore();

// 取最近的几篇文章(如果已加载)；若没有，可触发一次加载首页第一页
const recentPosts = computed(() => postStore.list.slice(0, 5));

if (!postStore.list.length) {
  // 尝试静默加载首页数据 (忽略错误)
  postStore.loadPage({pageNum: 1, pageSize: 5}).catch(() => {
  });
}

function goBack() {
  if (history.length > 1) router.back(); else router.push('/');
}

function submitSearch() {
  if (!keyword.value) return;
  // 假设后续会有搜索页，这里跳转；暂时可直接跳首页并带 query
  router.push({path: '/', query: {q: keyword.value}});
}
</script>
<style scoped>
.nf-wrapper {
  min-height: calc(100vh - 60px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3rem 1.2rem 4rem;
}

.nf-card {
  max-width: 680px;
  width: 100%;
  text-align: center;
  padding: 3rem 2.2rem 2.8rem;
  position: relative;
  overflow: hidden;
}

.nf-code {
  font-size: clamp(4rem, 18vw, 8rem);
  line-height: 1;
  margin: 0 0 1.2rem;
  font-weight: 800;
  letter-spacing: 4px;
}

.nf-text {
  margin: 0 0 .5rem;
  font-size: 1.05rem;
  font-weight: 600;
}

.nf-sub {
  margin: .25rem 0 1.6rem;
  font-size: .75rem;
  opacity: .6;
  letter-spacing: .5px;
}

.nf-actions {
  display: flex;
  flex-wrap: wrap;
  gap: .85rem;
  justify-content: center;
  margin: 0 0 1.6rem;
}

.btn {
  cursor: pointer;
  border: none;
  padding: .7rem 1.3rem;
  font-size: .85rem;
  border-radius: 12px;
  font-weight: 600;
  letter-spacing: .5px;
  transition: .25s;
}

.btn.primary {
  background: var(--accent, #6366f1);
  color: #fff;
  box-shadow: 0 6px 18px -6px rgba(99, 102, 241, .55);
}

.btn.primary:hover {
  filter: brightness(1.1);
}

.btn.ghost {
  background: rgba(0, 0, 0, 0.05);
  color: inherit;
}

:global(.dark) .btn.ghost {
  background: rgba(255, 255, 255, .08);
}

.btn.ghost:hover {
  background: rgba(0, 0, 0, .08);
}

:global(.dark) .btn.ghost:hover {
  background: rgba(255, 255, 255, .14);
}

.nf-search {
  display: flex;
  gap: .6rem;
  justify-content: center;
  margin: 0 0 1.8rem;
  flex-wrap: wrap;
}

.nf-search input {
  flex: 1 1 260px;
  min-width: 240px;
  border: 1px solid var(--border-color, rgba(0, 0, 0, .15));
  padding: .65rem .85rem;
  border-radius: 10px;
  background: var(--input-bg, rgba(0, 0, 0, .02));
}

:global(.dark) .nf-search input {
  border-color: rgba(255, 255, 255, .2);
  background: rgba(255, 255, 255, .05);
  color: #fff;
}

.nf-search button {
  padding: .65rem 1.1rem;
  border-radius: 10px;
  border: 1px solid var(--accent, #6366f1);
  background: var(--accent, #6366f1);
  color: #fff;
  cursor: pointer;
  font-size: .8rem;
  font-weight: 600;
}

.nf-search button:disabled {
  opacity: .4;
  cursor: not-allowed;
}

.nf-recent {
  text-align: left;
  margin-top: .5rem;
}

.small-title {
  margin: 0 0 .6rem;
  font-size: .75rem;
  letter-spacing: 1px;
  font-weight: 600;
  opacity: .6;
  text-transform: uppercase;
}

.nf-recent ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: .4rem;
}

.nf-recent a {
  font-size: .8rem;
  line-height: 1.2;
}

.nf-recent a:hover {
  text-decoration: underline;
}

/* Fancy background accents */
.nf-card::before, .nf-card::after {
  content: "";
  position: absolute;
  width: 560px;
  height: 560px;
  background: radial-gradient(circle at center, var(--accent, #6366f1) 0%, transparent 70%);
  opacity: .12;
  top: -260px;
  left: 50%;
  transform: translateX(-50%);
  filter: blur(40px);
  pointer-events: none;
}

.nf-card::after {
  top: auto;
  bottom: -320px;
  width: 480px;
  height: 480px;
  opacity: .1;
}
</style>
