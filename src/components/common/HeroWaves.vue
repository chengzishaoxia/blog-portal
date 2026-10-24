<template>
  <div class="hero-waves" :style="waveStyle" aria-hidden="true">
    <svg class="waves" xmlns="http://www.w3.org/2000/svg" viewBox="24 24 150 28" preserveAspectRatio="none" shape-rendering="auto">
      <defs>
        <path id="hero-wave-path" d="M-160 44c30 0 58-18 88-18s58 18 88 18 58-18 88-18 58 18 88 18v44h-352z" />
      </defs>
      <g class="parallax">
        <use href="#hero-wave-path" x="48" y="0" />
        <use href="#hero-wave-path" x="48" y="3" />
        <use href="#hero-wave-path" x="48" y="5" />
        <use href="#hero-wave-path" x="48" y="7" />
      </g>
    </svg>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  height?: string;
  minHeight?: string;
  maxHeight?: string;
  bottom?: string;
  fill1?: string;
  fill2?: string;
  fill3?: string;
  fill4?: string;
}

const props = withDefaults(defineProps<Props>(), {
  height: 'calc(var(--hero-wave-height) + var(--wave-overlap))',
  minHeight: '80px',
  maxHeight: '120px',
  bottom: '0',
  fill1: 'rgba(255, 255, 255, .34)',
  fill2: 'rgba(255, 255, 255, .48)',
  fill3: 'rgba(255, 255, 255, .68)',
  fill4: 'var(--bg-color)',
});

const waveStyle = computed(() => ({
  '--hero-waves-height': props.height,
  '--hero-waves-min-height': props.minHeight,
  '--hero-waves-max-height': props.maxHeight,
  '--hero-waves-bottom': props.bottom,
  '--hero-wave-fill-1': props.fill1,
  '--hero-wave-fill-2': props.fill2,
  '--hero-wave-fill-3': props.fill3,
  '--hero-wave-fill-4': props.fill4,
}));
</script>

<style scoped>
.hero-waves {
  position: absolute;
  left: 0;
  right: 0;
  bottom: var(--hero-waves-bottom);
  z-index: 1;
  line-height: 0;
  pointer-events: none;
}

.waves {
  width: 100%;
  height: var(--hero-waves-height);
  min-height: var(--hero-waves-min-height);
  max-height: var(--hero-waves-max-height);
  display: block;
}

.parallax > use {
  animation: moveWaves 10s linear infinite;
  filter: drop-shadow(0 4px 6px rgba(0, 0, 0, .25));
}

.parallax > use:nth-child(1) {
  animation-delay: -2s;
  fill: var(--hero-wave-fill-1);
}

.parallax > use:nth-child(2) {
  animation-delay: -3s;
  fill: var(--hero-wave-fill-2);
}

.parallax > use:nth-child(3) {
  animation-delay: -4s;
  fill: var(--hero-wave-fill-3);
}

.parallax > use:nth-child(4) {
  animation-delay: -5s;
  fill: var(--hero-wave-fill-4);
}

@keyframes moveWaves {
  0% {
    transform: translate3d(-90px, 0, 0);
  }

  100% {
    transform: translate3d(85px, 0, 0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .parallax > use {
    animation: none;
  }
}
</style>