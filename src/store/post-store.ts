import { defineStore } from 'pinia';
import { ref } from 'vue';
import { fetchPosts, fetchPostDetail, fetchTags, fetchFriendLinks } from '@/api/blog';
import { fetchArchives } from '@/api/blog';
import type { BlogPostItem, BlogPostDetail, PostPageQuery, BlogTagVO, BlogFriendLinkVO } from '@/types/blog';
import type { BlogArchiveGroup } from '@/types/blog';

interface PostLoadOptions {
    append?: boolean;
}

export const usePostStore = defineStore('post', () => {
    const loading = ref(false);
    const list = ref<BlogPostItem[]>([]);
    const total = ref(0);
    const detailCache = ref<Map<number, BlogPostDetail>>(new Map());
    const tags = ref<BlogTagVO[]>([]);
    const tagLoaded = ref(false);
    const _loadingTags = ref<Promise<void> | null>(null);
    const archives = ref<BlogArchiveGroup[]>([]);
    const archiveLoading = ref(false);
    const friendLinks = ref<BlogFriendLinkVO[]>([]);
    const friendLinkLoading = ref(false);
    const friendLinkLoaded = ref(false);

    function mergePostList(current: BlogPostItem[], incoming: BlogPostItem[]) {
        const merged = [...current];
        const seen = new Set(current.map((item) => item.id));
        incoming.forEach((item) => {
            if (seen.has(item.id)) return;
            seen.add(item.id);
            merged.push(item);
        });
        return merged;
    }

    async function loadTags(force = false) {
        if (tagLoaded.value && !force) return;
        if (_loadingTags.value && !force) return _loadingTags.value;
        _loadingTags.value = (async () => {
            const page = await fetchTags();
            tags.value = page?.list || [];
            tagLoaded.value = true;
        })();
        try {
            await _loadingTags.value;
        } finally {
            _loadingTags.value = null;
        }
    }

    async function loadPage(query: PostPageQuery, options: PostLoadOptions = {}) {
        loading.value = true;
        try {
            const page = await fetchPosts(query);
            const append = !!options.append && query.pageNum > 1;
            list.value = append ? mergePostList(list.value, page.list) : page.list;
            total.value = page.total;
        } finally {
            loading.value = false;
        }
    }

    async function getDetail(id: number) {
        if (detailCache.value.has(id)) return detailCache.value.get(id)!;
        const detail = await fetchPostDetail(id);
        detailCache.value.set(id, detail);
        return detail;
    }

    async function loadArchives(force = false) {
        if (archives.value.length && !force) return;
        archiveLoading.value = true;
        try {
            archives.value = await fetchArchives();
        } finally {
            archiveLoading.value = false;
        }
    }

    async function loadFriendLinks(force = false) {
        if (friendLinkLoaded.value && !force) return;
        friendLinkLoading.value = true;
        try {
            friendLinks.value = await fetchFriendLinks();
            friendLinkLoaded.value = true;
        } finally {
            friendLinkLoading.value = false;
        }
    }

    function clear() {
        list.value = [];
        total.value = 0;
        detailCache.value.clear();
        tagLoaded.value = false;
        archives.value = [];
        friendLinks.value = [];
        friendLinkLoaded.value = false;
    }

    return {
        loading,
        list,
        total,
        tags,
        loadTags,
        loadPage,
        getDetail,
        clear,
        tagLoaded,
        archives,
        archiveLoading,
        loadArchives,
        friendLinks,
        friendLinkLoading,
        friendLinkLoaded,
        loadFriendLinks,
    };
});