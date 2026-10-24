<template>
  <div class="wave-page-layout">
    <div class="layout-shell">
      <SideHeader />
      <div class="layout-main">
        <slot />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import SideHeader from '@/components/layout/SideHeader.vue';
</script>

<style scoped>
.wave-page-layout {
  position: relative;
  z-index: 1;
  width: 100%;
  margin-top: 1.7rem;
  padding: 0 0 2.2rem;
}

.layout-main {
  flex: 1;
  width: 100%;
  min-width: 0;
  color: var(--text-color);
}

.layout-shell {
  width: min(var(--layout-max-width), calc(100vw - 2.4rem));
  margin: 0 auto;
  display: flex;
  align-items: flex-start;
  gap: var(--layout-gap, 2rem);
}

.layout-shell :deep(.side-header) {
  flex: 0 0 var(--sidebar-width);
  width: var(--sidebar-width);
  min-width: var(--sidebar-width);
  top: calc(var(--header-height) + 1rem);
}

@media (max-width: 960px) {
  .wave-page-layout {
    margin-top: 1rem;
    padding-bottom: 2rem;
  }

  .layout-shell {
    width: min(calc(100vw - 1.5rem), var(--layout-max-width));
    display: block;
  }
}
</style>