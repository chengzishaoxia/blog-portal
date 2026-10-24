<template>
  <section class="friend-links-page">
    <FriendLinksSection :links="postStore.friendLinks" :loading="postStore.friendLinkLoading && !postStore.friendLinkLoaded" />
  </section>
</template>

<script setup lang="ts">
import { onActivated, onMounted } from 'vue';
import FriendLinksSection from '@/components/home/FriendLinksSection.vue';
import { usePostStore } from '@/store/post-store';

const postStore = usePostStore();

function ensureFriendLinks() {
  postStore.loadFriendLinks();
}

onMounted(() => {
  ensureFriendLinks();
});

onActivated(() => {
  ensureFriendLinks();
});
</script>

<style scoped>
.friend-links-page {
  padding-bottom: 2.4rem;
}
</style>