<template>
  <div class="tool-rail" :class="{ show: visible }">
    <button class="tool-item" type="button" :aria-label="themeLabel" @click="toggleTheme">
      <span class="tool-icon">{{ themeIcon }}</span>
    </button>
    <button class="tool-item progress-item" type="button" aria-label="回到顶部" @click="scrollTop">
      <span class="tool-icon">↑</span>
      <span class="tool-count">{{ progress }}%</span>
    </button>
  </div>
</template>
<script setup lang="ts">
import { computed, inject, onMounted, onUnmounted, ref, watch, type Ref } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const injectedTheme = inject<Ref<'light' | 'dark'>>('portalTheme');
const injectedToggleTheme = inject<() => void>('togglePortalTheme');

const visible = ref(false);
const progress = ref(0);
const BASE_THRESHOLD = 24;

const theme = computed<'light' | 'dark'>(() => injectedTheme?.value ?? 'light');
const themeIcon = computed(() => theme.value === 'dark' ? '☀' : '☾');
const themeLabel = computed(() => theme.value === 'dark' ? '切换浅色模式' : '切换深色模式');

function computeState() {
  const scrollTop = window.scrollY;
  const max = document.documentElement.scrollHeight - window.innerHeight;
  visible.value = scrollTop > BASE_THRESHOLD;
  progress.value = max <= 0 ? 0 : Math.min(100, Math.max(0, Math.round((scrollTop / max) * 100)));
}

function onScroll() {
  computeState();
}

function scrollTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function toggleTheme() {
  injectedToggleTheme?.();
}

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true });
  computeState();
});

onUnmounted(() => {
  window.removeEventListener('scroll', onScroll);
});

watch(() => route.fullPath, () => computeState());
</script>
<style scoped>
.tool-rail {
  position: fixed;
  top: 50%;
  right: -40px;
  bottom: auto;
  z-index: 1200;
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  color: #5d8fe9;
  opacity: 0;
  transform: translateY(-50%);
  transition: transform 0.45s ease, opacity 0.3s ease;
}

.tool-rail.show {
  opacity: 1;
  transform: translate(-46px, -50%);
}

.tool-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 2.75rem;
  min-height: 2.95rem;
  border: 0;
  background: transparent;
  color: inherit;
  cursor: pointer;
  padding: 0.25rem 0;
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.tool-item:hover {
  opacity: 0.88;
  transform: translateY(-1px);
}

.tool-icon {
  font-size: 1.65rem;
  line-height: 1;
}

.progress-item {
  gap: 0.2rem;
}

.tool-count {
  font-size: 1rem;
  font-weight: 700;
  line-height: 1;
}

:global(.dark) .tool-rail {
  color: #8eb8ff;
}

@media (max-width: 640px) {
  .tool-rail {
    top: 50%;
    right: -34px;
    bottom: auto;
  }

  .tool-rail.show {
    transform: translate(-38px, -50%);
  }

  .tool-item {
    width: 2.4rem;
    min-height: 2.6rem;
  }

  .tool-icon {
    font-size: 1.4rem;
  }

  .tool-count {
    font-size: 0.92rem;
  }
}
</style>
