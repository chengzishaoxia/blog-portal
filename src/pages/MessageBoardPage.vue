<template>
  <section class="message-board-page">
    <ProgressiveImage
      v-if="backgroundImage"
      class="board-background"
      :src="backgroundImage"
      :lazy="false"
      objectFit="cover"
      fetchPriority="high"
      :useNativeLazy="false"
      alt="留言板背景"
    >
      <template #placeholder>
        <img :src="outloadSvg" class="board-placeholder" alt="loading..." />
      </template>
    </ProgressiveImage>
    <div class="board-mask" aria-hidden="true" />

    <div class="message-container">
      <h1 class="message-title">留言板</h1>
      <form class="message-input" @submit.prevent="handleSubmit">
        <input
          v-model.trim="content"
          class="input"
          type="text"
          maxlength="120"
          placeholder="说点什么吧"
          aria-label="留言内容"
          @focus="showAction = true"
          @keyup.enter="handleSubmit"
        />
        <button v-show="showSendButton" class="send" type="submit" :disabled="submitting || !submitContent">
          {{ submitting ? '发送中' : '发送' }}
        </button>
      </form>
    </div>

    <div class="danmaku-container" aria-hidden="true">
      <VueDanmaku
        v-if="danmus.length"
        ref="danmakuRef"
        v-model:danmus="danmus"
        class="danmaku"
        :channels="8"
        :speeds="96"
        loop
        random-channel
        use-slot
      >
        <template #danmu="{ danmu }">
          <span class="danmaku-item">
            <ProgressiveImage
              v-if="hasAvatar(danmu)"
              class="danmaku-avatar danmaku-avatar-media"
              :src="danmu.avatar"
              :alt="`${getDanmuName(danmu.nickname)} avatar`"
              :lazy="false"
              :useNativeLazy="false"
              objectFit="cover"
            >
              <template #error>
                <span class="danmaku-avatar danmaku-avatar-fallback">{{ getDanmuInitial(danmu.nickname) }}</span>
              </template>
            </ProgressiveImage>
            <span v-else class="danmaku-avatar danmaku-avatar-fallback">{{ getDanmuInitial(danmu.nickname) }}</span>
            <span class="danmaku-text">
              <strong class="danmaku-name">{{ getDanmuName(danmu.nickname) }}</strong>
              <span>{{ danmu.content }}</span>
            </span>
          </span>
        </template>
      </VueDanmaku>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, inject, nextTick, onActivated, onMounted, ref, type Ref } from 'vue';
import { ElMessage } from 'element-plus';
import VueDanmaku from 'vue-danmaku';
import ProgressiveImage from '@/components/common/ProgressiveImage.vue';
import { MessageAPI } from '@/api/message';
import { useAuthStore } from '@/store/auth-store';
import outloadSvg from '@/assets/svg/outload.svg';
import type { BlogMessageDanmakuVO } from '@/types/blog';
import { createDefaultSiteConfig, type SiteConfig } from '@/types/site-config';

const auth = useAuthStore();
const injectedSiteConfig = inject<Ref<SiteConfig>>('portalSiteConfig');
const danmus = ref<BlogMessageDanmakuVO[]>([]);
const content = ref('');
const submitting = ref(false);
const danmakuRef = ref<any>(null);
const showAction = ref(false);

const siteConfig = computed(() => injectedSiteConfig?.value ?? createDefaultSiteConfig());
const currentUserLabel = computed(() => auth.profile?.nickname || auth.profile?.username || auth.username || '游客');
const isAuthed = computed(() => auth.isAuthed());
const submitNickname = computed(() => (isAuthed.value ? currentUserLabel.value : '游客').trim() || '游客');
const submitContent = computed(() => content.value.trim());
const backgroundImage = computed(() => siteConfig.value.messageBoard.backgroundUrl?.trim() || '');
const showSendButton = computed(() => showAction.value || !!submitContent.value);

function getDanmuName(name?: string) {
  return name?.trim() || '游客';
}

function getDanmuInitial(name?: string) {
  return getDanmuName(name).charAt(0).toUpperCase();
}

function hasAvatar(danmu: BlogMessageDanmakuVO) {
  return !!danmu.avatar?.trim();
}

async function loadDanmaku() {
  try {
    const list = await MessageAPI.listDanmaku(120);
    danmus.value = list;
  } catch {
    danmus.value = [];
  }

  await nextTick();
  danmakuRef.value?.play?.();
}

async function handleSubmit() {
  if (!submitContent.value) return;

  submitting.value = true;
  try {
    await MessageAPI.submit({
      nickname: submitNickname.value,
      content: submitContent.value,
    });
    content.value = '';
    showAction.value = false;
    ElMessage.success('留言已提交，待审核通过后展示');
  } finally {
    submitting.value = false;
  }
}

onMounted(() => {
  loadDanmaku();
});

onActivated(() => {
  loadDanmaku();
});
</script>

<style scoped>
.message-board-page {
  position: fixed;
  inset: 0;
  min-height: 100vh;
  padding: 0;
  background: linear-gradient(135deg, #b8d8dc 0%, #efd0ac 42%, #6a7b94 100%);
  overflow: hidden;
}

.board-background,
.board-mask {
  position: absolute;
  inset: 0;
}

.board-background {
  z-index: 0;
}

.board-background :deep(.pi-wrapper),
.board-background :deep(.pi-img),
.board-background :deep(.pi-lqip) {
  width: 100%;
  height: 100%;
}

.board-background :deep(.pi-wrapper.is-loaded .pi-img) {
  opacity: .92;
  filter: blur(0) brightness(.96) saturate(1.04);
}

.board-placeholder {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.board-mask {
  background:
    radial-gradient(circle at 18% 22%, rgba(255, 255, 255, .18), transparent 24%),
    linear-gradient(180deg, rgba(12, 18, 28, .08), rgba(12, 18, 28, .18) 42%, rgba(12, 18, 28, .34));
  z-index: 1;
}

.message-container {
  position: fixed;
  top: 35%;
  left: 0;
  right: 0;
  z-index: 3;
  width: min(28rem, calc(100vw - 2rem));
  margin: 0 auto;
  text-align: center;
  color: #fff;
}

.message-title {
  margin: 0;
  font-size: clamp(2.2rem, 5vw, 3.4rem);
  line-height: 1.05;
  letter-spacing: .08em;
  color: #fff;
  text-shadow: 0 8px 24px rgba(0, 0, 0, .22);
  animation: title-scale .9s ease;
}

.message-input {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: .7rem;
  height: 2.8rem;
  margin-top: 2rem;
}

.input {
  width: min(74%, 20rem);
  height: 100%;
  padding: 0 1.25rem;
  border: 1px solid rgba(255, 255, 255, .72);
  border-radius: 999px;
  outline: none;
  color: #f8fafc;
  background: rgba(255, 255, 255, .16);
  backdrop-filter: blur(12px);
  box-shadow: 0 14px 30px -24px rgba(15, 23, 42, .72);
}

.input::placeholder {
  color: rgba(255, 255, 255, .86);
}

.input:focus {
  background: rgba(255, 255, 255, .22);
}

.send {
  height: 100%;
  padding: 0 1.25rem;
  border: 1px solid rgba(255, 255, 255, .78);
  border-radius: 999px;
  outline: none;
  color: #f8fafc;
  background: rgba(255, 255, 255, .16);
  backdrop-filter: blur(12px);
  cursor: pointer;
  animation: slide-up-in .35s ease;
}

.send:disabled {
  opacity: .56;
  cursor: not-allowed;
}

.danmaku-container {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 2;
  overflow: hidden;
  pointer-events: none;
  animation: slide-down-in .9s ease;
}

.danmaku {
  position: fixed;
  top: calc(var(--header-height) + 0.6rem);
  width: 100%;
  height: 100%;
}

.danmaku-item {
  display: inline-flex;
  align-items: center;
  gap: .55rem;
  padding: .38rem .72rem .38rem .3rem;
  border-radius: 999px;
  background: rgba(0, 0, 0, .28);
  color: #fff;
  backdrop-filter: blur(8px);
  box-shadow: 0 14px 30px -22px rgba(15, 23, 42, .9);
}

.danmaku-avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  flex: 0 0 auto;
}

.danmaku-avatar-media :deep(.pi-placeholder),
.danmaku-avatar-media :deep(.pi-skeleton),
.danmaku-avatar-media :deep(.pi-img),
.danmaku-avatar-media :deep(.pi-error),
.danmaku-avatar-media :deep(.pi-placeholder-image) {
  border-radius: 50%;
}

.danmaku-avatar-fallback {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #fff0c7, #ffd57e);
  color: #5a3a09;
  font-weight: 700;
}

.danmaku-text {
  display: inline-flex;
  align-items: center;
  gap: .35rem;
  font-size: .92rem;
  white-space: nowrap;
}

.danmaku-name {
  font-weight: 700;
}

@media (max-width: 960px) {
  .message-container {
    top: 31%;
    width: min(30rem, calc(100vw - 1.4rem));
  }

  .message-input {
    height: auto;
    flex-direction: column;
  }

  .input,
  .send {
    width: 100%;
    height: 2.85rem;
  }
}

@media (max-width: 560px) {
  .message-container {
    top: 28%;
  }

  .message-title {
    font-size: 2rem;
  }
}

:global(.dark) .message-board-page {
  background: linear-gradient(135deg, #243949 0%, #32455a 42%, #111827 100%);
}

@keyframes title-scale {
  from {
    opacity: 0;
    transform: scale(.92) translateY(8px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

@keyframes slide-up-in {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slide-down-in {
  from {
    opacity: 0;
    transform: translateY(-12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
