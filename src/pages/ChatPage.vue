<template>
  <section class="chat-page">
    <div v-if="ready && isAuthed && userId" class="chat-main-card">
        <ChatRoom :currentUserId="userId" />
    </div>

    <div v-else class="chat-guard">
        <div v-if="!isAuthed" class="guard-card need-login">
          <div class="icon-wrap lock">
            <svg viewBox="0 0 24 24" class="ic">
              <path fill="currentColor" d="M12 17q.425 0 .713-.288T13 16q0-.425-.288-.713T12 15q-.425 0-.713.288T11 16q0 .425.288.713T12 17Zm-6 4q-.825 0-1.413-.588T4 19v-8q0-.825.588-1.413T6 9h1V7q0-2.075 1.463-3.537T12 2q2.075 0 3.538 1.463T17 7v2h1q.825 0 1.413.588T20 11v8q0 .825-.588 1.413T18 21H6Zm3-12h6V7q0-1.25-.875-2.125T12 4q-1.25 0-2.125.875T9 7v2Z" />
            </svg>
          </div>
          <h3 class="guard-title">请先登录</h3>
          <p class="guard-desc">登录后即可加入聊天室，和大家实时交流。</p>
          <button class="guard-btn primary" @click="openLogin">立即登录</button>
          <div class="tip-line">没有账号？在登录弹窗内注册。</div>
        </div>

        <div v-else class="guard-card initializing">
          <div class="icon-wrap spinner">
            <div class="ring">
              <span class="seg seg1" />
              <span class="seg seg2" />
              <span class="seg seg3" />
              <span class="seg seg4" />
            </div>
            <div class="center-dot" />
          </div>
          <h3 class="guard-title">正在初始化</h3>
          <p class="guard-desc">正在加载个人信息与聊天室资源，请稍候…</p>
          <div class="progress-dots">
            <span v-for="i in 5" :key="i" class="pd" :style="{ animationDelay: (i * 0.12) + 's' }" />
          </div>
        </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onActivated, onMounted, ref } from 'vue';
import ChatRoom from '@/components/ChatRoom.vue';
import { useAuthStore } from '@/store/auth-store';

const auth = useAuthStore();
const isAuthed = computed(() => auth.isAuthed());
const userId = computed(() => auth.profile?.userId || 0);
const ready = ref(false);

function openLogin() {
  auth.open('login');
}

function initPage() {
  if (!auth.isAuthed()) {
    auth.open('login');
  }
  ready.value = true;
}

onMounted(() => {
  initPage();
});

onActivated(() => {
  initPage();
});
</script>

<style scoped>
.chat-page {
  padding-bottom: 2.4rem;
}

.chat-main-card {
  width: 100%;
  border-radius: 28px;
  overflow: hidden;
  background: color-mix(in srgb, var(--card-bg) 92%, transparent);
  border: 1px solid color-mix(in srgb, var(--text-color) 10%, transparent);
  box-shadow: 0 30px 60px -42px rgba(15, 23, 42, .45);
}

:global(.dark) .chat-main-card {
  box-shadow: 0 30px 60px -42px rgba(0, 0, 0, .65);
}

:global(.dark) .chat-main-card :deep(.chat-room) {
  background: linear-gradient(180deg, rgba(17, 22, 29, .96), rgba(11, 16, 22, .98)) !important;
}

.chat-guard {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 2rem 0;
}

.guard-card {
  width: min(520px, 100%);
  background: linear-gradient(145deg, #ffffffcc, #f1f5f9dd);
  border: 1px solid #e2e8f0;
  border-radius: 24px;
  padding: 2.2rem 2rem 2.4rem;
  text-align: center;
  position: relative;
  backdrop-filter: blur(20px) saturate(1.25);
  box-shadow: 0 18px 42px -18px rgba(30, 41, 59, .25), 0 6px 18px -8px rgba(30, 41, 59, .15);
  animation: card-in .55s cubic-bezier(.4, .8, .4, 1);
  overflow: hidden;
}

:global(.dark) .guard-card {
  background: linear-gradient(145deg, #1e293bcc, #0f172add);
  border-color: #334155;
  box-shadow: 0 18px 42px -18px rgba(0, 0, 0, .55), 0 6px 18px -8px rgba(0, 0, 0, .6);
}

.guard-card::before {
  content: "";
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 75% 15%, rgba(99, 102, 241, .18), transparent 60%), radial-gradient(circle at 25% 85%, rgba(236, 72, 153, .15), transparent 55%);
  pointer-events: none;
}

.guard-card.need-login::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, #6366f11a, #8b5cf61a 40%, transparent 75%);
  pointer-events: none;
}

.guard-card.initializing::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, #0ea5e91a, #6366f11a 40%, transparent 75%);
  pointer-events: none;
}

@keyframes card-in {
  0% {
    opacity: 0;
    transform: translateY(20px) scale(.96);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.icon-wrap {
  width: 86px;
  height: 86px;
  margin: 0 auto 1.25rem;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-wrap.lock {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  border-radius: 26px;
  box-shadow: 0 10px 28px -8px rgba(99, 102, 241, .55);
  color: #fff;
}

.icon-wrap.lock .ic {
  width: 46px;
  height: 46px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, .25));
}

.ring {
  position: relative;
  width: 86px;
  height: 86px;
  border-radius: 50%;
  filter: drop-shadow(0 4px 12px rgba(14, 165, 233, .35));
  display: flex;
  align-items: center;
  justify-content: center;
}

.ring .seg {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 6px solid transparent;
  animation: spin 1.3s linear infinite;
}

.ring .seg1 {
  border-top-color: #0ea5e9;
  animation-delay: 0s;
}

.ring .seg2 {
  border-right-color: #6366f1;
  animation-delay: .15s;
}

.ring .seg3 {
  border-bottom-color: #8b5cf6;
  animation-delay: .3s;
}

.ring .seg4 {
  border-left-color: #0ea5e9;
  animation-delay: .45s;
}

.center-dot {
  position: absolute;
  width: 30px;
  height: 30px;
  background: linear-gradient(135deg, #6366f1, #0ea5e9);
  border-radius: 50%;
  box-shadow: 0 4px 14px -4px #6366f1aa;
  animation: pulse-dot 1.6s ease-in-out infinite;
}

@keyframes pulse-dot {
  0%,
  100% {
    transform: scale(.85);
    box-shadow: 0 4px 14px -4px #6366f188;
  }
  50% {
    transform: scale(1);
    box-shadow: 0 6px 20px -6px #6366f199;
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.guard-title {
  margin: 0 0 .75rem;
  font-size: 1.35rem;
  letter-spacing: .5px;
  font-weight: 700;
  background: linear-gradient(135deg, #0f172a, #334155);
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
}

:global(.dark) .guard-title {
  background: linear-gradient(135deg, #e2e8f0, #94a3b8);
}

.guard-desc {
  margin: .15rem 0 1.1rem;
  font-size: .85rem;
  line-height: 1.55;
  color: #475569;
}

:global(.dark) .guard-desc {
  color: #cbd5e1;
}

.tip-line {
  font-size: .65rem;
  letter-spacing: .5px;
  opacity: .55;
  margin-top: 1.2rem;
}

.guard-btn {
  cursor: pointer;
  border: 0;
  padding: .85rem 1.4rem;
  font-size: .8rem;
  font-weight: 600;
  letter-spacing: .5px;
  border-radius: 14px;
  display: inline-flex;
  align-items: center;
  gap: .5rem;
  position: relative;
  overflow: hidden;
}

.guard-btn.primary {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff;
  box-shadow: 0 10px 24px -10px rgba(99, 102, 241, .65);
}

.guard-btn.primary::before {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(120deg, transparent, rgba(255, 255, 255, .35), transparent);
  transform: translateX(-100%);
  animation: shine 3s ease-in-out infinite;
}

@keyframes shine {
  0%,
  60% {
    transform: translateX(-120%);
  }
  80% {
    transform: translateX(120%);
  }
  100% {
    transform: translateX(120%);
  }
}

.guard-btn.primary:hover {
  transform: translateY(-3px);
  box-shadow: 0 14px 32px -10px rgba(99, 102, 241, .75);
}

.guard-btn.primary:active {
  transform: translateY(2px);
}

.progress-dots {
  display: flex;
  justify-content: center;
  gap: .5rem;
  margin-top: .75rem;
}

.pd {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: linear-gradient(135deg, #0ea5e9, #6366f1);
  animation: pd 1.1s ease-in-out infinite;
  transform-origin: center;
  box-shadow: 0 2px 6px -2px rgba(14, 165, 233, .55);
}

@keyframes pd {
  0%,
  100% {
    transform: translateY(0) scale(.8);
    opacity: .4;
  }
  50% {
    transform: translateY(-6px) scale(1);
    opacity: 1;
  }
}

:global(.dark) .icon-wrap.lock {
  background: linear-gradient(135deg, #4f46e5, #7c3aed);
}

:global(.dark) .center-dot {
  background: linear-gradient(135deg, #4f46e5, #0ea5e9);
}

:global(.dark) .pd {
  background: linear-gradient(135deg, #0ea5e9, #4f46e5);
}
</style>