<template>
  <section class="home-hero" :style="{ '--parallax': `${offsetY}px`, '--hero-img-pos': imagePosition }">
    <div class="hero-bg-carousel" aria-hidden="true">
      <div
        v-for="(item, idx) in carouselImages"
        :key="item.id"
        class="hero-bg-slide"
        :class="{ single: carouselImages.length === 1 }"
        :style="slideStyle(idx)"
      >
        <ProgressiveImage
          :src="item.fileUrl"
          :lazy="false"
          objectFit="cover"
          fetchPriority="high"
          :useNativeLazy="false"
          :alt="`${resolvedHero.title} 背景`"
        >
          <template #placeholder>
            <img :src="outloadSvg" class="hero-placeholder" alt="loading..." />
          </template>
        </ProgressiveImage>
      </div>
    </div>
    <div class="hero-inner">
      <p class="hero-eyebrow">{{ resolvedHero.eyebrow }}</p>
      <h1 class="hero-title title">{{ resolvedHero.title }}</h1>
      <p class="hero-sub">
        <span>{{ typedSubtitle }}</span>
        <span class="hero-cursor" :class="{ active: isTyping }">|</span>
      </p>
    </div>
    <button class="hero-scroll" type="button" aria-label="向下滚动" @click="scrollToList">
      <span class="hero-scroll-icon">
        <i></i>
      </span>
    </button>
    <HeroWaves class="waves-wrap" />
  </section>
</template>
<script setup lang="ts">
import { computed, inject, onMounted, onUnmounted, ref, watch, type Ref } from 'vue';
import HeroWaves from '@/components/common/HeroWaves.vue';
import ProgressiveImage from '@/components/common/ProgressiveImage.vue';
import { fetchCarousels } from '@/api/carousel';
import { createDefaultSiteConfig, type SiteConfig } from '@/types/site-config';
import outloadSvg from '@/assets/svg/outload.svg';

interface LocalCarouselItem {
  id: number | string;
  fileId: number | string;
  fileUrl: string;
}

interface Props {
  background?: string;
  title?: string;
  imagePosition?: string;
}

const props = withDefaults(defineProps<Props>(), {
  background: 'https://picsum.photos/1600/900?blur=2',
  title: 'KLEE BLOG',
  imagePosition: 'center center'
});

const injectedSiteConfig = inject<Ref<SiteConfig>>('portalSiteConfig');
const imagePosition = props.imagePosition;
const offsetY = ref(0);
const carouselImages = ref<LocalCarouselItem[]>([]);
const totalDuration = ref(0);
const typedSubtitle = ref('');
const isTyping = ref(false);
const heroQuote = ref('');
let typingTimer: number | null = null;

const resolvedHero = computed(() => {
  const siteConfig = injectedSiteConfig?.value ?? createDefaultSiteConfig();
  const configHero = siteConfig.homeHero;
  return {
    eyebrow: configHero.eyebrow || 'HOME',
    title: configHero.title || props.title,
    imageUrl: configHero.imageUrl || props.background,
  };
});

const resolvedSubtitle = computed(() => heroQuote.value || '就算一次也好，我想在这颗星球上尽情奔跑。');

function onScrollParallax() {
  const y = window.scrollY;
  const vh = window.innerHeight;
  offsetY.value = Math.min(1, y / (vh * 0.6)) * 32;
}

function scrollToList() {
  const el = document.getElementById('blog-list');
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function stopTyping() {
  if (typingTimer !== null) {
    window.clearInterval(typingTimer);
    typingTimer = null;
  }
}

function startTyping(text: string) {
  stopTyping();
  if (!text) {
    typedSubtitle.value = '';
    isTyping.value = false;
    return;
  }
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    typedSubtitle.value = text;
    isTyping.value = false;
    return;
  }

  let index = 0;
  typedSubtitle.value = '';
  isTyping.value = true;
  typingTimer = window.setInterval(() => {
    index += 1;
    typedSubtitle.value = text.slice(0, index);
    if (index >= text.length) {
      stopTyping();
      isTyping.value = false;
    }
  }, 72);
}

function computeDurations() {
  const count = carouselImages.value.length;
  if (count <= 1) {
    totalDuration.value = 0;
    return;
  }
  totalDuration.value = count * 8000;
}

function slideStyle(idx: number) {
  if (carouselImages.value.length <= 1) {
    return {};
  }
  return {
    animationDelay: `${idx * 8000}ms`,
    animationDuration: `${totalDuration.value}ms`
  } as Record<string, string>;
}

async function loadCarousel() {
  const list = await fetchCarousels();
  const fallback = resolvedHero.value.imageUrl || props.background;
  const mapped: LocalCarouselItem[] = list
    .filter(item => !!item.fileUrl)
    .map(item => ({
      id: item.id ?? -1,
      fileId: item.fileId ?? -1,
      fileUrl: item.fileUrl || fallback,
    }));
  carouselImages.value = mapped.length ? mapped : [{ id: -1, fileId: -1, fileUrl: fallback }];
  computeDurations();
}

async function loadHitokoto() {
  try {
    const response = await fetch('https://v1.hitokoto.cn');
    const data = await response.json() as { hitokoto?: string };
    heroQuote.value = data.hitokoto || '';
  } catch {
    heroQuote.value = '';
  }
}

watch(() => resolvedSubtitle.value, (subtitle: string) => {
  startTyping(subtitle);
}, { immediate: true });

onMounted(() => {
  onScrollParallax();
  window.addEventListener('scroll', onScrollParallax, { passive: true });
  void loadCarousel();
  void loadHitokoto();
});

onUnmounted(() => {
  stopTyping();
  window.removeEventListener('scroll', onScrollParallax);
});
</script>
<style scoped>
.home-hero {
  position: relative;
  left: 50%;
  width: 100vw;
  margin-top: calc(-1 * var(--header-height));
  margin-left: -50vw;
  min-height: calc(100vh + var(--header-height));
  height: calc(100vh + var(--header-height));
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: linear-gradient(135deg, #1f2530, #2e3a47 35%, #425564);
}

.home-hero::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 1;
  background:
    radial-gradient(circle at top, rgba(255, 255, 255, 0.22), transparent 38%),
    linear-gradient(135deg, rgba(8, 15, 35, 0.18), rgba(5, 10, 26, 0.6));
}

:global(.light) .home-hero::before {
  background:
    radial-gradient(circle at top, rgba(255, 255, 255, 0.28), transparent 38%),
    linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(10, 19, 38, 0.4));
}

.hero-bg-carousel {
  position: absolute;
  inset: 0;
  z-index: 0;
  overflow: hidden;
}

.hero-bg-slide {
  position: absolute;
  inset: 0;
  opacity: 0;
  animation-name: imageAnimation;
  animation-timing-function: linear;
  animation-fill-mode: forwards;
  animation-iteration-count: infinite;
}

.hero-bg-slide.single {
  opacity: 1;
  animation: none !important;
  transform: none !important;
}

.hero-bg-slide :deep(.pi-wrapper) {
  position: absolute;
  inset: 0;
}

.hero-bg-slide :deep(.pi-img),
.hero-bg-slide :deep(.pi-lqip) {
  object-position: var(--hero-img-pos, center center);
}

.hero-placeholder {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.hero-inner {
  position: relative;
  z-index: 2;
  width: min(760px, calc(100vw - 3rem));
  text-align: center;
  padding: 0 1.5rem;
  transform: translateY(var(--parallax, 0px));
}

.hero-eyebrow {
  margin: 0 0 1rem;
  font-size: 0.78rem;
  letter-spacing: 0.48rem;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.82);
  opacity: 0;
  animation: fadeSlide 0.8s ease forwards;
}

.hero-title {
  margin: 0;
  font-size: clamp(3.2rem, 7.4vw, 5.6rem);
  line-height: 1.02;
  font-weight: 700;
  letter-spacing: 0.14em;
  color: #fff;
  text-shadow: 0 14px 34px rgba(0, 0, 0, 0.24);
  opacity: 0;
  animation: fadeSlide 0.95s ease forwards;
  animation-delay: 0.1s;
}

.hero-sub {
  margin: 1.35rem auto 0;
  min-height: 2rem;
  max-width: 42rem;
  font-size: clamp(1rem, 1.8vw, 1.18rem);
  line-height: 1.9;
  color: rgba(255, 255, 255, 0.94);
  text-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
  opacity: 0;
  animation: fadeSlide 0.95s ease forwards;
  animation-delay: 0.22s;
}

.hero-cursor {
  display: inline-block;
  width: 0.8em;
  margin-left: 0.12rem;
  color: rgba(255, 255, 255, 0.84);
  animation: blink 1s steps(1) infinite;
}

.hero-cursor.active {
  color: #fff;
}

.hero-scroll {
  position: absolute;
  bottom: clamp(5.6rem, 9vw, 7.8rem);
  z-index: 2;
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border: 0;
  padding: 0;
  background: transparent;
  color: rgba(255, 255, 255, 0.88);
  cursor: pointer;
  opacity: 0;
  animation: fadeSlide 0.95s ease forwards;
  animation-delay: 0.4s;
}

.hero-scroll-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  animation: floatArrow 1.6s ease-in-out infinite;
}

.hero-scroll-icon i {
  display: block;
  width: 0.9rem;
  height: 0.9rem;
  border-right: 2px solid currentColor;
  border-bottom: 2px solid currentColor;
  transform: rotate(45deg);
}

.hero-scroll:hover {
  color: #fff;
}

.waves-wrap {
  position: absolute;
  inset: auto 0 0;
  z-index: 2;
}

@keyframes imageAnimation {
  0% {
    opacity: 0;
    animation-timing-function: ease-in;
  }
  2% {
    opacity: 1;
  }
  8% {
    opacity: 1;
    animation-timing-function: ease-out;
    transform: scale(1.05);
  }
  17% {
    opacity: 1;
    transform: scale(1.1);
  }
  25% {
    opacity: 0;
    transform: scale(1.1);
  }
  100% {
    opacity: 0;
  }
}

@keyframes fadeSlide {
  from {
    opacity: 0;
    transform: translateY(24px) scale(0.985);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes blink {
  0%, 49% {
    opacity: 1;
  }
  50%, 100% {
    opacity: 0;
  }
}

@keyframes floatArrow {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(6px);
  }
}

@media (max-width: 768px) {
  .hero-inner {
    width: calc(100vw - 2rem);
    padding: 0 1rem;
  }

  .hero-eyebrow {
    letter-spacing: 0.28rem;
  }

  .hero-title {
    letter-spacing: 0.08em;
  }

  .hero-scroll {
    bottom: 6.2rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .hero-bg-slide {
    animation: none;
    opacity: 1;
  }

  .hero-eyebrow,
  .hero-title,
  .hero-sub,
  .hero-scroll {
    animation: none;
    opacity: 1;
    transform: none;
  }

  .hero-cursor,
  .hero-scroll-icon {
    animation: none;
  }
}
</style>
