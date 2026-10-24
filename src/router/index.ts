import {createRouter, createWebHistory, RouteRecordRaw} from 'vue-router';
import { useAuthStore } from '@/store/auth-store';

const HomePage = () => import('@/pages/HomePage.vue');
const PostDetailPage = () => import('@/pages/PostDetailPage.vue');
const TagPage = () => import('@/pages/TagPage.vue');
const TagsPage = () => import('@/pages/TagsPage.vue');
const UserProfilePage = () => import('@/pages/UserProfilePage.vue');
const ArchivesPage = () => import('@/pages/ArchivesPage.vue');
const ChatPage = () => import('@/pages/ChatPage.vue');
const FriendLinksPage = () => import('@/pages/FriendLinksPage.vue');
const MessageBoardPage = () => import('@/pages/MessageBoardPage.vue');
const AuthCallbackPage = () => import('@/pages/AuthCallbackPage.vue');
const WavePageFrame = () => import('@/components/layout/WavePageFrame.vue');

export const routes: RouteRecordRaw[] = [
    {path: '/', name: 'home', component: HomePage, meta: {title: '首页'}},
    {path: '/tag/:id(\\d+)', name: 'tag', component: TagPage, meta: {title: '标签归档'}},
    {path: '/post/:id(\\d+)', name: 'post-detail', component: PostDetailPage, meta: {title: '文章详情'}},
    {path: '/auth/callback', name: 'auth-callback', component: AuthCallbackPage, meta: {title: '登录中'}},
    {path: '/user/profile', name: 'user-profile', component: UserProfilePage, meta: {title: '个人中心', requiresAuth: true}},
    {
        path: '/message-board',
        name: 'message-board',
        component: MessageBoardPage,
        meta: {
            title: '留言板',
            layout: 'full'
        }
    },
    {
        path: '/',
        component: WavePageFrame,
        children: [
            {
                path: 'tags',
                name: 'tags',
                component: TagsPage,
                meta: {
                    title: '标签',
                    layout: 'wave',
                    waveTitle: '标签',
                    waveEyebrow: 'TAGS',
                    waveSubtitle: '把站内主题拆成更易浏览的入口，保留一些轻量的标签墙氛围。'
                }
            },
            {
                path: 'friend-links',
                name: 'friend-links',
                component: FriendLinksPage,
                meta: {
                    title: '友链',
                    layout: 'wave',
                    waveTitle: '友链',
                    waveEyebrow: 'LINKS',
                    waveSubtitle: '把常逛的站点独立整理成一页，作为博客外延阅读的入口。'
                }
            },
            {
                path: 'archives',
                name: 'archives',
                component: ArchivesPage,
                meta: {
                    title: '文章归档',
                    layout: 'wave',
                    waveTitle: '归档',
                    waveEyebrow: 'ARCHIVES',
                    waveSubtitle: '把最近三年的文章按照年份和月份整理在一起，保留一点旧博客的仪式感。'
                }
            },
            {
                path: 'chat',
                name: 'chat',
                component: ChatPage,
                meta: {
                    title: '聊天',
                    requiresAuth: true,
                    layout: 'wave',
                    waveTitle: '聊天室',
                    waveEyebrow: 'CHAT',
                    waveSubtitle: '保留站点统一的波浪页首，下面进入实时聊天和在线状态。'
                }
            },
        ]
    },
    {
        path: '/:pathMatch(.*)*',
        name: 'not-found',
        component: () => import('@/pages/NotFound.vue'),
        meta: {title: '未找到'}
    },
];

const router = createRouter({
    history: createWebHistory(),
    routes,
    scrollBehavior(to, from, saved) {
        if (saved) return saved;
        if (to.hash) {
            // 改造：等待目标元素出现在 DOM 再滚动，避免初次加载或切换时还未渲染导致的警告
            const hash = to.hash;
            const maxTries = 40; // 最长等待 ~2s (40 * 50ms)
            const waitForEl = (tries = 0): any => {
                const el = document.querySelector(hash);
                if (el) return { el: hash, behavior: 'smooth' } as any;
                if (tries >= maxTries) return { top: 0 };
                return new Promise(resolve => setTimeout(() => resolve(waitForEl(tries + 1)), 50));
            };
            return waitForEl();
        }
        return {top: 0};
    },
});

router.afterEach((to) => {
    const defaultTitle = import.meta.env.VITE_APP_TITLE || '橙子的小屋';
    if (to.meta.title) document.title = `${to.meta.title} - ${defaultTitle}`;
});

router.beforeEach((to,_from,next)=>{
  const auth = useAuthStore();
  // if authenticated but profile not loaded yet, trigger load (non-blocking)
  if(auth.isAuthed() && !auth.profile) auth.loadProfile();
  if(to.meta.requiresAuth && !auth.isAuthed()){
    auth.setRedirect(to.fullPath);
    auth.open('login');
    return next({ name:'home' });
  }
  next();
});

export default router;
