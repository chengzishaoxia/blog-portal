<template>
  <section class="wave-hero" :class="{ 'has-image': !!backgroundImage }">
    <ProgressiveImage
      v-if="backgroundImage"
      class="hero-background"
      :src="backgroundImage"
      :lazy="false"
      objectFit="cover"
      fetchPriority="high"
      :useNativeLazy="false"
      :alt="title + ' 背景'"
    >
      <template #placeholder>
        <img :src="outloadSvg" class="hero-placeholder" alt="loading..." />
      </template>
    </ProgressiveImage>
    <div class="hero-overlay" />
    <div class="hero-inner">
      <p v-if="eyebrow" class="eyebrow">{{ eyebrow }}</p>
      <h1 class="title">{{ title }}</h1>
      <p v-if="subtitle" class="subtitle">{{ subtitle }}</p>
      <slot />
    </div>
    <HeroWaves class="waves-wrap" height="110px" minHeight="80px" maxHeight="120px" bottom="-2px" />
  </section>
</template>

<script setup lang="ts">
import HeroWaves from '@/components/common/HeroWaves.vue';
import ProgressiveImage from '@/components/common/ProgressiveImage.vue';
import outloadSvg from '@/assets/svg/outload.svg';

defineProps<{
  title: string;
  subtitle?: string;
  eyebrow?: string;
  backgroundImage?: string;
}>();
</script>

<style scoped>
.wave-hero {
  position: relative;
  width: 100vw;
  margin-left: calc(50% - 50vw);
  margin-top: calc(-1 * var(--header-height));
  min-height: clamp(520px, 80vh, 920px);
  padding: calc(var(--header-height) + 3.8rem) 1.5rem 8.8rem;
  background:
    radial-gradient(circle at top, rgba(255, 255, 255, .06), transparent 30%),
    linear-gradient(90deg, #25252c 0%, #2b2c32 48%, #36363d 100%);
  color: #fff;
  overflow: hidden;
  display: flex;
  align-items: center;
}

.wave-hero::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  background: linear-gradient(180deg, rgba(255, 255, 255, .03), rgba(255, 255, 255, 0));
}

.hero-background,
.hero-overlay {
  position: absolute;
  inset: 0;
}

.hero-background {
  z-index: 0;
}

.hero-background :deep(.pi-img),
.hero-background :deep(.pi-lqip) {
  object-position: center;
}

.hero-background :deep(.pi-img) {
  background-position: center;
  background-repeat: no-repeat;
  background-size: cover;
}

.hero-background :deep(.pi-wrapper.is-loaded .pi-img) {
  opacity: .9;
  transform: scale(1.04);
  filter: blur(0) brightness(.92) saturate(1.08);
}

.hero-placeholder {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.hero-overlay {
  z-index: 1;
  pointer-events: none;
  background:
    linear-gradient(180deg, rgba(18, 20, 29, .18) 0%, rgba(18, 20, 29, .28) 42%, rgba(18, 20, 29, .42) 100%),
    linear-gradient(90deg, rgba(20, 22, 31, .32) 0%, rgba(20, 22, 31, .14) 50%, rgba(20, 22, 31, .32) 100%),
    radial-gradient(circle at top, rgba(255, 255, 255, .14), transparent 36%);
}

.wave-hero.has-image {
  background: #1b1e26;
}

.wave-hero.has-image::before {
  background: linear-gradient(180deg, rgba(255, 255, 255, .08), rgba(255, 255, 255, 0));
}

.hero-inner {
  position: relative;
  z-index: 2;
  max-width: var(--layout-max-width);
  margin: 0 auto;
  text-align: center;
  width: 100%;
}

.eyebrow {
  margin: 0 0 .65rem;
  font-size: .78rem;
  letter-spacing: 4px;
  text-transform: uppercase;
  color: rgba(255, 255, 255, .68);
}

.title {
  margin: 0;
  font-size: clamp(2.8rem, 6vw, 4.2rem);
  line-height: 1.15;
  font-weight: 700;
  letter-spacing: .08em;
  text-shadow: 0 10px 24px rgba(0, 0, 0, .28);
}

.subtitle {
  margin: 1rem auto 0;
  max-width: 680px;
  font-size: .98rem;
  color: rgba(255, 255, 255, .74);
}

.waves-wrap {
  z-index: 2;
}

@media (max-width: 768px) {
  .wave-hero {
    min-height: clamp(420px, 80vh, 680px);
    padding-top: calc(var(--header-height) + 2.8rem);
    padding-bottom: 7rem;
  }

  .subtitle {
    font-size: .88rem;
  }
}
</style>