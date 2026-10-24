export interface SiteHeroConfig {
  eyebrow: string;
  title: string;
  subtitle: string;
  imageFileId?: number | string;
  imageUrl?: string;
}

export interface SiteSidebarProfileConfig {
  avatarFileId?: number | string;
  avatarUrl?: string;
  name: string;
  intro: string;
}

export interface SiteSidebarNoticeConfig {
  title: string;
  content: string;
}

export interface SiteContactConfig {
  qq: string;
  github: string;
  gitee: string;
  email: string;
  wechat: string;
  csdn: string;
  qqGroup: string;
}

export interface SiteAboutConfig {
  title: string;
  repoLabel: string;
  repoName: string;
  repoUrl: string;
}

export interface SiteFooterConfig {
  copyrightText: string;
  primaryText: string;
  siteStartTime: string;
}

export interface SiteMessageBoardConfig {
  backgroundFileId?: number | string;
  backgroundUrl?: string;
}

export interface SiteConfig {
  homeHero: SiteHeroConfig;
  tagsHero: SiteHeroConfig;
  archivesHero: SiteHeroConfig;
  friendLinksHero: SiteHeroConfig;
  chatHero: SiteHeroConfig;
  messageBoard: SiteMessageBoardConfig;
  about: SiteAboutConfig;
  sidebarProfile: SiteSidebarProfileConfig;
  sidebarNotice: SiteSidebarNoticeConfig;
  contact: SiteContactConfig;
  footer: SiteFooterConfig;
}

const LEGACY_NOTICE_CONTENT = '后端基于 Spring Boot 开发，前端基于 Vue3 + TypeScript。首页布局已切换为 iris 风格。';
const LEGACY_HOME_TITLE = '橙子的小屋';
const LEGACY_FOOTER_PRIMARY_TEXT = '© 2026 My Blog · Powered by Vue3 + Vite · Theme Inspired by Shoka';
const LEGACY_FOOTER_RECORD_TEXT = 'xxxxxxxxxxxxxx';
const DEFAULT_HOME_TITLE = 'KLEE BLOG';
const DEFAULT_NOTICE_CONTENT = '欢迎来到橙子的小屋！！';
const DEFAULT_FOOTER_COPYRIGHT = '© 橙子的小屋 2022';
const DEFAULT_FOOTER_PRIMARY = '本站内容仅作学习交流与个人记录使用';
const DEFAULT_FOOTER_SITE_START_TIME = '2022-01-01T00:00:00';

function normalizeHomeTitle(title?: string): string {
  if (!title || title === LEGACY_HOME_TITLE) {
    return DEFAULT_HOME_TITLE;
  }
  return title;
}

function normalizeNoticeContent(content?: string): string {
  if (!content || content === LEGACY_NOTICE_CONTENT) {
    return DEFAULT_NOTICE_CONTENT;
  }
  return content;
}

function normalizeFooterPrimaryText(text?: string): string {
  if (!text || text === LEGACY_FOOTER_PRIMARY_TEXT || text === LEGACY_FOOTER_RECORD_TEXT) {
    return DEFAULT_FOOTER_PRIMARY;
  }
  return text;
}

export function createDefaultSiteConfig(): SiteConfig {
  return {
    homeHero: {
      eyebrow: 'HOME',
      title: DEFAULT_HOME_TITLE,
      subtitle: '就算一次也好，我想在这颗星球上尽情奔跑。',
      imageFileId: undefined,
      imageUrl: '',
    },
    tagsHero: {
      eyebrow: 'TAGS',
      title: '标签',
      subtitle: '把站内主题拆成更易浏览的入口，保留一些轻量的标签墙氛围。',
      imageFileId: undefined,
      imageUrl: '',
    },
    archivesHero: {
      eyebrow: 'ARCHIVES',
      title: '归档',
      subtitle: '把最近三年的文章按照年份和月份整理在一起，保留一点旧博客的仪式感。',
      imageFileId: undefined,
      imageUrl: '',
    },
    friendLinksHero: {
      eyebrow: 'LINKS',
      title: '友链',
      subtitle: '把常逛的站点独立整理成一页，作为博客外延阅读的入口。',
      imageFileId: undefined,
      imageUrl: '',
    },
    chatHero: {
      eyebrow: 'CHAT',
      title: '聊天室',
      subtitle: '保留站点统一的波浪页首，下面进入实时聊天和在线状态。',
      imageFileId: undefined,
      imageUrl: '',
    },
    messageBoard: {
      backgroundFileId: undefined,
      backgroundUrl: '',
    },
    about: {
      title: '关于',
      repoLabel: '项目开源地址：',
      repoName: 'KLEE - BLOG',
      repoUrl: 'https://gitee.com/variable-wing-core/klee-blog',
    },
    sidebarProfile: {
      avatarFileId: undefined,
      avatarUrl: '',
      name: '橙子的小屋',
      intro: '欢迎来到橙子的小屋。',
    },
    sidebarNotice: {
      title: '公告',
      content: DEFAULT_NOTICE_CONTENT,
    },
    contact: {
      qq: 'xxxxxxxxx',
      github: 'https://github.com/variable-wing-core/klee-blog',
      gitee: 'https://gitee.com/variable-wing-core/klee-blog',
      email: 'chengzishaoxia@163.com',
      wechat: '',
      csdn: '',
      qqGroup: '',
    },
    footer: {
      copyrightText: DEFAULT_FOOTER_COPYRIGHT,
      primaryText: DEFAULT_FOOTER_PRIMARY,
      siteStartTime: DEFAULT_FOOTER_SITE_START_TIME,
    },
  };
}

export function mergeSiteConfig(source?: Partial<SiteConfig>): SiteConfig {
  const defaults = createDefaultSiteConfig();
  const mergedHomeHero = {...defaults.homeHero, ...(source?.homeHero || {})};
  mergedHomeHero.title = normalizeHomeTitle(mergedHomeHero.title);
  const mergedSidebarNotice = {...defaults.sidebarNotice, ...(source?.sidebarNotice || {})};
  mergedSidebarNotice.content = normalizeNoticeContent(mergedSidebarNotice.content);
  const mergedFooter = {...defaults.footer, ...(source?.footer || {})};
  mergedFooter.copyrightText = mergedFooter.copyrightText || DEFAULT_FOOTER_COPYRIGHT;
  mergedFooter.primaryText = normalizeFooterPrimaryText(mergedFooter.primaryText);
  mergedFooter.siteStartTime = mergedFooter.siteStartTime || DEFAULT_FOOTER_SITE_START_TIME;
  return {
    homeHero: mergedHomeHero,
    tagsHero: {...defaults.tagsHero, ...(source?.tagsHero || {})},
    archivesHero: {...defaults.archivesHero, ...(source?.archivesHero || {})},
    friendLinksHero: {...defaults.friendLinksHero, ...(source?.friendLinksHero || {})},
    chatHero: {...defaults.chatHero, ...(source?.chatHero || {})},
    messageBoard: {...defaults.messageBoard, ...(source?.messageBoard || {})},
    about: {...defaults.about, ...(source?.about || {})},
    sidebarProfile: {...defaults.sidebarProfile, ...(source?.sidebarProfile || {})},
    sidebarNotice: mergedSidebarNotice,
    contact: {...defaults.contact, ...(source?.contact || {})},
    footer: mergedFooter,
  };
}