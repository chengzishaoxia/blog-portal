<template>
  <section class="callback-shell">
    <div class="callback-card">
      <h1>正在完成登录</h1>
      <p>{{ message }}</p>
    </div>
  </section>
</template>

<script setup lang="ts">
import {ref} from 'vue';
import {useRoute, useRouter} from 'vue-router';
import {ElMessage} from 'element-plus';
import {useAuthStore} from '@/store/auth-store';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const message = ref('请稍候，正在同步第三方登录状态。');

auth.consumeOauthCallback(route.query as Record<string, unknown>)
  .then((target) => {
    ElMessage.success('登录成功');
    router.replace(target);
  })
  .catch((error: Error) => {
    message.value = '登录未完成，请返回后重试。';
    ElMessage.error(error.message || '第三方登录失败');
    auth.open('login');
    router.replace('/');
  });
</script>

<style scoped>
.callback-shell {
  min-height: calc(100vh - var(--header-height, 56px));
  display: grid;
  place-items: center;
  padding: 6rem 1.5rem 2rem;
}

.callback-card {
  width: min(480px, 100%);
  padding: 2rem 1.75rem;
  border-radius: 24px;
  background: rgba(255, 255, 255, .82);
  box-shadow: 0 18px 48px -28px rgba(15, 23, 42, .35);
  text-align: center;
}

.callback-card h1 {
  margin: 0 0 .75rem;
  font-size: 1.8rem;
}

.callback-card p {
  margin: 0;
  color: rgba(15, 23, 42, .68);
}

:global(.dark) .callback-card {
  background: rgba(17, 24, 39, .86);
}
</style>