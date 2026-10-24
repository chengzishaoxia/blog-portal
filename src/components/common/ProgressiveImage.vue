<template>
  <figure
      class="pi-wrapper"
      :class="[
      { 'is-loaded': state.loaded, 'is-error': state.error, 'is-loading': !state.loaded && !state.error, 'has-lqip': !!lqip },
      fitClass,
      rounded ? 'is-rounded' : '',
    ]"
      :style="wrapperStyle"
  >
    <!-- Placeholder Layer (gradient shimmer OR custom slot) -->
    <div v-if="!state.loaded && !state.error" class="pi-placeholder" aria-hidden="true">
      <slot name="placeholder">
        <img :src="outloadSvg" class="pi-placeholder-image" alt="loading..." />
      </slot>
    </div>

    <!-- LQIP Layer (blurred small image) -->
    <img
        v-if="showLqip"
        class="pi-lqip"
        :src="lqip"
        :alt="alt || ''"
        loading="lazy"
        decoding="async"
        aria-hidden="true"
    />

    <!-- Actual Image -->
    <img
        v-if="shouldMountRealImage"
        ref="imgEl"
        class="pi-img"
        :class="{ 'with-transition': transition, 'will-change': transition && !state.loaded }"
        :src="realSrc"
        :alt="alt"
        :fetchpriority="fetchPriorityAttr"
        :loading="nativeLoading"
        decoding="async"
        @load="onLoad"
        @error="onError"
    />

    <!-- Error Fallback -->
    <div v-if="state.error" class="pi-error" role="img" :aria-label="alt">
      <slot name="error">
        <span class="pi-error-text">加载失败</span>
      </slot>
    </div>

    <!-- Caption slot (optional) -->
    <figcaption v-if="$slots.caption" class="pi-caption">
      <slot name="caption"/>
    </figcaption>
  </figure>
</template>
<script setup lang="ts">
import {computed, onMounted, onBeforeUnmount, reactive, ref, watch} from 'vue';
import outloadSvg from '@/assets/svg/outload.svg';

interface Props {
  src: string;              // 原图
  alt?: string;             // 无障碍文本
  lqip?: string;            // 低清模糊占位（base64 小图）
  ratio?: string | number;  // 比例 例如 '16:9', '4/3', 1.777, 0.75
  width?: number;           // 固定宽度（px），可选
  height?: number;          // 固定高度（px），可选
  lazy?: boolean;           // 是否懒加载（IntersectionObserver）
  threshold?: number;       // 触发加载的 rootMargin 像素
  transition?: boolean;     // 是否淡入+模糊过渡
  rounded?: boolean;        // 圆角
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  fetchPriority?: 'high' | 'low' | 'auto'; // 浏览器 Fetch Priority
  useNativeLazy?: boolean;  // 是否使用原生 loading="lazy"
}

const props = withDefaults(defineProps<Props>(), {
  alt: '',
  lqip: '',
  ratio: '',
  lazy: true,
  threshold: 180, // 视窗前 180px 预加载
  transition: true,
  rounded: false,
  objectFit: 'cover',
  fetchPriority: 'auto',
  useNativeLazy: false
});

/* State */
const state = reactive({loaded: false, error: false, intersected: !props.lazy});
const imgEl = ref<HTMLImageElement | null>(null);

/* Derived values */
const alt = computed(() => props.alt || 'image');
const showLqip = computed(() => !!props.lqip && !state.loaded && !state.error);
const shouldMountRealImage = computed(() => !props.lazy || state.intersected);
const realSrc = computed(() => props.src);
const fetchPriorityAttr = computed(() => props.fetchPriority);
const nativeLoading = computed(() => (props.useNativeLazy && props.lazy ? 'lazy' : 'eager'));
const backgroundPaddingRatio = computed(() => {
  if (props.height && props.width) return undefined; // 固定宽高忽略 ratio
  if (props.ratio) {
    if (typeof props.ratio === 'number' && props.ratio > 0) return `${(1 / props.ratio) * 100}%`;
    const str = String(props.ratio).replace(/,/g, ':').replace('/', ':');
    const parts = str.split(':').map(Number).filter(n => !isNaN(n) && n > 0);
    if (parts.length === 2) return `${(parts[1] / parts[0]) * 100}%`;
  }
  return undefined;
});

const fitClass = computed(() => `fit-${props.objectFit}`);

const wrapperStyle = computed(() => {
  const style: Record<string, string> = {'--pi-fit': props.objectFit} as Record<string, string>;
  if (props.width) style.width = props.width + 'px';
  if (props.height) style.height = props.height + 'px';
  else if (backgroundPaddingRatio.value) style.paddingTop = backgroundPaddingRatio.value; // 高度自适应比例
  return style;
});

/* IntersectionObserver for lazy load */
let observer: IntersectionObserver | null = null;

function setupObserver() {
  if (!props.lazy || state.intersected) return;
  if (!('IntersectionObserver' in window)) {
    state.intersected = true; // 回退立即加载
    return;
  }
  observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        state.intersected = true;
        observer && observer.disconnect();
      }
    });
  }, {root: null, rootMargin: props.threshold + 'px', threshold: 0.01});
  if (imgEl.value) observer.observe(imgEl.value.parentElement as Element);
}

onMounted(setupObserver);

onBeforeUnmount(() => {
  observer && observer.disconnect();
  observer = null;
});

/* Handlers */
function onLoad(ev: Event) {
  if ((ev.target as HTMLImageElement).currentSrc !== realSrc.value) return;
  state.loaded = true;
}

function onError() {
  state.error = true;
}

/* Watch src changes to reset state */
watch(() => props.src, () => {
  state.loaded = false;
  state.error = false;
  if (props.lazy) state.intersected = false; // 重新观察
  setupObserver();
});
</script>
<style scoped>
.pi-wrapper {
  position: relative;
  display: block;
  overflow: hidden;
  background: var(--pi-bg, #1e242d);
  color: inherit;
  margin: 0; /* Reset UA default figure margin (typically 1em 40px) to prevent background image offset */
}

.pi-wrapper.is-rounded {
  border-radius: 12px;
}

/* Maintain ratio (when padding-top used) */
.pi-wrapper[style*='padding-top'] {
  width: 100%;
}

.pi-placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pi-skeleton {
  width: 100%;
  height: 100%;
  background: linear-gradient(120deg, rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0.16), rgba(255, 255, 255, 0.06));
  background-size: 200% 100%;
  animation: pi-shimmer 2.2s linear infinite;
}

.pi-placeholder-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

:global(.light) .pi-skeleton {
  background: linear-gradient(120deg, rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.12), rgba(0, 0, 0, 0.05));
}

.pi-lqip, .pi-img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: var(--pi-fit, cover);
}

.pi-lqip {
  filter: blur(18px) brightness(.9) saturate(1.15);
  transform: scale(1.04);
  transition: opacity .4s ease;
}

.pi-wrapper.is-loaded .pi-lqip {
  opacity: 0;
}

.pi-img {
  opacity: 0;
  transition: opacity .6s ease, filter 1s ease;
  filter: blur(12px) brightness(.9) saturate(1.05);
}

.pi-img.with-transition.pi-wrapper.is-loaded, .pi-wrapper.is-loaded .pi-img {
  opacity: 1;
  filter: blur(0) brightness(1) saturate(1);
}

.pi-img:not(.with-transition) {
  transition: none;
}

/* When no transition desired */
.pi-wrapper.is-loaded .pi-img:not(.with-transition) {
  opacity: 1;
  filter: none;
}

.pi-error {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: repeating-linear-gradient(45deg, #2f3541, #2f3541 14px, #39404d 14px, #39404d 28px);
  color: #fff;
  font-size: .75rem;
  letter-spacing: 1px;
}

:global(.light) .pi-error {
  background: repeating-linear-gradient(45deg, #d1d7de, #d1d7de 14px, #e0e6ed 14px, #e0e6ed 28px);
  color: #222;
}

.pi-error-text {
  background: rgba(0, 0, 0, 0.35);
  padding: .35rem .6rem;
  border-radius: 4px;
}

:global(.light) .pi-error-text {
  background: rgba(255, 255, 255, 0.55);
}

.pi-caption {
  margin-top: .5rem;
  font-size: .75rem;
  opacity: .76;
  text-align: center;
}

@keyframes pi-shimmer {
  0% {
    background-position: 0% 50%;
  }
  100% {
    background-position: -200% 50%;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .pi-skeleton {
    animation: none;
  }

  .pi-img, .pi-lqip {
    transition: none;
    filter: none !important;
  }
}
</style>
